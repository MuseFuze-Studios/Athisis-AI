export function applyGuardrails(text: string): string {
  const metaPattern = /\b(as an ai|language model|ai|artificial intelligence)\b/gi;
  if (metaPattern.test(text)) {
    text = text.replace(metaPattern, '').replace(/\s{2,}/g, ' ').trim();
  }
  const explicitPattern = /\b(fuck|sex|porn|naked|penis|vagina|cum|dick|pussy)\b/i;
  if (explicitPattern.test(text)) {
    return "She smiles and the scene gently fades to black.";
  }
  return text;
}
