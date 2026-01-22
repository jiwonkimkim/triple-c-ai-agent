/**
 * Suggester Agent
 * 선택지 및 추천 옵션 제시
 */

import { AgentType } from '@prisma/client';
import { ChatAgentState } from '../graph';
import {
  ChatMessage,
  SuggestionOption,
  getMissingFields,
  PRODUCT_CATEGORIES,
  BEAUTY_SUBCATEGORIES,
  COPY_LENGTHS,
  generateMessageId,
} from '../types';
import { prisma } from '@/lib/prisma';

// 카테고리 옵션
const CATEGORY_OPTIONS: SuggestionOption[] = [
  { id: 'fashion', label: '패션', value: 'FASHION', description: '의류, 액세서리, 신발 등', icon: '👗' },
  { id: 'beauty', label: '뷰티/스킨케어', value: 'BEAUTY', description: '화장품, 스킨케어, 헤어케어', icon: '💄' },
  { id: 'food', label: '식품/음료', value: 'FOOD', description: '식품, 건강식품, 음료', icon: '🍽️' },
  { id: 'electronics', label: '전자제품', value: 'ELECTRONICS', description: '가전, IT기기, 액세서리', icon: '📱' },
  { id: 'home', label: '홈/리빙', value: 'HOME_LIVING', description: '가구, 인테리어, 생활용품', icon: '🏠' },
  { id: 'sports', label: '스포츠/피트니스', value: 'SPORTS_FITNESS', description: '운동용품, 건강기구', icon: '⚽' },
  { id: 'other', label: '기타', value: 'OTHER', description: '기타 카테고리', icon: '📦' },
];

// 뷰티 서브카테고리 옵션
const BEAUTY_SUBCATEGORY_OPTIONS: SuggestionOption[] = [
  { id: 'skincare', label: '스킨케어', value: 'skincare', description: '세럼, 크림, 토너 등' },
  { id: 'suncare', label: '선케어', value: 'suncare', description: '선크림, 선스틱 등' },
  { id: 'lip', label: '립', value: 'lip', description: '립스틱, 립틴트, 립밤 등' },
  { id: 'mascara', label: '마스카라', value: 'mascara', description: '마스카라, 아이라이너' },
  { id: 'maskpack', label: '마스크팩', value: 'maskpack', description: '시트마스크, 슬리핑팩' },
  { id: 'cushion', label: '쿠션/파운데이션', value: 'cushion', description: '쿠션, 파운데이션, BB크림' },
  { id: 'eyeshadow', label: '아이섀도우', value: 'eyeshadow', description: '아이섀도우, 팔레트' },
  { id: 'cleanser', label: '클렌저', value: 'cleanser', description: '폼클렌저, 클렌징오일' },
  { id: 'other_beauty', label: '기타 뷰티', value: 'other_beauty', description: '기타 뷰티 제품' },
];

// 카피 길이 옵션
const COPY_LENGTH_OPTIONS: SuggestionOption[] = [
  { id: 'short', label: '짧게', value: 'short', description: '간결하고 임팩트 있게' },
  { id: 'medium', label: '적당히', value: 'medium', description: '균형 잡힌 정보 전달' },
  { id: 'long', label: '자세히', value: 'long', description: '상세하고 포괄적으로' },
];

// 이미지 모델 옵션
const IMAGE_MODEL_OPTIONS: SuggestionOption[] = [
  { id: 'gemini-2.5-flash-image', label: '기본 (Flash)', value: 'gemini-2.5-flash-image', description: '빠른 이미지 생성' },
  { id: 'gemini-3-pro-image-preview', label: '프로 (Pro)', value: 'gemini-3-pro-image-preview', description: '고품질 이미지 생성' },
];

// 이미지 업로드 여부 옵션
const IMAGE_UPLOAD_OPTIONS: SuggestionOption[] = [
  { id: 'upload_images', label: '제품 이미지 업로드', value: 'upload', description: '제품 사진을 직접 업로드합니다' },
  { id: 'skip_images', label: '이미지 없이 진행', value: 'skip', description: 'AI가 이미지를 생성합니다' },
];

// 브랜드 선택 옵션 (동적으로 생성)
function createBrandOptions(brands: Array<{ id: string; name: string }>): SuggestionOption[] {
  const options: SuggestionOption[] = brands.map(brand => ({
    id: brand.id,
    label: brand.name,
    value: brand.id,
    description: '브랜드 스타일 적용',
  }));

  options.push({
    id: 'no_brand',
    label: '브랜드 없이 진행',
    value: '',
    description: '기본 스타일로 생성',
  });

  return options;
}

