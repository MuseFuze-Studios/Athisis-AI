import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { Sidebar } from './components/sidebar/Sidebar';
import { SettingsModal } from './components/settings/SettingsModal';
import { Button } from './components/ui/Button';
import Menu from 'lucide-react/dist/esm/icons/menu.js';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import Bot from 'lucide-react/dist/esm/icons/bot.js';
import StopCircle from 'lucide-react/dist/esm/icons/stop-circle.js';
import { Message, ChatSession } from './types';
import { improveResponse } from './utils/responseImprover';
import { useSettings } from './hooks/useSettings';
import { useOllama } from './hooks/useOllama';
import { useHotkeys } from 'react-hotkeys-hook';
import { useToast } from './hooks/useToast'; // Import useToast
import { useClipboard } from './hooks/useClipboard'; // Import useClipboard
import { ModeSelector } from './components/chat/ModeSelector';
import { Toast } from './components/ui/Toast'; // Import Toast component
import { LandingPage } from './components/chat/LandingPage'; // Import LandingPage

const initialChatSession: ChatSession = {
  id: '1',
  name: 'New Chat',
  messages: [
    {
      id: '1',
      content: "Hi! I'm Sophie, your local AI coding assistant. I'm ready to connect to your Ollama instance and help you with code explanations, generation, refactoring, and more. Please configure your Ollama settings and select a model to get started.",
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
  const { toasts, showToast, dismissToast } = useToast(); // Initialize useToast
  const {
    models = [],
    isConnected,
    isLoading: modelsLoading,
    checkConnection,
    generateResponse,
    pullModel,
    abortGeneration,
    deleteModel, // New: Expose deleteModel from useOllama
    thinkingProcess, // AI's internal thought process
    memoryService, // Expose memoryService
    deleteMemory, // Expose deleteMemory
    memories, // Expose memories
    generateChatName, // Expose generateChatName
  } = useOllama(showToast);
  console.log('App.tsx: models from useOllama:', models); // Added console.log
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { history: clipboardItems } = useClipboard(); // Initialize useClipboard

  const activeChatSession = chatSessions.find(session => session.id === activeChatSessionId);
  const messages = activeChatSession ? activeChatSession.messages : [];

  const isNewEmptyChat = activeChatSession && activeChatSession.messages.length === 0 && activeChatSession.name === 'New Chat';

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
    const saveFact = async (fact: string) => {
      try {
        await memoryService.addMemory(fact, 'fact');
      } catch (error) {
        console.error('Failed to save fact:', error);
        showToast('Failed to save fact.', 'error');
      }
    };

    if (content.toLowerCase().startsWith('remember that ')) {
      const factToSave = content.substring('remember that '.length).trim();
      if (factToSave) {
        await saveFact(factToSave);
        // Add the user's command and an acknowledgement to the chat history without sending to AI
        const timestamp = new Date();
        const userCommandMessage: Message = {
          id: Date.now().toString(),
          content: content,
          role: 'user',
          timestamp,
        };
        const acknowledgementMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Got it! I'll remember that.",
          role: 'assistant',
          timestamp,
        };
        setChatSessions(prev => prev.map(session =>
          session.id === activeChatSessionId
            ? { ...session, messages: [...session.messages, userCommandMessage, acknowledgementMessage] }
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
    const imageFiles: File[] = [];
    const textFiles: File[] = [];

    if (attachedFiles && attachedFiles.length > 0) {
      attachedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        } else {
          textFiles.push(file);
        }
      });

      const fileContents = await Promise.all(
        textFiles.map(async (file) => {
          const text = await file.text();
          return `\n\n--- File: ${file.name} ---\n${text}`;
        })
      );
      fullPrompt += fileContents.join('');
    }

    // Convert image files to base64
    const imageBase64s: string[] = await Promise.all(
      imageFiles.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string); // Get full Data URL
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );

    // AI names the chat on first prompt
    if (isNewEmptyChat && activeChatSession) {
      try {
        const newChatName = await generateChatName(fullPrompt);
        if (newChatName) {
          setChatSessions(prevSessions => prevSessions.map(session => 
            session.id === activeChatSession.id ? { ...session, name: newChatName } : session
          ));
        }
      } catch (error) {
        console.error('Failed to generate chat name:', error);
        showToast('Failed to generate chat name.', 'error');
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: fullPrompt,
      role: 'user',
      timestamp: new Date(),
      type: 'text',
      images: imageBase64s.length > 0 ? imageBase64s.map(base64 => `data:image/jpeg;base64,${base64}`) : undefined, // Add images to message with proper data URL format
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
      ...messages,
      userMessage
    ].map(msg => ({
      role: msg.role,
      content: String(msg.content), // Explicitly convert to string
      images: msg.images, // Pass images from message
    }));
    console.log('Sending message to AI:', conversationMessages);

    try {
      const startTime = performance.now();
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
        const latency = performance.now() - startTime;
        let improved = null;
        if (settings.qualityPassEnabled || settings.tldrEnabled) {
          improved = improveResponse(finalResponse.response);
        }
        setChatSessions(prev => prev.map(session => {
          if (session.id === activeChatSessionId) {
            return {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: improved ? improved.refined : finalResponse.response,
                      refinedContent: improved ? improved.refined : undefined,
                      score: improved ? improved.score : undefined,
                      tldr: settings.tldrEnabled && improved ? improved.tldr : undefined,
                    }
                  : msg
              )
            };
          }
          return session;
        }));

        fetch('/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latency, tokens: finalResponse.eval_count, score: improved?.score })
        }).catch(() => {});
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

  const handlePinMessage = (id: string) => {
    setChatSessions(prev => prev.map(session =>
      session.id === activeChatSessionId
        ? {
            ...session,
            messages: session.messages.map(m =>
              m.id === id ? { ...m, pinned: !m.pinned } : m
            )
          }
        : session
    ));
  };

  return (
    <div className="h-screen text-gray-100 flex flex-col relative overflow-hidden">
      {/* Ambient background elements for glassmorphism depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-color-shift-1"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl animate-color-shift-2"></div>
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-emerald-500/6 rounded-full blur-3xl animate-color-shift-3"></div>
      </div>

      {!focusMode && (
        <header className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between relative z-10 transition-glass">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<Menu size={20} />}
              onClick={() => setSidebarOpen(prev => !prev)}
              className="rounded-full glass-hover transition-glass"
            />
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full glass glow-primary">
                <Bot size={20} className="text-blue-400" />
              </div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Sophie</h1>
              {isConnected ? (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"></span>
                  <span className="text-sm text-emerald-300 glass-subtle px-3 py-1 rounded-full font-medium">
                    Connected
                  </span>
                  {settings.ollama.model && (
                    <span className="text-sm text-gray-300 glass px-3 py-1 rounded-full font-medium">
                      {settings.ollama.model}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 shadow-lg shadow-red-400/50"></span>
                  <span className="text-sm text-red-300 glass-subtle px-3 py-1 rounded-full font-medium">
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
              className="rounded-full glass-hover transition-glass"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={<Settings size={20} />}
              onClick={() => setSettingsOpen(true)}
              className="rounded-full glass-hover transition-glass"
            />
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar
          isOpen={sidebarOpen && !focusMode}
          sessions={chatSessions}
          activeSessionId={activeChatSessionId}
          onSessionSelect={setActiveChatSessionId}
          onNewChat={handleNewChat}
          onOpenSettings={() => setSettingsOpen(true)}
          onDeleteChat={handleDeleteChatSession}
          onRenameChat={handleRenameChatSession}
          clipboardItems={clipboardItems}
        />

        <main className="flex-1 flex flex-col relative">
          <div className="flex-1 overflow-auto max-w-3xl mx-auto">
            {isNewEmptyChat ? (
              <LandingPage onNewChat={handleNewChat} />
            ) : (
              messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  showLineNumbers={settings.showLineNumbers}
                  isLatestMessage={index === messages.length - 1}
                  thinkingProcess={mode === 'deep' && message.role === 'assistant' && index === messages.length - 1 ? thinkingProcess : null}
                  onPin={handlePinMessage}
                />
              ))
            )}
            
            {isLoading && !isNewEmptyChat && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center space-x-3 glass px-6 py-3 rounded-2xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400/30 border-t-blue-400"></div>
                  <span className="text-gray-300 font-medium">Generating response...</span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    icon={<StopCircle size={16} />}
                    onClick={abortGeneration}
                    title="Stop Generation"
                    className="text-red-400 hover:text-red-300 glass-hover transition-glass rounded-full"
                  />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 glass-strong border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isLoading}
              />
            </div>
          </div>
        </main>
      </div>

      {focusMode && (
        <div className="fixed top-6 right-6 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusMode(false)}
            className="glass glow-primary rounded-full px-4 py-2 font-medium transition-glass"
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
        onModelSelect={(modelName: string) => updateSettings({ ollama: { ...settings.ollama, model: modelName } })}
        memoryService={memoryService} // Pass memoryService to SettingsModal
        deleteMemory={deleteMemory} // Pass deleteMemory to SettingsModal
        memories={memories} // Pass memories to SettingsModal
      />

      <Toast messages={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
