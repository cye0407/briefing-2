'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Check, X } from 'lucide-react';
import { Brief, Phase } from '@/lib/types';

interface BriefSectionData {
  id: keyof Brief;
  title: string;
  phase: Phase;
}

const BRIEF_SECTIONS: BriefSectionData[] = [
  { id: 'businessProblem', title: 'Business Problem', phase: 'problem' },
  { id: 'businessObjective', title: 'Business Objective', phase: 'objective' },
  { id: 'researchObjective', title: 'Research Objective', phase: 'objective' },
  { id: 'targetAudience', title: 'Target Audience', phase: 'audience' },
  { id: 'knowledgeGap', title: 'Knowledge Gap', phase: 'gap' },
];

interface EditableBriefPanelProps {
  brief: Brief;
  currentPhase: Phase;
  onUpdateField: (field: keyof Brief, value: string) => void;
  onCopyToClipboard: () => void;
}

export function EditableBriefPanel({
  brief,
  currentPhase,
  onUpdateField,
  onCopyToClipboard,
}: EditableBriefPanelProps) {
  const [editingSection, setEditingSection] = useState<keyof Brief | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (field: keyof Brief) => {
    setEditingSection(field);
    setEditValue(brief[field]);
  };

  const handleSave = () => {
    if (editingSection) {
      onUpdateField(editingSection, editValue);
      setEditingSection(null);
      setEditValue('');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditValue('');
  };

  return (
    <div className="w-96 bg-gray-50 p-4 overflow-y-auto border-l border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Brief Preview</h2>
        <button
          onClick={onCopyToClipboard}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Copy to clipboard
        </button>
      </div>

      <div className="space-y-4">
        {BRIEF_SECTIONS.map((section) => (
          <BriefSection
            key={section.id}
            title={section.title}
            content={brief[section.id]}
            isActive={currentPhase === section.phase}
            isEditing={editingSection === section.id}
            editValue={editValue}
            onEditChange={setEditValue}
            onEdit={() => handleEdit(section.id)}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ))}
      </div>
    </div>
  );
}

interface BriefSectionProps {
  title: string;
  content: string;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onEditChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

function BriefSection({
  title,
  content,
  isActive,
  isEditing,
  editValue,
  onEditChange,
  onEdit,
  onSave,
  onCancel,
}: BriefSectionProps) {
  return (
    <div
      className={cn(
        'group p-3 rounded-lg border transition-all',
        isActive
          ? 'border-indigo-500 bg-indigo-50 shadow-sm'
          : content
            ? 'border-green-200 bg-white'
            : 'border-gray-200 bg-white'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        {content && !isActive && !isEditing && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
              Done
            </span>
            <button
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : content ? (
        <div
          onClick={onEdit}
          className="cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
        >
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{content}</p>
        </div>
      ) : (
        <div className="text-sm py-2 px-3 rounded bg-gray-50 text-gray-400 italic border border-dashed border-gray-200">
          {isActive ? 'Working on this now...' : 'We\'ll fill this in soon'}
        </div>
      )}
    </div>
  );
}
