'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Message, Brief, Phase, KnowledgeCheckResult } from '@/lib/types';
import { cn } from '@/lib/utils';
import ExpertModeEntry from '@/components/ExpertModeEntry';
import { EditableBriefPanel } from '@/components/EditableBriefPanel';
import { VerticalProgress } from '@/components/VerticalProgress';
import { MyBriefsDrawer } from '@/components/MyBriefsDrawer';
import { KnowledgeCheck } from '@/components/KnowledgeCheck';
import { ActionChips, ActionChipAction } from '@/components/ui/ActionChip';
import { Button } from '@/components/ui/Button';
import { useBriefs } from '@/hooks/useBriefs';
import {
  FileText,
  Download,
  Send,
  ChevronRight,
  Upload,
  Check,
  Pencil,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Loader2,
} from 'lucide-react';

const INITIAL_BRIEF: Brief = {
  businessProblem: '',
  businessObjective: '',
  researchObjective: '',
  knowledgeGap: '',
  targetAudience: '',
};

const PHASE_ORDER: Phase[] = ['problem', 'objective', 'research_objective', 'audience', 'gap', 'knowledge_check', 'review', 'done'];

// Action sets: "initial" shows after user's first input (no AI suggestion yet),
// "withSuggestion" shows after the AI has proposed/suggested content.
const PHASE_ACTIONS_INITIAL: Record<Phase, ActionChipAction[]> = {
  problem: [
    { id: 'suggest', label: 'Suggest alternative', icon: Sparkles, primary: true },
    { id: 'edit', label: 'Edit myself', icon: Pencil },
    { id: 'help', label: 'Help me improve', icon: HelpCircle },
  ],
  objective: [
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
  ],
  research_objective: [
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
  ],
  audience: [
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'help', label: 'Help me define', icon: HelpCircle },
  ],
  gap: [
    { id: 'suggest', label: 'Suggest more gaps', icon: Sparkles, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
  ],
  knowledge_check: [],
  review: [
    { id: 'finalize', label: 'Finalize brief', icon: Check, primary: true },
    { id: 'edit_section', label: 'Edit a section', icon: Pencil },
  ],
  done: [],
};

const PHASE_ACTIONS_WITH_SUGGESTION: Record<Phase, ActionChipAction[]> = {
  problem: [
    { id: 'accept', label: 'Accept & continue', icon: Check, primary: true },
    { id: 'edit', label: 'Edit myself', icon: Pencil },
    { id: 'suggest', label: 'Suggest alternative', icon: Sparkles },
    { id: 'help', label: 'Help me improve', icon: HelpCircle },
    { id: 'regenerate', label: 'Try again', icon: RefreshCw },
  ],
  objective: [
    { id: 'accept', label: 'Accept & continue', icon: Check, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles },
    { id: 'regenerate', label: 'Try again', icon: RefreshCw },
  ],
  research_objective: [
    { id: 'accept', label: 'Accept & continue', icon: Check, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles },
    { id: 'regenerate', label: 'Try again', icon: RefreshCw },
  ],
  audience: [
    { id: 'accept', label: 'Accept & continue', icon: Check, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'suggest', label: 'Suggest alternatives', icon: Sparkles },
    { id: 'help', label: 'Help me define', icon: HelpCircle },
  ],
  gap: [
    { id: 'accept', label: 'Accept & continue', icon: Check, primary: true },
    { id: 'edit', label: 'Edit', icon: Pencil },
    { id: 'suggest', label: 'Suggest more gaps', icon: Sparkles },
  ],
  knowledge_check: [],
  review: [
    { id: 'finalize', label: 'Finalize brief', icon: Check, primary: true },
    { id: 'edit_section', label: 'Edit a section', icon: Pencil },
  ],
  done: [],
};

const WELCOME_MESSAGE = `# Welcome to the Briefing Agent

I'll help you build a high-quality research brief through a guided conversation.

**Here's what we'll cover:**

1. **Business Problem** - The challenge driving this research
2. **Objectives** - What success looks like
3. **Target Audience** - Who we're studying
4. **Knowledge Gap** - What we need to learn
5. **Knowledge Check** - See what's already known

---

**Let's start with the business problem.**

A good problem statement is specific and actionable. For example:

> "We're seeing 15% customer churn in the premium segment but don't understand why customers are leaving or where they're going."

**What challenge or question is driving your research need?**`;

