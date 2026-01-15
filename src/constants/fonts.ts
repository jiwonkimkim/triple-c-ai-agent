/**
 * 폰트 상수 정의 (OFL 라이선스, 상업적 이용 가능)
 * - 에디터와 AI 프롬프트 모두에서 사용
 * - 폰트 추가 시 이 파일만 수정하면 자동 반영
 */

export interface FontOption {
  value: string;      // CSS font-family 값
  label: string;      // 표시 이름
  category: FontCategory;
  mood: string[];     // 분위기/느낌 키워드 (AI 프롬프트용)
}

export type FontCategory = '고딕' | '명조' | '타이틀' | '손글씨' | '특수' | '영문';

// 분위기별 폰트 매핑 (AI 프롬프트에서 사용)
export const FONT_MOOD_MAP: Record<string, string[]> = {
  '프리미엄': ['Noto Serif KR, serif', 'Playfair Display, serif', 'Hahmlet, serif', '고운바탕, serif'],
  '럭셔리': ['Noto Serif KR, serif', 'Playfair Display, serif', 'Hahmlet, serif', '송명, serif'],
  '고급스러운': ['Noto Serif KR, serif', 'Hahmlet, serif', '고운바탕, serif', '송명, serif'],
  '모던': ['Pretendard, sans-serif', 'Noto Sans KR, sans-serif', 'Gothic A1, sans-serif', '고운돋움, sans-serif'],
  '깔끔한': ['Pretendard, sans-serif', 'Noto Sans KR, sans-serif', 'Gothic A1, sans-serif', 'Stylish, sans-serif'],
  '미니멀': ['Pretendard, sans-serif', 'Gothic A1, sans-serif', '고운돋움, sans-serif'],
  '임팩트': ['Black Han Sans, sans-serif', '검은고딕, sans-serif', '독도, cursive', '동해독도, cursive'],
  '강렬한': ['Black Han Sans, sans-serif', '독도, cursive', '동해독도, cursive', '기랑해랑, cursive'],
  '트렌디': ['Montserrat, sans-serif', 'Spoqa Han Sans Neo, sans-serif', 'Stylish, sans-serif', 'Orbit, sans-serif'],
  '영한': ['Montserrat, sans-serif', 'Orbit, sans-serif', 'Stylish, sans-serif'],
  '자연스러운': ['Nanum Myeongjo, serif', '고운바탕, serif', '나눔명조, serif', 'Gowun Batang, serif'],
  '오가닉': ['Nanum Myeongjo, serif', '나눔명조, serif', '고운바탕, serif'],
  '귀여운': ['Jua, sans-serif', 'Sunflower, sans-serif', '동글, sans-serif', 'Cute Font, cursive', 'Single Day, cursive'],
  '캐주얼': ['Jua, sans-serif', 'Sunflower, sans-serif', 'Poor Story, cursive', '동글, sans-serif'],
  '친근한': ['Jua, sans-serif', '동글, sans-serif', '개구, cursive', 'Poor Story, cursive'],
  '손글씨': ['Gaegu, cursive', 'Hi Melody, cursive', '나눔펜, cursive', '나눔붓, cursive', 'Single Day, cursive'],
  '감성적': ['Hi Melody, cursive', '나눔펜, cursive', '나눔붓, cursive', '감자꽃, cursive'],
  '부드러운': ['고운돋움, sans-serif', '고운바탕, serif', '연성, cursive', 'Sunflower, sans-serif'],
  '미래적': ['Orbit, sans-serif', 'Montserrat, sans-serif', 'Gothic A1, sans-serif'],
  'SF': ['Orbit, sans-serif', 'Montserrat, sans-serif'],
};

