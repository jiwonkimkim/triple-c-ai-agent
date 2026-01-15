/**
 * LangGraph Workflow for Chat Agent System
 * Multi-Agent 대화형 프로젝트 생성 워크플로우
 */

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { AgentType } from '@prisma/client';
import {
  AgentState,
  ChatMessage,
  ProjectCollectedData,
  BrandContext,
  GenerationResult,
  NextAction,
  RouteDecision,
} from './types';

// Agent imports
import { coordinatorAgent } from './agents/coordinator';
import { intakeAgent } from './agents/intake';
import { clarifierAgent } from './agents/clarifier';
import { suggesterAgent } from './agents/suggester';
import { plannerAgent } from './agents/planner';
import { brandContextAgent } from './agents/brand-context';
import { generatorAgent } from './agents/generator';
import { feedbackAgent } from './agents/feedback';

// ============================================
// State Annotation (LangGraph v0.2+)
// ============================================

const ChatAgentAnnotation = Annotation.Root({
  conversationId: Annotation<string>,
  userId: Annotation<string>,
  messages: Annotation<ChatMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  collectedData: Annotation<ProjectCollectedData>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
  currentAgent: Annotation<AgentType>({
    default: () => 'COORDINATOR' as AgentType,
  }),
  nextAction: Annotation<NextAction | undefined>,
  brandContext: Annotation<BrandContext | undefined>,
  generationResult: Annotation<GenerationResult | undefined>,
  errors: Annotation<string[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

export type ChatAgentState = typeof ChatAgentAnnotation.State;

// ============================================
// Routing Functions
// ============================================

function routeFromCoordinator(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction) {
    return 'INTAKE' as AgentType;
  }

  switch (nextAction.type) {
    case 'continue':
      return nextAction.targetAgent;
    case 'await_input':
      return '__end__';
    case 'generate':
      return 'GENERATOR' as AgentType;
    case 'complete':
      return '__end__';
    case 'error':
      return '__end__';
    default:
      return 'INTAKE' as AgentType;
  }
}

function routeFromIntake(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction) {
    return 'COORDINATOR' as AgentType;
  }

  switch (nextAction.type) {
    case 'continue':
      return nextAction.targetAgent;
    case 'await_input':
      return '__end__';
    default:
      return 'COORDINATOR' as AgentType;
  }
}

function routeFromClarifier(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'continue') {
    return nextAction.targetAgent;
  }

  return 'COORDINATOR' as AgentType;
}

function routeFromSuggester(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'continue') {
    return nextAction.targetAgent;
  }

  return 'COORDINATOR' as AgentType;
}

function routeFromPlanner(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction) {
    return 'BRAND_CONTEXT' as AgentType;
  }

  switch (nextAction.type) {
    case 'continue':
      return nextAction.targetAgent;
    case 'await_input':
      return '__end__';
    case 'generate':
      return 'GENERATOR' as AgentType;
    default:
      return 'COORDINATOR' as AgentType;
  }
}

function routeFromBrandContext(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (nextAction?.type === 'generate') {
    return 'GENERATOR' as AgentType;
  }

  if (nextAction?.type === 'continue') {
    return nextAction.targetAgent;
  }

  return 'PLANNER' as AgentType;
}

function routeFromGenerator(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (nextAction?.type === 'complete') {
    return '__end__';
  }

  if (nextAction?.type === 'error') {
    return 'FEEDBACK' as AgentType;
  }

  return '__end__';
}

function routeFromFeedback(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'continue') {
    return nextAction.targetAgent;
  }

  return 'COORDINATOR' as AgentType;
}

// ============================================
// Graph Builder
// ============================================

export function createChatAgentGraph() {
  const workflow = new StateGraph(ChatAgentAnnotation);

  // Add nodes
  workflow.addNode('COORDINATOR', coordinatorAgent);
  workflow.addNode('INTAKE', intakeAgent);
  workflow.addNode('CLARIFIER', clarifierAgent);
  workflow.addNode('SUGGESTER', suggesterAgent);
  workflow.addNode('PLANNER', plannerAgent);
  workflow.addNode('BRAND_CONTEXT', brandContextAgent);
  workflow.addNode('GENERATOR', generatorAgent);
  workflow.addNode('FEEDBACK', feedbackAgent);

  // Set entry point
  workflow.addEdge(START, 'COORDINATOR');

  // Add conditional edges
  workflow.addConditionalEdges('COORDINATOR', routeFromCoordinator, {
    INTAKE: 'INTAKE',
    CLARIFIER: 'CLARIFIER',
    SUGGESTER: 'SUGGESTER',
    PLANNER: 'PLANNER',
    BRAND_CONTEXT: 'BRAND_CONTEXT',
    GENERATOR: 'GENERATOR',
    FEEDBACK: 'FEEDBACK',
    __end__: END,
  });

  workflow.addConditionalEdges('INTAKE', routeFromIntake, {
    COORDINATOR: 'COORDINATOR',
    CLARIFIER: 'CLARIFIER',
    SUGGESTER: 'SUGGESTER',
    PLANNER: 'PLANNER',
    __end__: END,
  });

  workflow.addConditionalEdges('CLARIFIER', routeFromClarifier, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    SUGGESTER: 'SUGGESTER',
    __end__: END,
  });

  workflow.addConditionalEdges('SUGGESTER', routeFromSuggester, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    CLARIFIER: 'CLARIFIER',
    PLANNER: 'PLANNER',
    __end__: END,
  });

  workflow.addConditionalEdges('PLANNER', routeFromPlanner, {
    COORDINATOR: 'COORDINATOR',
    BRAND_CONTEXT: 'BRAND_CONTEXT',
    GENERATOR: 'GENERATOR',
    __end__: END,
  });

  workflow.addConditionalEdges('BRAND_CONTEXT', routeFromBrandContext, {
    PLANNER: 'PLANNER',
    GENERATOR: 'GENERATOR',
    COORDINATOR: 'COORDINATOR',
  });

  workflow.addConditionalEdges('GENERATOR', routeFromGenerator, {
    FEEDBACK: 'FEEDBACK',
    __end__: END,
  });

  workflow.addConditionalEdges('FEEDBACK', routeFromFeedback, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    PLANNER: 'PLANNER',
    GENERATOR: 'GENERATOR',
    __end__: END,
  });

  return workflow.compile();
}

// ============================================
// Graph Instance (Singleton)
// ============================================

let graphInstance: ReturnType<typeof createChatAgentGraph> | null = null;

export function getChatAgentGraph() {
  if (!graphInstance) {
    graphInstance = createChatAgentGraph();
  }
  return graphInstance;
}

// ============================================
// Helper Functions
// ============================================

export function createInitialState(
  conversationId: string,
  userId: string,
  initialMessage?: string
): ChatAgentState {
  const messages: ChatMessage[] = initialMessage
    ? [
        {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: initialMessage,
          createdAt: new Date(),
        },
      ]
    : [];

  return {
    conversationId,
    userId,
    messages,
    collectedData: {},
    currentAgent: 'COORDINATOR' as AgentType,
    nextAction: undefined,
    brandContext: undefined,
    generationResult: undefined,
    errors: [],
  };
}

export function addUserMessage(state: ChatAgentState, content: string, attachments?: string[]): ChatAgentState {
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content,
    attachments,
    createdAt: new Date(),
  };

  return {
    ...state,
    messages: [...state.messages, newMessage],
    // 새 메시지가 오면 Coordinator부터 다시 시작
    currentAgent: 'COORDINATOR' as AgentType,
    nextAction: undefined,
  };
}
