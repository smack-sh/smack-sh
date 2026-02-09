const encoder = new TextEncoder();
const decoder = new TextDecoder();
const IV_LENGTH = 16;

export async function encrypt(key: string, data: string) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cryptoKey = await getKey(key);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-CBC',
      iv,
    },
    cryptoKey,
    encoder.encode(data),
  );

  const bundle = new Uint8Array(IV_LENGTH + ciphertext.byteLength);

  // Prepend IV to the ciphertext bundle
  bundle.set(iv, 0);
  bundle.set(new Uint8Array(ciphertext), IV_LENGTH);

  return uint8ArrayToBase64(bundle);
}

export async function decrypt(key: string, payload: string) {
  const bundle = base64ToUint8Array(payload);

  // Extract IV from the beginning of the bundle
  const iv = new Uint8Array(bundle.buffer, bundle.byteOffset, IV_LENGTH);

  // Extract ciphertext following the IV
  const ciphertext = new Uint8Array(bundle.buffer, bundle.byteOffset + IV_LENGTH, bundle.byteLength - IV_LENGTH);

  const cryptoKey = await getKey(key);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv,
    },
    cryptoKey,
    ciphertext,
  );

  return decoder.decode(plaintext);
}

async function getKey(key: string) {
  // Assuming 'key' is a base64 encoded string of the raw AES key material
  return await crypto.subtle.importKey('raw', base64ToUint8Array(key), { name: 'AES-CBC' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

// Renamed from decodeBase64 to accurately reflect its function: Uint8Array to Base64 string
function uint8ArrayToBase64(data: Uint8Array) {
  const byteChars = Array.from(data, (byte) => String.fromCodePoint(byte));

  return btoa(byteChars.join(''));
}

// Renamed from encodeBase64 to accurately reflect its function: Base64 string to Uint8Array
function base64ToUint8Array(payload: string) {
  return Uint8Array.from(atob(payload), (ch) => ch.codePointAt(0)!);
}
