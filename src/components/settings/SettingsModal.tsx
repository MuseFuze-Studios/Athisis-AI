import React, { useState, useEffect, useCallback } from 'react'; // Ensure useState is imported
import { X, Cpu, Keyboard, Bot, MessageSquareText, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ModelSelector } from './ModelSelector';
import { DirectorySelector } from './DirectorySelector';
import { AppSettings } from '../../types';
import { OllamaModel } from '../../services/ollamaApi';
import { promptApi, Prompt } from '../../services/promptApi';
import { clsx } from 'clsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  isOllamaConnected: boolean;
  onRefreshModels: () => void;
  onPullModel: (modelName: string) => Promise<void>;
  isModelsLoading: boolean;
  onDeleteModel: (modelName: string) => Promise<void>;
  models: OllamaModel[]; // Added models prop
  memoryService: MemoryService | null; // New prop for memory service
  deleteMemory: (id: string) => void; // New prop for deleting memory
  memories: Memory[]; // New prop for memories
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  isOllamaConnected,
  onRefreshModels,
  onPullModel,
  isModelsLoading,
  onDeleteModel,
  models,
  memoryService,
  deleteMemory,
  memories,
}: SettingsModalProps) {

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('models'); // Default to 'models' tab

  const fetchPrompts = useCallback(async () => {
    try {
      const fetchedPrompts = await promptApi.getPrompts();
      setPrompts(fetchedPrompts);
      const active = await promptApi.getActivePrompt();
      setActivePrompt(active);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPrompts();
    }
  }, [isOpen, fetchPrompts]);

  const handleCreateOrUpdatePrompt = async () => {
    try {
      if (editingPromptId) {
        await promptApi.updatePrompt(editingPromptId, newPromptName, newPromptContent);
      } else {
        await promptApi.createPrompt(newPromptName, newPromptContent);
      }
      setNewPromptName('');
      setNewPromptContent('');
      setEditingPromptId(null);
      fetchPrompts();
    } catch (error) {
      console.error("Failed to save prompt:", error);
    }
  };

  const handleEditClick = (prompt: Prompt) => {
    setEditingPromptId(prompt.id);
    setNewPromptName(prompt.name);
    setNewPromptContent(prompt.content);
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      try {
        await promptApi.deletePrompt(id);
        fetchPrompts();
      } catch (error) {
        console.error("Failed to delete prompt:", error);
        alert(`Error deleting prompt: ${error.message}`);
      }
    }
  };

  const handleSetActivePrompt = async (id: string) => {
    try {
      const updatedActive = await promptApi.setActivePrompt(id);
      setActivePrompt(updatedActive);
      fetchPrompts(); // Refresh list to show active status
    } catch (error) {
      console.error("Failed to set active prompt:", error);
      alert(`Error setting active prompt: ${error.message}`);
    }
  };

  const handleResetToFallback = async () => {
    if (window.confirm("Are you sure you want to reset to the fallback prompt?")) {
      try {
        const updatedActive = await promptApi.resetToFallback();
        setActivePrompt(updatedActive);
        fetchPrompts(); // Refresh list to show active status
      } catch (error) {
        console.error("Failed to reset to fallback:", error);
        alert(`Error resetting to fallback: ${error.message}`);
      }
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    console.log(`Attempting to delete model: ${modelName}`); // Added log
    if (window.confirm(`Are you sure you want to delete the model "${modelName}"? This action cannot be undone.`)) {
      try {
        await onDeleteModel(modelName); // Call the prop passed from App.tsx
        console.log(`Model ${modelName} deleted successfully.`); // Added log
        onRefreshModels(); // Refresh the model list after deletion
        // Also, if the deleted model was selected as quickChatModel or workhorseModel, clear that setting
        if (settings.ollama.quickChatModel === modelName) {
          onUpdateSettings({ ollama: { ...settings.ollama, quickChatModel: '' } });
        }
        if (settings.ollama.workhorseModel === modelName) {
          onUpdateSettings({ ollama: { ...settings.ollama, workhorseModel: '' } });
        }
        if (settings.ollama.model === modelName) { // For the legacy model field
          onUpdateSettings({ ollama: { ...settings.ollama, model: '' } });
        }
        alert(`Model "${modelName}" deleted successfully!`); // Success alert
      } catch (error) {
        console.error("Failed to delete model:", error);
        alert(`Error deleting model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (!isOpen) return null;

  console.log('Memories in SettingsModal:', memories);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-strong rounded-3xl border border-white/20 w-full max-w-3xl mx-6 max-h-[90vh] overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/10">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={18} />}
            onClick={onClose}
            className="glass-hover rounded-2xl"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-2">
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'models' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('models')}
          >
            {activeTab === 'models' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            AI Models
          </button>
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'ollama' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('ollama')}
          >
            {activeTab === 'ollama' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            Ollama
          </button>
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'prompts' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('prompts')}
          >
            {activeTab === 'prompts' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            Prompts
          </button>
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'memories' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('memories')}
          >
            {activeTab === 'memories' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            Memories
          </button>
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'display' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('display')}
          >
            {activeTab === 'display' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            Display
          </button>
          <button
            className={clsx(
              'px-6 py-4 text-sm font-medium rounded-t-2xl transition-glass relative',
              activeTab === 'shortcuts' 
                ? 'text-blue-400 glass-subtle' 
                : 'text-gray-400 hover:text-white glass-hover'
            )}
            onClick={() => setActiveTab('shortcuts')}
          >
            {activeTab === 'shortcuts' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-400 rounded-full"></div>
            )}
            Shortcuts
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* AI Model Configuration */}
          {activeTab === 'models' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-primary mr-3">
                  <Bot size={18} className="text-blue-400" />
                </div>
                AI Model Configuration
              </h3>
              <div className="space-y-6">
                <p className="text-sm text-gray-400 font-normal">
                  Select the model to use for all tasks.
                </p>
                <ModelSelector
                  label="Model"
                  selectedModel={settings.ollama.model}
                  onModelSelect={(model) => onUpdateSettings({
                    ollama: { ...settings.ollama, model: model }
                  })}
                  onPullModel={onPullModel}
                  isConnected={isOllamaConnected}
                  onRefresh={onRefreshModels}
                  isLoading={isModelsLoading}
                  onDeleteModel={handleDeleteModel}
                  models={models} // Pass models prop
                />
              </div>
            </section>
          )}

          {/* Ollama Configuration */}
          {activeTab === 'ollama' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-secondary mr-3">
                  <Cpu size={18} className="text-purple-400" />
                </div>
                Ollama Configuration
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Host"
                    value={settings.ollama.host}
                    onChange={(e) => onUpdateSettings({
                      ollama: { ...settings.ollama, host: e.target.value }
                    })}
                  />
                  <Input
                    label="Port"
                    type="number"
                    value={settings.ollama.port}
                    onChange={(e) => onUpdateSettings({ 
                      ollama: { ...settings.ollama, port: parseInt(e.target.value) } 
                    })}
                  />
                </div>
                <Input
                  label="Path"
                  type="text"
                  value={settings.ollama.path}
                  onChange={(e) => onUpdateSettings({ 
                    ollama: { ...settings.ollama, path: e.target.value } 
                  })}
                  placeholder="e.g., /api"
                />
                <DirectorySelector
                  currentPath={settings.ollama.modelsDirectory}
                  onPathChange={(path) => onUpdateSettings({
                    ollama: { ...settings.ollama, modelsDirectory: path }
                  })}
                  label="Models Directory"
                  description="Path where Ollama stores downloaded models"
                />
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enableCuda"
                    checked={settings.enableCuda}
                    onChange={(e) => onUpdateSettings({ enableCuda: e.target.checked })}
                    className="rounded glass border-white/20 focus:ring-blue-500/50"
                  />
                  <label htmlFor="enableCuda" className="text-sm text-gray-300 font-medium">
                    Enable CUDA acceleration
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Memories Configuration */}
          {activeTab === 'memories' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-accent mr-3">
                  <MessageSquareText size={18} className="text-emerald-400" />
                </div>
                Long-Term Memories
              </h3>
              <div className="space-y-6">
                <p className="text-sm text-gray-400 font-normal">
                  These are memories the AI has automatically stored to provide better context in future conversations.
                </p>
                <Input
                  label="Embedding Model"
                  value={settings.embeddingModel}
                  onChange={(e) => onUpdateSettings({ embeddingModel: e.target.value })}
                  placeholder="e.g., nomic-embed-text"
                  description="Model used to generate embeddings for memories. Must be available in Ollama."
                />
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all memories? This action cannot be undone.')) {
                      memoryService?.clearAllMemories();
                    }
                  }}
                >
                  Clear All Memories
                </Button>
                <h4 className="text-base font-medium text-gray-300 mt-8 mb-4">Stored Memories ({memories.length})</h4>
                {memories.length === 0 ? (
                  <p className="text-gray-400 font-normal">No memories stored yet.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {memories.map((memory) => (
                      <div key={memory.id} className="glass p-4 rounded-2xl border border-white/10 flex justify-between items-start transition-glass">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{new Date(memory.timestamp).toLocaleString()} - {memory.type}</p>
                          <p className="text-sm text-gray-300 mt-2 font-normal">{memory.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this memory?')) {
                              deleteMemory(memory.id);
                            }
                          }}
                          className="glass-hover rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* System Prompts Configuration */}
          {activeTab === 'prompts' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-primary mr-3">
                  <MessageSquareText size={18} className="text-blue-400" />
                </div>
                System Prompts
              </h3>
              <div className="space-y-6">
                {/* Prompt Selector */}
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                  <select
                    id="prompt"
                    value={settings.promptId}
                    onChange={(e) => onUpdateSettings({ promptId: e.target.value })}
                    className="w-full px-4 py-3 glass border border-white/20 rounded-2xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium"
                  >
                    {prompts.map(prompt => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {prompts.length === 0 ? (
                  <p className="text-gray-400 font-normal">No prompts defined. Add a new one below.</p>
                ) : (
                  <ul className="space-y-3">
                    {prompts.map((prompt) => (
                      <li key={prompt.id} className="flex items-center justify-between glass p-4 rounded-2xl border border-white/10 transition-glass">
                        <div className="flex-1 overflow-hidden">
                          <p className="text-white font-semibold">{prompt.name}</p>
                          <div className="text-gray-400 text-sm max-h-20 overflow-y-auto pr-2 mt-1 font-normal">
                            {prompt.content}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {activePrompt?.id === prompt.id ? (
                            <span className="text-emerald-400 flex items-center text-sm font-medium glass-subtle px-3 py-1 rounded-full">
                              <CheckCircle size={14} className="mr-2" /> Active
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetActivePrompt(prompt.id)}
                              disabled={prompt.isFallback}
                              className="rounded-xl"
                            >
                              Set Active
                            </Button>
                          )}
                          {!prompt.isFallback && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Edit size={16} />}
                                onClick={() => handleEditClick(prompt)}
                                className="rounded-xl"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => handleDeletePrompt(prompt.id)}
                                className="rounded-xl"
                              />
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-white/10 pt-6 mt-6">
                  <h4 className="text-base font-semibold text-white mb-4">{editingPromptId ? 'Edit Prompt' : 'Add New Prompt'}</h4>
                  <div className="space-y-4">
                    <Input
                      label="Prompt Name"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      placeholder="e.g., Friendly Assistant"
                    />
                    <Input
                      label="Prompt Content"
                      value={newPromptContent}
                      onChange={(e) => setNewPromptContent(e.target.value)}
                      placeholder="e.g., You are a helpful and friendly AI assistant."
                      textarea
                      rows={4}
                    />
                    <div className="flex space-x-3">
                      <Button onClick={handleCreateOrUpdatePrompt} icon={<Plus size={18} />}>
                        {editingPromptId ? 'Update Prompt' : 'Add Prompt'}
                      </Button>
                      {editingPromptId && (
                        <Button variant="secondary" onClick={() => {
                          setEditingPromptId(null);
                          setNewPromptName('');
                          setNewPromptContent('');
                        }}>
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 mt-6">
                  <Button
                    variant="destructive"
                    onClick={handleResetToFallback}
                  >
                    Reset to Fallback Prompt
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Display Settings */}
          {activeTab === 'display' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-secondary mr-3">
                  <span className="text-purple-400">🎨</span>
                </div>
                Display Settings
              </h3>
              <div className="space-y-6">
                <Input
                  label="Font Size"
                  type="number"
                  min="10"
                  max="20"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                />
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showLineNumbers"
                    checked={settings.showLineNumbers}
                    onChange={(e) => onUpdateSettings({ showLineNumbers: e.target.checked })}
                    className="rounded glass border-white/20 focus:ring-blue-500/50"
                  />
                  <label htmlFor="showLineNumbers" className="text-sm text-gray-300 font-medium">
                    Show line numbers in code blocks
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <div className="p-2 rounded-full glass glow-accent mr-3">
                  <Keyboard size={18} className="text-emerald-400" />
                </div>
                Keyboard Shortcuts
              </h3>
              <div className="space-y-4">
                {Object.entries(settings.keyboardShortcuts || {}).map(([action, shortcut]) => (
                  <div key={action} className="flex items-center justify-between glass p-4 rounded-2xl">
                    <span className="text-sm text-gray-300 capitalize font-medium">
                      {typeof action === 'string' ? action.replace(/-/g, ' ') : action}
                    </span>
                    <code className="px-3 py-2 glass-subtle rounded-xl text-xs text-gray-300 font-mono font-medium">
                      {shortcut}
                    </code>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-8 border-t border-white/10">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}