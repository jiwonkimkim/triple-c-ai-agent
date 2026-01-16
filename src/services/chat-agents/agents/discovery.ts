/**
 * Discovery Agent
 * 제품 아이디어가 없는 사용자를 위한 탐색 및 추천
 * "뭘 만들지 모르겠어요", "추천해주세요" 등의 요청 처리
 */

import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  BEAUTY_SPECIALIST_DATA,
  BeautySubCategory,
  generateMessageId,
} from '../types';

// 트렌드 데이터 (기본 버전 - 하드코딩)
const BEAUTY_TRENDS = {
  hot: [
    { name: '글로시 립', category: 'lip' as BeautySubCategory, reason: '촉촉하고 자연스러운 입술 연출' },
    { name: '비타민C 세럼', category: 'skincare' as BeautySubCategory, reason: '미백과 안티에이징 효과' },
    { name: '톤업 선크림', category: 'suncare' as BeautySubCategory, reason: '자연스러운 피부 보정' },
    { name: '글로우 쿠션', category: 'cushion' as BeautySubCategory, reason: '수분광 피부 연출' },
  ],
  seasonal: {
    spring: ['톤업 선크림', '립틴트', '시카 크림'],
    summer: ['워터 틴트', '선스틱', '클렌징 폼'],
    fall: ['매트 립스틱', '보습 세럼', '쿠션'],
    winter: ['립밤', '수분 크림', '슬리핑팩'],
  },
  beginner: [
    { name: '립틴트/립밤', category: 'lip' as BeautySubCategory, reason: '진입 장벽이 낮고 수요가 꾸준함' },
    { name: '클렌징 제품', category: 'cleanser' as BeautySubCategory, reason: '필수 아이템으로 회전율 높음' },
    { name: '선크림', category: 'suncare' as BeautySubCategory, reason: '계절 무관 필수품' },
  ],
};

// 현재 계절 판단
function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

// 발견 모드 타입
type DiscoveryMode = 'trending' | 'seasonal' | 'beginner' | 'category_explore';

// 발견 모드 결정
function determineDiscoveryMode(message: string): DiscoveryMode {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('요즘') || lowerMessage.includes('트렌드') || lowerMessage.includes('인기')) {
    return 'trending';
  }
  if (lowerMessage.includes('계절') || lowerMessage.includes('시즌')) {
    return 'seasonal';
  }
  if (lowerMessage.includes('처음') || lowerMessage.includes('입문') || lowerMessage.includes('쉬운')) {
    return 'beginner';
  }
  return 'category_explore';
}

export async function discoveryAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { messages } = state;

  // 마지막 사용자 메시지 찾기
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const messageContent = lastUserMessage?.content || '';

  // 발견 모드 결정
  const mode = determineDiscoveryMode(messageContent);

  let responseContent = '';
  let options: Array<{ id: string; label: string; value: string; description?: string }> = [];

  switch (mode) {
    case 'trending':
      responseContent = `요즘 뷰티 트렌드를 알려드릴게요! 🔥\n\n` +
        BEAUTY_TRENDS.hot.map((trend, i) =>
          `${i + 1}. **${trend.name}** ${BEAUTY_SPECIALIST_DATA[trend.category].emoji}\n   ${trend.reason}`
        ).join('\n\n') +
        `\n\n어떤 제품이 끌리세요?`;

      options = BEAUTY_TRENDS.hot.map(trend => ({
        id: trend.category,
        label: `${BEAUTY_SPECIALIST_DATA[trend.category].emoji} ${trend.name}`,
        value: trend.category,
        description: trend.reason,
      }));
      break;

    case 'seasonal':
      const season = getCurrentSeason();
      const seasonName = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }[season];
      const seasonTrends = BEAUTY_TRENDS.seasonal[season];

      responseContent = `${seasonName}에 인기 있는 뷰티 아이템이에요! 🌸\n\n` +
        seasonTrends.map((trend, i) => `${i + 1}. ${trend}`).join('\n') +
        `\n\n관심 있는 제품이 있으신가요?`;

      options = [
        { id: 'lip', label: '💄 립 제품', value: 'lip' },
        { id: 'skincare', label: '✨ 스킨케어', value: 'skincare' },
        { id: 'suncare', label: '☀️ 선케어', value: 'suncare' },
        { id: 'other', label: '🔍 다른 카테고리 보기', value: 'explore' },
      ];
      break;

    case 'beginner':
      responseContent = `뷰티 상세페이지 처음이시군요! 👋\n\n` +
        `초보자분께 추천드리는 제품이에요:\n\n` +
        BEAUTY_TRENDS.beginner.map((item, i) =>
          `${i + 1}. **${item.name}** ${BEAUTY_SPECIALIST_DATA[item.category].emoji}\n   💡 ${item.reason}`
        ).join('\n\n') +
        `\n\n어떤 제품으로 시작해볼까요?`;

      options = BEAUTY_TRENDS.beginner.map(item => ({
        id: item.category,
        label: `${BEAUTY_SPECIALIST_DATA[item.category].emoji} ${item.name}`,
        value: item.category,
        description: item.reason,
      }));
      break;

    case 'category_explore':
    default:
      responseContent = `어떤 뷰티 제품에 관심 있으세요? 💄\n\n` +
        `카테고리별로 제가 도움드릴 수 있어요:`;

      options = Object.entries(BEAUTY_SPECIALIST_DATA).slice(0, 6).map(([key, data]) => ({
        id: key,
        label: `${data.emoji} ${data.name}`,
        value: key,
        description: data.trends.slice(0, 2).join(', '),
      }));
      break;
  }

  const assistantMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: responseContent,
    agentType: 'COORDINATOR',
    metadata: {
      uiType: 'options',
      options,
      askingField: 'subCategory',
      discoveryMode: mode,
    },
    createdAt: new Date(),
  };

  return {
    messages: [assistantMessage],
    collectedData: {
      category: 'BEAUTY',  // 뷰티로 고정 (현재 뷰티 특화)
    },
    currentAgent: 'COORDINATOR',
    nextAction: { type: 'await_input' },
  };
}

// Discovery 모드 감지 (외부에서 사용)
export function isDiscoveryRequest(message: string): boolean {
  const discoveryKeywords = [
    '모르겠', '추천', '뭘 만들', '어떤 게 좋', '도움',
    '아이디어', '트렌드', '인기', '요즘', '처음',
    '입문', '시작', '뭐가 좋', '뭘 팔', '제안',
  ];

  const lowerMessage = message.toLowerCase();
  return discoveryKeywords.some(k => lowerMessage.includes(k));
}
