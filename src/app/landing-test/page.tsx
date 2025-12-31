'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Sparkles, Star, Zap, Heart, Check,
  Image, Type, MousePointer, Download, Users, Store,
  Clock, TrendingUp, Shield, Palette, Layers, Play,
  ChevronDown, Upload, Wand2, Edit3, FileImage, Video,
  Globe, Instagram, FileText, MessageSquare, BarChart3,
  Crown, Building2, User, X, Menu, Plus, Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type StyleType = 'kawaii' | 'zen' | 'tokyo' | 'anime' | 'sapporo' | 'biei' | 'typo' | 'smile';

// 공통 데이터
const FEATURES = [
  {
    icon: Wand2,
    title: 'AI 상세페이지 생성',
    description: '제품 이미지와 정보만 입력하면 AI가 2가지 버전의 상세페이지를 자동으로 생성합니다. 원하는 버전을 선택하거나 조합하세요.',
    tag: '핵심 기능'
  },
  {
    icon: Palette,
    title: '브랜드 RAG 분석',
    description: '웹사이트, 인스타그램, PDF 문서에서 브랜드 톤앤매너를 자동 학습합니다. 모든 콘텐츠가 브랜드와 일관되게 생성됩니다.',
    tag: 'AI 기술'
  },
  {
    icon: Edit3,
    title: '블록 에디터',
    description: '텍스트, 이미지, 버튼, 리스트 등 8가지 블록을 자유롭게 조합하세요. 드래그앤드롭으로 쉽게 편집하고 30초마다 자동 저장됩니다.',
    tag: '에디터'
  },
  {
    icon: Store,
    title: '템플릿 마켓플레이스',
    description: '다른 크리에이터의 템플릿을 구매하거나, 내가 만든 템플릿을 판매해 수익을 창출하세요. 판매 수익의 70%가 크리에이터에게!',
    tag: '마켓플레이스'
  },
  {
    icon: Users,
    title: '팀 워크스페이스',
    description: '팀원을 초대하고 역할을 관리하세요. Owner, Admin, Editor, Viewer 4가지 권한으로 체계적인 협업이 가능합니다.',
    tag: 'B2B'
  },
  {
    icon: Download,
    title: '다양한 내보내기',
    description: 'HTML, 이미지, GIF, MP4 등 원하는 형식으로 내보내세요. 쿠팡, 네이버, 11번가 등 어디서든 사용 가능합니다.',
    tag: '내보내기'
  }
];

const STEPS = [
  {
    num: '01',
    title: '제품 정보 입력',
    description: '제품 이미지를 업로드하고 제품명, 특징, 타겟 고객 등 기본 정보를 입력합니다.',
    icon: Upload
  },
  {
    num: '02',
    title: 'AI가 2가지 버전 생성',
    description: 'AI가 브랜드 톤앤매너를 반영해 2가지 버전의 상세페이지를 즉시 생성합니다.',
    icon: Wand2
  },
  {
    num: '03',
    title: '편집 & 내보내기',
    description: '블록 에디터로 세부 수정 후 HTML, 이미지, GIF 등 원하는 형식으로 내보냅니다.',
    icon: Download
  }
];

const PRICING = [
  {
    name: '무료',
    price: '₩0',
    period: '',
    description: '시작하기 좋은 플랜',
    features: ['3회 무료 생성', '기본 템플릿', '워터마크 포함', '이메일 지원'],
    cta: '무료로 시작',
    popular: false
  },
  {
    name: '프로',
    price: '₩29,000',
    period: '/월',
    description: '개인 셀러를 위한 플랜',
    features: ['무제한 생성', '프리미엄 템플릿', '워터마크 제거', 'RAG 브랜드 분석', 'GIF/모션 생성', '우선 지원'],
    cta: '프로 시작하기',
    popular: true
  },
  {
    name: '팀',
    price: '₩79,000',
    period: '/월',
    description: '팀 협업이 필요한 비즈니스',
    features: ['프로 플랜 모든 기능', '팀 워크스페이스', '멤버 5명 포함', '역할 기반 권한', '팀 템플릿 공유', '전담 매니저'],
    cta: '팀 플랜 문의',
    popular: false
  }
];

const STATS = [
  { value: '10x', label: '더 빠른 제작 속도' },
  { value: '5,000+', label: '활성 사용자' },
  { value: '100,000+', label: '생성된 상세페이지' },
  { value: '98%', label: '고객 만족도' }
];

const FAQ = [
  {
    q: '정말 10분 안에 상세페이지를 만들 수 있나요?',
    a: '네! 제품 이미지와 기본 정보만 입력하면 AI가 즉시 2가지 버전의 상세페이지를 생성합니다. 기존 1시간 이상 걸리던 작업을 10분 이내로 단축할 수 있습니다.'
  },
  {
    q: '브랜드 톤앤매너는 어떻게 반영되나요?',
    a: 'RAG(검색 증강 생성) 기술을 활용합니다. 브랜드 웹사이트, 인스타그램, PDF 문서 등을 분석해 브랜드의 고유한 어조와 스타일을 학습하고 콘텐츠에 반영합니다.'
  },
  {
    q: '어떤 쇼핑몰에서 사용할 수 있나요?',
    a: 'HTML, 이미지, GIF 등 다양한 형식으로 내보낼 수 있어 쿠팡, 네이버 스마트스토어, 11번가, Gmarket 등 모든 쇼핑몰에서 사용 가능합니다.'
  },
  {
    q: '무료 플랜에서 뭘 할 수 있나요?',
    a: '무료 플랜에서는 3회의 상세페이지 생성과 기본 템플릿을 사용할 수 있습니다. 카드 등록 없이 바로 시작할 수 있으며, 마음에 드시면 언제든 업그레이드하세요.'
  }
];

