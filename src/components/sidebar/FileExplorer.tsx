import React, { useState } from 'react';
import Folder from 'lucide-react/dist/esm/icons/folder.js';
import FileIcon from 'lucide-react/dist/esm/icons/file.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.js';
import { ProjectFile } from '../../types';
import { clsx } from 'clsx';

interface FileExplorerProps {
  onFileSelect: (file: ProjectFile) => void;
  rootPath?: string;
}

// Mock file structure - in real implementation, this would come from filesystem
const mockFiles: ProjectFile[] = [
  {
    name: 'src',
    path: '/project/src',
    type: 'directory',
    children: [
      { name: 'components', path: '/project/src/components', type: 'directory' },
      { name: 'hooks', path: '/project/src/hooks', type: 'directory' },
      { name: 'utils', path: '/project/src/utils', type: 'directory' },
      { name: 'App.tsx', path: '/project/src/App.tsx', type: 'file' },
      { name: 'main.tsx', path: '/project/src/main.tsx', type: 'file' },
    ],
  },
  {
    name: 'public',
    path: '/project/public',
    type: 'directory',
    children: [
      { name: 'index.html', path: '/project/public/index.html', type: 'file' },
    ],
  },
  { name: 'package.json', path: '/project/package.json', type: 'file' },
  { name: 'tsconfig.json', path: '/project/tsconfig.json', type: 'file' },
  { name: 'README.md', path: '/project/README.md', type: 'file' },
];

export function FileExplorer({ onFileSelect, rootPath }: FileExplorerProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/project/src']));

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderFile = (file: ProjectFile, level: number = 0) => {
    const isExpanded = expandedDirs.has(file.path);
    const isDirectory = file.type === 'directory';

    return (
      <div key={file.path}>
        <div
          className={clsx(
            'flex items-center p-1 rounded hover:bg-gray-800 cursor-pointer',
            'transition-colors duration-150'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (isDirectory) {
              toggleDirectory(file.path);
            } else {
              onFileSelect(file);
            }
          }}
        >
          {isDirectory && (
            <span className="mr-1 text-gray-500">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          <span className="mr-2 text-gray-400">
            {isDirectory ? <Folder size={16} /> : <FileIcon size={16} />}
          </span>
          <span className="text-sm text-gray-300">{file.name}</span>
        </div>
        
        {isDirectory && isExpanded && file.children && (
          <div>
            {file.children.map(child => renderFile(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-sm font-medium text-gray-300">File Explorer</h3>
        {rootPath && (
          <p className="text-xs text-gray-500 mt-1 truncate">{rootPath}</p>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {mockFiles.map(file => renderFile(file))}
      </div>
    </div>
  );
}