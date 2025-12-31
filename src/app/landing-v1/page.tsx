'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Layers, Rocket, Shield, Play, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPageV1() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Triple C
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
              기능
            </Link>
            <Link href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">
              가격
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg shadow-purple-500/25">
                무료 시작
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm mb-8">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>AI 기반 마케팅 콘텐츠 플랫폼</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            상세페이지 제작,
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              1시간에서 10분으로
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-white/60 mb-12 max-w-2xl mx-auto"
          >
            이미지와 정보만 입력하면 AI가 브랜드에 맞는 완벽한 상세페이지를 생성합니다.
            더 이상 디자이너를 기다리지 마세요.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 gap-2 text-lg px-8 h-14 rounded-xl shadow-2xl shadow-white/20">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2 text-lg px-8 h-14 rounded-xl">
              <Play className="h-5 w-5" />
              데모 보기
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-white/40 mt-6"
          >
            카드 등록 없이 3회 무료 생성 제공
          </motion.p>
        </div>

        {/* Hero Image/Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl border border-white/20 bg-gradient-to-b from-white/10 to-white/5 p-2 shadow-2xl shadow-purple-500/10">
            <div className="rounded-xl bg-slate-900/80 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-sm text-white/40">Triple C Editor</div>
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <Layers className="h-16 w-16 text-purple-500/50 mx-auto mb-4" />
                  <p className="text-white/40">에디터 미리보기</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              왜 <span className="text-purple-400">Triple C</span>인가요?
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              마케터와 셀러를 위해 설계된 올인원 콘텐츠 플랫폼
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="h-8 w-8" />,
                title: "AI 자동 생성",
                description: "제품 이미지와 정보만으로 2가지 버전의 상세페이지를 즉시 생성합니다."
              },
              {
                icon: <Layers className="h-8 w-8" />,
                title: "브랜드 일관성",
                description: "RAG 기술로 브랜드 톤앤매너를 학습해 일관된 콘텐츠를 만듭니다."
              },
              {
                icon: <Rocket className="h-8 w-8" />,
                title: "10배 빠른 속도",
                description: "몇 시간 걸리던 작업을 몇 분 만에 완료. 생산성을 극대화하세요."
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "마켓플레이스",
                description: "다른 크리에이터의 템플릿을 구매하거나 내 템플릿을 판매할 수 있습니다."
              },
              {
                icon: <Play className="h-8 w-8" />,
                title: "모션 & 비디오",
                description: "정적인 이미지를 GIF, 동영상으로 변환해 더 높은 전환율을 달성하세요."
              },
              {
                icon: <Check className="h-8 w-8" />,
                title: "팀 협업",
                description: "워크스페이스에서 팀원들과 실시간으로 협업하고 관리하세요."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group p-8 rounded-2xl bg-gradient-to-b from-white/10 to-transparent border border-white/10 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-32 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              3단계로 <span className="text-purple-400">완성</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { step: "01", title: "업로드", desc: "제품 이미지와 정보를 입력하세요" },
              { step: "02", title: "생성", desc: "AI가 2가지 버전의 상세페이지를 생성합니다" },
              { step: "03", title: "편집 & 내보내기", desc: "에디터에서 수정 후 원하는 형식으로 내보내세요" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-bold text-purple-500/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border border-white/10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-white/60 mb-8">
              무료 체험으로 Triple C의 마법을 경험해보세요
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 gap-2 text-lg px-8 h-14 rounded-xl">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">Triple C</span>
          </div>
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Triple C. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
