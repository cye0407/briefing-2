'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { Phase } from '@/lib/types';

interface Step {
  phase: Phase;
  label: string;
  number: number;
}

const STEPS: Step[] = [
  { phase: 'problem', label: 'Problem', number: 1 },
  { phase: 'objective', label: 'Objectives', number: 2 },
  { phase: 'audience', label: 'Audience', number: 3 },
  { phase: 'gap', label: 'Knowledge Gap', number: 4 },
  { phase: 'review', label: 'Review', number: 5 },
];

const PHASE_ORDER: Phase[] = ['problem', 'objective', 'audience', 'gap', 'review', 'done'];

interface ProgressStepperProps {
  currentPhase: Phase;
  onStepClick?: (phase: Phase) => void;
}

export function ProgressStepper({ currentPhase, onStepClick }: ProgressStepperProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => {
        const stepIndex = PHASE_ORDER.indexOf(step.phase);
        const isComplete = currentIndex > stepIndex;
        const isCurrent = currentPhase === step.phase;

        return (
          <div key={step.phase} className="flex items-center">
            <button
              onClick={() => onStepClick?.(step.phase)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full transition-all',
                isCurrent && 'bg-white/20',
                !isCurrent && !isComplete && 'opacity-50',
                onStepClick && 'cursor-pointer hover:bg-white/10'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  isComplete && 'bg-white text-indigo-600',
                  isCurrent && 'bg-white text-indigo-600',
                  !isComplete && !isCurrent && 'bg-white/30 text-white'
                )}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-sm hidden sm:inline',
                  isCurrent ? 'text-white font-medium' : 'text-white/80'
                )}
              >
                {step.label}
              </span>
            </button>

            {idx < STEPS.length - 1 && (
              <div
                className={cn('w-6 h-0.5 rounded-full mx-1', isComplete ? 'bg-white/60' : 'bg-white/20')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
