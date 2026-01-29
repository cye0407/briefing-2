'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
} from 'lucide-react';
import { SavedBrief } from '@/hooks/useBriefs';

interface MyBriefsDrawerProps {
  briefs: SavedBrief[];
  currentBriefId: string | null;
  onSelectBrief: (id: string) => void;
  onNewBrief: () => void;
  onDeleteBrief: (id: string) => void;
}

export function MyBriefsDrawer({
  briefs,
  currentBriefId,
  onSelectBrief,
  onNewBrief,
  onDeleteBrief,
}: MyBriefsDrawerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'bg-gray-900 text-white flex flex-col transition-all duration-200 flex-shrink-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && <span className="font-semibold text-sm">My Briefs</span>}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* New Brief Button */}
      <div className="p-3">
        <button
          onClick={onNewBrief}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-indigo-600 hover:bg-indigo-700 transition-colors',
            'text-sm font-medium',
            isCollapsed && 'justify-center'
          )}
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Brief</span>}
        </button>
      </div>

      {/* Briefs List */}
      <div className="flex-1 overflow-y-auto">
        {briefs.length === 0 ? (
          <div className={cn('p-4 text-center text-gray-500 text-sm', isCollapsed && 'hidden')}>
            No briefs yet
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {briefs.map((brief) => (
              <BriefItem
                key={brief.id}
                brief={brief}
                isActive={brief.id === currentBriefId}
                isCollapsed={isCollapsed}
                onSelect={() => onSelectBrief(brief.id)}
                onDelete={() => onDeleteBrief(brief.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500">
            {briefs.length} brief{briefs.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}

function BriefItem({
  brief,
  isActive,
  isCollapsed,
  onSelect,
  onDelete,
}: {
  brief: SavedBrief;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors cursor-pointer',
        isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'
      )}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={onSelect}
    >
      <div className={cn('flex items-start gap-3 p-2', isCollapsed && 'justify-center')}>
        <FileText
          className={cn(
            'w-4 h-4 mt-0.5 flex-shrink-0',
            isActive ? 'text-indigo-400' : 'text-gray-500'
          )}
        />

        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'text-sm font-medium truncate',
                isActive ? 'text-white' : 'text-gray-300'
              )}
            >
              {brief.title || 'Untitled Brief'}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{formatRelativeTime(brief.updatedAt)}</span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  brief.status === 'complete'
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-yellow-900/50 text-yellow-400'
                )}
              >
                {brief.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete button on hover */}
      {showDelete && !isCollapsed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-900/50 rounded transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" />
        </button>
      )}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
