import { useState, useEffect, useCallback, useRef } from 'react';
import { OllamaAPI, OllamaModel } from '../services/ollamaApi';
import { useSettings } from './useSettings';
import { promptApi, Prompt } from '../services/promptApi';
import { MemoryService } from '../services/memoryService';
import { useToast } from './useToast'; // Import useToast

export function useOllama() {
  const { settings } = useSettings();
  const [api, setApi] = useState<OllamaAPI | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingProcess, setThinkingProcess] = useState<string | null>(null);
  const [memoryService, setMemoryService] = useState<MemoryService | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  const currentAbortController = useRef<AbortController | null>(null);
  const { showToast } = useToast(); // Initialize useToast

  // Initialize API when settings change
  useEffect(() => {
    if (settings.ollama.host && settings.ollama.port) {
      const newApi = new OllamaAPI(settings.ollama.host, settings.ollama.port, settings.ollama.path);
      setApi(newApi);
    }
  }, [settings.ollama.host, settings.ollama.port, settings.ollama.path]);

  // Initialize MemoryService when API and embedding model are available
  useEffect(() => {
    if (api && settings.embeddingModel) {
      try {
        const newMemoryService = new MemoryService(api, settings.embeddingModel);
        setMemoryService(newMemoryService);
        newMemoryService.subscribe(() => {
          setMemories(newMemoryService.getAllMemories());
        });
        console.log('MemoryService initialized successfully with embedding model:', settings.embeddingModel);
      } catch (error) {
        console.error('Failed to initialize MemoryService:', error);
        showToast(`Failed to initialize memory service: ${error.message}`, 'error');
        setMemoryService(null);
      }
    }
  }, [api, settings.embeddingModel]);

  // Check connection and load models
  const checkConnection = useCallback(async () => {
    if (!api) return;

    setIsLoading(true);
    setError(null);

    try {
      const available = await api.isAvailable();
      setIsConnected(available);

      if (available) {
        const modelList = await api.getModels();
        setModels(modelList);
      } else {
        setModels([]);
        setError('Cannot connect to Ollama. Make sure Ollama is running.');
      }
    } catch (err) {
      setIsConnected(false);
      setModels([]);
      setError(err instanceof Error ? err.message : 'Failed to connect to Ollama');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  // Auto-check connection when API changes
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const generateResponse = useCallback(async (
    messages: { role: 'user' | 'assistant' | 'system', content: string }[],
    onStream?: (chunk: string) => void,
    isDeepThinkingMode?: boolean
  ) => {
    if (!isConnected) {
      throw new Error('Ollama is not connected');
    }

    const latestUserMessage = messages[messages.length - 1]?.content || '';

    setThinkingProcess(null); // Clear previous thinking process

    // Step 0: Retrieve relevant memories for context augmentation
    let contextMemories = '';
    if (memoryService && latestUserMessage.length > 10) { // Only retrieve if user message is substantial
      try {
        const similarMemories = await memoryService.retrieveSimilarMemories(latestUserMessage, 3); // Retrieve top 3
        if (similarMemories.length > 0) {
          contextMemories = '\n\nRelevant past conversations:\n' +
            similarMemories.map(mem => `[${mem.type}]: ${mem.content}`).join('\n');
          console.log('Augmenting prompt with memories:', contextMemories);
        }
      } catch (memError) {
        console.error('Error retrieving memories:', memError);
      }
    }

    if (isDeepThinkingMode) {
      // Step 1: Generate thinking process
      const thinkingPromptMessages = [
        { role: 'system', content: `You are an AI assistant. Your task is to generate a step-by-step internal thought process for responding to a user query. This thought process should break down the problem, consider multiple options, and weigh pros and cons. Do not provide the final answer, only the reasoning. The user query is: ${latestUserMessage}` },
        { role: 'user', content: latestUserMessage }
      ];

      const thinkingAbortController = new AbortController();
      currentAbortController.current = thinkingAbortController; // Store it

      try {
        await api.generateResponse(
        settings.ollama.model,
        thinkingPromptMessages,
        (chunk) => { setThinkingProcess(prev => (prev || '') + chunk); },
        thinkingAbortController.signal
      );
      } catch (error) {
        console.error("Error generating thinking process:", error);
        setThinkingProcess("Could not generate thinking process.");
        // Continue to generate main response even if thinking fails
      } finally {
        currentAbortController.current = null; // Clear it
      }
    }

    // Step 2: Generate actual response
    // Determine which prompt ID to use
    const systemPromptId = settings.promptId;
    console.log(`Fetching system prompt with ID: ${systemPromptId}`); // Added log

    // Fetch the system prompt content
    let systemPromptContent = '';
    try {
      const systemPrompt = await promptApi.getPromptById(systemPromptId);
      systemPromptContent = systemPrompt.content;
    } catch (error) {
      console.error(`Failed to fetch system prompt with ID ${systemPromptId}:`, error);
      // Fallback to a default system prompt if fetching fails
      systemPromptContent = 'You are a helpful AI assistant.';
    }

    const mainResponseMessages = [
      { role: 'system', content: systemPromptContent + contextMemories }, // Use the fetched content + augmented memories
      ...messages
    ];

    const mainAbortController = new AbortController();
    currentAbortController.current = mainAbortController; // Store it

    let finalResponse: OllamaResponse | null = null;
    try {
      finalResponse = await api.generateResponse(settings.ollama.model, mainResponseMessages, onStream, mainAbortController.signal);
    } finally {
      currentAbortController.current = null; // Clear on completion or error
    }

    // Step 3: Automatic Memory Creation (after response)
    if (memoryService && finalResponse && finalResponse.response) {
      const userMessage = messages.findLast(msg => msg.role === 'user')?.content || '';
      const aiResponse = finalResponse.response;

      // Simple heuristic: if user message is a question/instruction and AI response is substantial
      const importantKeywords = ['how to', 'what is', 'explain', 'define', 'steps', 'guide', 'example', 'code', 'solution', 'remember', 'note', 'fact'];
      const isUserMessageImportant = importantKeywords.some(keyword => userMessage.toLowerCase().includes(keyword)) ||
                                     userMessage.toLowerCase().endsWith('?') ||
                                     userMessage.toLowerCase().startsWith('tell me');
      const isAiResponseSubstantial = aiResponse.length > 50; // Arbitrary length

      console.log('Automatic memory check: isUserMessageImportant =', isUserMessageImportant, ', isAiResponseSubstantial =', isAiResponseSubstantial);

      if (isUserMessageImportant && isAiResponseSubstantial) {
        console.log('Attempting to summarize conversation for automatic memory...');
        const conversationSummary = await summarizeContent(`User: ${userMessage}\nAI: ${aiResponse}`);
        if (conversationSummary) {
          await memoryService.addMemory(conversationSummary, 'assistant'); // Store as assistant memory
          console.log('Calling showToast for automatic memory.');
          showToast('Conversation summarized and added to memory!', 'success');
          console.log('Conversation summarized and successfully added to memory:', conversationSummary);
        } else {
          showToast('Automatic summarization failed, memory not saved.', 'error');
          console.error('Automatic summarization returned empty content.');
        }
      }
    }

    return finalResponse;
  }, [api, isConnected, settings.ollama.model, settings.promptId, memoryService]);

  const abortGeneration = useCallback(() => {
    if (currentAbortController.current) {
      currentAbortController.current.abort();
      setIsLoading(false);
      console.log('AI generation aborted.');
    }
  }, []);

  const pullModel = useCallback(async (modelName: string, onProgress?: (progress: any) => void) => {
    if (!api) {
      throw new Error('Ollama API not initialized');
    }

    return api.pullModel(modelName, onProgress);
  }, [api]);

  const deleteModel = useCallback(async (modelName: string) => {
    if (!api) {
      throw new Error('Ollama API not initialized');
    }
    return api.deleteModel(modelName);
  }, [api]);

  const summarizeContent = useCallback(async (content: string): Promise<string> => {
    if (!api) {
      throw new Error('Ollama API not initialized for summarization.');
    }
    const summarizePrompt = `Please summarize the following text concisely, focusing on key information and facts. The summary should be no more than 2-3 sentences.\n\nText: """\n${content}\n"""\n\nSummary:`;
    const messages = [{ role: 'user', content: summarizePrompt }];
    try {
      const response = await api.generateResponse(settings.ollama.model, messages);
      console.log('Summarization response:', response);
      const summary = response?.message?.content || response?.response || '';
      console.log('Generated summary:', summary);
      return summary;
    } catch (error) {
      console.error('Failed to summarize content:', error);
      showToast('Failed to summarize content for memory.', 'error');
      return content; // Fallback to original content if summarization fails
    }
  }, [api, settings.ollama.model, showToast]);

  const saveFact = useCallback(async (fact: string) => {
    if (!memoryService) {
      showToast('Memory service not available. Please check Ollama connection and embedding model settings.', 'error');
      return;
    }
    try {
      await memoryService.addMemory(fact, 'user');
      showToast('Fact saved to memory!', 'success');
    } catch (error) {
      console.error('Failed to save fact:', error);
      showToast('Failed to save fact to memory.', 'error');
    }
  }, [memoryService, showToast]);

  const deleteMemory = useCallback((id: string) => {
    if (!memoryService) {
      showToast('Memory service not available.', 'error');
      return;
    }
    try {
      memoryService.deleteMemory(id);
      showToast('Memory deleted!', 'success');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      showToast('Failed to delete memory.', 'error');
    }
  }, [memoryService, showToast]);

  return {
    models,
    isConnected,
    isLoading,
    error,
    checkConnection,
    generateResponse,
    pullModel,
    abortGeneration,
    deleteModel, // Expose deleteModel
    thinkingProcess, // Expose thinking process
    memoryService, // Expose memoryService
    saveFact, // Expose saveFact
    deleteMemory, // Expose deleteMemory
    memories, // Expose memories
  };
}