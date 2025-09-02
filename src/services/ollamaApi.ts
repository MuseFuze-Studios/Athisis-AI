export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  complexity?: 'simple' | 'complex'; // Added complexity property
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  message?: {
    role: string;
    content: string;
  };
}

export class OllamaAPI {
  private baseUrl: string;

  // Constructor takes the full base URL of the Ollama API
  constructor(baseUrl: string = 'http://localhost:11434/api') {
    this.baseUrl = baseUrl;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      if (!response.ok) return false;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        await response.json();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Invalid JSON when loading models:', text);
        throw new Error('Invalid response from Ollama');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelsWithComplexity = (data.models || []).map((model: any) => ({
        ...model,
        complexity: model.name.toLowerCase().includes('mini') || model.name.toLowerCase().includes('tiny') ? 'simple' : 'complex',
      }));
      return modelsWithComplexity;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw error;
    }
  }

  async generateResponse(
    model: string,
    messages: { role: 'user' | 'assistant' | 'system', content: string, images?: string[] }[],
    onStream?: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<OllamaResponse> {
    try {
      console.log('Making fetch request to:', `${this.baseUrl}/chat`);
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            ...(msg.images && { 
              images: msg.images.map(img => {
                // If it's already a data URL, extract base64 part
                if (img.startsWith('data:')) {
                  return img.split(',')[1];
                }
                // If it's already base64, use as is
                return img;
              })
            }), // Conditionally add images with proper base64 format
          })),
          stream: !!onStream,
        }),
        signal, // Pass the AbortSignal here
      });
      console.log('Fetch response:', response);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, response:`, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (onStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        let finalData: OllamaResponse | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream finished.');
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data: OllamaResponse = JSON.parse(line);
              console.log('Parsed stream data:', data);
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
                onStream(data.message.content);
                console.log('Streaming chunk (message.content):', data.message.content);
              } else if (data.response) {
                fullResponse += data.response;
                onStream(data.response);
                console.log('Streaming chunk (response):', data.response);
              }
              if (data.done) {
                finalData = { ...data, response: fullResponse };
                console.log('Final data received:', finalData);
              }
            } catch (e) {
              console.error('Error parsing stream chunk:', e, 'Chunk:', line);
              // Skip invalid JSON lines
            }
          }
        }

        return finalData || { model, created_at: new Date().toISOString(), response: fullResponse, done: true };
      } else {
        const data = await response.json();
        console.log('Non-streaming response:', data);
        return data;
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      throw error;
    }
  }

  async pullModel(model: string, onProgress?: (progress: unknown) => void): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: model,
          stream: !!onProgress,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (onProgress && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              onProgress?.(data);
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to pull model:', error);
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }
}