// 에디터 목업 컴포넌트
function EditorMockup({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10 bg-slate-900' : 'border-gray-200 bg-white'} shadow-2xl`}>
      {/* Browser Header */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/10 bg-slate-800' : 'border-gray-100 bg-gray-50'}`}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className={`flex-1 text-center text-xs ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
          Triple C Editor
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className={`w-14 border-r ${isDark ? 'border-white/10 bg-slate-800/50' : 'border-gray-100 bg-gray-50'} p-2 space-y-2`}>
          {[Type, Image, MousePointer, Layers].map((Icon, i) => (
            <div key={i} className={`p-2 rounded-lg ${i === 0 ? (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') : (isDark ? 'text-white/40' : 'text-gray-400')}`}>
              <Icon className="w-5 h-5" />
            </div>
          ))}
        </div>

        {/* Main Area */}
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {/* Hero Block */}
            <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-purple-500/30 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
              <div className={`h-24 rounded flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <FileImage className={`w-8 h-8 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
              </div>
              <div className={`mt-3 h-6 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-3/4`} />
              <div className={`mt-2 h-4 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-1/2`} />
            </div>

            {/* Feature Blocks */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((i) => (
                <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div className={`w-8 h-8 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} mb-2`} />
                  <div className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-full mb-1`} />
                  <div className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-2/3`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`w-48 border-l ${isDark ? 'border-white/10 bg-slate-800/50' : 'border-gray-100 bg-gray-50'} p-3`}>
          <div className={`text-xs font-medium mb-3 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>속성</div>
          <div className="space-y-2">
            {['텍스트 스타일', '배경 색상', '여백'].map((label, i) => (
              <div key={i}>
                <div className={`text-xs mb-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{label}</div>
                <div className={`h-8 rounded ${isDark ? 'bg-slate-700' : 'bg-white border border-gray-200'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 생성 결과 목업
function GenerationMockup({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-2 gap-4">
      {['버전 A', '버전 B'].map((version, i) => (
        <div key={i} className={`rounded-xl overflow-hidden border ${isDark ? 'border-white/10 bg-slate-800' : 'border-gray-200 bg-white'} shadow-lg`}>
          <div className={`px-3 py-2 border-b ${isDark ? 'border-white/10' : 'border-gray-100'} flex items-center justify-between`}>
            <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{version}</span>
            <div className={`px-2 py-0.5 rounded text-xs ${i === 0 ? 'bg-green-500/20 text-green-500' : (isDark ? 'bg-white/10 text-white/40' : 'bg-gray-100 text-gray-400')}`}>
              {i === 0 ? '추천' : '대안'}
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className={`h-20 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-100'} flex items-center justify-center`}>
              <FileImage className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
            </div>
            <div className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-full`} />
            <div className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-3/4`} />
            <div className={`h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-200'} w-1/2`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingTestPage() {
  const [activeStyle, setActiveStyle] = useState<StyleType>('kawaii');

  const styles: { id: StyleType; name: string }[] = [
    { id: 'kawaii', name: 'Kawaii' },
    { id: 'zen', name: 'Zen' },
    { id: 'tokyo', name: 'Tokyo' },
    { id: 'anime', name: 'Anime' },
    { id: 'sapporo', name: 'Sapporo' },
    { id: 'biei', name: 'Biei' },
    { id: 'typo', name: 'Typo' },
    { id: 'smile', name: 'Smile' },
  ];

  return (
    <div className="min-h-screen">
      {/* Style Switcher Tab */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white/90 backdrop-blur-xl rounded-full p-1.5 shadow-xl border border-black/5">
        <div className="flex gap-1">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => setActiveStyle(style.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeStyle === style.id
                  ? 'bg-black text-white'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeStyle === 'kawaii' && <KawaiiStyle key="kawaii" />}
        {activeStyle === 'zen' && <ZenStyle key="zen" />}
        {activeStyle === 'tokyo' && <TokyoStyle key="tokyo" />}
        {activeStyle === 'anime' && <AnimeStyle key="anime" />}
        {activeStyle === 'sapporo' && <SapporoStyle key="sapporo" />}
        {activeStyle === 'biei' && <BieiStyle key="biei" />}
        {activeStyle === 'typo' && <TypoStyle key="typo" />}
        {activeStyle === 'smile' && <SmileStyle key="smile" />}
      </AnimatePresence>
    </div>
  );
}

// Style 1: Kawaii
function KawaiiStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-purple-50"
    >
      {/* Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-20 left-[10%] text-4xl">✨</motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-40 right-[15%] text-3xl">🌸</motion.div>
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute bottom-40 left-[20%] text-3xl">⭐</motion.div>
        <motion.div animate={{ y: [0, 15, 0], x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-60 right-[25%] text-2xl">💫</motion.div>
      </div>

      {/* Header */}
      <header className="relative z-50 py-6">
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-lg shadow-pink-200">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Triple C
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-purple-500 transition-colors">기능</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-purple-500 transition-colors">가격</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-purple-500 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="rounded-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-200 border-0">
                시작하기 ♡
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-lg shadow-pink-100 text-sm mb-8 border border-pink-100"
          >
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-purple-600">AI 마케팅 콘텐츠 플랫폼</span>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            <span className="text-gray-800">상세페이지,</span>
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              10분이면 완성!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-500 mb-10 max-w-xl mx-auto"
          >
            이미지와 제품 정보만 입력하면 AI가 브랜드에 맞는
            <br />
            완벽한 상세페이지를 뚝딱 만들어줘요 ♪
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 h-14 px-8 text-lg shadow-xl shadow-pink-200 border-0 gap-2">
                무료로 시작하기
                <Heart className="h-5 w-5 fill-white" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-lg border-purple-200 text-purple-600 hover:bg-purple-50">
              <Play className="h-5 w-5 mr-2" />
              데모 보기
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-400"
          >
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> 카드 없이 3회 무료</span>
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> 1분 안에 시작</span>
          </motion.div>
        </div>

        {/* Editor Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-[2rem] bg-white p-4 shadow-2xl shadow-purple-100 border border-pink-100">
            <EditorMockup theme="light" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              1시간 → <span className="text-purple-500">10분</span>으로
            </h2>
            <p className="text-gray-500">상세페이지 제작 시간을 10배 단축하세요</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl bg-gray-100 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="font-bold text-gray-400">기존 방식</span>
              </div>
              <div className="text-4xl font-bold text-gray-400 mb-4">1시간+</div>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2"><X className="h-4 w-4" /> 디자이너 대기</li>
                <li className="flex items-center gap-2"><X className="h-4 w-4" /> 여러 번 수정 요청</li>
                <li className="flex items-center gap-2"><X className="h-4 w-4" /> 브랜드 가이드 전달</li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-purple-200 shadow-xl shadow-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-purple-500" />
                <span className="font-bold text-purple-600">Triple C</span>
              </div>
              <div className="text-4xl font-bold text-purple-600 mb-4">10분</div>
              <ul className="space-y-2 text-purple-600">
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> AI 즉시 생성</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> 2가지 버전 제공</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4" /> 브랜드 자동 반영</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">이런 게 가능해요 ✨</h2>
            <p className="text-gray-500">상세페이지 제작에 필요한 모든 기능</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white shadow-xl shadow-pink-50 border border-pink-50 hover:shadow-2xl hover:shadow-pink-100 transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-purple-500" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-500">{feature.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">3단계면 끝!</h2>
            <p className="text-gray-500">복잡한 과정 없이 간단하게</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-200">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-sm text-purple-400 font-bold mb-2">STEP {step.num}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Generation Result */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <span className="text-sm text-purple-500 font-medium">AI가 생성한 2가지 버전</span>
            </div>
            <GenerationMockup theme="light" />
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">심플한 가격</h2>
            <p className="text-gray-500">필요한 만큼만 사용하세요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-3xl ${plan.popular ? 'bg-gradient-to-br from-pink-400 to-purple-400 text-white shadow-xl shadow-purple-200 scale-105' : 'bg-white border border-pink-100'}`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-1 text-sm font-medium mb-4">
                    <Crown className="h-4 w-4" /> 인기
                  </div>
                )}
                <div className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-500'} mb-2`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-white/80' : 'text-gray-400'}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-white/80' : 'text-gray-400'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-full ${plan.popular ? 'bg-white text-purple-600 hover:bg-white/90' : 'bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500'}`}>
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">자주 묻는 질문</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-white border border-pink-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-medium text-gray-800">{item.q}</span>
                  <ChevronDown className={`h-5 w-5 text-purple-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-500">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto p-12 rounded-[2rem] bg-gradient-to-r from-pink-100 to-purple-100 border border-purple-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">지금 바로 시작해보세요!</h2>
            <p className="text-gray-500 mb-8">무료 체험으로 Triple C를 경험해보세요 ♪</p>
            <Link href="/auth/signup">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 h-14 px-10 shadow-lg gap-2">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-pink-100 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-gray-800">Triple C</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-purple-500 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-purple-500 transition-colors">개인정보처리방침</Link>
              <Link href="#" className="hover:text-purple-500 transition-colors">문의하기</Link>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Triple C. Made with ♡
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 2: Zen
function ZenStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-stone-50"
    >
      {/* Header */}
      <header className="py-8 border-b border-stone-200">
        <div className="container mx-auto flex items-center justify-between px-8">
          <Link href="/" className="text-2xl tracking-[0.3em] text-stone-800 font-light">
            TRIPLE C
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-stone-500 hover:text-stone-800 transition-colors tracking-wider">기능</a>
            <a href="#pricing" className="text-sm text-stone-500 hover:text-stone-800 transition-colors tracking-wider">가격</a>
            <a href="#faq" className="text-sm text-stone-500 hover:text-stone-800 transition-colors tracking-wider">FAQ</a>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm text-stone-500 hover:text-stone-800 transition-colors tracking-wider">
              로그인
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" className="rounded-none border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white tracking-wider">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-8 py-32">
        <div className="max-w-4xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} className="mb-12">
            <div className="w-16 h-[1px] bg-stone-300 mb-8" />
            <p className="text-sm tracking-[0.2em] text-stone-400 mb-4">AI MARKETING PLATFORM</p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-light text-stone-800 leading-tight mb-12 tracking-tight"
          >
            고요함 속에서
            <br />
            <span className="text-stone-400">완벽한 콘텐츠가</span>
            <br />
            탄생합니다
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-stone-500 text-lg max-w-md mb-12 leading-relaxed"
          >
            복잡함을 버리고 본질에 집중하세요.
            AI가 당신의 브랜드에 맞는 상세페이지를 만들어드립니다.
            1시간 걸리던 작업을 10분으로.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center gap-6"
          >
            <Link href="/auth/signup">
              <Button className="rounded-none bg-stone-800 hover:bg-stone-900 h-14 px-12 tracking-wider">
                체험하기
              </Button>
            </Link>
            <span className="text-sm text-stone-400 tracking-wider">카드 등록 없이 3회 무료</span>
          </motion.div>
        </div>
      </section>

      {/* Editor Visual */}
      <section className="container mx-auto px-8 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <EditorMockup theme="light" />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-24 border-y border-stone-200">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-light text-stone-800 mb-2">{stat.value}</div>
                <div className="text-sm text-stone-400 tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-32">
        <div className="container mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-16 max-w-5xl mx-auto">
            {[
              { num: '一', title: '단순함', desc: '불필요한 것을 제거하고 핵심에 집중합니다. 이미지와 정보만 입력하면 AI가 나머지를 처리합니다.' },
              { num: '二', title: '조화', desc: 'RAG 기술로 브랜드의 정체성을 이해합니다. 모든 콘텐츠가 브랜드와 하나가 됩니다.' },
              { num: '三', title: '균형', desc: '빠름과 완성도 사이의 완벽한 균형. 10분 안에 전문가 수준의 상세페이지를 완성합니다.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-5xl text-stone-300 mb-6 font-serif">{item.num}</div>
                <h3 className="text-2xl text-stone-800 mb-4 tracking-wider">{item.title}</h3>
                <p className="text-stone-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 bg-white">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20">
              <div className="w-16 h-[1px] bg-stone-300 mb-8" />
              <h2 className="text-4xl font-light text-stone-800 tracking-tight mb-4">기능</h2>
              <p className="text-stone-500">콘텐츠 제작의 본질에 집중합니다</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="border-t border-stone-200 pt-8"
                >
                  <div className="flex items-start justify-between mb-4">
                    <feature.icon className="h-6 w-6 text-stone-400" />
                    <span className="text-xs text-stone-400 tracking-wider">{feature.tag}</span>
                  </div>
                  <h3 className="text-xl text-stone-800 mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-stone-500 leading-relaxed text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-32 border-t border-stone-200">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20 text-center">
              <h2 className="text-4xl font-light text-stone-800 tracking-tight">과정</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-16">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full border border-stone-300 flex items-center justify-center mx-auto mb-8">
                    <span className="text-2xl font-light text-stone-400">{step.num}</span>
                  </div>
                  <h3 className="text-xl text-stone-800 mb-4 tracking-wider">{step.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-white">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20 text-center">
              <h2 className="text-4xl font-light text-stone-800 tracking-tight mb-4">가격</h2>
              <p className="text-stone-500">필요한 만큼만</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {PRICING.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-8 ${plan.popular ? 'bg-stone-800 text-white' : 'border border-stone-200'}`}
                >
                  <div className={`text-sm mb-4 tracking-wider ${plan.popular ? 'text-stone-400' : 'text-stone-500'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-light">{plan.price}</span>
                    <span className={plan.popular ? 'text-stone-400' : 'text-stone-400'}>{plan.period}</span>
                  </div>
                  <div className={`w-8 h-[1px] mb-6 ${plan.popular ? 'bg-stone-600' : 'bg-stone-200'}`} />
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className={`text-sm flex items-center gap-2 ${plan.popular ? 'text-stone-300' : 'text-stone-500'}`}>
                        <Check className="h-4 w-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full rounded-none ${plan.popular ? 'bg-white text-stone-800 hover:bg-stone-100' : 'bg-stone-800 text-white hover:bg-stone-900'}`}>
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 border-t border-stone-200">
        <div className="container mx-auto px-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-light text-stone-800 tracking-tight">질문</h2>
            </div>

            <div className="space-y-0">
              {FAQ.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="border-t border-stone-200"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between py-6 text-left"
                  >
                    <span className="text-stone-800 tracking-wide">{item.q}</span>
                    <Plus className={`h-4 w-4 text-stone-400 transition-transform ${openFaq === i ? 'rotate-45' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-6 text-stone-500 leading-relaxed">{item.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-stone-800 text-white">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-4xl font-light mb-8 tracking-wide">시작할 준비가 되셨나요?</h2>
          <p className="text-stone-400 mb-12">복잡함을 내려놓고 본질에 집중하세요</p>
          <Link href="/auth/signup">
            <Button variant="outline" className="rounded-none border-white text-white hover:bg-white hover:text-stone-800 h-14 px-12 tracking-wider">
              무료 체험
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-200">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xl tracking-[0.2em] text-stone-800 font-light">TRIPLE C</span>
            <div className="flex items-center gap-8 text-sm text-stone-400 tracking-wider">
              <Link href="#" className="hover:text-stone-800 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-stone-800 transition-colors">개인정보</Link>
              <Link href="#" className="hover:text-stone-800 transition-colors">문의</Link>
            </div>
            <p className="text-sm text-stone-400 tracking-wider">
              © {new Date().getFullYear()} TRIPLE C
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 3: Tokyo
function TokyoStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 text-white overflow-hidden"
    >
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Neon Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 py-6 border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="text-2xl font-black">
            <span className="text-cyan-400">TRIPLE</span>
            <span className="text-pink-400">C</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/50 hover:text-cyan-400 transition-colors tracking-wider">FEATURES</a>
            <a href="#pricing" className="text-sm text-white/50 hover:text-cyan-400 transition-colors tracking-wider">PRICING</a>
            <a href="#faq" className="text-sm text-white/50 hover:text-cyan-400 transition-colors tracking-wider">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white/70 hover:text-cyan-400 hover:bg-transparent tracking-wider">
                LOGIN
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-400 hover:to-pink-400 rounded-lg font-bold tracking-wider">
                START
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm mb-8"
          >
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            AI POWERED PLATFORM
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black leading-none mb-8"
          >
            <span className="block text-white">FUTURE OF</span>
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              MARKETING
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/50 mb-12 max-w-2xl mx-auto"
          >
            AI가 만드는 미래형 상세페이지.
            <br />
            1시간 → 10분. 한계를 넘어서다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-lg h-14 px-8 text-lg font-bold tracking-wider shadow-lg shadow-cyan-500/25">
                START NOW
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-lg h-14 px-8 text-lg tracking-wider">
              <Play className="mr-2 h-5 w-5" />
              WATCH DEMO
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-8 text-sm text-white/40 font-mono"
          >
            <span>[ 3 FREE CREDITS ]</span>
            <span>[ NO CARD REQUIRED ]</span>
          </motion.div>
        </div>

        {/* Editor Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl border border-cyan-500/30 p-1 shadow-2xl shadow-cyan-500/10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-transparent to-pink-500/20" />
            <div className="relative">
              <EditorMockup theme="dark" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-white/40 mt-1 tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="text-cyan-400">CORE</span> FEATURES
            </h2>
            <p className="text-white/50">최첨단 AI 기술로 구동되는 기능들</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature, i) => {
              const colors = ['cyan', 'purple', 'pink', 'cyan', 'purple', 'pink'];
              const color = colors[i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : color === 'purple' ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-white/40 tracking-wider font-mono">{feature.tag}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-wide">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative z-10 py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black">
              <span className="text-pink-400">3</span> STEPS
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-black text-white/10 mb-4">{step.num}</div>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 ${i === 0 ? 'bg-cyan-500/20 text-cyan-400' : i === 1 ? 'bg-purple-500/20 text-purple-400' : 'bg-pink-500/20 text-pink-400'}`}>
                  <step.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-wide">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Generation Result */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <span className="text-sm text-cyan-400 font-mono tracking-wider">// AI GENERATED VERSIONS</span>
            </div>
            <GenerationMockup theme="dark" />
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4">PRICING</h2>
            <p className="text-white/50">투명한 가격 정책</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 rounded-xl ${plan.popular ? 'bg-gradient-to-b from-cyan-500/20 to-purple-500/20 border-2 border-cyan-500/50' : 'border border-white/10 bg-white/5'}`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold mb-4 tracking-wider">
                    <Zap className="h-4 w-4" /> POPULAR
                  </div>
                )}
                <div className="text-sm text-white/50 mb-2 tracking-wider">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-white/40">{plan.period}</span>
                </div>
                <div className="h-[1px] bg-white/10 mb-6" />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="text-sm flex items-center gap-2 text-white/70">
                      <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-lg font-bold tracking-wider ${plan.popular ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-32 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black">FAQ</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-2">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="border border-white/10 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{item.q}</span>
                  <ChevronDown className={`h-5 w-5 text-cyan-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-white/60">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10">
            <h2 className="text-4xl font-black mb-4">READY TO START?</h2>
            <p className="text-white/50 mb-8">미래를 경험하세요</p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 rounded-lg h-14 px-10 font-bold tracking-wider">
                GET STARTED
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xl font-black">
              <span className="text-cyan-400">TRIPLE</span>
              <span className="text-pink-400">C</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40 tracking-wider">
              <Link href="#" className="hover:text-white transition-colors">TERMS</Link>
              <Link href="#" className="hover:text-white transition-colors">PRIVACY</Link>
              <Link href="#" className="hover:text-white transition-colors">CONTACT</Link>
            </div>
            <p className="text-sm text-white/30 font-mono">
              © {new Date().getFullYear()} TRIPLE C // ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 4: Anime
function AnimeStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-64 h-64 border-4 border-dashed border-orange-200 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -left-32 w-96 h-96 border-4 border-dashed border-blue-200 rounded-full"
        />
      </div>

      {/* Header */}
      <header className="relative z-50 py-6">
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg rotate-3 hover:rotate-0 transition-transform">
              <span className="text-white font-black text-xl">C</span>
            </div>
            <div className="font-black text-2xl">
              <span className="text-orange-500">Triple</span>
              <span className="text-blue-500">C</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-bold">기능</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-bold">가격</a>
            <a href="#faq" className="text-sm text-gray-500 hover:text-orange-500 transition-colors font-bold">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-600 hover:text-orange-500 font-bold">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 rounded-xl font-bold shadow-lg shadow-orange-200 -rotate-1 hover:rotate-0 transition-transform">
                시작하기!
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 font-bold text-sm mb-8 border-2 border-orange-200 shadow-lg rotate-1"
          >
            ⚡ AI 마케팅 플랫폼
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.4, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-8"
          >
            <span className="text-gray-800 inline-block hover:scale-105 transition-transform">상세페이지</span>
            <br />
            <span className="inline-block -rotate-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent hover:rotate-0 transition-transform">
              초고속 생성!
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 mb-10 max-w-xl mx-auto"
          >
            이미지만 올리면 AI가 뚝딱!
            <br />
            <span className="font-bold text-orange-500">1시간 → 10분</span>으로 단축!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 rounded-2xl h-16 px-10 text-lg font-black shadow-xl shadow-orange-200 -rotate-1 hover:rotate-0 hover:scale-105 transition-all">
                무료로 시작! →
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-2xl h-16 px-8 text-lg font-bold border-2 border-blue-200 text-blue-500 hover:bg-blue-50">
              <Play className="mr-2 h-5 w-5" />
              데모 보기!
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-8 text-sm text-gray-400 font-bold"
          >
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> 무료 3회</span>
            <span className="flex items-center gap-1"><Check className="h-4 w-4 text-green-500" /> 카드 불필요</span>
          </motion.div>
        </div>

        {/* Editor Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.3, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="rounded-3xl bg-white p-4 shadow-2xl shadow-orange-100 border-4 border-orange-100 rotate-1 hover:rotate-0 transition-transform">
            <EditorMockup theme="light" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-gray-500 mt-1 font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">
              <motion.span
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                엄청난 기능들!
              </motion.span>
            </h2>
            <p className="text-gray-500 font-bold">이게 전부 가능해요!</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature, i) => {
              const rotations = [-2, 1, -1, 2, -1.5, 1.5];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, rotate: rotations[i] }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  whileHover={{ scale: 1.05, rotate: rotations[i] / 2 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 rounded-3xl bg-white shadow-xl border-2 border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center"
                    >
                      <feature.icon className="h-7 w-7 text-orange-500" />
                    </motion.div>
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-500">{feature.tag}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 py-24 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800">
              3단계면 끝!
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -3 : 3 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ${i === 0 ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-200' : i === 1 ? 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-blue-200' : 'bg-gradient-to-br from-green-400 to-teal-500 shadow-green-200'}`}
                >
                  <step.icon className="h-10 w-10 text-white" />
                </motion.div>
                <div className="text-sm text-orange-500 font-black mb-2">STEP {step.num}</div>
                <h3 className="text-xl font-black text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Generation Result */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <span className="text-sm font-black text-orange-500">AI가 생성한 2가지 버전!</span>
            </div>
            <div className="rotate-1 hover:rotate-0 transition-transform">
              <GenerationMockup theme="light" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4">가격표!</h2>
            <p className="text-gray-500 font-bold">심플하게!</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => {
              const rotations = [-2, 0, 2];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, rotate: rotations[i] }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  whileHover={{ scale: 1.05, rotate: rotations[i] / 2 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-8 rounded-3xl ${plan.popular ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-2xl shadow-orange-200 scale-105' : 'bg-white border-2 border-gray-100 shadow-xl'}`}
                >
                  {plan.popular && (
                    <div className="flex items-center gap-2 text-sm font-black mb-4">
                      <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" /> 인기!
                    </div>
                  )}
                  <div className={`text-sm font-bold mb-2 ${plan.popular ? 'text-white/80' : 'text-gray-500'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className={plan.popular ? 'text-white/80' : 'text-gray-400'}>{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="text-sm flex items-center gap-2 font-medium">
                        <Check className="h-4 w-4 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className={`w-full rounded-2xl font-black ${plan.popular ? 'bg-white text-orange-500 hover:bg-white/90' : 'bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600'}`}>
                    {plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800">자주 묻는 질문!</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-white border-2 border-gray-100 overflow-hidden shadow-lg"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-black text-gray-800">{item.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"
                  >
                    <ChevronDown className="h-5 w-5 text-orange-500" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-gray-500">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ scale: 0.9, rotate: -1 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto p-12 rounded-3xl bg-gradient-to-r from-orange-100 via-pink-100 to-blue-100 border-4 border-white shadow-2xl"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              🚀
            </motion.div>
            <h2 className="text-3xl font-black text-gray-800 mb-4">지금 바로 시작!</h2>
            <p className="text-gray-500 mb-8 font-bold">무료 체험으로 경험해보세요!</p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 rounded-2xl h-14 px-10 font-black shadow-lg hover:scale-105 transition-transform">
                무료로 시작하기! →
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t-4 border-orange-100 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center rotate-3">
                <span className="text-white font-black">C</span>
              </div>
              <span className="font-black text-xl">
                <span className="text-orange-500">Triple</span>
                <span className="text-blue-500">C</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400 font-bold">
              <Link href="#" className="hover:text-orange-500 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-orange-500 transition-colors">개인정보</Link>
              <Link href="#" className="hover:text-orange-500 transition-colors">문의하기</Link>
            </div>
            <p className="text-sm text-gray-400 font-bold">
              © {new Date().getFullYear()} Triple C ⚡
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 5: Sapporo - 삿포로 아카렌가 스타일 (밝은 겨울)
function SapporoStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 눈송이 위치 고정 (hydration 문제 방지)
  const snowflakes = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: (i * 17 + 7) % 100,
    delay: (i * 0.4) % 10,
    duration: 10 + (i % 6) * 2,
    size: i % 3 === 0 ? 'w-2 h-2' : i % 3 === 1 ? 'w-1.5 h-1.5' : 'w-1 h-1',
  })), []);

  // 박스 위에 쌓이는 눈 컴포넌트 - 둥근 모서리 부분 피해서 쌓임
  const SnowOnTop = ({
    delay = 0,
    duration = 12,
    compact = false
  }: {
    delay?: number;
    duration?: number;
    compact?: boolean;
  }) => (
    <motion.div
      className={`absolute pointer-events-none z-50 ${compact ? 'left-2 right-2' : 'left-3 right-3'}`}
      style={{ bottom: '100%', marginBottom: '-2px', transformOrigin: 'bottom center' }}
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        scaleY: [0, 1, 1, 1, 0.8],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeOut",
        times: [0, 0.1, 0.7, 0.9, 1],
      }}
    >
      {/* 눈 더미 - 둥근 모서리 안쪽에만 쌓임 */}
      <div
        className={`${compact ? 'h-2' : 'h-3'} rounded-t-full bg-white`}
        style={{
          boxShadow: '0 2px 6px rgba(0,0,0,0.12), inset 0 -1px 3px rgba(200,220,240,0.4)',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f0f5fa 100%)'
        }}
      />
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-[#d4e5f7] via-[#e8f1f8] to-[#f0f5f9] text-slate-700 overflow-hidden"
    >
      {/* 눈 내리는 배경 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-30">
        {snowflakes.map((snow, i) => (
          <motion.div
            key={i}
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


      {/* 따뜻한 조명 효과들 */}
      <div className="fixed right-20 top-1/4 pointer-events-none opacity-70">
        <div className="w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
      </div>
      <div className="fixed left-10 top-1/2 pointer-events-none opacity-50">
        <div className="w-32 h-32 bg-orange-300/20 rounded-full blur-3xl" />
      </div>
      <div className="fixed right-1/3 bottom-1/3 pointer-events-none opacity-40">
        <div className="w-40 h-40 bg-amber-300/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-50 py-6 border-b border-slate-200/50 backdrop-blur-sm bg-white/30">
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-semibold text-slate-700 tracking-wide">
              Triple C
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm text-slate-500 hover:text-amber-600 transition-colors">기능</a>
            <a href="#pricing" className="text-sm text-slate-500 hover:text-amber-600 transition-colors">가격</a>
            <a href="#faq" className="text-sm text-slate-500 hover:text-amber-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-600 hover:text-amber-600 hover:bg-amber-50">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block mb-8"
          >
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/50 border border-white/60 backdrop-blur-xl shadow-lg shadow-black/5">
              <span className="text-lg">⛄</span>
              <span className="text-sm font-medium text-slate-600">
                AI 마케팅 콘텐츠 플랫폼
              </span>
              <span className="text-base">❄️</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            <span className="text-slate-700">차가운 겨울,</span>
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 bg-clip-text text-transparent">
              따뜻한 콘텐츠
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            눈 덮인 삿포로의 따뜻한 카페처럼,
            <br />
            AI가 당신의 브랜드에 따뜻함을 더해드립니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <div className="relative">
              <SnowOnTop delay={0} duration={10} compact />
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-14 px-10 text-base font-medium shadow-xl shadow-amber-500/30">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <SnowOnTop delay={4} duration={10} compact />
              <Button size="lg" variant="outline" className="border-slate-300 text-slate-600 hover:bg-white/60 h-14 px-10 text-base backdrop-blur-sm">
                <Play className="mr-2 h-5 w-5" />
                데모 보기
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-500"
          >
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-500" />
              3회 무료 체험
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-amber-500" />
              카드 등록 불필요
            </span>
          </motion.div>
        </div>

        {/* Editor Mockup - 따뜻한 창문 스타일 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="relative">
            {/* 따뜻한 빛 글로우 */}
            <div className="absolute -inset-4 bg-gradient-to-b from-amber-400/30 via-amber-300/20 to-transparent blur-xl rounded-2xl" />

            {/* 창문 프레임 위 눈 */}
            <div className="relative">
              <SnowOnTop delay={2} duration={12} />

              {/* 창문 프레임 */}
              <div className="rounded-xl border-2 border-amber-200 bg-white/80 shadow-2xl shadow-amber-200/50 overflow-hidden backdrop-blur-sm">
              {/* 상단 바 - 따뜻한 색상 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-300" />
                  <div className="w-3 h-3 rounded-full bg-amber-200" />
                </div>
                <div className="flex-1 text-center text-sm text-slate-400">Triple C Editor</div>
              </div>
              <EditorMockup theme="light" />
            </div>
          </div>
          </div>
        </motion.div>
      </section>

      {/* Stats - 유리 카드 스타일 */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SnowOnTop delay={i * 2 + 1} duration={14} />
                <div className="text-center p-6 rounded-xl bg-white/70 border border-amber-100 backdrop-blur-sm shadow-sm">
                  <div className="text-4xl font-bold text-amber-600">{stat.value}</div>
                  <div className="text-sm text-slate-500 mt-2">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm mb-6"
            >
              FEATURES
            </motion.div>
            <h2 className="text-4xl font-bold text-slate-700 mb-4">
              따뜻한 기능들
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">
              삿포로의 겨울 카페처럼, 포근하고 강력한 기능을 제공합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SnowOnTop delay={i * 1.5} duration={15} />
                <div className="group p-8 rounded-xl bg-white/80 border border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300 backdrop-blur-sm h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-100 transition-colors">
                      <feature.icon className="h-6 w-6 text-amber-600" />
                    </div>
                    <span className="text-xs text-amber-600 tracking-wider">{feature.tag}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm mb-6">
              PROCESS
            </div>
            <h2 className="text-4xl font-bold text-slate-700">
              3단계로 완성
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-12">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center relative"
                >
                  {/* 연결선 */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-amber-300 to-transparent" />
                  )}

                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-300">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm text-amber-600 font-medium mb-2">STEP {step.num}</div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-3">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Generation Result */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <span className="text-sm text-amber-600 tracking-wider">AI 생성 결과 미리보기</span>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-white/80 p-6 backdrop-blur-sm shadow-xl">
              <GenerationMockup theme="light" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm mb-6">
              PRICING
            </div>
            <h2 className="text-4xl font-bold text-slate-700 mb-4">가격 정책</h2>
            <p className="text-slate-500">따뜻하고 합리적인 가격</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative p-8 rounded-xl overflow-visible ${
                  plan.popular
                    ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-2xl shadow-amber-300 scale-105'
                    : 'bg-white/80 border border-amber-100 backdrop-blur-sm'
                }`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-2 text-sm font-medium mb-4 text-amber-100">
                    <Star className="h-4 w-4 fill-amber-100" /> 인기
                  </div>
                )}
                <div className={`text-sm mb-2 ${plan.popular ? 'text-white/80' : 'text-slate-500'}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`text-4xl font-bold ${plan.popular ? '' : 'text-slate-700'}`}>{plan.price}</span>
                  <span className={plan.popular ? 'text-white/70' : 'text-slate-400'}>{plan.period}</span>
                </div>
                <div className={`h-[1px] mb-6 ${plan.popular ? 'bg-white/30' : 'bg-amber-100'}`} />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`text-sm flex items-center gap-2 ${plan.popular ? 'text-white/90' : 'text-slate-600'}`}>
                      <Check className={`h-4 w-4 flex-shrink-0 ${plan.popular ? 'text-white' : 'text-amber-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full font-medium ${
                  plan.popular
                    ? 'bg-white text-amber-600 hover:bg-white/90'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                }`}>
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-sm mb-6">
              FAQ
            </div>
            <h2 className="text-4xl font-bold text-slate-700">자주 묻는 질문</h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="rounded-xl bg-white/80 border border-amber-100 overflow-hidden backdrop-blur-sm shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-amber-50/50 transition-colors"
                >
                  <span className="font-medium text-slate-700">{item.q}</span>
                  <ChevronDown className={`h-5 w-5 text-amber-500 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-slate-500 leading-relaxed">{item.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto p-16 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-white border border-amber-200 shadow-xl"
          >
            <div className="text-6xl mb-6">☕</div>
            <h2 className="text-4xl font-bold text-slate-700 mb-4">따뜻한 시작</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto">
              눈 내리는 삿포로의 카페에서 따뜻한 커피 한 잔처럼,
              여유롭게 시작해보세요.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-14 px-12 font-medium shadow-xl shadow-amber-300">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-30 py-12 border-t border-amber-100 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-slate-700">Triple C</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <Link href="#" className="hover:text-amber-600 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-amber-600 transition-colors">개인정보</Link>
              <Link href="#" className="hover:text-amber-600 transition-colors">문의하기</Link>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Triple C
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 6: Biei - 비에이 크리스마스 트리 스타일 (맑은 겨울 하늘)
function BieiStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 눈송이 위치 고정 (hydration 문제 방지)
  const snowflakes = useMemo(() => Array.from({ length: 45 }, (_, i) => ({
    id: i,
    left: (i * 19 + 5) % 100,
    delay: (i * 0.5) % 12,
    duration: 12 + (i % 6) * 3,
    size: i % 4 === 0 ? 4 : i % 4 === 1 ? 3 : i % 4 === 2 ? 2.5 : 2,
    opacity: 0.4 + (i % 4) * 0.15,
    drift: (i % 5 - 2) * 8,
  })), []);

  // 얇고 자연스러운 눈 쌓임 SVG 컴포넌트
  const SnowCap = ({ width = 200 }: { width?: number }) => (
    <div className="absolute -top-[3px] left-0 right-0 h-[6px] overflow-visible pointer-events-none">
      <svg viewBox={`0 0 ${width} 10`} className="w-full h-full" preserveAspectRatio="none">
        <path
          d={`M0,10 Q${width*0.05},4 ${width*0.1},6 Q${width*0.15},2 ${width*0.2},5 Q${width*0.28},1 ${width*0.35},3 Q${width*0.42},0 ${width*0.5},2 Q${width*0.58},0 ${width*0.65},3 Q${width*0.72},1 ${width*0.8},5 Q${width*0.85},2 ${width*0.9},6 Q${width*0.95},4 ${width},10 Z`}
          fill="white"
          className="drop-shadow-sm"
        />
      </svg>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-[#A8D8F0] via-[#D4EBF7] to-[#F0F8FC] text-slate-700 overflow-hidden"
    >
      {/* 떨어지는 눈 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-40">
        {snowflakes.map((snow) => (
          <motion.div
            key={snow.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${snow.left}%`,
              width: snow.size,
              height: snow.size,
              opacity: snow.opacity,
              boxShadow: '0 0 3px rgba(255,255,255,0.8)',
            }}
            initial={{ y: -10, x: 0 }}
            animate={{
              y: ['0vh', '105vh'],
              x: [0, snow.drift, 0, -snow.drift, 0],
            }}
            transition={{
              y: { duration: snow.duration, repeat: Infinity, delay: snow.delay, ease: 'linear' },
              x: { duration: snow.duration / 2, repeat: Infinity, delay: snow.delay, ease: 'easeInOut' },
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 py-6 border-b border-white/40 backdrop-blur-md bg-[#A8D8F0]/30">
        <div className="container mx-auto flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center shadow-lg shadow-sky-200/50 backdrop-blur-sm">
                <span className="text-sky-600 font-bold text-lg">C</span>
              </div>
              <SnowCap width={50} />
            </div>
            <span className="text-2xl font-semibold text-slate-700 tracking-wide">
              Triple C
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">기능</a>
            <a href="#pricing" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">가격</a>
            <a href="#faq" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-600 hover:text-sky-600 hover:bg-sky-50">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-white/90 hover:bg-white text-sky-600 shadow-lg shadow-sky-200/50 backdrop-blur-sm">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative inline-block mb-8"
          >
            <div className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-white/60 border border-white/80 backdrop-blur-xl shadow-lg shadow-sky-100/50">
              <span className="text-lg">🌲</span>
              <span className="text-sm font-medium text-sky-700">
                비에이의 고요한 겨울에서 영감을 받은
              </span>
              <span className="text-base">❄️</span>
              <SnowCap width={280} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-tight mb-8"
          >
            <span className="text-slate-700">순백의 캔버스에</span>
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              당신의 이야기를
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            끝없이 펼쳐진 설원 위 홀로 선 나무처럼,
            <br />
            당신의 브랜드가 돋보이는 상세페이지를 만들어 드립니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <div className="relative">
              <Link href="/auth/signup">
                <Button size="lg" className="relative bg-white hover:bg-white/90 text-sky-600 h-14 px-10 text-base font-medium shadow-xl shadow-sky-200/50">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <SnowCap width={200} />
            </div>

            <div className="relative">
              <Button size="lg" variant="outline" className="border-white/60 bg-white/30 text-slate-600 hover:bg-white/50 h-14 px-10 text-base backdrop-blur-sm">
                <Play className="mr-2 h-5 w-5" />
                데모 보기
              </Button>
              <SnowCap width={160} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-8 text-sm text-slate-500"
          >
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sky-500" />
              3회 무료 체험
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sky-500" />
              카드 등록 불필요
            </span>
          </motion.div>
        </div>

        {/* Editor Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="relative">
            <SnowCap width={900} />
            <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-2xl shadow-sky-100/50 overflow-hidden">
              <EditorMockup theme="light" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold bg-gradient-to-r from-sky-500 to-cyan-500 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">이런 게 가능해요</h2>
            <p className="text-slate-500">상세페이지 제작에 필요한 모든 기능</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <SnowCap width={380} />
                <div className="p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg shadow-sky-50 hover:shadow-xl hover:shadow-sky-100/50 transition-all hover:bg-white/90">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-sky-600" />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-600">{feature.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-[#D4EBF7] to-[#E8F4FC]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">간단한 3단계</h2>
            <p className="text-slate-500">누구나 쉽게 시작할 수 있어요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div className="relative inline-block mb-6">
                  <SnowCap width={80} />
                  <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-lg shadow-sky-100/50 flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-sky-600" />
                  </div>
                </div>
                <div className="text-5xl font-bold text-sky-200 mb-2">{step.num}</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">심플한 요금제</h2>
            <p className="text-slate-500">필요에 맞게 선택하세요</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-xl shadow-sky-200'
                    : 'bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg'
                }`}
              >
                <SnowCap width={300} />
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-sky-600 text-xs font-bold shadow-lg">
                    인기
                  </div>
                )}
                <div className={`text-sm mb-2 ${plan.popular ? 'text-sky-100' : 'text-slate-500'}`}>{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? 'text-sky-100' : 'text-slate-400'}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.popular ? 'text-sky-100' : 'text-slate-500'}`}>{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 ${plan.popular ? 'text-sky-200' : 'text-sky-500'}`} />
                      <span className={plan.popular ? 'text-white/90' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-white text-sky-600 hover:bg-sky-50'
                      : 'bg-sky-500 text-white hover:bg-sky-600'
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4">자주 묻는 질문</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="relative"
              >
                <SnowCap width={700} />
                <div className="rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-md overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/50 transition-colors"
                  >
                    <span className="font-medium text-slate-700">{item.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-4 text-slate-500 text-sm leading-relaxed">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-[#D4EBF7] to-[#A8D8F0]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-6">
              지금 시작하세요
            </h2>
            <p className="text-slate-500 mb-8">
              비에이의 설원처럼 깨끗한 상세페이지를 만들어보세요
            </p>
            <Link href="/auth/signup">
              <div className="relative inline-block">
                <SnowCap width={220} />
                <Button size="lg" className="bg-white hover:bg-white/90 text-sky-600 h-14 px-12 font-medium shadow-xl shadow-sky-200/50">
                  무료로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-30 py-12 border-t border-white/40 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md">
                <span className="text-sky-600 font-bold text-sm">C</span>
              </div>
              <span className="font-semibold text-slate-700">Triple C</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <Link href="#" className="hover:text-sky-600 transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-sky-600 transition-colors">개인정보</Link>
              <Link href="#" className="hover:text-sky-600 transition-colors">문의하기</Link>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Triple C
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 7: Typo - 미니멀 타이포그래피 중심 (Just My Type 스타일)
function TypoStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white text-black"
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/5">
        <div className="container mx-auto flex items-center justify-between px-8 py-5">
          <Link href="/" className="text-2xl font-light tracking-tight">
            Triple C
          </Link>
          <nav className="hidden md:flex items-center gap-12">
            <a href="#features" className="text-sm tracking-wide text-black/60 hover:text-black transition-colors">Features</a>
            <a href="#process" className="text-sm tracking-wide text-black/60 hover:text-black transition-colors">Process</a>
            <a href="#pricing" className="text-sm tracking-wide text-black/60 hover:text-black transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm tracking-wide text-black/60 hover:text-black hover:bg-transparent">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-black text-white hover:bg-black/80 text-sm tracking-wide px-6">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center pt-20">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm tracking-[0.3em] uppercase text-black/40 mb-8"
            >
              AI Marketing Platform
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[clamp(3rem,8vw,7rem)] font-light leading-[0.95] tracking-tight mb-12"
            >
              Typography
              <br />
              <span className="italic font-normal">creates</span>
              <br />
              <span className="font-medium">meaning.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-black/50 max-w-xl leading-relaxed mb-12"
            >
              AI가 당신의 브랜드 언어를 학습하고,
              일관된 톤앤매너로 상세페이지를 자동 생성합니다.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/auth/signup">
                <Button size="lg" className="bg-black text-white hover:bg-black/80 h-14 px-10 text-base tracking-wide">
                  무료로 시작하기
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-black/20 text-black hover:bg-black/5 h-14 px-10 text-base tracking-wide">
                <Play className="mr-3 h-4 w-4" />
                데모 보기
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 border-t border-black/10">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-4xl mx-auto">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl font-light tracking-tight mb-2">{stat.value}</div>
                <div className="text-sm text-black/40 tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 bg-black text-white">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm tracking-[0.3em] uppercase text-white/40 mb-6"
            >
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-light tracking-tight mb-20"
            >
              강력한 기능,
              <br />
              <span className="italic">심플한 경험.</span>
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:border-white/40 transition-colors">
                      <feature.icon className="h-5 w-5 text-white/60" />
                    </div>
                    <div>
                      <h3 className="text-xl font-medium mb-3 tracking-tight">{feature.title}</h3>
                      <p className="text-white/50 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="py-32">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm tracking-[0.3em] uppercase text-black/40 mb-6"
            >
              Process
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-light tracking-tight mb-20"
            >
              3단계로
              <br />
              <span className="italic">완성됩니다.</span>
            </motion.h2>

            <div className="space-y-0">
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="py-12 border-t border-black/10 group"
                >
                  <div className="flex items-start gap-12">
                    <span className="text-7xl font-light text-black/10 group-hover:text-black/20 transition-colors">
                      {step.num}
                    </span>
                    <div className="pt-4">
                      <h3 className="text-2xl font-medium mb-4 tracking-tight">{step.title}</h3>
                      <p className="text-black/50 leading-relaxed max-w-md">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editor Preview */}
      <section className="py-32 bg-neutral-50">
        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-sm tracking-[0.3em] uppercase text-black/40 mb-6">Preview</p>
              <h2 className="text-4xl font-light tracking-tight">직관적인 에디터</h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-lg border border-black/10 bg-white overflow-hidden shadow-2xl shadow-black/5"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-black/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-black/10" />
                  <div className="w-3 h-3 rounded-full bg-black/10" />
                  <div className="w-3 h-3 rounded-full bg-black/10" />
                </div>
                <div className="flex-1 text-center text-xs text-black/30 tracking-wide">Triple C Editor</div>
              </div>
              <EditorMockup theme="light" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32">
        <div className="container mx-auto px-8">
          <div className="max-w-5xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm tracking-[0.3em] uppercase text-black/40 mb-6"
            >
              Pricing
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-light tracking-tight mb-20"
            >
              심플한 가격,
              <br />
              <span className="italic">명확한 가치.</span>
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {PRICING.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`p-8 ${
                    plan.popular
                      ? 'bg-black text-white'
                      : 'bg-white border border-black/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="text-xs tracking-[0.2em] uppercase text-white/50 mb-6">Most Popular</div>
                  )}
                  <div className={`text-sm mb-2 ${plan.popular ? 'text-white/50' : 'text-black/40'}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-light tracking-tight">{plan.price}</span>
                    <span className={plan.popular ? 'text-white/40' : 'text-black/30'}>{plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, j) => (
                      <li key={j} className={`text-sm flex items-start gap-3 ${plan.popular ? 'text-white/70' : 'text-black/60'}`}>
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-white/40' : 'text-black/30'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-12 tracking-wide ${
                      plan.popular
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'bg-black text-white hover:bg-black/80'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 bg-neutral-50">
        <div className="container mx-auto px-8">
          <div className="max-w-3xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm tracking-[0.3em] uppercase text-black/40 mb-6"
            >
              FAQ
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-light tracking-tight mb-16"
            >
              자주 묻는 질문
            </motion.h2>

            <div className="space-y-0">
              {FAQ.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="border-t border-black/10"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-6 flex items-center justify-between text-left group"
                  >
                    <span className="text-lg font-medium tracking-tight group-hover:text-black/70 transition-colors">
                      {item.q}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus className="h-5 w-5 text-black/30" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-black/50 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-light tracking-tight mb-8"
            >
              지금 시작하세요.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-white/50 mb-12"
            >
              3회 무료 체험 · 카드 등록 불필요
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 h-14 px-12 text-base tracking-wide">
                  무료로 시작하기
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-black/10">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <span className="text-xl font-light tracking-tight">Triple C</span>
            <div className="flex items-center gap-10 text-sm text-black/40">
              <Link href="#" className="hover:text-black transition-colors tracking-wide">이용약관</Link>
              <Link href="#" className="hover:text-black transition-colors tracking-wide">개인정보</Link>
              <Link href="#" className="hover:text-black transition-colors tracking-wide">문의하기</Link>
            </div>
            <p className="text-sm text-black/30 tracking-wide">
              © {new Date().getFullYear()} Triple C
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// Style 8: Smile - Visual Smiles 스타일 (미니멀 패션 브랜드 느낌)
function SmileStyle() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 큰 마키 텍스트 컴포넌트 (Visual Smiles 스타일)
  const Marquee = ({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) => (
    <div className="overflow-hidden whitespace-nowrap border-y border-black/10 bg-[#F5F0E8]">
      <motion.div
        animate={{ x: reverse ? ['0%', '-50%'] : ['-50%', '0%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="inline-flex py-6"
      >
        {[...Array(6)].map((_, i) => (
          <span key={i} className="text-[12vw] md:text-[9vw] font-black tracking-tighter mx-4 uppercase" style={{ WebkitTextStroke: '2px black', color: 'transparent' }}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );

  // 스캘럽(물결) 장식 컴포넌트
  const ScallopBorder = ({ color = '#E8DFD0' }: { color?: string }) => (
    <svg className="w-full h-6" viewBox="0 0 100 10" preserveAspectRatio="none">
      <path
        d="M0,10 Q5,0 10,10 Q15,0 20,10 Q25,0 30,10 Q35,0 40,10 Q45,0 50,10 Q55,0 60,10 Q65,0 70,10 Q75,0 80,10 Q85,0 90,10 Q95,0 100,10 L100,10 L0,10 Z"
        fill={color}
      />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FFFBF5] text-black"
    >
      {/* Header - 심플 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF5]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <Link href="/" className="text-2xl font-black tracking-tighter uppercase">
            Triple C
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm uppercase tracking-wider hover:underline">About</a>
            <a href="#features" className="text-sm uppercase tracking-wider hover:underline">Features</a>
            <a href="#pricing" className="text-sm uppercase tracking-wider hover:underline">Pricing</a>
          </nav>
          <Link href="/auth/signup">
            <Button className="bg-black text-white hover:bg-black/80 uppercase text-xs tracking-wider px-6 h-10">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero - Visual Smiles 스타일 */}
      <section className="pt-20">
        {/* 마키 텍스트 */}
        <Marquee>Triple C</Marquee>

        {/* 메인 히어로 */}
        <div className="relative bg-[#E8DFD0] py-32">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm uppercase tracking-[0.3em] mb-6"
              >
                AI Content Platform
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase mb-8"
              >
                Creating
                <br />
                contents
                <br />
                for humans
                <br />
                <span className="italic font-normal">and their</span>
                <br />
                happiness
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link href="/auth/signup">
                  <Button className="bg-black text-white hover:bg-black/80 uppercase text-sm tracking-wider px-10 h-14">
                    Start Now
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* 스캘럽 장식 - 하단 */}
          <div className="absolute bottom-0 left-0 right-0">
            <ScallopBorder color="#FFFBF5" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-b border-black/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-black tracking-tighter">{stat.value}</div>
                <div className="text-sm uppercase tracking-wider mt-2 text-black/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - 심플 그리드 */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm uppercase tracking-[0.3em] mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              The Latest
              <br />
              Features
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#FFFBF5] p-8 group hover:bg-[#E8DFD0] transition-colors"
              >
                <div className="w-12 h-12 border border-black/20 flex items-center justify-center mb-6 group-hover:border-black transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight mb-3">{feature.title}</h3>
                <p className="text-black/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 마키 텍스트 - 중간 */}
      <Marquee reverse>Visual Content</Marquee>

      {/* Process */}
      <section id="process" className="py-24 bg-[#1A1A1A] text-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-white/50">Process</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              How It Works
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-16">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="text-8xl font-black tracking-tighter text-white/10 mb-4">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{step.title}</h3>
                <p className="text-white/50 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editor Preview */}
      <section className="py-24 bg-[#E8DFD0] relative">
        <div className="absolute top-0 left-0 right-0 rotate-180">
          <ScallopBorder color="#1A1A1A" />
        </div>

        <div className="container mx-auto px-6 pt-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm uppercase tracking-[0.3em] mb-4">Preview</p>
            <h2 className="text-4xl font-black tracking-tighter uppercase">The Editor</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto border-2 border-black bg-white overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-[#FFFBF5]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-black" />
                <div className="w-3 h-3 rounded-full border-2 border-black" />
                <div className="w-3 h-3 rounded-full border-2 border-black" />
              </div>
              <div className="text-xs uppercase tracking-wider">Triple C Editor</div>
              <div className="w-16" />
            </div>
            <EditorMockup theme="light" />
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <ScallopBorder color="#FFFBF5" />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-sm uppercase tracking-[0.3em] mb-4">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              Simple Pricing
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
            {PRICING.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`p-8 border-2 ${
                  plan.popular
                    ? 'border-black bg-black text-white'
                    : 'border-black/20 hover:border-black transition-colors'
                }`}
              >
                {plan.popular && (
                  <div className="text-xs uppercase tracking-wider mb-4">Most Popular</div>
                )}
                <div className={`text-sm uppercase tracking-wider mb-2 ${plan.popular ? 'text-white/60' : 'text-black/50'}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                  <span className={plan.popular ? 'text-white/40' : 'text-black/30'}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className={`text-sm flex items-start gap-3 ${plan.popular ? 'text-white/70' : 'text-black/60'}`}>
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-12 uppercase text-xs tracking-wider ${
                    plan.popular
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-black text-white hover:bg-black/80'
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-[#F5F0E8]">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <p className="text-sm uppercase tracking-[0.3em] mb-4">FAQ</p>
              <h2 className="text-4xl font-black tracking-tighter uppercase">
                Questions?
              </h2>
            </motion.div>

            <div className="space-y-0 border-t-2 border-black">
              {FAQ.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="border-b-2 border-black"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full py-6 flex items-center justify-between text-left group"
                  >
                    <span className="text-lg font-bold uppercase tracking-tight group-hover:underline">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 45 : 0 }}
                      className="text-2xl font-light"
                    >
                      +
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-black/60 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <Marquee>Get Started Now</Marquee>

      <section className="py-24 bg-black text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-8"
            >
              Ready to
              <br />
              <span className="italic font-normal">start?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-white/50 mb-10"
            >
              3회 무료 체험 · 카드 등록 불필요
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Link href="/auth/signup">
                <Button className="bg-white text-black hover:bg-white/90 uppercase text-sm tracking-wider px-10 h-14">
                  Start Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-black/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xl font-black tracking-tighter uppercase">Triple C</span>
            <div className="flex items-center gap-8 text-xs uppercase tracking-wider text-black/40">
              <Link href="#" className="hover:text-black transition-colors">이용약관</Link>
              <Link href="#" className="hover:text-black transition-colors">개인정보</Link>
              <Link href="#" className="hover:text-black transition-colors">문의하기</Link>
            </div>
            <p className="text-xs text-black/30 uppercase tracking-wider">
              © {new Date().getFullYear()} Triple C
            </p>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
