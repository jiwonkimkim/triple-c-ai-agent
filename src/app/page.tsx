'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Palette, Clock, Users, Sparkles, CheckCircle, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStyleTheme } from '@/contexts/style-theme-context';
import { cn } from '@/lib/utils';

// 마키 텍스트 컴포넌트 (Smile 테마 전용)
const Marquee = ({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) => (
  <div className="overflow-hidden whitespace-nowrap border-y border-border bg-secondary">
    <motion.div
      animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      className="inline-flex py-6"
    >
      {[...Array(6)].map((_, i) => (
        <span key={i} className="text-[12vw] md:text-[9vw] font-black tracking-tighter mx-4 uppercase text-outline">
          {children}
        </span>
      ))}
    </motion.div>
  </div>
);

// 스캘럽 장식 컴포넌트 (Smile 테마 전용)
const ScallopBorder = () => (
  <svg className="w-full h-6" viewBox="0 0 100 10" preserveAspectRatio="none">
    <path
      d="M0,10 Q5,0 10,10 Q15,0 20,10 Q25,0 30,10 Q35,0 40,10 Q45,0 50,10 Q55,0 60,10 Q65,0 70,10 Q75,0 80,10 Q85,0 90,10 Q95,0 100,10 L100,10 L0,10 Z"
      className="fill-background"
    />
  </svg>
);

const themeOptions = [
  { value: 'default', label: 'Default', description: '기본 스타일' },
  { value: 'smile', label: 'Smile', description: '패션 브랜드 스타일' },
] as const;

export default function LandingPage() {
  const { styleTheme, setStyleTheme, isLoaded } = useStyleTheme();
  // Use default theme until client hydration is complete
  const isSmile = isLoaded && styleTheme === 'smile';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-border",
          isSmile && "border-b-2"
        )}>
          <Link href="/" className={cn(
            "text-2xl font-bold",
            isSmile && "font-black tracking-tighter uppercase"
          )}>
            Triple C
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className={cn(
              "text-sm hover:text-primary transition-colors",
              isSmile && "uppercase tracking-wider hover:underline"
            )}>Features</a>
            <a href="#how-it-works" className={cn(
              "text-sm hover:text-primary transition-colors",
              isSmile && "uppercase tracking-wider hover:underline"
            )}>How It Works</a>
          </nav>
          <div className="flex items-center gap-3">
            {/* Theme Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {themeOptions.map((theme) => (
                  <DropdownMenuItem
                    key={theme.value}
                    onClick={() => setStyleTheme(theme.value)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 cursor-pointer",
                      styleTheme === theme.value && "bg-accent"
                    )}
                  >
                    <span className="font-medium">{theme.label}</span>
                    <span className="text-xs text-muted-foreground">{theme.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/login">
              <Button variant="ghost" className={cn(
                "text-sm",
                isSmile && "uppercase text-xs tracking-wider"
              )}>
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button className={cn(
                "px-6 h-10",
                isSmile && "uppercase text-xs tracking-wider"
              )}>
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20">
        {/* Smile 테마: 마키 */}
        {isSmile && <Marquee>Triple C</Marquee>}

        <div className={cn(
          "relative py-24 md:py-32",
          isSmile ? "bg-muted" : "bg-gradient-to-b from-primary/5 to-background"
        )}>
          <div className="container mx-auto px-6">
            <div className="max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "mb-8",
                  isSmile
                    ? "text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase"
                    : "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                )}
              >
                {isSmile ? (
                  <>
                    전문적인
                    <br />
                    <span className="italic font-normal">상품 상세페이지</span>를
                    <br />
                    몇 분 만에
                    <br />
                    제작하세요
                  </>
                ) : (
                  <>
                    전문적인 상품 상세페이지를
                    <br />
                    <span className="text-primary">몇 분 만에</span> 제작하세요
                  </>
                )}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg text-muted-foreground max-w-xl mb-8"
              >
                Triple C는 AI 기반 마케팅 콘텐츠 에이전트로, 매력적인 상품 상세페이지와
                프로모션 크리에이티브를 생성, 편집, 내보내기할 수 있도록 도와드립니다.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/signup">
                  <Button size="lg" className={cn(
                    "gap-2 h-14 px-8",
                    isSmile && "uppercase text-sm tracking-wider px-10"
                  )}>
                    무료 체험 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className={cn(
                    "h-14 px-8",
                    isSmile && "border-2 uppercase text-sm tracking-wider hover:bg-primary hover:text-primary-foreground"
                  )}>
                    자세히 알아보기
                  </Button>
                </Link>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "text-sm text-muted-foreground mt-6",
                  isSmile && "uppercase tracking-wider"
                )}
              >
                신용카드 없이 시작 가능. 무료 생성 3회 제공.
              </motion.p>
            </div>
          </div>

          {/* Smile 테마: 스캘럽 */}
          {isSmile && (
            <div className="absolute bottom-0 left-0 right-0">
              <ScallopBorder />
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className={cn(
              "text-sm text-primary mb-4",
              isSmile && "uppercase tracking-[0.3em]"
            )}>Features</p>
            <h2 className={cn(
              isSmile
                ? "text-4xl md:text-5xl font-black tracking-tighter uppercase"
                : "text-3xl md:text-4xl font-bold"
            )}>
              {isSmile ? (
                <>
                  콘텐츠 제작에
                  <br />
                  필요한 모든 것
                </>
              ) : (
                "콘텐츠 제작에 필요한 모든 것"
              )}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              아이디어부터 콘텐츠 게시까지 하나의 워크플로우로
            </p>
          </motion.div>

          <div className={cn(
            "grid md:grid-cols-2 lg:grid-cols-4",
            isSmile ? "gap-px bg-border" : "gap-6"
          )}>
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="AI 기반 자동 생성"
              description="몇 장의 제품 이미지와 기본 정보만으로 완성도 높은 상세페이지와 매력적인 카피를 생성합니다."
              isSmile={isSmile}
            />
            <FeatureCard
              icon={<Palette className="h-5 w-5" />}
              title="브랜드 일관성 유지"
              description="RAG 기반 브랜드 분석으로 모든 콘텐츠가 브랜드 고유의 톤앤매너와 스타일을 유지합니다."
              isSmile={isSmile}
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title="10배 빠른 제작"
              description="기존 몇 시간 걸리던 작업을 몇 분 만에 완료. 전략에 집중하고 실행은 AI에게 맡기세요."
              isSmile={isSmile}
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="팀 협업 지원"
              description="B2B 워크스페이스로 마케팅 팀 전체가 프로젝트를 원활하게 협업할 수 있습니다."
              isSmile={isSmile}
            />
          </div>
        </div>
      </section>

      {/* Smile 테마: 마키 */}
      {isSmile && <Marquee reverse>Visual Content</Marquee>}

      {/* How It Works Section */}
      <section id="how-it-works" className={cn(
        "py-24",
        isSmile ? "bg-foreground text-background" : "bg-muted"
      )}>
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className={cn(
              "text-sm mb-4",
              isSmile ? "uppercase tracking-[0.3em] opacity-50" : "text-primary"
            )}>Process</p>
            <h2 className={cn(
              isSmile
                ? "text-4xl md:text-5xl font-black tracking-tighter uppercase"
                : "text-3xl md:text-4xl font-bold"
            )}>
              이용 방법
            </h2>
            <p className={cn(
              "mt-4 text-lg",
              isSmile ? "opacity-50" : "text-muted-foreground"
            )}>
              3단계로 전문적인 마케팅 콘텐츠 완성
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-16">
            <StepCard
              num="01"
              title="업로드 및 입력"
              description="제품 이미지를 업로드하고 제품명, 특징, 타겟 고객 등 기본 정보를 입력하세요."
              isSmile={isSmile}
            />
            <StepCard
              num="02"
              title="생성 및 선택"
              description="AI가 두 가지 버전의 상세페이지를 생성합니다. 원하는 버전을 선택하거나 조합하세요."
              isSmile={isSmile}
            />
            <StepCard
              num="03"
              title="편집 및 내보내기"
              description="비주얼 에디터로 세부 조정 후 HTML, 이미지, GIF, 영상 등 다양한 형식으로 내보내세요."
              isSmile={isSmile}
            />
          </div>
        </div>
      </section>

      {/* Smile 테마: 마키 */}
      {isSmile && <Marquee>Get Started Now</Marquee>}

      {/* CTA Section */}
      <section className={cn(
        "py-24",
        isSmile ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
      )}>
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "mb-8",
                isSmile
                  ? "text-5xl md:text-6xl font-black tracking-tighter uppercase text-left"
                  : "text-3xl md:text-4xl font-bold"
              )}
            >
              {isSmile ? (
                <>
                  마케팅 콘텐츠
                  <br />
                  제작을 혁신할
                  <br />
                  <span className="italic font-normal">준비가 되셨나요?</span>
                </>
              ) : (
                "마케팅 콘텐츠 제작을 혁신할 준비가 되셨나요?"
              )}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "text-xl mb-10",
                isSmile ? "opacity-50 text-left" : "opacity-90"
              )}
            >
              이미 수천 명의 마케터들이 Triple C로 멋진 콘텐츠를 제작하고 있습니다.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className={isSmile ? "text-left" : ""}
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  variant={isSmile ? "secondary" : "secondary"}
                  className={cn(
                    "gap-2 h-14 px-8",
                    isSmile && "bg-background text-foreground hover:bg-background/90 uppercase text-sm tracking-wider px-10"
                  )}
                >
                  무료로 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn(
        "py-8 border-t border-border bg-background",
        isSmile && "border-t-2"
      )}>
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xl font-bold",
                isSmile && "font-black tracking-tighter uppercase"
              )}>Triple C</span>
              <span className="text-sm text-muted-foreground">마케팅 콘텐츠 에이전트</span>
            </div>
            <p className={cn(
              "text-xs text-muted-foreground",
              isSmile && "uppercase tracking-wider"
            )}>
              © {new Date().getFullYear()} Triple C. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  isSmile,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSmile: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "p-8 group transition-colors",
        isSmile
          ? "bg-background hover:bg-muted"
          : "bg-card rounded-lg border border-border hover:border-primary hover:shadow-md"
      )}
    >
      <div className={cn(
        "w-12 h-12 flex items-center justify-center mb-6 transition-colors",
        isSmile
          ? "border border-border group-hover:border-primary"
          : "bg-primary/10 text-primary rounded-lg"
      )}>
        {icon}
      </div>
      <h3 className={cn(
        "mb-3",
        isSmile
          ? "text-xl font-bold uppercase tracking-tight"
          : "text-lg font-semibold"
      )}>{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({
  num,
  title,
  description,
  isSmile,
}: {
  num: string;
  title: string;
  description: string;
  isSmile: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {isSmile ? (
        <div className="text-8xl font-black tracking-tighter opacity-10 mb-4">
          {num}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-4">
          {num}
        </div>
      )}
      <h3 className={cn(
        "mb-4",
        isSmile
          ? "text-2xl font-bold uppercase tracking-tight"
          : "text-xl font-semibold"
      )}>{title}</h3>
      <p className={cn(
        "leading-relaxed",
        isSmile ? "opacity-50" : "text-muted-foreground"
      )}>{description}</p>
    </motion.div>
  );
}
