'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brief, Message, Phase } from '@/lib/types';

export interface SavedBrief {
  id: string;
  title: string;
  data: Brief;
  messages: Message[];
  phase: Phase;
  updatedAt: Date;
  createdAt: Date;
  status: 'draft' | 'complete';
}

const STORAGE_KEY = 'briefing-agent-briefs';

const INITIAL_BRIEF: Brief = {
  businessProblem: '',
  businessObjective: '',
  researchObjective: '',
  knowledgeGap: '',
  targetAudience: '',
};

export function useBriefs() {
  const [briefs, setBriefs] = useState<SavedBrief[]>([]);
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((b: SavedBrief) => ({
          ...b,
          updatedAt: new Date(b.updatedAt),
          createdAt: new Date(b.createdAt),
        }));
        setBriefs(hydrated);

        // Select the most recent brief
        if (hydrated.length > 0) {
          setCurrentBriefId(hydrated[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load briefs from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(briefs));
      } catch (error) {
        console.error('Failed to save briefs to localStorage:', error);
      }
    }
  }, [briefs, isLoaded]);

  const createBrief = useCallback(() => {
    const now = new Date();
    const newBrief: SavedBrief = {
      id: `brief-${Date.now()}`,
      title: 'Untitled Brief',
      data: INITIAL_BRIEF,
      messages: [],
      phase: 'problem',
      updatedAt: now,
      createdAt: now,
      status: 'draft',
    };
    setBriefs((prev) => [newBrief, ...prev]);
    setCurrentBriefId(newBrief.id);
    return newBrief;
  }, []);

  const updateBrief = useCallback((id: string, updates: Partial<SavedBrief>) => {
    setBriefs((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              ...updates,
              updatedAt: new Date(),
              // Auto-generate title from business problem
              title:
                updates.data?.businessProblem?.slice(0, 50) ||
                b.data?.businessProblem?.slice(0, 50) ||
                'Untitled Brief',
            }
          : b
      )
    );
  }, []);

  const deleteBrief = useCallback(
    (id: string) => {
      setBriefs((prev) => prev.filter((b) => b.id !== id));
      if (currentBriefId === id) {
        const remaining = briefs.filter((b) => b.id !== id);
        setCurrentBriefId(remaining[0]?.id || null);
      }
    },
    [briefs, currentBriefId]
  );

  const currentBrief = briefs.find((b) => b.id === currentBriefId) || null;

  return {
    briefs,
    currentBrief,
    currentBriefId,
    setCurrentBriefId,
    createBrief,
    updateBrief,
    deleteBrief,
    isLoaded,
  };
}
