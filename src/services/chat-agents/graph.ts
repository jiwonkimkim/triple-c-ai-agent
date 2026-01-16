/**
 * LangGraph Workflow for Chat Agent System (v2)
 * 뷰티 특화 Consultative Multi-Agent 워크플로우
 */

import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { AgentType } from '@prisma/client';
import { randomUUID } from 'crypto';
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
import { discoveryAgent } from './agents/discovery';
import { beautySpecialistAgent } from './agents/beauty-specialist';
import { planningConsultantAgent } from './agents/planning-consultant';

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
    reducer: (_, update) => update,
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
  const { nextAction, collectedData } = state;

  if (!nextAction) {
    return 'INTAKE' as AgentType;
  }

  // Discovery 모드
  if ((nextAction as any).type === 'discovery') {
    return 'DISCOVERY' as any;
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
  const { nextAction, collectedData } = state;

  if (!nextAction) {
    return 'COORDINATOR' as AgentType;
  }

  switch (nextAction.type) {
    case 'continue':
      // 뷰티 카테고리가 설정되었으면 Beauty Specialist로
      if (nextAction.targetAgent === 'PLANNER' &&
          collectedData.category === 'BEAUTY' &&
          collectedData.subCategory) {
        return 'PLANNING_CONSULTANT' as any;
      }
      return nextAction.targetAgent;
    case 'await_input':
      return '__end__';
    default:
      return 'COORDINATOR' as AgentType;
  }
}

function routeFromDiscovery(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'continue') {
    return nextAction.targetAgent;
  }

  return 'COORDINATOR' as AgentType;
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
  const { nextAction, collectedData } = state;

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

function routeFromPlanningConsultant(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'generate') {
    return 'GENERATOR' as AgentType;
  }

  if (nextAction.type === 'continue') {
    return nextAction.targetAgent;
  }

  return '__end__';
}