function phaseToField(phase: Phase): keyof Brief | null {
  const map: Record<Phase, keyof Brief | null> = {
    problem: 'businessProblem',
    objective: 'businessObjective',
    research_objective: 'researchObjective',
    audience: 'targetAudience',
    gap: 'knowledgeGap',
    knowledge_check: null,
    review: null,
    done: null,
  };
  return map[phase];
}

function BriefingAgentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'guided';

  // Brief management
  const {
    briefs,
    currentBrief,
    currentBriefId,
    setCurrentBriefId,
    createBrief,
    updateBrief,
    deleteBrief,
    isLoaded,
  } = useBriefs();

  const [showExpertEntry, setShowExpertEntry] = useState(mode === 'expert');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('problem');
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [phaseInputCount, setPhaseInputCount] = useState(0); // tracks how many times user has submitted in current phase
  const [completedPhases, setCompletedPhases] = useState<Phase[]>([]);
  const [knowledgeCheckResult, setKnowledgeCheckResult] = useState<KnowledgeCheckResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: WELCOME_MESSAGE,
        },
      ]);
    }
  }, [messages.length]);

  // Auto-create brief if none exists
  useEffect(() => {
    if (isLoaded && briefs.length === 0) {
      createBrief();
    }
  }, [isLoaded, briefs.length, createBrief]);

  // Load brief data when current brief changes
  useEffect(() => {
    if (currentBrief) {
      setBrief(currentBrief.data);
      setPhase(currentBrief.phase);
      if (currentBrief.messages.length > 0) {
        setMessages(currentBrief.messages);
      }
    }
  }, [currentBriefId, currentBrief]);

  // Save state to brief periodically
  const saveCurrentState = useCallback(() => {
    if (currentBriefId) {
      updateBrief(currentBriefId, {
        data: brief,
        messages,
        phase,
        status: phase === 'done' ? 'complete' : 'draft',
      });
    }
  }, [currentBriefId, brief, messages, phase, updateBrief]);

  useEffect(() => {
    const timer = setTimeout(saveCurrentState, 1000);
    return () => clearTimeout(timer);
  }, [saveCurrentState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addAssistantMessage = (content: string, withActions = false) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content,
      },
    ]);
    setShowActions(withActions);
  };

  const handleBriefExtracted = (extractedBrief: Partial<Brief>) => {
    setBrief((prev) => ({ ...prev, ...extractedBrief }));
    setShowExpertEntry(false);

    const extractedFields = Object.entries(extractedBrief)
      .filter(([, value]) => value)
      .map(([key, value]) => `**${key}:** ${String(value).slice(0, 100)}...`)
      .join('\n');

    const welcomeBack: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `I've extracted the following from your document:\n\n${extractedFields || 'No specific brief elements found.'}\n\nLet me review and help you refine each section. ${
        extractedBrief.businessProblem
          ? "I see you have a business problem defined. Would you like me to help strengthen it, or shall we move on to objectives?"
          : "Let's start by defining the business problem. What challenge is driving this research?"
      }`,
    };

    setMessages([welcomeBack]);
    if (extractedBrief.businessProblem) {
      setPhase('objective');
      setCompletedPhases(['problem']);
    }
  };

  const handleSwitchToGuided = () => {
    setShowExpertEntry(false);
    router.push('/?mode=guided');
  };

  const updateBriefField = (field: keyof Brief, value: string) => {
    setBrief((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowActions(false);

    // Update brief with user input
    const field = phaseToField(phase);
    if (field) {
      updateBriefField(field, userMessage.content);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          phase,
          brief: { ...brief, ...(field ? { [field]: userMessage.content } : {}) },
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      // Track input count for this phase.
      // First input: show INITIAL actions (no accept — AI is giving feedback/coaching).
      // Second+ input: user has refined, so flip to WITH_SUGGESTION (shows accept).
      const newCount = phaseInputCount + 1;
      setPhaseInputCount(newCount);
      if (newCount >= 2) {
        setHasSuggestion(true);
      }
      addAssistantMessage(data.message, true);
    } catch (error) {
      console.error('Error:', error);
      addAssistantMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (actionId: string) => {
    setShowActions(false);

    switch (actionId) {
      case 'accept':
        // Mark current phase as completed
        if (!completedPhases.includes(phase)) {
          setCompletedPhases((prev) => [...prev, phase]);
        }
        advancePhase();
        break;

      case 'finalize':
        setCompletedPhases((prev) => [...prev, 'review']);
        setPhase('done');
        addAssistantMessage(
          `Your research brief is complete!\n\n**Summary:**\n\n- **Business Problem:** ${brief.businessProblem}\n- **Business Objective:** ${brief.businessObjective}\n- **Research Objective:** ${brief.researchObjective}\n- **Target Audience:** ${brief.targetAudience}\n- **Knowledge Gap:** ${brief.knowledgeGap}\n\nYou can copy the brief using the Export button, or click on any section to make edits.`,
          false
        );
        break;

      case 'edit':
      case 'edit_section':
        addAssistantMessage(
          "You can click on any section in the Brief Preview panel to edit it directly. Or type your changes here and I'll update the brief.",
          false
        );
        inputRef.current?.focus();
        break;

      case 'suggest':
        setIsLoading(true);
        try {
          const field = phaseToField(phase);
          const currentValue = field ? brief[field] : '';

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                ...messages,
                {
                  id: Date.now().toString(),
                  role: 'user',
                  content: `Please suggest an alternative way to phrase this ${phase}: "${currentValue}"`,
                },
              ],
              phase,
              brief,
            }),
          });

          if (!response.ok) throw new Error('API request failed');
          const data = await response.json();
          setHasSuggestion(true);
          addAssistantMessage(data.message, true);
        } catch (error) {
          console.error('Error:', error);
          addAssistantMessage('Sorry, I encountered an error generating alternatives.', false);
        } finally {
          setIsLoading(false);
        }
        break;

      case 'help':
        const helpMessages: Record<Phase, string> = {
          problem:
            "**Tips for a strong business problem:**\n\n1. Be specific about what's at stake\n2. Quantify the impact if possible\n3. Explain who needs to make a decision\n4. Clarify why this matters now\n\nFor example: \"Our enterprise segment has seen a 20% drop in renewal rates over the past 2 quarters. The VP of Sales needs to decide whether to invest in customer success or adjust our pricing strategy by Q3.\"",
          objective:
            '**Tips for clear business objectives:**\n\n1. Make them measurable\n2. Link to business outcomes\n3. Be realistic about scope\n\nFor example: "Identify the top 3 factors driving non-renewal and quantify the potential revenue impact of addressing each."',
          research_objective:
            '**Tips for research objectives:**\n\n1. Focus on specific questions the research should answer\n2. Distinguish from business objectives — these are about insights, not outcomes\n3. Be actionable\n\nFor example: "Understand the key decision factors and pain points that lead premium customers to cancel their subscriptions."',
          audience:
            "**Tips for defining target audience:**\n\n1. Be specific about demographics\n2. Include behavioral characteristics\n3. Consider decision-making roles\n\nFor example: \"IT decision-makers at mid-market companies (500-2000 employees) who have evaluated but not purchased our solution in the last 12 months.\"",
          gap: '**Tips for knowledge gaps:**\n\n1. Focus on what you don\'t know, not what you want to confirm\n2. Be specific about what evidence would change your decision\n\nFor example: "We don\'t know whether customers who churn are leaving for competitors or leaving the category entirely."',
          knowledge_check: 'The knowledge check will search for existing research that may address your questions.',
          review: 'Review your brief sections and make any final edits.',
          done: 'Your brief is complete!',
        };
        setHasSuggestion(true); // After getting help, user can now accept
        addAssistantMessage(helpMessages[phase], true);
        break;

      case 'regenerate':
        setIsLoading(true);
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                ...messages,
                {
                  id: Date.now().toString(),
                  role: 'user',
                  content: `Please help me rephrase my ${phase} statement. Here's what I have so far, but I'd like a different approach.`,
                },
              ],
              phase,
              brief,
            }),
          });

          if (!response.ok) throw new Error('API request failed');
          const data = await response.json();
          setHasSuggestion(true);
          addAssistantMessage(data.message, true);
        } catch (error) {
          console.error('Error:', error);
          addAssistantMessage('Sorry, I encountered an error. Please try again.', false);
        } finally {
          setIsLoading(false);
        }
        break;
    }
  };

  const advancePhase = () => {
    const currentIndex = PHASE_ORDER.indexOf(phase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      const nextPhase = PHASE_ORDER[currentIndex + 1];
      setPhase(nextPhase);
      setHasSuggestion(false);
      setPhaseInputCount(0);

      // Don't add message for knowledge_check phase - it has its own UI
      if (nextPhase === 'knowledge_check') {
        return;
      }

      const phasePrompts: Record<Phase, string> = {
        problem: '',
        objective:
          "Great progress! Now let's define your **business objective**.\n\nWhat does success look like for this research? What specific business outcomes are you hoping to achieve?",
        research_objective:
          "Now let's define the **research objective**.\n\nWhat specific questions should this research answer? What insights do you need to make better decisions?",
        audience:
          "Now let's identify the **target audience**.\n\nWho should this research focus on? Be specific about demographics, behaviors, or characteristics.",
        gap: "Finally, let's clarify the **knowledge gap**.\n\nWhat don't you currently know that this research needs to answer?",
        knowledge_check: '',
        review: `Let's review your complete brief:\n\n**Business Problem:** ${brief.businessProblem}\n\n**Business Objective:** ${brief.businessObjective}\n\n**Research Objective:** ${brief.researchObjective}\n\n**Target Audience:** ${brief.targetAudience}\n\n**Knowledge Gap:** ${brief.knowledgeGap}\n\nWould you like to finalize this brief or make any changes?`,
        done: 'Your brief is complete!',
      };

      if (phasePrompts[nextPhase]) {
        addAssistantMessage(phasePrompts[nextPhase], false);
      }
    }
  };

  const goToPhase = (newPhase: Phase) => {
    setPhase(newPhase);
    setHasSuggestion(false);
    setPhaseInputCount(0);
    setShowActions(newPhase !== 'knowledge_check');
  };

  const handleKnowledgeCheckComplete = (result: KnowledgeCheckResult) => {
    setKnowledgeCheckResult(result);
    setCompletedPhases((prev) => [...prev, 'knowledge_check']);

    // Add findings to the conversation
    const findingsMessage = result.findings.length > 0
      ? `\n\n**What We Found:**\n${result.findings.map(f => `- ${f}`).join('\n')}`
      : '';

    const gapsMessage = result.remainingGaps.length > 0
      ? `\n\n**Remaining Gaps:**\n${result.remainingGaps.map(g => `- ${g}`).join('\n')}`
      : '';

    addAssistantMessage(
      `Knowledge check complete!${findingsMessage}${gapsMessage}\n\nLet's review your complete brief.`,
      false
    );

    setPhase('review');
    setTimeout(() => {
      addAssistantMessage(
        `Here's your complete brief:\n\n**Business Problem:** ${brief.businessProblem}\n\n**Business Objective:** ${brief.businessObjective}\n\n**Research Objective:** ${brief.researchObjective}\n\n**Target Audience:** ${brief.targetAudience}\n\n**Knowledge Gap:** ${brief.knowledgeGap}\n\nWould you like to finalize this brief or make any changes?`,
        true
      );
    }, 500);
  };

  const handleKnowledgeCheckSkip = () => {
    setCompletedPhases((prev) => [...prev, 'knowledge_check']);
    setPhase('review');
    addAssistantMessage(
      `Let's review your complete brief:\n\n**Business Problem:** ${brief.businessProblem}\n\n**Business Objective:** ${brief.businessObjective}\n\n**Research Objective:** ${brief.researchObjective}\n\n**Target Audience:** ${brief.targetAudience}\n\n**Knowledge Gap:** ${brief.knowledgeGap}\n\nWould you like to finalize this brief or make any changes?`,
      true
    );
  };

  const copyBriefToClipboard = () => {
    const markdown = `# Research Brief

## Business Problem
${brief.businessProblem || 'TBD'}

## Business Objective
${brief.businessObjective || 'TBD'}

## Research Objective
${brief.researchObjective || 'TBD'}

## Target Audience
${brief.targetAudience || 'TBD'}

## Knowledge Gap
${brief.knowledgeGap || 'TBD'}`;

    navigator.clipboard.writeText(markdown);
  };

  const handleNewBrief = () => {
    createBrief();
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: WELCOME_MESSAGE,
      },
    ]);
    setBrief(INITIAL_BRIEF);
    setPhase('problem');
    setCompletedPhases([]);
    setShowActions(false);
    setHasSuggestion(false);
    setPhaseInputCount(0);
    setKnowledgeCheckResult(null);
  };

  if (showExpertEntry) {
    return (
      <ExpertModeEntry onBriefExtracted={handleBriefExtracted} onSwitchToGuided={handleSwitchToGuided} />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900">Briefing Agent</span>
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {mode === 'expert' ? 'Expert' : 'Guided'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={copyBriefToClipboard}>
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 4 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: My Briefs Drawer */}
        <MyBriefsDrawer
          briefs={briefs}
          currentBriefId={currentBriefId}
          onSelectBrief={setCurrentBriefId}
          onNewBrief={handleNewBrief}
          onDeleteBrief={deleteBrief}
        />

        {/* Center Left: Vertical Progress */}
        <div className="w-52 bg-white border-r border-gray-200 p-4 overflow-y-auto flex-shrink-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
            Progress
          </div>
          <VerticalProgress
            currentPhase={phase}
            completedPhases={completedPhases}
            onStepClick={goToPhase}
          />
        </div>

        {/* Center: Chat Panel */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'p-4 rounded-xl max-w-2xl',
                  msg.role === 'user'
                    ? 'bg-indigo-50 ml-auto border border-indigo-100'
                    : 'bg-gray-50 mr-auto border border-gray-100'
                )}
              >
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-2 max-w-2xl">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <p className="text-sm text-gray-500">Thinking...</p>
              </div>
            )}

            {/* Knowledge Check UI */}
            {phase === 'knowledge_check' && !isLoading && (
              <div className="max-w-2xl">
                <KnowledgeCheck
                  brief={brief}
                  onComplete={handleKnowledgeCheckComplete}
                  onSkip={handleKnowledgeCheckSkip}
                />
              </div>
            )}

            {/* Action Chips */}
            {showActions && !isLoading && phase !== 'done' && phase !== 'knowledge_check' && (
              <div className="max-w-2xl">
                <ActionChips
                  actions={hasSuggestion ? PHASE_ACTIONS_WITH_SUGGESTION[phase] : PHASE_ACTIONS_INITIAL[phase]}
                  onAction={handleAction}
                  disabled={isLoading}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3 max-w-2xl">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
                rows={2}
                disabled={isLoading || phase === 'knowledge_check'}
              />
              <Button type="submit" disabled={isLoading || !input.trim() || phase === 'knowledge_check'} className="self-end">
                <Send className="w-4 h-4" />
                Send
              </Button>
            </div>

            <div className="mt-3 flex gap-2 max-w-2xl">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={advancePhase}
                disabled={phase === 'done' || phase === 'knowledge_check'}
              >
                <ChevronRight className="w-4 h-4" />
                Next Section
              </Button>

              {mode === 'guided' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowExpertEntry(true);
                    router.push('/?mode=expert');
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Upload existing brief
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Editable Brief Preview */}
        <EditableBriefPanel
          brief={brief}
          currentPhase={phase}
          onUpdateField={updateBriefField}
          onCopyToClipboard={copyBriefToClipboard}
        />
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading...
      </div>
    </div>
  );
}

export default function BriefingAgent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BriefingAgentInner />
    </Suspense>
  );
}
