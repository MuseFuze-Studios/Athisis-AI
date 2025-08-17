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
        setMemories(newMemoryService.getAllMemories()); // Initialize memories state immediately with current memories
        newMemoryService.subscribe(() => {
          const currentMemories = newMemoryService.getAllMemories();
          setMemories(currentMemories);
          console.log(`useOllama: Memories updated via subscription. Total memories: ${currentMemories.length}`);
        });
        console.log('MemoryService initialized successfully with embedding model:', settings.embeddingModel);
        console.log(`useOllama: Initial memories after service init: ${newMemoryService.getAllMemories().length}`);
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
    messages: { role: 'user' | 'assistant' | 'system', content: string, images?: string[] }[],
    onStream?: (chunk: string) => void,
    isDeepThinkingMode?: boolean
  ) => {
    if (!isConnected) {
      throw new Error('Ollama is not connected');
    }

    let latestUserMessage = messages[messages.length - 1]?.content || '';
    const lastUserMessageWithImage = messages.findLast(msg => msg.role === 'user' && msg.images && msg.images.length > 0);

    if (lastUserMessageWithImage && api) {
      setThinkingProcess("Analyzing image with Python service...");
      try {
        // Get the first image and ensure it has the data URL prefix
        const imageData = lastUserMessageWithImage.images[0];
        const response = await fetch('http://localhost:5000/process_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: imageData }), // Send the raw imageData
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const description = data.description;

        if (description) {
          latestUserMessage = `Image Description: ${description}\n\nUser Query: ${latestUserMessage}`;
          setThinkingProcess("Image analysis complete. Generating response...");
        } else {
          setThinkingProcess("Could not get image description from Python service. Generating response without image context.");
        }
      } catch (imgError) {
        console.error("Error analyzing image with Python service:", imgError);
        setThinkingProcess("Failed to analyze image with Python service. Generating response without image context.");
      }
    }

    setThinkingProcess(null); // Clear previous thinking process
    let refinedPath = ''; // Declare refinedPath here, initialized to empty string

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
      setThinkingProcess("Generating multiple reasoning paths...");
      // Step 1: Generate multiple reasoning paths
      const multiPathPromptMessages = [
        { role: 'system', content: `You are an AI assistant. Your task is to generate 2-3 distinct step-by-step internal thought processes or approaches for responding to a user query. Each approach should be clearly separated and offer a different perspective or method to solve the problem. Do not provide the final answer, only the reasoning paths. The user query is: ${latestUserMessage}` },
        { role: 'user', content: latestUserMessage }
      ];

      const multiPathAbortController = new AbortController();
      currentAbortController.current = multiPathAbortController;

      let rawMultiPaths = '';
      try {
        await api.generateResponse(
          settings.ollama.model,
          multiPathPromptMessages,
          (chunk) => { rawMultiPaths += chunk; setThinkingProcess(prev => (prev || '') + chunk); },
          multiPathAbortController.signal
        );
        setThinkingProcess(rawMultiPaths); // Display all generated paths initially
      } catch (error) {
        console.error("Error generating multiple paths:", error);
        setThinkingProcess("Could not generate multiple reasoning paths.");
        // Continue to generate main response even if this fails
      } finally {
        currentAbortController.current = null;
      }

      // Step 2: Self-correction/Self-refinement - Evaluate and select the best path
      if (rawMultiPaths) {
        setThinkingProcess(prev => (prev || '') + "\n\nEvaluating and refining paths...");
        const evaluationPromptMessages = [
          { role: 'system', content: `You have generated several reasoning paths. Your task is to evaluate these paths, identify the most logical, efficient, or accurate one, and refine it if necessary. Provide only the refined, chosen path. If no path is suitable, state that. The original query was: ${latestUserMessage}\n\nGenerated Paths:\n"""\n${rawMultiPaths}\n"""` },
          { role: 'user', content: `Evaluate the provided reasoning paths and select/refine the best one for the query: ${latestUserMessage}` }
        ];

        const evaluationAbortController = new AbortController();
        currentAbortController.current = evaluationAbortController;

        refinedPath = '';
        try {
          let hasRefinedPathHeaderBeenAdded = false;
          await api.generateResponse(
            settings.ollama.model,
            evaluationPromptMessages,
            (chunk) => {
              refinedPath += chunk;
              setThinkingProcess(prev => {
                let newThinkingProcess = prev || rawMultiPaths;
                if (!hasRefinedPathHeaderBeenAdded) {
                  newThinkingProcess += "\n\nRefined Path:\n";
                  hasRefenedPathHeaderBeenAdded = true;
                }
                return newThinkingProcess + chunk;
              });
            },
            evaluationAbortController.signal
          );
          setThinkingProcess("Chosen and refined path:\n" + refinedPath); // Display the final refined path
        } catch (error) {
          console.error("Error evaluating and refining paths:", error);
          setThinkingProcess(prev => (prev || rawMultiPaths) + "\n\nCould not evaluate and refine paths. Using initial paths.");
        } finally {
          currentAbortController.current = null;
        }
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

    let finalSystemPrompt = systemPromptContent + contextMemories;
    if (isDeepThinkingMode && refinedPath) {
      finalSystemPrompt += `\n\nBased on the following refined thought process, formulate your response. Ensure your output is clear, concise, non-repetitive, supported by evidence/examples where appropriate, and ends with a practical conclusion:\n"""\n${refinedPath}\n"""`;
    }

    const mainResponseMessages = [
      { role: 'system', content: finalSystemPrompt }, // Use the fetched content + augmented memories + refined path
      ...messages
    ]

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
      console.log(`useOllama: saveFact called with fact: "${fact}"`);
      const addedMemory = await memoryService.addMemory(fact, 'user');
      if (addedMemory) {
        showToast('Fact saved to memory!', 'success');
        console.log('useOllama: Fact successfully added to memoryService.', addedMemory);
      } else {
        showToast('Failed to save fact to memory: No memory returned.', 'error');
        console.error('useOllama: memoryService.addMemory returned null.');
      }
    } catch (error) {
      console.error('Failed to save fact:', error);
      showToast('Failed to save fact to memory.', 'error');
    }
  }, [memoryService, showToast]);

  const generateChatName = useCallback(async (userPrompt: string): Promise<string> => {
    if (!api) {
      throw new Error('Ollama API not initialized for chat naming.');
    }
    const chatNamePrompt = `Generate a very concise (3-5 words) and descriptive name for a chat based on the following user's first message. Do not include any conversational filler, just the name.\n\nUser's first message: """\n${userPrompt}\n"""\n\nChat Name:`;
    const messages = [{ role: 'user', content: chatNamePrompt }];
    try {
      const response = await api.generateResponse(settings.ollama.model, messages);
      const name = response?.message?.content || response?.response || '';
      return name.trim().replace(/["'`]/g, ''); // Clean up potential quotes
    } catch (error) {
      console.error('Failed to generate chat name:', error);
      showToast('Failed to generate chat name.', 'error');
      return 'New Chat'; // Fallback name
    }
  }, [api, settings.ollama.model, showToast]);

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
    generateChatName, // Expose generateChatName
  };
}