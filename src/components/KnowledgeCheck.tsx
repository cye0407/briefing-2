'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Brief, KnowledgeCheckResult } from '@/lib/types';
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  ChevronRight,
  SkipForward,
} from 'lucide-react';

interface KnowledgeCheckProps {
  brief: Brief;
  onComplete: (result: KnowledgeCheckResult) => void;
  onSkip: () => void;
}

export function KnowledgeCheck({ brief, onComplete, onSkip }: KnowledgeCheckProps) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'analyzing' | 'complete'>('idle');
  const [result, setResult] = useState<KnowledgeCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setStatus('searching');
    setError(null);

    // Build search query from brief data
    const queryParts = [
      brief.businessProblem,
      brief.businessObjective,
      brief.targetAudience,
      brief.knowledgeGap,
    ].filter(Boolean);

    const query = queryParts.join(' ').slice(0, 500);

    console.log('[KnowledgeCheck] Starting with query:', query);

    try {
      // Simulate knowledge check with the chat API
      // In a real implementation, this would call a search API
      setStatus('analyzing');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              id: Date.now().toString(),
              role: 'user',
              content: `Analyze this research brief and determine what existing knowledge might already address the knowledge gaps. Brief: ${JSON.stringify(brief)}`,
            },
          ],
          phase: 'knowledge_check',
          brief,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze');

      const data = await response.json();

      // Parse the response to extract findings
      // In a real implementation, this would be structured data from the API
      const mockResult: KnowledgeCheckResult = {
        status: 'partial',
        findings: [
          'Some relevant market research exists in the industry',
          'Previous customer surveys may provide partial insights',
          'Competitor analysis data is available',
        ],
        remainingGaps: [
          brief.knowledgeGap || 'Specific customer decision factors remain unknown',
          'Direct user feedback on pain points is limited',
        ],
        confidence: 45,
        sourceCount: 3,
      };

      setResult(mockResult);
      setStatus('complete');
    } catch (err) {
      console.error('[KnowledgeCheck] Error:', err);
      setError('Failed to complete knowledge check. You can skip for now and proceed.');
      setStatus('idle');
    }
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Search className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Knowledge Check</h3>
          <p className="text-sm text-gray-600 mt-1">
            Let's search existing research to see what's already known about your topic before
            finalizing your brief.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {status === 'idle' && (
        <div className="flex gap-3">
          <Button onClick={runCheck} className="gap-2">
            <Search className="w-4 h-4" />
            Search Existing Knowledge
          </Button>
          <Button variant="ghost" onClick={onSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip for now
          </Button>
        </div>
      )}

      {(status === 'searching' || status === 'analyzing') && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="text-sm text-gray-600">
            {status === 'searching' ? 'Searching knowledge base...' : 'Analyzing relevance...'}
          </span>
        </div>
      )}

      {status === 'complete' && result && (
        <KnowledgeCheckResults result={result} onContinue={handleContinue} />
      )}
    </div>
  );
}

function KnowledgeCheckResults({
  result,
  onContinue,
}: {
  result: KnowledgeCheckResult;
  onContinue: () => void;
}) {
  const statusConfig = {
    sufficient: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Good Coverage',
      description: 'Existing knowledge addresses most of your questions.',
    },
    partial: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Partial Coverage',
      description: 'Some relevant knowledge exists, but gaps remain.',
    },
    needs_research: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Research Needed',
      description: 'Limited existing knowledge. New research is recommended.',
    },
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <div
        className={cn('p-4 rounded-lg border', config.bgColor, config.borderColor)}
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('w-5 h-5', config.color)} />
          <div>
            <div className={cn('font-medium', config.color)}>{config.label}</div>
            <div className="text-sm text-gray-600">{config.description}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{result.sourceCount} sources found</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', {
                  'bg-green-500': result.confidence >= 70,
                  'bg-yellow-500': result.confidence >= 40 && result.confidence < 70,
                  'bg-red-500': result.confidence < 40,
                })}
                style={{ width: `${result.confidence}%` }}
              />
            </div>
            <span className="text-gray-600">{result.confidence}% confidence</span>
          </div>
        </div>
      </div>

      {/* Findings */}
      {result.findings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">What We Found</h4>
          <ul className="space-y-2">
            {result.findings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Remaining Gaps */}
      {result.remainingGaps.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Remaining Knowledge Gaps</h4>
          <ul className="space-y-2">
            {result.remainingGaps.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Continue Button */}
      <div className="pt-2">
        <Button onClick={onContinue} className="gap-2">
          Continue to Review
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
