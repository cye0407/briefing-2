/**
 * Core types for the Briefing Agent
 */

// The 5 core fields every brief must have
export interface Brief {
  businessProblem: string;
  businessObjective: string;
  researchObjective: string;
  knowledgeGap: string;
  targetAudience: string;
}

// Conversation message
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// The phases of brief creation
export type Phase =
  | 'problem'              // Gathering business problem
  | 'objective'            // Gathering business objectives
  | 'research_objective'   // Gathering research objective
  | 'audience'             // Gathering target audience
  | 'gap'                  // Identifying knowledge gap
  | 'knowledge_check'      // Checking existing knowledge
  | 'review'               // Review complete brief
  | 'done';                // Brief finalized

// Knowledge Check results
export interface KnowledgeCheckResult {
  status: 'sufficient' | 'partial' | 'needs_research';
  findings: string[];
  remainingGaps: string[];
  confidence: number;
  sourceCount: number;
}

// Current state of the briefing session
export interface BriefingState {
  phase: Phase;
  brief: Brief;
  messages: Message[];
}

// What the agent returns after processing input
export interface AgentResponse {
  message: string;
  briefUpdates?: Partial<Brief>;
  nextPhase?: Phase;
}