function routeFromBrandContext(state: ChatAgentState): RouteDecision {
  const { nextAction, collectedData } = state;

  // await_input이면 대화 종료
  if (nextAction?.type === 'await_input') {
    return '__end__';
  }

  if (nextAction?.type === 'generate') {
    return 'GENERATOR' as AgentType;
  }

  if (nextAction?.type === 'continue') {
    // 뷰티 제품이면 Planning Consultant로
    if (collectedData.category === 'BEAUTY') {
      return 'PLANNING_CONSULTANT' as any;
    }
    return nextAction.targetAgent;
  }

  // error나 complete도 종료
  if (nextAction?.type === 'error' || nextAction?.type === 'complete') {
    return '__end__';
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

function routeFromBeautySpecialist(state: ChatAgentState): RouteDecision {
  const { nextAction } = state;

  if (!nextAction || nextAction.type === 'await_input') {
    return '__end__';
  }

  if (nextAction.type === 'continue') {
    if (nextAction.targetAgent === 'PLANNER') {
      return 'PLANNING_CONSULTANT' as any;
    }
    return nextAction.targetAgent;
  }

  return 'COORDINATOR' as AgentType;
}

// ============================================
// Graph Builder
// ============================================

export function createChatAgentGraph() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workflow = new StateGraph(ChatAgentAnnotation) as any;

  // Add nodes (기존 + 새로운 Agent들)
  workflow.addNode('COORDINATOR', coordinatorAgent);
  workflow.addNode('INTAKE', intakeAgent);
  workflow.addNode('CLARIFIER', clarifierAgent);
  workflow.addNode('SUGGESTER', suggesterAgent);
  workflow.addNode('PLANNER', plannerAgent);
  workflow.addNode('BRAND_CONTEXT', brandContextAgent);
  workflow.addNode('GENERATOR', generatorAgent);
  workflow.addNode('FEEDBACK', feedbackAgent);

  // 새로운 Agent 노드
  workflow.addNode('DISCOVERY', discoveryAgent);
  workflow.addNode('BEAUTY_SPECIALIST', beautySpecialistAgent);
  workflow.addNode('PLANNING_CONSULTANT', planningConsultantAgent);

  // Set entry point
  workflow.addEdge(START, 'COORDINATOR');

  // Coordinator 라우팅
  workflow.addConditionalEdges('COORDINATOR', routeFromCoordinator, {
    INTAKE: 'INTAKE',
    CLARIFIER: 'CLARIFIER',
    SUGGESTER: 'SUGGESTER',
    PLANNER: 'PLANNER',
    BRAND_CONTEXT: 'BRAND_CONTEXT',
    GENERATOR: 'GENERATOR',
    FEEDBACK: 'FEEDBACK',
    DISCOVERY: 'DISCOVERY',
    BEAUTY_SPECIALIST: 'BEAUTY_SPECIALIST',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
    __end__: END,
  });

  // Intake 라우팅
  workflow.addConditionalEdges('INTAKE', routeFromIntake, {
    COORDINATOR: 'COORDINATOR',
    CLARIFIER: 'CLARIFIER',
    SUGGESTER: 'SUGGESTER',
    PLANNER: 'PLANNER',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
    BEAUTY_SPECIALIST: 'BEAUTY_SPECIALIST',
    __end__: END,
  });

  // Discovery 라우팅
  workflow.addConditionalEdges('DISCOVERY', routeFromDiscovery, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    SUGGESTER: 'SUGGESTER',
    __end__: END,
  });

  // Clarifier 라우팅
  workflow.addConditionalEdges('CLARIFIER', routeFromClarifier, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    SUGGESTER: 'SUGGESTER',
    __end__: END,
  });

  // Suggester 라우팅
  workflow.addConditionalEdges('SUGGESTER', routeFromSuggester, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    CLARIFIER: 'CLARIFIER',
    PLANNER: 'PLANNER',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
    __end__: END,
  });

  // Planner 라우팅
  workflow.addConditionalEdges('PLANNER', routeFromPlanner, {
    COORDINATOR: 'COORDINATOR',
    BRAND_CONTEXT: 'BRAND_CONTEXT',
    GENERATOR: 'GENERATOR',
    __end__: END,
  });

  // Planning Consultant 라우팅
  workflow.addConditionalEdges('PLANNING_CONSULTANT', routeFromPlanningConsultant, {
    COORDINATOR: 'COORDINATOR',
    GENERATOR: 'GENERATOR',
    __end__: END,
  });

  // Beauty Specialist 라우팅
  workflow.addConditionalEdges('BEAUTY_SPECIALIST', routeFromBeautySpecialist, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    SUGGESTER: 'SUGGESTER',
    PLANNER: 'PLANNER',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
    __end__: END,
  });

  // Brand Context 라우팅
  workflow.addConditionalEdges('BRAND_CONTEXT', routeFromBrandContext, {
    PLANNER: 'PLANNER',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
    GENERATOR: 'GENERATOR',
    COORDINATOR: 'COORDINATOR',
    __end__: END,
  });

  // Generator 라우팅
  workflow.addConditionalEdges('GENERATOR', routeFromGenerator, {
    FEEDBACK: 'FEEDBACK',
    __end__: END,
  });

  // Feedback 라우팅
  workflow.addConditionalEdges('FEEDBACK', routeFromFeedback, {
    COORDINATOR: 'COORDINATOR',
    INTAKE: 'INTAKE',
    PLANNER: 'PLANNER',
    PLANNING_CONSULTANT: 'PLANNING_CONSULTANT',
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
          id: `msg_${randomUUID()}`,
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
    id: `msg_${randomUUID()}`,
    role: 'user',
    content,
    attachments,
    createdAt: new Date(),
  };

  return {
    ...state,
    messages: [...state.messages, newMessage],
    currentAgent: 'COORDINATOR' as AgentType,
    nextAction: undefined,
  };
}
