export const nodeAsyncControlFlowSnippet = String.raw`import { readFileSync, readFile as readFileCallback } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const path = "execution-model-demo.txt";
await writeFile(path, "文件内容已就绪", "utf8");

console.log("=== 同步读取 ===");
console.log("调用前");
const syncData = readFileSync(path, "utf8");
console.log("完成处理：", syncData);
console.log("继续其他工作");

console.log("\n=== 回调异步读取 ===");
await new Promise((resolve, reject) => {
    console.log("调用前");
    readFileCallback(path, "utf8", (error, data) => {
        if (error) {
            reject(error);
            return;
        }
        console.log("完成处理：", data);
        resolve();
    });
    console.log("继续其他工作");
});

console.log("\n=== async/await 读取 ===");
async function load() {
    console.log("函数开始，发起读取");
    const data = await readFile(path, "utf8");
    console.log("完成处理：", data);
}

const pending = load();
console.log("函数已返回 Promise，继续其他工作");
await pending;
`;
