export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type: 'text' | 'code';
  codeBlocks?: CodeBlock[];
  thinkingProcess?: string; // Add this line
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  filename?: string;
}

export interface OllamaModel {
  name: string;
  complexity: 'simple' | 'complex';
}

export interface OllamaConfig {
  host: string;
  port: number;
  path: string;
  model: string;
  modelsDirectory: string;
}

export interface Memory {
  id: string;
  content: string;
  embedding: number[];
  timestamp: number; // Unix timestamp
  type: 'user' | 'assistant';
}

export interface AppSettings {
  ollama: OllamaConfig;
  promptId: string;
  embeddingModel: string; // New field for the embedding model
  theme: 'dark';
  fontSize: number;
  showLineNumbers: boolean;
  enableCuda: boolean;
  keyboardShortcuts: Record<string, string>;
}

export interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  type: 'code' | 'text';
  language?: string;
}

export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: ProjectFile[];
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  timestamp: Date;
}