'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowUpRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPageV2() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-black/5">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Triple C</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-black/60 hover:text-black transition-colors">
              기능
            </Link>
            <Link href="#how" className="text-sm text-black/60 hover:text-black transition-colors">
              사용법
            </Link>
            <Link href="#pricing" className="text-sm text-black/60 hover:text-black transition-colors">
              가격
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-black/70 hover:text-black">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-black text-white hover:bg-black/90 rounded-full px-6">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 text-sm mb-10">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              AI 마케팅 콘텐츠 플랫폼
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.1] mb-8"
          >
            상세페이지,
            <br />
            <span className="text-black/30">이제 AI가</span>
            <br />
            만듭니다.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center text-lg md:text-xl text-black/50 max-w-2xl mx-auto mb-12"
          >
            1시간 걸리던 작업을 10분으로. 이미지와 정보만 입력하면
            브랜드에 맞는 완벽한 상세페이지가 완성됩니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-black text-white hover:bg-black/90 rounded-full h-14 px-8 text-base gap-2 shadow-xl shadow-black/10">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base border-black/20 hover:bg-black/5">
              데모 영상 보기
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-sm text-black/40 mt-6"
          >
            카드 등록 없이 무료 체험 가능
          </motion.p>
        </div>

        {/* Brands/Trust Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-24 text-center"
        >
          <p className="text-sm text-black/40 mb-8">신뢰할 수 있는 플랫폼</p>
          <div className="flex justify-center items-center gap-12 opacity-40">
            {['Shopify', 'Coupang', 'Naver', '11st', 'Gmarket'].map((brand) => (
              <span key={brand} className="text-lg font-medium text-black/60">{brand}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Visual Section */}
      <section className="container mx-auto px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <div className="aspect-[16/10] rounded-3xl bg-gradient-to-br from-black/[0.02] to-black/[0.06] border border-black/10 overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🎨</span>
                </div>
                <p className="text-black/40 text-lg">에디터 미리보기</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                왜 Triple C인가요?
              </h2>
              <p className="text-xl text-black/50 max-w-xl">
                콘텐츠 제작의 모든 과정을 AI가 도와드립니다
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "AI 상세페이지 생성",
                  desc: "제품 이미지와 정보만 입력하면 AI가 2가지 버전의 상세페이지를 즉시 생성합니다. 직접 수정도 가능합니다.",
                  tag: "핵심 기능"
                },
                {
                  title: "브랜드 일관성 유지",
                  desc: "RAG 기술로 웹사이트, 문서에서 브랜드 톤앤매너를 학습합니다. 모든 콘텐츠가 브랜드와 일관됩니다.",
                  tag: "RAG"
                },
                {
                  title: "마켓플레이스",
                  desc: "다른 크리에이터의 템플릿을 구매하거나, 내가 만든 템플릿을 판매해 수익을 창출하세요.",
                  tag: "커뮤니티"
                },
                {
                  title: "팀 워크스페이스",
                  desc: "팀원을 초대하고 권한을 관리하세요. 프로젝트를 함께 작업하고 히스토리를 추적할 수 있습니다.",
                  tag: "협업"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group p-8 rounded-2xl bg-[#FAFAFA] hover:bg-black hover:text-white transition-all duration-500 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-black/5 group-hover:bg-white/20 transition-colors">
                      {feature.tag}
                    </span>
                    <ArrowUpRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-black/50 group-hover:text-white/70 transition-colors leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-32 bg-[#FAFAFA]">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                간단한 3단계
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { num: "01", title: "업로드", desc: "제품 이미지와 기본 정보를 입력합니다" },
                { num: "02", title: "생성", desc: "AI가 2가지 버전의 상세페이지를 생성합니다" },
                { num: "03", title: "완성", desc: "에디터에서 수정 후 원하는 형식으로 내보냅니다" }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-7xl font-semibold text-black/10 mb-4">{step.num}</div>
                  <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-black/50">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {[
                { value: "10x", label: "더 빠른 제작 속도" },
                { value: "1,000+", label: "활성 사용자" },
                { value: "50,000+", label: "생성된 상세페이지" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl md:text-6xl font-semibold mb-2">{stat.value}</div>
                  <div className="text-white/50">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                심플한 가격 정책
              </h2>
              <p className="text-xl text-black/50">
                필요한 만큼만 사용하세요
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl border border-black/10"
              >
                <div className="text-sm text-black/50 mb-2">무료</div>
                <div className="text-4xl font-semibold mb-4">₩0</div>
                <Minus className="h-6 w-6 text-black/20 mb-6" />
                <ul className="space-y-3 text-black/60">
                  <li>3회 무료 생성</li>
                  <li>기본 템플릿</li>
                  <li>워터마크 포함</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-black text-white"
              >
                <div className="text-sm text-white/50 mb-2">프로</div>
                <div className="text-4xl font-semibold mb-4">₩29,000<span className="text-lg text-white/50">/월</span></div>
                <Minus className="h-6 w-6 text-white/20 mb-6" />
                <ul className="space-y-3 text-white/70">
                  <li>무제한 생성</li>
                  <li>프리미엄 템플릿</li>
                  <li>워터마크 제거</li>
                  <li>팀 워크스페이스</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[#FAFAFA]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
              지금 시작하세요
            </h2>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-black text-white hover:bg-black/90 rounded-full h-14 px-10 text-base gap-2">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-medium">Triple C</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-black/50">
              <Link href="#" className="hover:text-black transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-black transition-colors">개인정보처리방침</Link>
              <Link href="#" className="hover:text-black transition-colors">문의하기</Link>
            </div>
            <p className="text-sm text-black/40">
              &copy; {new Date().getFullYear()} Triple C
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
