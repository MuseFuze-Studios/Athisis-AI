import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OllamaModel, OllamaAPI } from '../../services/ollamaApi';
import { clsx } from 'clsx';
import { useSettings } from '../../hooks/useSettings';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onPullModel: (modelName: string) => Promise<void>;
  isConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  onDeleteModel: (modelName: string) => Promise<void>;
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  onPullModel,
  isConnected,
  onRefresh,
  isLoading,
  onDeleteModel
}: ModelSelectorProps) {
  const [newModelName, setNewModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState<string>('');
  const [allModels, setAllModels] = useState<OllamaModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<OllamaModel[]>([]);

  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    const fetchModels = async () => {
      if (isConnected) {
        try {
          const api = new OllamaAPI(settings.ollama.host, settings.ollama.port, settings.ollama.path);
          const fetchedModels = await api.getModels();
          setAllModels(fetchedModels);
        } catch (error) {
          console.error("Failed to fetch models:", error);
          setAllModels([]);
        }
      } else {
        setAllModels([]);
      }
    };
    fetchModels();
  }, [isConnected, settings.ollama.host, settings.ollama.port, settings.ollama.path]);

  useEffect(() => {
    const currentComplexity = settings.selectedModelComplexity;
    const filtered = allModels.filter(model => model.complexity === currentComplexity);
    setFilteredModels(filtered);
  }, [allModels, settings.selectedModelComplexity]);

  const handlePullModel = async () => {
    if (!newModelName.trim()) return;

    setIsPulling(true);
    setPullProgress('Starting download...');

    try {
      await onPullModel(newModelName.trim());
      setNewModelName('');
      setPullProgress('');
    } catch (error) {
      setPullProgress(`Error: ${error instanceof Error ? error.message : 'Failed to pull model'}`);
    } finally {
      setIsPulling(false);
    }
  };

  const formatModelSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-green-400' : 'bg-red-400'
          )} />
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected to Ollama' : 'Disconnected'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          onClick={onRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Model Complexity Selection */}
      <div className="flex space-x-2">
        <Button
          variant={settings.selectedModelComplexity === 'simple' ? 'default' : 'outline'}
          onClick={() => updateSettings({ selectedModelComplexity: 'simple' })}
        >
          Simple Models
        </Button>
        <Button
          variant={settings.selectedModelComplexity === 'complex' ? 'default' : 'outline'}
          onClick={() => updateSettings({ selectedModelComplexity: 'complex' })}
        >
          Complex Models
        </Button>
      </div>

      {/* Available Models */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Available Models</h4>
        {!isConnected ? (
          <div className="flex items-center space-x-2 p-3 bg-gray-800 rounded-lg">
            <AlertCircle size={16} className="text-amber-400" />
            <span className="text-sm text-gray-400">
              Connect to Ollama to see available models
            </span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-sm text-gray-400 p-3 bg-gray-800 rounded-lg">
            No models found for the selected complexity. Pull a model or change complexity.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredModels.map(model => (
              <div
                key={model.name}
                className={clsx(
                  'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                  selectedModel === model.name
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-750 text-gray-300'
                )}
                onClick={() => onModelSelect(model.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{model.name}</span>
                    {selectedModel === model.name && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2"> {/* New div for buttons */}
                    <span className="text-xs opacity-75">
                      {formatModelSize(model.size)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent onModelSelect from firing
                        onDeleteModel(model.name);
                      }}
                      className="text-red-400 hover:text-red-300"
                    />
                  </div>
                </div>
                {model.details && (
                  <div className="text-xs opacity-75 mt-1">
                    {model.details.parameter_size} • {model.details.quantization_level}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pull New Model */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Download New Model</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., llama2, codellama, mistral"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              disabled={!isConnected || isPulling}
              className="flex-1"
            />
            <Button
              icon={<Download size={16} />}
              onClick={handlePullModel}
              disabled={!isConnected || !newModelName.trim() || isPulling}
            >
              {isPulling ? 'Pulling...' : 'Pull'}
            </Button>
          </div>
          
          {pullProgress && (
            <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
              {pullProgress}
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Popular models: llama2, codellama, mistral, phi, neural-chat
          </div>
        </div>
      </div>
    </div>
  );
}