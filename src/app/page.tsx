'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Palette, Clock, Users, Sparkles, CheckCircle, Sun, Moon, Play, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStyleTheme } from '@/contexts/style-theme-context';
import { cn } from '@/lib/utils';
import { MouseGlowEffect } from '@/components/ui/mouse-glow-effect';

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

// Fluid 마키 컴포넌트 - 참조 사이트 스타일
const FluidMarquee = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-hidden whitespace-nowrap border-y border-[#7BA3D8]/20 bg-[#7BA3D8] text-white py-4">
    <motion.div
      animate={{ x: ['-50%', '0%'] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      className="inline-flex"
    >
      {[...Array(8)].map((_, i) => (
        <span key={i} className="text-[4rem] md:text-[5rem] font-light tracking-tight mx-8 uppercase">
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
  { value: 'sapporo', label: 'Sapporo', description: '겨울 카페 스타일' },
  { value: 'fluid', label: 'Fluid', description: '모던 미니멀 스타일' },
] as const;

// 눈송이 컴포넌트 (Sapporo 테마 전용)
const Snowflakes = () => {
  const snowflakes = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: (i * 17 + 7) % 100,
    delay: (i * 0.4) % 10,
    duration: 10 + (i % 6) * 2,
    size: i % 3 === 0 ? 'w-2 h-2' : i % 3 === 1 ? 'w-1.5 h-1.5' : 'w-1 h-1',
  })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-30">
      {snowflakes.map((snow) => (
        <motion.div
          key={snow.id}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: '110vh',
            opacity: [0, 0.8, 0.8, 0],
          }}
          transition={{
            duration: snow.duration,
            repeat: Infinity,
            delay: snow.delay,
            ease: "linear"
          }}
          className={`absolute ${snow.size} bg-white rounded-full`}
          style={{
            left: `${snow.left}%`,
            boxShadow: '0 0 4px rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const { styleTheme, setStyleTheme, isLoaded } = useStyleTheme();
  // Use default theme until client hydration is complete
  const isSmile = isLoaded && styleTheme === 'smile';
  const isSapporo = isLoaded && styleTheme === 'sapporo';
  const isFluid = isLoaded && styleTheme === 'fluid';

  // default 테마 여부 (smile, sapporo, fluid가 아닌 경우)
  const isDefault = isLoaded && !isSmile && !isSapporo && !isFluid;

  return (
    <div className={cn(
      "min-h-screen text-foreground",
      isDefault ? "bg-transparent" : "bg-background",
      isSapporo && "bg-gradient-to-b from-[#d4e5f7] via-[#e8f1f8] to-[#f0f5f9]"
    )}>
      {/* Default 테마: 마우스 따라다니는 글로우 효과 */}
      {isDefault && <MouseGlowEffect />}

      {/* Sapporo 테마: 눈 내림 효과 */}
      {isSapporo && <Snowflakes />}

      {/* Sapporo 테마: 따뜻한 조명 효과 */}
      {isSapporo && (
        <>
          <div className="fixed right-20 top-1/4 pointer-events-none opacity-70 z-20">
            <div className="w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
          </div>
          <div className="fixed left-10 top-1/2 pointer-events-none opacity-50 z-20">
            <div className="w-32 h-32 bg-orange-300/20 rounded-full blur-3xl" />
          </div>
        </>
      )}

      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50",
        isSapporo
          ? "bg-white/30 backdrop-blur-sm border-b border-slate-200/50"
          : isFluid
            ? "bg-[#F5F3EA]/90 backdrop-blur-md"
            : "bg-background/95 backdrop-blur-sm"
      )}>
        <div className={cn(
          "flex items-center justify-between px-6 py-4",
          !isSapporo && !isFluid && "border-b border-border",
          isSmile && "border-b-2",
          isFluid && "py-6 px-8 lg:px-16"
        )}>
          <Link href="/" className={cn(
            "flex items-center gap-3",
            isSmile && "font-black tracking-tighter uppercase"
          )}>
            {isSapporo && (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            )}
            <span className={cn(
              "text-2xl font-bold",
              isSapporo && "text-slate-700 tracking-wide font-semibold",
              isFluid && "text-3xl font-light tracking-tight"
            )}>
              Triple C
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className={cn(
              "text-sm hover:text-primary transition-colors",
              isSmile && "uppercase tracking-wider hover:underline",
              isSapporo && "text-slate-500 hover:text-amber-600",
              isFluid && "text-sm font-light tracking-wide hover:opacity-60"
            )}>Features</a>
            <a href="#how-it-works" className={cn(
              "text-sm hover:text-primary transition-colors",
              isSmile && "uppercase tracking-wider hover:underline",
              isSapporo && "text-slate-500 hover:text-amber-600",
              isFluid && "text-sm font-light tracking-wide hover:opacity-60"
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
                isSmile && "uppercase text-xs tracking-wider",
                isSapporo && "text-slate-600 hover:text-amber-600 hover:bg-amber-50",
                isFluid && "text-sm font-light hover:bg-transparent hover:opacity-60"
              )}>
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button className={cn(
                "px-6 h-10",
                isSmile && "uppercase text-xs tracking-wider",
                isSapporo && "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30",
                isFluid && "bg-[#7BA3D8] text-white hover:bg-[#6B93C8] font-light px-8"
              )}>
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={cn("pt-20", isSapporo && "relative z-10", isFluid && "pt-0")}>
        {/* Smile 테마: 마키 */}
        {isSmile && <Marquee>Triple C</Marquee>}

        {/* Fluid 테마: 마키 배너 */}
        {isFluid && (
          <div className="pt-20">
            <FluidMarquee>The Future of Content</FluidMarquee>
          </div>
        )}

        {/* Sapporo 테마: 배지 */}
        {isSapporo && (
          <div className="container mx-auto px-6 pt-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-xl shadow-lg shadow-black/5">
                <span className="text-lg">⛄</span>
                <span className="text-sm font-medium text-slate-600">
                  AI 마케팅 콘텐츠 플랫폼
                </span>
                <span className="text-base">❄️</span>
              </div>
            </motion.div>
          </div>
        )}

        <div className={cn(
          "relative py-24 md:py-32",
          isSmile ? "bg-muted" : isSapporo ? "bg-transparent" : isFluid ? "bg-transparent" : "bg-transparent",
          isFluid && "py-20 md:py-32"
        )}>
          <div className={cn("container mx-auto px-6", isFluid && "px-8 lg:px-20 max-w-[1500px]")}>
            <div className={cn("max-w-4xl", isFluid && "max-w-none")}>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "mb-8",
                  isSmile
                    ? "text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase"
                    : isSapporo
                      ? "text-5xl md:text-7xl font-bold leading-tight text-center"
                      : isFluid
                        ? "text-[4rem] md:text-[6rem] lg:text-[8rem] font-extralight leading-[0.95] tracking-[-0.02em]"
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
                ) : isSapporo ? (
                  <>
                    <span className="text-slate-700">차가운 겨울,</span>
                    <br />
                    <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                      따뜻한 콘텐츠
                    </span>
                  </>
                ) : isFluid ? (
                  <>
                    <span className="block">Product Pages</span>
                    <span className="block italic font-thin">Made Simple</span>
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
                className={cn(
                  "text-lg text-muted-foreground max-w-xl mb-8",
                  isSapporo && "text-xl text-slate-500 max-w-2xl mx-auto text-center leading-relaxed",
                  isFluid && "text-xl font-light max-w-2xl mb-12 leading-relaxed opacity-70"
                )}
              >
                {isSapporo ? (
                  <>
                    눈 덮인 삿포로의 따뜻한 카페처럼,
                    <br />
                    AI가 당신의 브랜드에 따뜻함을 더해드립니다.
                  </>
                ) : isFluid ? (
                  <>
                    AI-powered marketing content agent that helps you create,
                    edit, and export professional product pages and promotional creatives.
                  </>
                ) : (
                  <>
                    Triple C는 AI 기반 마케팅 콘텐츠 에이전트로, 매력적인 상품 상세페이지와
                    프로모션 크리에이티브를 생성, 편집, 내보내기할 수 있도록 도와드립니다.
                  </>
                )}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "flex flex-col sm:flex-row gap-4",
                  isSapporo && "justify-center items-center",
                  isFluid && "gap-6"
                )}
              >
                <Link href="/signup">
                  <Button size="lg" className={cn(
                    "gap-2 h-14 px-8",
                    isSmile && "uppercase text-sm tracking-wider px-10",
                    isSapporo && "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xl shadow-amber-500/30",
                    isFluid && "bg-[#7BA3D8] text-white hover:bg-[#6B93C8] h-14 px-10 font-light text-base"
                  )}>
                    {isFluid ? "Get started" : "무료로 시작하기"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className={cn(
                    "h-14 px-8",
                    isSmile && "border-2 uppercase text-sm tracking-wider hover:bg-primary hover:text-primary-foreground",
                    isSapporo && "border-slate-300 text-slate-600 hover:bg-white/60 backdrop-blur-sm",
                    isFluid && "border-[#7BA3D8]/30 text-[#7BA3D8] hover:bg-[#7BA3D8]/10 font-light text-base px-10"
                  )}>
                    {isSapporo ? (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        데모 보기
                      </>
                    ) : isFluid ? (
                      "Learn more"
                    ) : (
                      "자세히 알아보기"
                    )}
                  </Button>
                </Link>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "text-sm text-muted-foreground mt-6",
                  isSmile && "uppercase tracking-wider",
                  isSapporo && "flex items-center justify-center gap-8 text-slate-500",
                  isFluid && "text-sm font-light opacity-50 mt-8"
                )}
              >
                {isSapporo ? (
                  <>
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-500" />
                      3회 무료 체험
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-amber-500" />
                      카드 등록 불필요
                    </span>
                  </>
                ) : isFluid ? (
                  "No credit card required. 3 free generations included."
                ) : (
                  "신용카드 없이 시작 가능. 무료 생성 3회 제공."
                )}
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
      <section id="features" className={cn(
        "py-24",
        isSapporo && "relative z-10",
        isFluid && "py-32 px-8 lg:px-16"
      )}>
        <div className={cn("container mx-auto px-6", isFluid && "px-0")}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={cn("mb-16", isSapporo && "text-center")}
          >
            <p className={cn(
              "text-sm text-primary mb-4",
              isSmile && "uppercase tracking-[0.3em]",
              isSapporo && "inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700",
              isFluid && "text-xs uppercase tracking-[0.2em] opacity-50"
            )}>Features</p>
            <h2 className={cn(
              isSmile
                ? "text-4xl md:text-5xl font-black tracking-tighter uppercase"
                : isSapporo
                  ? "text-4xl font-bold text-slate-700"
                  : isFluid
                    ? "text-4xl md:text-5xl font-extralight tracking-tight"
                    : "text-3xl md:text-4xl font-bold"
            )}>
              {isSmile ? (
                <>
                  콘텐츠 제작에
                  <br />
                  필요한 모든 것
                </>
              ) : isSapporo ? (
                "따뜻한 기능들"
              ) : isFluid ? (
                "Everything you need"
              ) : (
                "콘텐츠 제작에 필요한 모든 것"
              )}
            </h2>
            <p className={cn(
              "mt-4 text-lg text-muted-foreground",
              isSapporo && "text-slate-500 max-w-lg mx-auto",
              isFluid && "font-light opacity-60 max-w-xl"
            )}>
              {isSapporo
                ? "삿포로의 겨울 카페처럼, 포근하고 강력한 기능을 제공합니다"
                : isFluid
                  ? "From ideation to publication, all in one seamless workflow."
                  : "아이디어부터 콘텐츠 게시까지 하나의 워크플로우로"
              }
            </p>
          </motion.div>

          <div className={cn(
            "grid md:grid-cols-2 lg:grid-cols-4",
            isSmile ? "gap-px bg-border" : "gap-6",
            isFluid && "gap-0 border-t border-l border-[#7BA3D8]/20"
          )}>
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title={isFluid ? "AI-Powered Generation" : "AI 기반 자동 생성"}
              description={isFluid ? "Create polished product pages and compelling copy with just a few product images and basic info." : "몇 장의 제품 이미지와 기본 정보만으로 완성도 높은 상세페이지와 매력적인 카피를 생성합니다."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
            <FeatureCard
              icon={<Palette className="h-5 w-5" />}
              title={isFluid ? "Brand Consistency" : "브랜드 일관성 유지"}
              description={isFluid ? "RAG-based brand analysis ensures all content maintains your unique tone and style." : "RAG 기반 브랜드 분석으로 모든 콘텐츠가 브랜드 고유의 톤앤매너와 스타일을 유지합니다."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5" />}
              title={isFluid ? "10x Faster Creation" : "10배 빠른 제작"}
              description={isFluid ? "Complete hours of work in minutes. Focus on strategy while AI handles execution." : "기존 몇 시간 걸리던 작업을 몇 분 만에 완료. 전략에 집중하고 실행은 AI에게 맡기세요."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title={isFluid ? "Team Collaboration" : "팀 협업 지원"}
              description={isFluid ? "B2B workspaces enable your entire marketing team to collaborate seamlessly." : "B2B 워크스페이스로 마케팅 팀 전체가 프로젝트를 원활하게 협업할 수 있습니다."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
          </div>
        </div>
      </section>

      {/* Smile 테마: 마키 */}
      {isSmile && <Marquee reverse>Visual Content</Marquee>}

      {/* Fluid 테마: 마키 */}
      {isFluid && <FluidMarquee>Create · Design · Export</FluidMarquee>}

      {/* How It Works Section */}
      <section id="how-it-works" className={cn(
        "py-24 relative z-10",
        isSmile ? "bg-foreground text-background" : isSapporo ? "bg-white/50 backdrop-blur-sm" : isFluid ? "bg-[#7BA3D8]/5" : "bg-transparent",
        isFluid && "py-32 px-8 lg:px-16"
      )}>
        <div className={cn("container mx-auto px-6", isFluid && "px-0")}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={cn("mb-16", isSapporo && "text-center")}
          >
            <p className={cn(
              "text-sm mb-4",
              isSmile ? "uppercase tracking-[0.3em] opacity-50" : "text-primary",
              isSapporo && "inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700",
              isFluid && "text-xs uppercase tracking-[0.2em] opacity-50"
            )}>Process</p>
            <h2 className={cn(
              isSmile
                ? "text-4xl md:text-5xl font-black tracking-tighter uppercase"
                : isSapporo
                  ? "text-4xl font-bold text-slate-700"
                  : isFluid
                    ? "text-4xl md:text-5xl font-extralight tracking-tight"
                    : "text-3xl md:text-4xl font-bold"
            )}>
              {isFluid ? "How it works" : "이용 방법"}
            </h2>
            <p className={cn(
              "mt-4 text-lg",
              isSmile ? "opacity-50" : "text-muted-foreground",
              isSapporo && "text-slate-500",
              isFluid && "font-light opacity-60"
            )}>
              {isFluid ? "Three simple steps to professional marketing content." : "3단계로 전문적인 마케팅 콘텐츠 완성"}
            </p>
          </motion.div>

          <div className={cn(
            "grid md:grid-cols-3 gap-8 md:gap-16",
            isFluid && "gap-12 md:gap-20"
          )}>
            <StepCard
              num="01"
              title={isFluid ? "Upload & Input" : "업로드 및 입력"}
              description={isFluid ? "Upload product images and enter basic info like product name, features, and target audience." : "제품 이미지를 업로드하고 제품명, 특징, 타겟 고객 등 기본 정보를 입력하세요."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
            <StepCard
              num="02"
              title={isFluid ? "Generate & Select" : "생성 및 선택"}
              description={isFluid ? "AI generates two versions of your product page. Pick your favorite or combine elements." : "AI가 두 가지 버전의 상세페이지를 생성합니다. 원하는 버전을 선택하거나 조합하세요."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
            <StepCard
              num="03"
              title={isFluid ? "Edit & Export" : "편집 및 내보내기"}
              description={isFluid ? "Fine-tune with the visual editor, then export to HTML, images, GIF, or video formats." : "비주얼 에디터로 세부 조정 후 HTML, 이미지, GIF, 영상 등 다양한 형식으로 내보내세요."}
              isSmile={isSmile}
              isSapporo={isSapporo}
              isFluid={isFluid}
              isDefault={isDefault}
            />
          </div>
        </div>
      </section>

      {/* Smile 테마: 마키 */}
      {isSmile && <Marquee>Get Started Now</Marquee>}

      {/* Fluid 테마: 마키 */}
      {isFluid && <FluidMarquee>Start Creating Today</FluidMarquee>}

      {/* CTA Section */}
      <section className={cn(
        "py-24 relative z-10",
        isSmile ? "bg-foreground text-background" : isSapporo ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white" : isFluid ? "bg-[#7BA3D8] text-white" : "bg-primary text-primary-foreground",
        isFluid && "py-40 px-8 lg:px-20"
      )}>
        <div className={cn("container mx-auto px-6", isFluid && "px-0 max-w-[1500px]")}>
          <div className={cn("max-w-2xl mx-auto text-center", isFluid && "max-w-none text-center")}>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "mb-8",
                isSmile
                  ? "text-5xl md:text-6xl font-black tracking-tighter uppercase text-left"
                  : isSapporo
                    ? "text-4xl md:text-5xl font-bold"
                    : isFluid
                      ? "text-[3rem] md:text-[5rem] lg:text-[6rem] font-extralight tracking-[-0.02em] leading-[1]"
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
              ) : isSapporo ? (
                "따뜻한 콘텐츠로 시작하세요"
              ) : isFluid ? (
                <>
                  <span className="block">Ready to</span>
                  <span className="block italic font-thin">transform your content?</span>
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
                isSmile ? "opacity-50 text-left" : "opacity-90",
                isFluid && "font-light opacity-60 text-lg"
              )}
            >
              {isFluid ? "Join thousands of marketers already creating beautiful content with Triple C." : "이미 수천 명의 마케터들이 Triple C로 멋진 콘텐츠를 제작하고 있습니다."}
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
                    isSmile && "bg-background text-foreground hover:bg-background/90 uppercase text-sm tracking-wider px-10",
                    isSapporo && "bg-white text-amber-600 hover:bg-white/90 shadow-lg",
                    isFluid && "bg-white text-[#7BA3D8] hover:bg-white/90 font-light text-base px-10"
                  )}
                >
                  {isFluid ? "Get started free" : "무료로 시작하기"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn(
        "py-8 border-t border-border bg-background relative z-10",
        isSmile && "border-t-2",
        isSapporo && "bg-white/50 backdrop-blur-sm border-slate-200/50",
        isFluid && "py-12 px-8 lg:px-16 border-[#7BA3D8]/20"
      )}>
        <div className={cn("container mx-auto px-6", isFluid && "px-0")}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-xl font-bold",
                isSmile && "font-black tracking-tighter uppercase",
                isSapporo && "text-slate-700 font-semibold",
                isFluid && "text-2xl font-light tracking-tight"
              )}>Triple C</span>
              <span className={cn(
                "text-sm text-muted-foreground",
                isSapporo && "text-slate-500",
                isFluid && "font-light opacity-50"
              )}>{isFluid ? "Marketing Content Agent" : "마케팅 콘텐츠 에이전트"}</span>
            </div>
            <p className={cn(
              "text-xs text-muted-foreground",
              isSmile && "uppercase tracking-wider",
              isSapporo && "text-slate-500",
              isFluid && "font-light opacity-50"
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
  isSapporo,
  isFluid,
  isDefault,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSmile: boolean;
  isSapporo: boolean;
  isFluid?: boolean;
  isDefault?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "p-8 group",
        isSmile
          ? "bg-background hover:bg-muted transition-colors"
          : isSapporo
            ? "bg-white/80 rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-lg backdrop-blur-sm transition-colors"
            : isFluid
              ? "border-r border-b border-[#7BA3D8]/20 hover:bg-[#7BA3D8]/5 p-10 transition-colors"
              : isDefault
                ? "glass-card"
                : "bg-card rounded-lg border border-border hover:border-primary hover:shadow-md transition-colors"
      )}
    >
      <div className={cn(
        "w-12 h-12 flex items-center justify-center mb-6 transition-colors",
        isSmile
          ? "border border-border group-hover:border-primary"
          : isSapporo
            ? "rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 group-hover:from-amber-200 group-hover:to-amber-100"
            : isFluid
              ? "w-10 h-10 border border-[#7BA3D8]/30 group-hover:border-[#7BA3D8]/50"
              : isDefault
                ? "bg-white/20 text-primary rounded-lg"
                : "bg-primary/10 text-primary rounded-lg"
      )}>
        <span className={cn(isSapporo && "text-amber-600", isFluid && "opacity-60")}>{icon}</span>
      </div>
      <h3 className={cn(
        "mb-3",
        isSmile
          ? "text-xl font-bold uppercase tracking-tight"
          : isSapporo
            ? "text-lg font-semibold text-slate-700"
            : isFluid
              ? "text-lg font-light tracking-tight"
              : "text-lg font-semibold"
      )}>{title}</h3>
      <p className={cn(
        "text-muted-foreground text-sm leading-relaxed",
        isSapporo && "text-slate-500",
        isFluid && "font-light opacity-60"
      )}>{description}</p>
    </motion.div>
  );
}

function StepCard({
  num,
  title,
  description,
  isSmile,
  isSapporo,
  isFluid,
  isDefault,
}: {
  num: string;
  title: string;
  description: string;
  isSmile: boolean;
  isSapporo: boolean;
  isFluid?: boolean;
  isDefault?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        isSapporo && "text-center",
        isDefault && "glass-card p-8"
      )}
    >
      {isSmile ? (
        <div className="text-8xl font-black tracking-tighter opacity-10 mb-4">
          {num}
        </div>
      ) : isSapporo ? (
        <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-lg shadow-amber-500/30">
          {num}
        </div>
      ) : isFluid ? (
        <div className="text-6xl font-extralight tracking-tight opacity-20 mb-6">
          {num}
        </div>
      ) : isDefault ? (
        <div className="w-12 h-12 rounded-full bg-white/20 text-primary flex items-center justify-center text-lg font-bold mb-4">
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
          : isSapporo
            ? "text-xl font-semibold text-slate-700"
            : isFluid
              ? "text-2xl font-light tracking-tight"
              : "text-xl font-semibold"
      )}>{title}</h3>
      <p className={cn(
        "leading-relaxed",
        isSmile ? "opacity-50" : "text-muted-foreground",
        isSapporo && "text-slate-500",
        isFluid && "font-light opacity-60"
      )}>{description}</p>
    </motion.div>
  );
}
