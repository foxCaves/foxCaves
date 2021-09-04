const RNG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function randomString(length: number = 10): string {
	const u8 = new Uint8Array(length);
	window.crypto.getRandomValues(u8);
	let result = '';
	for (let i = 0; i < length; i++) {
		// This algorithm is NOT crypto secure, but it is good enough for our purposes
		result += RNG_ALPHABET[u8[i]! % RNG_ALPHABET.length];
	}
	return result;
}
