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
  onDeleteModel: (modelName: string) => Promise<void>; // New prop
  promptId: string; // New prop
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
  promptId,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900/70 rounded-xl border border-gray-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={18} />}
            onClick={onClose}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800">
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'models' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('models')}
          >
            AI Models
          </button>
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'ollama' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('ollama')}
          >
            Ollama
          </button>
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'prompts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('prompts')}
          >
            Prompts
          </button>
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'memories' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('memories')}
          >
            Memories
          </button>
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'display' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('display')}
          >
            Display
          </button>
          <button
            className={clsx(
              'px-6 py-3 text-sm font-medium',
              activeTab === 'shortcuts' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            )}
            onClick={() => setActiveTab('shortcuts')}
          >
            Shortcuts
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* AI Model Configuration */}
          {activeTab === 'models' && (
            <section>
              <h3 className="text-md font-medium text-white mb-4 flex items-center">
                <Bot size={18} className="mr-2" />
                AI Model Configuration
              </h3>
              <div className="space-y-4"> {/* Added a div for spacing */}
                <p className="text-sm text-gray-400">
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
                />
              </div>
            </section>
          )}

          {/* Ollama Configuration */}
          {activeTab === 'ollama' && (
            <section>
              <h3 className="text-md font-medium text-white mb-4 flex items-center">
                <Cpu size={18} className="mr-2" />
                Ollama Configuration
              </h3>
              <div className="space-y-4">
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
                    className="rounded bg-gray-800 border-gray-700"
                  />
                  <label htmlFor="enableCuda" className="text-sm text-gray-300">
                    Enable CUDA acceleration
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Memories Configuration */}
          {activeTab === 'memories' && (
            <section>
              <h3 className="text-md font-medium text-white mb-4 flex items-center">
                <MessageSquareText size={18} className="mr-2" />
                Long-Term Memories
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
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
                <h4 className="text-sm font-medium text-gray-300 mt-6 mb-3">Stored Memories ({memories.length})</h4>
                {memories.length === 0 ? (
                  <p className="text-gray-400">No memories stored yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {memories.map((memory) => (
                      <div key={memory.id} className="bg-gray-800 p-3 rounded-md border border-gray-700 flex justify-between items-start">
                        <div>
                          <p className="text-xs text-gray-500">{new Date(memory.timestamp).toLocaleString()} - {memory.type}</p>
                          <p className="text-sm text-gray-300 mt-1">{memory.content}</p>
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
              <h3 className="text-md font-medium text-white mb-4 flex items-center">
                <MessageSquareText size={18} className="mr-2" />
                System Prompts
              </h3>
              <div className="space-y-4">
                {/* Prompt Selector */}
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
                  <select
                    id="prompt"
                    value={settings.promptId}
                    onChange={(e) => onUpdateSettings({ promptId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {prompts.map(prompt => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </option>
                    ))}
                  </select>
                </div>

                {prompts.length === 0 ? (
                  <p className="text-gray-400">No prompts defined. Add a new one below.</p>
                ) : (
                  <ul className="space-y-2">
                    {prompts.map((prompt) => (
                      <li key={prompt.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md border border-gray-700">
                        <div className="flex-1 overflow-hidden">
                          <p className="text-white font-medium">{prompt.name}</p>
                          <div className="text-gray-400 text-sm max-h-20 overflow-y-auto pr-2">
                            {prompt.content}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {activePrompt?.id === prompt.id ? (
                            <span className="text-green-500 flex items-center text-sm">
                              <CheckCircle size={16} className="mr-1" /> Active
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetActivePrompt(prompt.id)}
                              disabled={prompt.isFallback}
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
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => handleDeletePrompt(prompt.id)}
                              />
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h4 className="text-md font-medium text-white mb-3">{editingPromptId ? 'Edit Prompt' : 'Add New Prompt'}</h4>
                  <div className="space-y-3">
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
                    <div className="flex space-x-2">
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

                <div className="border-t border-gray-700 pt-4 mt-4">
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
              <h3 className="text-md font-medium text-white mb-4">Display</h3>
              <div className="space-y-4">
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
                    className="rounded bg-gray-800 border-gray-700"
                  />
                  <label htmlFor="showLineNumbers" className="text-sm text-gray-300">
                    Show line numbers in code blocks
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <section>
              <h3 className="text-md font-medium text-white mb-4 flex items-center">
                <Keyboard size={18} className="mr-2" />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                {Object.entries(settings.keyboardShortcuts || {}).map(([action, shortcut]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">
                      {typeof action === 'string' ? action.replace(/-/g, ' ') : action}
                    </span>
                    <code className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                      {shortcut}
                    </code>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-800">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}