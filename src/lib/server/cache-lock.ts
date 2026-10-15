import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

async function removeOwner(lockPath: string, owner: string): Promise<void> {
  // Unlink only this owner's unique file. Never recursively remove a lock that
  // another process may already have acquired during release/recovery.
  try {
    await unlink(join(lockPath, owner));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  await rmdir(lockPath).catch((error: NodeJS.ErrnoException) => {
    if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code ?? ""))
      throw error;
  });
}

export async function withCacheLock<T>(
  lockPath: string,
  action: () => Promise<T>,
  timeoutMs = 180_000,
): Promise<T> {
  await mkdir(dirname(lockPath), { recursive: true });
  const owner = `owner-${process.pid}-${randomUUID()}.json`;
  const candidate = `${lockPath}.${owner}`;
  await mkdir(candidate);
  await writeFile(join(candidate, owner), JSON.stringify({ pid: process.pid }));
  const deadline = Date.now() + timeoutMs;
  let acquired = false;
  try {
    while (!acquired) {
      try {
        // Publish an already populated directory atomically: no empty-lock
        // initialization window, and an existing nonempty lock cannot be replaced.
        await rename(candidate, lockPath);
        acquired = true;
      } catch (error) {
        if (
          !["EEXIST", "ENOTEMPTY", "EPERM", "EACCES"].includes(
            (error as NodeJS.ErrnoException).code ?? "",
          )
        )
          throw error;
        const files = await readdir(lockPath).catch(
          (readError: NodeJS.ErrnoException) => {
            if (readError.code === "ENOENT") return [];
            throw readError;
          },
        );
        for (const file of files) {
          const match = /^owner-(\d+)-[\w-]+\.json$/.exec(file);
          if (match && !isAlive(Number(match[1])))
            await removeOwner(lockPath, file);
        }
        if (Date.now() >= deadline)
          throw new Error(
            "[缓存锁超时] 等待同一 Cargo.toml 的编译任务超过时限。",
            { cause: error },
          );
        await delay(50);
      }
    }
    return await action();
  } finally {
    if (acquired) await removeOwner(lockPath, owner);
    else await removeOwner(candidate, owner);
  }
}
