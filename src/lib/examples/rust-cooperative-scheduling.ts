export const tokioYieldCargoToml = `[package]
name = "cooperative-scheduling"
version = "0.1.0"
edition = "2024"

[dependencies]
tokio = { version = "=1.54.1", features = ["rt", "macros"] }
`;

export const tokioYieldSnippet = String.raw`use std::sync::{Arc, Mutex};

use tokio::task::yield_now;

async fn run_task(name: &str, shared_total: Arc<Mutex<u32>>, should_yield: bool) -> u32 {
    let mut count = 0;

    loop {
        let total = {
            let mut total = shared_total.lock().expect("共享计数器的锁已中毒");
            if *total >= 100 {
                break;
            }
            *total += 1;
            *total
        }; // 在 await 前释放锁.

        count += 1;
        println!("Task {name}: total={total}, count={count}");
        if should_yield {
            // 主动让出执行权, 给同一线程上的其他任务执行机会.
            yield_now().await;
        }
    }

    count
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let should_yield_a = false;
    let should_yield_b = false;

    let total = Arc::new(Mutex::new(0));
    let task_a = tokio::spawn(run_task("A", total.clone(), should_yield_a));
    let task_b = tokio::spawn(run_task("B", total.clone(), should_yield_b));

    let count_a = task_a.await.expect("Task A 执行失败");
    let count_b = task_b.await.expect("Task B 执行失败");

    println!(
        "完成: total={}, Task A={count_a}, Task B={count_b}",
        *total.lock().expect("共享计数器的锁已中毒")
    );
}
`;