export async function suggesterAgent(
  state: ChatAgentState
): Promise<Partial<ChatAgentState>> {
  const { collectedData, messages, userId } = state;
  const missingFields = getMissingFields(collectedData);

  // 어떤 선택지를 제시할지 결정
  let options: SuggestionOption[] = [];
  let message = '';
  let askingField = '';
  let uiType: 'options' | 'image_upload' = 'options';

  // 1. 카테고리가 없으면 카테고리 선택지
  if (!collectedData.category) {
    options = CATEGORY_OPTIONS;
    message = collectedData.productName
      ? `'${collectedData.productName}'은(는) 어떤 카테고리에 해당하나요?`
      : '어떤 카테고리의 제품인가요?';
    askingField = 'category';
  }
  // 2. 뷰티 카테고리인데 서브카테고리가 없으면
  else if (collectedData.category === 'BEAUTY' && !collectedData.subCategory) {
    options = BEAUTY_SUBCATEGORY_OPTIONS;
    message = '더 정확한 콘텐츠를 위해 세부 카테고리를 선택해주세요.';
    askingField = 'subCategory';
  }
  // 3. 카피 길이가 없으면
  else if (!collectedData.copyLength) {
    options = COPY_LENGTH_OPTIONS;
    message = '상세페이지의 텍스트 분량은 어느 정도가 좋을까요?';
    askingField = 'copyLength';
  }
  // 4. 브랜드 선택 (brandProfileId가 명시적으로 설정되지 않은 경우)
  else if (collectedData.brandProfileId === undefined) {
    // 사용자의 브랜드 목록 조회
    try {
      const userBrands = await prisma.brandProfile.findMany({
        where: { userId: userId },
        select: { id: true, name: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });

      if (userBrands.length > 0) {
        options = createBrandOptions(userBrands);
        message = '등록된 브랜드가 있네요! 브랜드 스타일을 적용할까요?';
        askingField = 'brandProfileId';
      } else {
        // 브랜드가 없으면 스킵하고 다음 단계로
        return {
          collectedData: { brandProfileId: null } as any,  // 명시적으로 null 설정
          currentAgent: 'SUGGESTER',
          nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
        };
      }
    } catch (error) {
      console.error('[Suggester] Failed to fetch brands:', error);
      // 에러 시 스킵
      return {
        collectedData: { brandProfileId: null } as any,
        currentAgent: 'SUGGESTER',
        nextAction: { type: 'continue', targetAgent: 'SUGGESTER' as AgentType },
      };
    }
  }
  // 5. 이미지 업로드 대기 중인 경우 - 이미지 업로드 UI 표시
  else if (collectedData.waitingForImageUpload === true) {
    uiType = 'image_upload';
    message = '하단의 클립 버튼을 눌러 제품 이미지를 첨부해주세요. (최대 5장)\n\n이미지를 첨부한 후 전송 버튼을 눌러주세요.';
    askingField = 'imageUpload';

    // 선택지 메시지 생성
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: message,
      agentType: 'SUGGESTER',
      metadata: {
        uiType,
        askingField,
      },
      createdAt: new Date(),
    };

    return {
      messages: [assistantMessage],
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'await_input' },
    };
  }
  // 6. 제품 이미지 업로드 여부 (productImages가 명시적으로 설정되지 않은 경우)
  else if (collectedData.productImages === undefined) {
    options = IMAGE_UPLOAD_OPTIONS;
    message = '제품 이미지가 있으신가요? 이미지가 있으면 더 좋은 상세페이지를 만들 수 있어요.';
    askingField = 'productImageChoice';
  }
  // 6. 이미지 모델 선택 (항상 물어봄 - 이미지 유무와 관계없이)
  else if (!collectedData.imageModel) {
    options = IMAGE_MODEL_OPTIONS;
    const hasImages = collectedData.productImages && collectedData.productImages.length > 0;
    message = hasImages
      ? '제품 이미지를 기반으로 배경 이미지를 생성합니다. 어떤 품질로 만들까요?'
      : 'AI가 이미지를 생성합니다. 어떤 품질로 만들까요?';
    askingField = 'imageModel';
  }
  // 7. 필수 정보가 모두 있으면 바로 기획 단계로 이동
  else {
    // 뷰티 카테고리면 Planning Consultant로, 아니면 Planner로
    const targetAgent = collectedData.category === 'BEAUTY' && collectedData.subCategory
      ? 'PLANNING_CONSULTANT' as AgentType
      : 'PLANNER' as AgentType;

    return {
      currentAgent: 'SUGGESTER',
      nextAction: { type: 'continue', targetAgent },
    };
  }

  // 선택지 메시지 생성
  const assistantMessage: ChatMessage = {
    id: generateMessageId(),
    role: 'assistant',
    content: message,
    agentType: 'SUGGESTER',
    metadata: {
      uiType,
      options,
      multiSelect: false,
      askingField,  // 어떤 필드를 물어보는지 저장
    },
    createdAt: new Date(),
  };

  return {
    messages: [assistantMessage],
    currentAgent: 'SUGGESTER',
    nextAction: { type: 'await_input' },
  };
}

// 선택지 응답 처리 헬퍼 함수
export function processSuggesterSelection(
  selectedOptionId: string,
  currentField: string,
  options: SuggestionOption[]
): Partial<import('../types').ProjectCollectedData> {
  const selectedOption = options.find(opt => opt.id === selectedOptionId);

  if (!selectedOption) {
    return {};
  }

  switch (currentField) {
    case 'category':
      return { category: selectedOption.value as any };
    case 'subCategory':
      return { subCategory: selectedOption.value as any };
    case 'copyLength':
      return { copyLength: selectedOption.value as any };
    case 'brandProfileId':
      return { brandProfileId: selectedOption.value || undefined };
    case 'productImageChoice':
      // 이미지 업로드 선택: upload면 대기 상태로, skip이면 빈 배열로 진행
      if (selectedOption.value === 'upload') {
        // 이미지 업로드 대기 상태로 전환
        return { waitingForImageUpload: true };
      } else {
        // 이미지 없이 진행
        return { productImages: [], waitingForImageUpload: false };
      }
    case 'imageModel':
      return { imageModel: selectedOption.value as any };
    default:
      return {};
  }
}