// 전체 폰트 목록 (에디터 + AI 공용)
export const FONT_OPTIONS: FontOption[] = [
  // 고딕 계열 (Sans-serif)
  { value: 'Pretendard, sans-serif', label: 'Pretendard', category: '고딕', mood: ['모던', '깔끔', '미니멀', '프로페셔널'] },
  { value: 'Noto Sans KR, sans-serif', label: 'Noto Sans KR', category: '고딕', mood: ['모던', '깔끔', '가독성'] },
  { value: 'Nanum Gothic, sans-serif', label: '나눔고딕', category: '고딕', mood: ['기본', '깔끔', '친근'] },
  { value: 'Gothic A1, sans-serif', label: 'Gothic A1', category: '고딕', mood: ['모던', '깔끔', '다양한 굵기'] },
  { value: 'Gowun Dodum, sans-serif', label: '고운돋움', category: '고딕', mood: ['부드러운', '따뜻한', '본문용'] },
  { value: 'Spoqa Han Sans Neo, sans-serif', label: '스포카 한 산스', category: '고딕', mood: ['트렌디', '테크', '스타트업'] },
  { value: 'IBM Plex Sans KR, sans-serif', label: 'IBM Plex Sans', category: '고딕', mood: ['테크', '프로페셔널', 'IBM'] },
  { value: 'Stylish, sans-serif', label: 'Stylish', category: '고딕', mood: ['트렌디', '스타일리시', '영한'] },

  // 명조 계열 (Serif)
  { value: 'Nanum Myeongjo, serif', label: '나눔명조', category: '명조', mood: ['전통', '고급', '자연', '오가닉'] },
  { value: 'Noto Serif KR, serif', label: 'Noto Serif KR', category: '명조', mood: ['프리미엄', '럭셔리', '고급'] },
  { value: 'Gowun Batang, serif', label: '고운바탕', category: '명조', mood: ['부드러운', '고급', '자연스러운'] },
  { value: 'Song Myung, serif', label: '송명', category: '명조', mood: ['클래식', '전통', '고급스러운'] },
  { value: 'Hahmlet, serif', label: 'Hahmlet', category: '명조', mood: ['현대적 명조', '프리미엄', '럭셔리'] },
  { value: 'KoPub Batang, serif', label: '코퍼브 바탕', category: '명조', mood: ['출판', '본문', '전통'] },

  // 디스플레이/타이틀 (Display) - 카피용 강조 폰트
  { value: 'Black Han Sans, sans-serif', label: '검은고딕', category: '타이틀', mood: ['임팩트', '강렬', '헤드라인', '광고'] },
  { value: 'Jua, sans-serif', label: '주아', category: '타이틀', mood: ['귀여운', '캐주얼', '친근', '밝은'] },
  { value: 'Do Hyeon, sans-serif', label: '도현', category: '타이틀', mood: ['둥근', '친근', '제목'] },
  { value: 'Gugi, sans-serif', label: '구기', category: '타이틀', mood: ['독특한', '개성', '레트로'] },
  { value: 'Sunflower, sans-serif', label: '해바라기', category: '타이틀', mood: ['밝은', '귀여운', '부드러운'] },
  { value: 'Dokdo, cursive', label: '독도', category: '타이틀', mood: ['강렬', '붓글씨', '임팩트', '한국적'] },
  { value: 'East Sea Dokdo, cursive', label: '동해독도', category: '타이틀', mood: ['강렬', '붓글씨', '역동적'] },
  { value: 'Yeon Sung, cursive', label: '연성', category: '타이틀', mood: ['부드러운', '감성', '타이틀'] },
  { value: 'Kirang Haerang, cursive', label: '기랑해랑', category: '타이틀', mood: ['장식적', '강렬', '개성'] },
  { value: 'Poor Story, cursive', label: 'Poor Story', category: '타이틀', mood: ['캐주얼', '손글씨', '친근'] },

  // 손글씨/캘리 (Handwriting)
  { value: 'Gaegu, cursive', label: '개구', category: '손글씨', mood: ['손글씨', '친근', '캐주얼', '따뜻한'] },
  { value: 'Hi Melody, cursive', label: '하이멜로디', category: '손글씨', mood: ['감성', '손글씨', '멜로디', '부드러운'] },
  { value: 'Gamja Flower, cursive', label: '감자꽃', category: '손글씨', mood: ['귀여운', '손글씨', '감성'] },
  { value: 'Cute Font, cursive', label: '귀여운 폰트', category: '손글씨', mood: ['귀여운', '캐주얼', '밝은'] },
  { value: 'Nanum Pen Script, cursive', label: '나눔펜', category: '손글씨', mood: ['손글씨', '펜글씨', '감성', '자연스러운'] },
  { value: 'Nanum Brush Script, cursive', label: '나눔붓', category: '손글씨', mood: ['손글씨', '붓글씨', '감성', '예술적'] },
  { value: 'Single Day, cursive', label: 'Single Day', category: '손글씨', mood: ['귀여운', '손글씨', '밝은'] },
  { value: 'Dongle, sans-serif', label: '동글', category: '손글씨', mood: ['동글동글', '귀여운', '친근', '캐주얼'] },

  // 특수/코딩 (Special)
  { value: 'Nanum Gothic Coding, monospace', label: '나눔고딕코딩', category: '특수', mood: ['코딩', '모노스페이스', '테크'] },
  { value: 'Black And White Picture, sans-serif', label: '흑백사진', category: '특수', mood: ['레트로', '빈티지', '특수효과'] },
  { value: 'Orbit, sans-serif', label: 'Orbit', category: '특수', mood: ['미래적', 'SF', '우주', '테크'] },

  // 영문 (English)
  { value: 'Arial, sans-serif', label: 'Arial', category: '영문', mood: ['기본', '깔끔', '가독성'] },
  { value: 'Georgia, serif', label: 'Georgia', category: '영문', mood: ['클래식', '전통', '격식'] },
  { value: 'Impact, sans-serif', label: 'Impact', category: '영문', mood: ['임팩트', '강렬', '헤드라인'] },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: '영문', mood: ['트렌디', '모던', '세련된'] },
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: '영문', mood: ['럭셔리', '프리미엄', '우아한'] },
];

