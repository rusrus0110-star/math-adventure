export async function requestStorageRetention(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
