import Piscina from "piscina";
import os from "os";

const workerFilePath = new URL("./passwordWorker.js", import.meta.url).href;

const piscina = new Piscina({
	filename: workerFilePath,
	minThreads: 1,
	maxThreads: os.cpus().length,
});

function hashPassword(password) {
	return piscina.run({ password }, { name: "hash" });
}

function verifyPassword(hash, password) {
	return piscina.run({ hash, password }, { name: "verify" });
}

export { hashPassword, verifyPassword };