/**
 * AI 프롬프트용 폰트 가이드 생성
 * @returns 분위기별 폰트 추천 문자열
 */
export function generateFontGuideForAI(): string {
  const moodGroups: Record<string, Set<string>> = {};

  // 폰트별 분위기를 그룹핑
  FONT_OPTIONS.forEach(font => {
    font.mood.forEach(mood => {
      if (!moodGroups[mood]) {
        moodGroups[mood] = new Set();
      }
      moodGroups[mood].add(`"${font.value}"`);
    });
  });

  // 주요 분위기별로 정리
  const mainMoods = [
    { key: '프리미엄/럭셔리', moods: ['프리미엄', '럭셔리', '고급'] },
    { key: '모던/깔끔', moods: ['모던', '깔끔', '미니멀'] },
    { key: '임팩트/강렬', moods: ['임팩트', '강렬', '헤드라인'] },
    { key: '트렌디/영한', moods: ['트렌디', '세련된'] },
    { key: '자연/오가닉', moods: ['자연', '오가닉', '자연스러운'] },
    { key: '귀여운/캐주얼', moods: ['귀여운', '캐주얼', '친근'] },
    { key: '손글씨/감성', moods: ['손글씨', '감성', '따뜻한'] },
    { key: '부드러운/따뜻한', moods: ['부드러운', '따뜻한'] },
    { key: '미래적/테크', moods: ['미래적', 'SF', '테크'] },
  ];

  let guide = '## ★ 폰트 가이드 (이미지 분위기에 맞는 폰트 선택!)\n';
  guide += '각 텍스트마다 어울리는 fontFamily를 선택하세요:\n\n';

  mainMoods.forEach(({ key, moods }) => {
    const fonts = new Set<string>();
    moods.forEach(mood => {
      moodGroups[mood]?.forEach(font => fonts.add(font));
    });

    if (fonts.size > 0) {
      const fontList = Array.from(fonts).slice(0, 4).join(' 또는 ');
      guide += `- ${key}: ${fontList}\n`;
    }
  });

  guide += '\n### 사용 가능한 전체 폰트 목록:\n';
  const categories = ['고딕', '명조', '타이틀', '손글씨', '특수', '영문'] as FontCategory[];
  categories.forEach(cat => {
    const fonts = FONT_OPTIONS.filter(f => f.category === cat);
    if (fonts.length > 0) {
      guide += `- ${cat}: ${fonts.map(f => f.label).join(', ')}\n`;
    }
  });

  return guide;
}

/**
 * 에디터용 폰트 옵션 반환 (기존 형식 호환)
 */
export function getFontOptionsForEditor() {
  return FONT_OPTIONS.map(({ value, label, category }) => ({
    value,
    label,
    category,
  }));
}
