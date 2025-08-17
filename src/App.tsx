import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { Sidebar } from './components/sidebar/Sidebar';
import { SettingsModal } from './components/settings/SettingsModal';
import { Button } from './components/ui/Button';
import { Menu, Minimize2, Settings, Bot, StopCircle } from 'lucide-react';
import { Message, ChatSession } from './types';
import { useSettings } from './hooks/useSettings';
import { useOllama } from './hooks/useOllama';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from './hooks/useToast'; // Import useToast
import { ModeSelector } from './components/chat/ModeSelector';
import { Toast } from './components/ui/Toast'; // Import Toast component

const initialChatSession: ChatSession = {
  id: '1',
  name: 'New Chat',
  messages: [
    {
      id: '1',
      content: "Hello! I'm Athisis.AI, your local AI coding assistant. I'm ready to connect to your Ollama instance and help you with code explanations, generation, refactoring, and more. Please configure your Ollama settings and select a model to get started.",
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
    }
  ],
  timestamp: new Date(),
};

function App() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
      // Convert timestamp strings back to Date objects
      return parsedSessions.map(session => ({
        ...session,
        messages: session.messages.map(message => ({
          ...message,
          timestamp: new Date(message.timestamp),
        })),
        timestamp: new Date(session.timestamp),
      }));
    }
    return [initialChatSession];
  });
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState<'basic' | 'deep'>('basic');

  const { settings, updateSettings } = useSettings();
  const {
    models,
    isConnected,
    isLoading: modelsLoading,
    error: ollamaError,
    checkConnection,
    generateResponse,
    pullModel,
    abortGeneration,
    deleteModel, // New: Expose deleteModel from useOllama
    thinkingProcess, // AI's internal thought process
    memoryService, // Expose memoryService
    deleteMemory, // Expose deleteMemory
    memories, // Expose memories
  } = useOllama();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toasts, showToast, dismissToast } = useToast(); // Initialize useToast

  const activeChatSession = chatSessions.find(session => session.id === activeChatSessionId);
  const messages = activeChatSession ? activeChatSession.messages : [];

  useHotkeys('cmd+k', () => {
    if (activeChatSession) {
      setChatSessions(prev => prev.map(session => 
        session.id === activeChatSessionId 
          ? { ...session, messages: [] } 
          : session
      ));
    }
  }, { preventDefault: true });
  useHotkeys('cmd+b', () => setSidebarOpen(prev => !prev), { preventDefault: true });
  useHotkeys('cmd+comma', () => setSettingsOpen(true), { preventDefault: true });
  useHotkeys('escape', () => setFocusMode(prev => !prev), { preventDefault: true });

  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleNewChat = () => {
    const newChatSession: ChatSession = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
      timestamp: new Date(),
    };
    setChatSessions(prev => [...prev, newChatSession]);
    setActiveChatSessionId(newChatSession.id);
  };

  const handleDeleteChatSession = (sessionId: string) => {
    setChatSessions(prev => {
      const updatedSessions = prev.filter(session => session.id !== sessionId);
      if (updatedSessions.length === 0) {
        // If no sessions left, create a new one
        const newSession: ChatSession = {
          id: Date.now().toString(),
          name: 'New Chat',
          messages: [],
          timestamp: new Date(),
        };
        setActiveChatSessionId(newSession.id);
        return [newSession];
      } else if (activeChatSessionId === sessionId) {
        // If the deleted session was active, switch to the first available session
        setActiveChatSessionId(updatedSessions[0].id);
      }
      return updatedSessions;
    });
  };

  const handleRenameChatSession = (sessionId: string, newName: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, name: newName } : session
    ));
  };

  const handleSendMessage = async (content: string, attachedFiles?: File[]) => {
    // Check if the message is a command to save a fact
    if (content.toLowerCase().startsWith('remember that ')) {
      const factToSave = content.substring('remember that '.length).trim();
      if (factToSave) {
        await saveFact(factToSave);
        // Add the user's command to the chat history without sending to AI
        const userCommandMessage: Message = {
          id: Date.now().toString(),
          content: content,
          role: 'user',
          timestamp: new Date(),
        };
        setChatSessions(prev => prev.map(session => 
          session.id === activeChatSessionId
            ? { ...session, messages: [...session.messages, userCommandMessage] }
            : session
        ));
        return; // Stop further processing
      }
    }
    if (!isConnected) {
      alert('Please connect to Ollama first by configuring your settings.');
      setSettingsOpen(true);
      return;
    }

    if (!settings.ollama.model) {
      alert(`Please select a model in the settings.`);
      setSettingsOpen(true);
      return;
    }

    let fullPrompt = content;
    if (attachedFiles && attachedFiles.length > 0) {
      const fileContents = await Promise.all(
        attachedFiles.map(async (file) => {
          const text = await file.text();
          return `\n\n--- File: ${file.name} ---\n${text}`;
        })
      );
      fullPrompt += fileContents.join('');
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: fullPrompt,
      role: 'user',
      timestamp: new Date(),
      type: 'text',
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      type: 'text',
    };

    setChatSessions(prev => prev.map(session => 
      session.id === activeChatSessionId
        ? { ...session, messages: [...session.messages, userMessage, assistantMessage] }
        : session
    ));

    setIsLoading(true);

    const conversationMessages = [
      {
        role: 'system',
        content: 'You are a laid-back, casual, and conversational AI assistant. Be concise and to the point unless explicitly asked for more detail. Always be supportive of ambitious ideas, but ground them with practical, actionable steps. Blend creativity with exploration and realism in your suggestions. Engage like a collaborator, not just a tool. You can switch into a detailed and technical mode when the user requests it.'
      },
      ...messages, 
      userMessage
    ].map(msg => ({
      role: msg.role,
      content: String(msg.content), // Explicitly convert to string
    }));
    console.log('Sending message to AI:', conversationMessages);

    try {
      const finalResponse = await generateResponse(
        conversationMessages,
        (chunk) => {
          setChatSessions(prev => prev.map(session => {
            if (session.id === activeChatSessionId) {
              return {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
                )
              };
            }
            return session;
          }));
        },
        mode === 'deep'
      );

      if (finalResponse && finalResponse.response) {
        setChatSessions(prev => prev.map(session => {
          if (session.id === activeChatSessionId) {
            return {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: finalResponse.response }
                  : msg
              )
            };
          }
          return session;
        }));
      }
      
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your Ollama connection and try again.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text',
      };
      
      setChatSessions(prev => prev.map(session => {
        if (session.id === activeChatSessionId) {
          return {
            ...session,
            messages: session.messages.slice(0, -1).concat(errorMessage)
          };
        }
        return session;
      }));
    } finally {
      setIsLoading(false);
      console.log('Loading set to false.');
    }
  };

  const handlePullModel = async (modelName: string) => {
    try {
      await pullModel(modelName);
      await checkConnection();
    } catch (error) {
      console.error('Failed to pull model:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen bg-gray-950 text-gray-100 flex flex-col">
      {!focusMode && (
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<Menu size={20} />}
              onClick={() => setSidebarOpen(prev => !prev)}
              className="rounded-full"
            />
            <div className="flex items-center space-x-3">
              <Bot size={24} className="text-blue-400" />
              <h1 className="text-xl font-bold text-white">Athisis.AI</h1>
              {isConnected ? (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm text-green-300 bg-green-600/20 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                  {settings.ollama.model && (
                    <span className="text-sm text-gray-300 bg-gray-700 px-2 py-0.5 rounded-full">
                      {settings.ollama.model}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span className="text-sm text-red-300 bg-red-600/20 px-2 py-0.5 rounded-full">
                    Disconnected
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <ModeSelector selectedMode={mode} onModeChange={setMode} />
            <Button
              variant="ghost"
              size="sm"
              icon={<Minimize2 size={20} />}
              onClick={() => setFocusMode(true)}
              title="Focus Mode (Esc)"
              className="rounded-full"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={20} />}
              onClick={() => setSettingsOpen(true)}
              className="rounded-full"
            />
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen && !focusMode}
          sessions={chatSessions}
          activeSessionId={activeChatSessionId}
          onSessionSelect={setActiveChatSessionId}
          onNewChat={handleNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
          onDeleteChat={handleDeleteChatSession}
          onRenameChat={handleRenameChatSession}
        />

        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                showLineNumbers={settings.showLineNumbers}
                isLatestMessage={index === messages.length - 1}
                thinkingProcess={mode === 'deep' && message.role === 'assistant' && index === messages.length - 1 ? thinkingProcess : null}
              />
            ))}
            
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <div className="flex items-center space-x-2 text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span>Generating...</span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    icon={<StopCircle size={16} />}
                    onClick={abortGeneration}
                    title="Stop Generation"
                    className="text-red-400 hover:text-red-300"
                  />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </main>
      </div>

      {focusMode && (
        <div className="fixed top-4 right-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setFocusMode(false)}
          >
            Exit Focus Mode
          </Button>
        </div>
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        models={models}
        isOllamaConnected={isConnected}
        onRefreshModels={checkConnection}
        onPullModel={handlePullModel}
        onDeleteModel={deleteModel}
        isModelsLoading={modelsLoading}
        promptId={settings.promptId}
        memoryService={memoryService} // Pass memoryService to SettingsModal
        deleteMemory={deleteMemory} // Pass deleteMemory to SettingsModal
        memories={memories} // Pass memories to SettingsModal
      />

      <Toast messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
