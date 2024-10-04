const RNG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function randomString(length = 10): string {
    const u8 = new Uint8Array(length);
    globalThis.crypto.getRandomValues(u8);
    let result = '';
    for (let i = 0; i < length; i++) {
        // This algorithm is NOT crypto secure, but it is good enough for our purposes
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        result += RNG_ALPHABET[u8[i]! % RNG_ALPHABET.length];
    }

    return result;
}
