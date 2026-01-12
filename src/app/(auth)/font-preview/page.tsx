'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const fonts = [
  {
    name: 'Noto Sans KR',
    fontFamily: '"Noto Sans KR", sans-serif',
    description: '구글 공식 한글 폰트, 깔끔하고 가독성 좋음',
    weights: ['300', '400', '500', '700'],
  },
  {
    name: 'Pretendard',
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, sans-serif',
    description: '애플 스타일, 세련되고 모던함',
    weights: ['300', '400', '500', '700'],
  },
  {
    name: 'Spoqa Han Sans Neo',
    fontFamily: '"Spoqa Han Sans Neo", sans-serif',
    description: '배달의민족/토스 스타일, 균형잡힌 디자인',
    weights: ['300', '400', '500', '700'],
  },
  {
    name: 'Gowun Dodum',
    fontFamily: '"Gowun Dodum", sans-serif',
    description: '부드럽고 따뜻한 느낌, 친근함',
    weights: ['400'],
  },
  {
    name: 'Nanum Gothic',
    fontFamily: '"Nanum Gothic", sans-serif',
    description: '클래식한 한글 폰트, 네이버 스타일',
    weights: ['400', '700', '800'],
  },
  {
    name: 'IBM Plex Sans KR',
    fontFamily: '"IBM Plex Sans KR", sans-serif',
    description: 'IBM 디자인 시스템, 기술적이고 전문적',
    weights: ['300', '400', '500', '700'],
  },
  {
    name: 'Wanted Sans',
    fontFamily: '"Wanted Sans Variable", "Wanted Sans", sans-serif',
    description: '원티드 스타일, 현대적이고 세련됨',
    weights: ['400', '500', '600', '700'],
  },
  {
    name: 'SUIT',
    fontFamily: '"SUIT Variable", "SUIT", sans-serif',
    description: '수트 폰트, 비즈니스 전문적 느낌',
    weights: ['300', '400', '500', '700'],
  },
  {
    name: 'Gmarket Sans',
    fontFamily: '"GmarketSans", sans-serif',
    description: 'G마켓 스타일, 굵고 임팩트 있음',
    weights: ['300', '500', '700'],
  },
  {
    name: 'Paperlogy',
    fontFamily: '"Paperlogy", sans-serif',
    description: '페이퍼로지, 부드럽고 읽기 편함',
    weights: ['400', '700'],
  },
  {
    name: 'Cafe24 Ssurround',
    fontFamily: '"Cafe24Ssurround", sans-serif',
    description: '카페24, 둥글고 귀여운 느낌',
    weights: ['400', '700'],
  },
];

const sampleTexts = {
  title: 'Triple C 마케팅 콘텐츠',
  subtitle: '프로페셔널한 상세페이지를 10분 안에',
  body: '안녕하세요. AI 기반 마케팅 콘텐츠 생성 서비스입니다. 상품 이미지와 텍스트만 있으면 전문가 수준의 상세페이지를 자동으로 만들어 드립니다.',
  numbers: '0123456789',
  english: 'The Quick Brown Fox Jumps Over The Lazy Dog',
};

export default function FontPreviewPage() {
  const [selectedFont, setSelectedFont] = useState(fonts[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load fonts via @font-face CSS injection
    const fontCSS = `
      @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
      @import url('https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css');
      @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=IBM+Plex+Sans+KR:wght@300;400;500;700&family=Nanum+Gothic:wght@400;700;800&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');

      @font-face {
        font-family: 'Wanted Sans Variable';
        font-weight: 100 900;
        src: url('https://cdn.jsdelivr.net/gh/AidenJeon/data-engineering-zoomcamp-project/WantedSansVariable.woff2') format('woff2');
      }

      @font-face {
        font-family: 'SUIT Variable';
        font-weight: 100 900;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_suit@1.0/SUIT-Variable.woff2') format('woff2');
      }

      @font-face {
        font-family: 'GmarketSans';
        font-weight: 300;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansLight.woff') format('woff');
      }
      @font-face {
        font-family: 'GmarketSans';
        font-weight: 500;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff');
      }
      @font-face {
        font-family: 'GmarketSans';
        font-weight: 700;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff');
      }

      @font-face {
        font-family: 'Paperlogy';
        font-weight: 400;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Paperlogy';
        font-weight: 700;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2');
      }

      @font-face {
        font-family: 'Cafe24Ssurround';
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Cafe24Ssurround.woff') format('woff');
      }
    `;

    if (!document.getElementById('font-preview-styles')) {
      const style = document.createElement('style');
      style.id = 'font-preview-styles';
      style.textContent = fontCSS;
      document.head.appendChild(style);
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/login">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">한글 폰트 미리보기</h1>
            <p className="text-muted-foreground">프로젝트에 적용할 폰트를 선택하세요</p>
          </div>
        </div>

        {/* 폰트 선택 버튼들 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {fonts.map((font) => (
            <button
              key={font.name}
              onClick={() => setSelectedFont(font)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedFont.name === font.name
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium text-sm">{font.name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{font.description}</p>
            </button>
          ))}
        </div>

        {/* 선택된 폰트 미리보기 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedFont.name}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Weights: {selectedFont.weights.join(', ')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* 타이틀 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">제목 (Bold, 48px)</p>
              <h1 className="text-5xl font-bold" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.title}</h1>
            </div>

            {/* 서브타이틀 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">부제목 (Medium, 24px)</p>
              <h2 className="text-2xl font-medium" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.subtitle}</h2>
            </div>

            {/* 본문 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">본문 (Regular, 16px)</p>
              <p className="text-base leading-relaxed" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.body}</p>
            </div>

            {/* 작은 텍스트 */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">작은 텍스트 (Light, 14px)</p>
              <p className="text-sm font-light" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.body}</p>
            </div>

            {/* 숫자 & 영문 */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">숫자</p>
                <p className="text-2xl" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.numbers}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">영문</p>
                <p className="text-lg" style={{ fontFamily: selectedFont.fontFamily }}>{sampleTexts.english}</p>
              </div>
            </div>

            {/* 웨이트 비교 */}
            <div>
              <p className="text-xs text-muted-foreground mb-4">웨이트 비교</p>
              <div className="space-y-2" style={{ fontFamily: selectedFont.fontFamily }}>
                <p style={{ fontWeight: 300 }}>Light (300): 가벼운 느낌의 텍스트입니다</p>
                <p style={{ fontWeight: 400 }}>Regular (400): 기본 텍스트입니다</p>
                <p style={{ fontWeight: 500 }}>Medium (500): 약간 굵은 텍스트입니다</p>
                <p style={{ fontWeight: 700 }}>Bold (700): 굵은 텍스트입니다</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 모든 폰트 비교 */}
        <Card>
          <CardHeader>
            <CardTitle>전체 폰트 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fonts.map((font) => (
                <div
                  key={font.name}
                  className="p-4 rounded-lg border bg-white"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <p className="text-xs text-muted-foreground mb-2 font-sans">{font.name}</p>
                  <p className="text-xl font-medium mb-1">Triple C 마케팅 콘텐츠 에이전트</p>
                  <p className="text-sm text-muted-foreground">
                    AI 기반으로 프로페셔널한 상세페이지를 10분 안에 만들어 드립니다.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 적용 안내 */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">
            <strong>적용 방법:</strong> 원하는 폰트를 선택하셨다면 알려주세요.
            해당 폰트로 프로젝트 전체에 적용해 드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
