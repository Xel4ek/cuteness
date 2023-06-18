export class RSA {
  private static e = BigInt(65537); // Common choice for e

  private static pemToArrayBuffer(pem: string) {
    const base64 = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, '');
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }

    return bytes.buffer;
  }


  public async encrypt(publicKeyPem: string, data: string) {
    const publicKeyBuffer = RSA.pemToArrayBuffer(publicKeyPem);

    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt']
    );

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      publicKey,
      new TextEncoder().encode(data)
    );

    return new Uint8Array(encrypted);
  }

  public async decrypt(privateKey: CryptoKey, encryptedData: Uint8Array) {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  }


  private static modInverse(a: bigint, m: bigint) {
    const m0 = m;
    let y = BigInt(0);
    let x = BigInt(1);

    if (m === BigInt(1)) { return BigInt(0); }

    while (a > BigInt(1)) {
      const q = a / m;
      let t = m;

      m = a % m;
      a = t;
      t = y;

      y = x - q * y;
      x = t;
    }

    if (x < BigInt(0)) { x = x + m0; }

    return x;
  }

  private static generatePrime(): bigint {
    // This is NOT a correct way to generate prime numbers!
    // It's here just for simplicity and demonstration purposes.
    return BigInt(Math.floor(Math.random() * 1000) + 1000);
  }

  public generateKeys() {
    const p = RSA.generatePrime();
    const q = RSA.generatePrime();

    const n = p * q;
    const phi = (p - BigInt(1)) * (q - BigInt(1));

    const e = RSA.e;

    const d = RSA.modInverse(e, phi);

    return {
      publicKey: new RSAKey({ e, n }),
      privateKey: new RSAKey({ d, n }),
    };
  }
}

export class RSAKey {
  constructor(private key: { e: bigint, n: bigint } | { d: bigint, n: bigint }) {}

  private static toBase64Url(value: bigint) {
    const str = value.toString(16);
    const bin = new Uint8Array(Math.ceil(str.length / 2)).map((_, i) =>
      parseInt(str.substr(i * 2, 2), 16)
    );

    return btoa(String.fromCharCode(...bin))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  public toPem() {
    const keyType = 'e' in this.key ? 'PUBLIC' : 'PRIVATE';
    const keyValues = Object.values(this.key).map(RSAKey.toBase64Url).join('.');

    return `-----BEGIN RSA ${keyType} KEY-----\n${keyValues}\n-----END RSA ${keyType} KEY-----`;
  }
}
