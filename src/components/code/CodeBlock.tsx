import React, { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Copy, Check, Edit3, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useClipboard } from '../../hooks/useClipboard';
import { clsx } from 'clsx';
import 'prismjs'; // Import core Prism.js
import 'prismjs/components/prism-csharp'; // Import C# language definition

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language, filename, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(code);
  const { copyToClipboard } = useClipboard();

  const handleCopy = async () => {
    const success = await copyToClipboard(editedCode, 'code', language);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCode(code);
    setIsEditing(false);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {language}
          </span>
          {filename && (
            <span className="text-sm text-gray-300">{filename}</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {!isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Edit3 size={16} />}
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={copied ? <Check size={16} /> : <Copy size={16} />}
                onClick={handleCopy}
                className={clsx(
                  'transition-all duration-200 text-gray-400 hover:text-white',
                  copied && 'text-green-400'
                )}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                icon={<Save size={16} />}
                onClick={handleSave}
                className="text-gray-400 hover:text-white"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={16} />}
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full h-64 p-4 bg-gray-950 text-gray-100 font-mono text-sm resize-none border-0 focus:outline-none"
            style={{ fontFamily: 'SF Mono, Monaco, Inconsolata, Roboto Mono, monospace' }}
          />
        ) : (
          <Highlight
            theme={themes.vsDark}
            code={editedCode}
            language={language}
          >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={clsx(className, 'p-4 bg-gray-950 overflow-auto text-sm')}
                style={style}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {showLineNumbers && (
                      <span className="inline-block w-8 text-right text-gray-500 select-none mr-4">
                        {i + 1}
                      </span>
                    )}
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        )}
      </div>
    </div>
  );
}