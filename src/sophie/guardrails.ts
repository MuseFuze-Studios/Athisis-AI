export function applyGuardrails(text: string): string {
  const metaPattern = /\b(as an ai|language model|ai|artificial intelligence)\b/gi;
  if (metaPattern.test(text)) {
    text = text.replace(metaPattern, '').replace(/\s{2,}/g, ' ').trim();
  }
  return text;
}
