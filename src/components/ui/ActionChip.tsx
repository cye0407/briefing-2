'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ActionChipAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  primary?: boolean;
}

interface ActionChipProps {
  action: ActionChipAction;
  onClick: () => void;
  disabled?: boolean;
}

export function ActionChip({ action, onClick, disabled }: ActionChipProps) {
  const Icon = action.icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all',
        'hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        action.primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {action.label}
    </button>
  );
}

interface ActionChipsProps {
  actions: ActionChipAction[];
  onAction: (actionId: string) => void;
  disabled?: boolean;
}

export function ActionChips({ actions, onAction, disabled }: ActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action) => (
        <ActionChip
          key={action.id}
          action={action}
          onClick={() => onAction(action.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
