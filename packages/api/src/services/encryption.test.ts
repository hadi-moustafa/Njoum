import { encrypt, decrypt } from './encryption';

describe('encryption service', () => {
  it('round-trips plaintext through encrypt → decrypt', () => {
    const original = 'هذا نص سري للاختبار';
    const cipher   = encrypt(original);
    expect(decrypt(cipher)).toBe(original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const msg = 'same message';
    expect(encrypt(msg)).not.toBe(encrypt(msg));
  });

  it('ciphertext is a non-empty base64 string', () => {
    const cipher = encrypt('hello');
    expect(typeof cipher).toBe('string');
    expect(cipher.length).toBeGreaterThan(0);
    // valid base64
    expect(() => Buffer.from(cipher, 'base64')).not.toThrow();
  });

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const cipher = encrypt('safe content');
    const buf    = Buffer.from(cipher, 'base64');
    buf[28]      = buf[28]! ^ 0xff; // flip bits inside the ciphertext
    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws when ENCRYPTION_KEY is missing', () => {
    const saved = process.env['ENCRYPTION_KEY'];
    delete process.env['ENCRYPTION_KEY'];
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY/);
    process.env['ENCRYPTION_KEY'] = saved;
  });

  it('throws when ENCRYPTION_KEY is wrong length', () => {
    const saved = process.env['ENCRYPTION_KEY'];
    process.env['ENCRYPTION_KEY'] = 'tooshort';
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY/);
    process.env['ENCRYPTION_KEY'] = saved;
  });

  it('handles empty string', () => {
    expect(decrypt(encrypt(''))).toBe('');
  });

  it('handles unicode and emojis', () => {
    const text = '💜 نجوم — safety app 🌸';
    expect(decrypt(encrypt(text))).toBe(text);
  });
});
