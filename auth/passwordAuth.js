import argon2 from "argon2";
import { Worker, isMainThread, parentPort } from "worker_threads";

let worker;
if (isMainThread) {
    worker = new Worker(new URL(import.meta.url));
}

function hashPassword(password) {
    const promise = new Promise((resolve, reject) => {
        if (!isMainThread) {
            return reject(new Error("This function should only be used in the main thread"));
        }
        worker.on("message", (msg) => {
            msg.type === "hashed" ? resolve(msg.hash) : reject(msg.error);
        });
        worker.on("error", reject);
        worker.postMessage({ action: "hash", password });
    });
    return promise;
}

async function verifyPassword(hash, password) {
    const promise = new Promise((resolve, reject) => {
        worker.on("message", (msg) => {
            msg.type === "verified" ? resolve(msg.isValid) : reject(msg.error);
        });
        worker.on("error", reject);
        worker.postMessage({ action: "verify", hash, password });
    });
    return promise;
}

if (!isMainThread) {
    parentPort.on("message", async (msg) => {
        if (msg.action === "hash") {
            try {
                const hash = await argon2.hash(msg.password, {
                    type: argon2.argon2id,
                    memoryCost: 2 ** 16,
                    timeCost: 4,
                    parallelism: 1,
                });

                parentPort.postMessage({ type: "hashed", hash });
            } catch (error) {
                parentPort.postMessage({ type: "error", error: error.message });
            }
        } else if (msg.action === "verify") {
            try {
                const isValid = await argon2.verify(msg.hash, msg.password);
                parentPort.postMessage({ type: "verified", isValid });
            } catch (error) {
                parentPort.postMessage({ type: "error", error: error.message });
            }
        }
    });
}

export { hashPassword, verifyPassword };
