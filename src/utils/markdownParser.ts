

export interface MessageSegment {
  type: 'text' | 'code';
  content: string;
  lang?: string;
}

export function parseMessageContent(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [fullMatch, lang, codeContent] = match;
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;

    // Add preceding text segment
    if (startIndex > lastIndex) {
      segments.push({ type: 'text', content: text.substring(lastIndex, startIndex) });
    }

    // Add code segment
    segments.push({ type: 'code', content: codeContent, lang: lang || 'plaintext' });
    lastIndex = endIndex;
  }

  // Add any remaining text segment
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return segments;
}

