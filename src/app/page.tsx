import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Palette, Clock, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Triple C</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-1 flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            전문적인
            <br />
            <span className="text-primary">상품 상세페이지</span>를
            <br />
            몇 분 만에 제작하세요
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Triple C는 AI 기반 마케팅 콘텐츠 에이전트로, 매력적인 상품 상세페이지와
            프로모션 크리에이티브를 생성, 편집, 내보내기할 수 있도록 도와드립니다.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              무료 체험 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              자세히 알아보기
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          신용카드 없이 시작 가능. 무료 생성 3회 제공.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              콘텐츠 제작에 필요한 모든 것
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              아이디어부터 콘텐츠 게시까지 하나의 워크플로우로
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="AI 기반 자동 생성"
              description="몇 장의 제품 이미지와 기본 정보만으로 완성도 높은 상세페이지와 매력적인 카피를 생성합니다."
            />
            <FeatureCard
              icon={<Palette className="h-10 w-10 text-primary" />}
              title="브랜드 일관성 유지"
              description="RAG 기반 브랜드 분석으로 모든 콘텐츠가 브랜드 고유의 톤앤매너와 스타일을 유지합니다."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-primary" />}
              title="10배 빠른 제작"
              description="기존 몇 시간 걸리던 작업을 몇 분 만에 완료. 전략에 집중하고 실행은 AI에게 맡기세요."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="팀 협업 지원"
              description="B2B 워크스페이스로 마케팅 팀 전체가 프로젝트를 원활하게 협업할 수 있습니다."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              이용 방법
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              3단계로 전문적인 마케팅 콘텐츠 완성
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="업로드 및 입력"
              description="제품 이미지를 업로드하고 제품명, 특징, 타겟 고객 등 기본 정보를 입력하세요."
            />
            <StepCard
              step="2"
              title="생성 및 선택"
              description="AI가 두 가지 버전의 상세페이지를 생성합니다. 원하는 버전을 선택하거나 조합하세요."
            />
            <StepCard
              step="3"
              title="편집 및 내보내기"
              description="비주얼 에디터로 세부 조정 후 HTML, 이미지, GIF, 영상 등 다양한 형식으로 내보내세요."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-24 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            마케팅 콘텐츠 제작을 혁신할 준비가 되셨나요?
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-lg text-primary-foreground/90">
            이미 수천 명의 마케터들이 Triple C로 멋진 콘텐츠를 제작하고 있습니다.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Triple C</span>
            <span className="text-sm text-muted-foreground">
              마케팅 콘텐츠 에이전트
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Triple C. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
