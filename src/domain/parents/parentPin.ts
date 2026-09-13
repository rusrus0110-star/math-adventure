export interface ParentPinRecord { id: 'parent-pin'; salt: string; hash: string; iterations: number }
const ITERATIONS = 210_000;
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) => Uint8Array.from(atob(value), character => character.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256));
}
export async function createPinRecord(pin: string): Promise<ParentPinRecord> {
  if (!/^\d{4,6}$/.test(pin)) throw new Error('Bitte 4 bis 6 Ziffern eingeben.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { id: 'parent-pin', salt: encode(salt), hash: encode(await derive(pin, salt, ITERATIONS)), iterations: ITERATIONS };
}
export async function verifyPin(pin: string, record: ParentPinRecord): Promise<boolean> {
  if (!/^\d{4,6}$/.test(pin)) return false;
  const candidate = await derive(pin, decode(record.salt), record.iterations);
  const stored = decode(record.hash);
  return candidate.length === stored.length && candidate.reduce((difference, byte, index) => difference | (byte ^ stored[index]!), 0) === 0;
}
