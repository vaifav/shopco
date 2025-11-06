import argon2 from "argon2";

export async function hash({ password }) {
    const hash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 4,
        parallelism: 1,
    });
    return hash;
}


export async function verify({ hash, password }) {
    const isValid = await argon2.verify(hash, password);
    return isValid;
}