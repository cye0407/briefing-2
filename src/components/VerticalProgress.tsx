'use client';

import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { Phase } from '@/lib/types';

interface Step {
  id: Phase;
  label: string;
  description?: string;
}

const STEPS: Step[] = [
  { id: 'problem', label: 'Business Problem', description: 'Define the challenge' },
  { id: 'objective', label: 'Business Objective', description: 'What success looks like' },
  { id: 'research_objective', label: 'Research Objective', description: 'What to learn' },
  { id: 'audience', label: 'Target Audience', description: 'Who to study' },
  { id: 'gap', label: 'Knowledge Gap', description: 'What we need to learn' },
  { id: 'knowledge_check', label: 'Knowledge Check', description: 'Search existing research' },
  { id: 'review', label: 'Review & Finalize', description: 'Complete your brief' },
];

const PHASE_ORDER: Phase[] = ['problem', 'objective', 'research_objective', 'audience', 'gap', 'knowledge_check', 'review', 'done'];

interface VerticalProgressProps {
  currentPhase: Phase;
  completedPhases: Phase[];
  onStepClick?: (phase: Phase) => void;
}

export function VerticalProgress({ currentPhase, completedPhases, onStepClick }: VerticalProgressProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex flex-col gap-0">
      {STEPS.map((step, idx) => {
        const stepIndex = PHASE_ORDER.indexOf(step.id);
        const isCompleted = completedPhases.includes(step.id) || currentIndex > stepIndex;
        const isCurrent = currentPhase === step.id;
        const isPending = !isCompleted && !isCurrent;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Vertical line and dot */}
            <div className="flex flex-col items-center">
              {/* Dot/icon */}
              <button
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted && 'bg-indigo-600 border-indigo-600 text-white',
                  isCurrent && 'bg-white border-indigo-600 text-indigo-600',
                  isPending && 'bg-gray-100 border-gray-300 text-gray-400',
                  onStepClick && 'cursor-pointer hover:scale-105'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="text-xs font-medium">{idx + 1}</span>
                )}
              </button>

              {/* Connecting line (not on last item) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-16 transition-all',
                    isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className="pt-1 pb-12">
              <div
                className={cn(
                  'font-medium text-sm',
                  isCurrent && 'text-indigo-600',
                  isCompleted && 'text-gray-900',
                  isPending && 'text-gray-400'
                )}
              >
                {step.label}
              </div>
              {step.description && (
                <div className="text-xs text-gray-500 mt-0.5">{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
