import React, { useState } from 'react';
import Folder from 'lucide-react/dist/esm/icons/folder.js';
import Check from 'lucide-react/dist/esm/icons/check.js';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle.js';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface DirectorySelectorProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  label: string;
  description?: string;
}

export function DirectorySelector({ 
  currentPath, 
  onPathChange, 
  label, 
  description 
}: DirectorySelectorProps) {
  const [tempPath, setTempPath] = useState(currentPath);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);

  const validatePath = async (path: string) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // In a real desktop app, you'd use filesystem APIs
      // For web demo, we'll simulate validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Basic path validation
      const isValid = path.length > 0 && (
        path.includes('ollama') || 
        path.includes('models') ||
        path.toLowerCase().includes('ai')
      );
      
      setValidationResult(isValid ? 'valid' : 'invalid');
      
      if (isValid) {
        onPathChange(path);
      }
    } catch {
      setValidationResult('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleBrowse = async () => {
    // In a real implementation, this would use:
    // - File System Access API for web
    // - Native file dialogs for Electron/Tauri
    // For demo, we'll use a prompt
    const path = prompt('Enter the path to your Ollama models directory:', tempPath);
    if (path && path !== tempPath) {
      setTempPath(path);
      await validatePath(path);
    }
  };

  const handleApply = async () => {
    if (tempPath !== currentPath) {
      await validatePath(tempPath);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mb-3">{description}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={tempPath}
          onChange={(e) => setTempPath(e.target.value)}
          placeholder="e.g., F:\Models\Ollama\"
          className="flex-1 font-mono text-sm"
        />
        <Button
          variant="secondary"
          icon={<Folder size={16} />}
          onClick={handleBrowse}
        >
          Browse
        </Button>
      </div>

      {tempPath !== currentPath && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleApply}
            disabled={isValidating}
            icon={isValidating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Check size={14} />
            )}
          >
            {isValidating ? 'Validating...' : 'Apply'}
          </Button>
          
          {validationResult === 'valid' && (
            <div className="flex items-center text-green-400 text-xs">
              <Check size={12} className="mr-1" />
              Valid path
            </div>
          )}
          
          {validationResult === 'invalid' && (
            <div className="flex items-center text-red-400 text-xs">
              <AlertTriangle size={12} className="mr-1" />
              Invalid or inaccessible path
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500">
        This should point to where Ollama stores downloaded models on your system.
      </div>
    </div>
  );
}