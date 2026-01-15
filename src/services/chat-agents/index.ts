/**
 * Chat Agent System - Main Export
 */

// Types
export * from './types';

// Graph
export {
  createChatAgentGraph,
  getChatAgentGraph,
  createInitialState,
  addUserMessage,
  type ChatAgentState,
} from './graph';

// Agents (기존)
export { coordinatorAgent } from './agents/coordinator';
export { intakeAgent } from './agents/intake';
export { clarifierAgent } from './agents/clarifier';
export { suggesterAgent, processSuggesterSelection } from './agents/suggester';
export { plannerAgent } from './agents/planner';
export { brandContextAgent } from './agents/brand-context';
export { generatorAgent } from './agents/generator';
export { feedbackAgent } from './agents/feedback';
export { parseIntent, getRecommendedAgent } from './agents/intent-parser';

// Agents (신규 - Consultative 아키텍처)
export { detectProduct, productDetectorAgent } from './agents/product-detector';
export { discoveryAgent, isDiscoveryRequest } from './agents/discovery';
export { beautySpecialistAgent, getRecommendedSections, getCopyTips } from './agents/beauty-specialist';
export { planningConsultantAgent } from './agents/planning-consultant';
