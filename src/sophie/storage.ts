export function encrypt(text: string, key?: string): string {
  if (!key) return text;
  const chars = Array.from(text).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)),
  );
  return btoa(chars.join(''));
}

export function decrypt(text: string, key?: string): string {
  if (!key) return text;
  const decoded = atob(text);
  const chars = Array.from(decoded).map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)),
  );
  return chars.join('');
}
