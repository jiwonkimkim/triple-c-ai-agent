'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Code, Copy, Check, Terminal, ImageIcon, FileText } from 'lucide-react';

// 생성된 섹션 결과 타입
interface GeneratedSection {
  type: string;
  title?: string;
  body: string;
  imageUrl?: string;
}

// 개발자 프롬프트 정보 타입 (생성 결과 포함)
export interface DevPromptInfo {
  textGeneration: {
    systemPrompt: string;
    userPrompt: string;
    // 생성된 텍스트 결과
    generatedResult?: {
      hookMessage: string;
      sections: GeneratedSection[];
    };
  };
  sectionImagePrompts: Array<{
    sectionType: string;
    // ★★★ [0] 메타 정보 (UI 태그 표시용) ★★★
    generationMode?: 'T2I' | 'I2I';    // 생성 모드 (Text-to-Image / Image-to-Image)
    sectionTypeOriginal?: string;      // 원본 섹션 타입 (예: FEATURES_01)
    sectionTypeMapped?: string;        // 매핑된 섹션 타입 (예: FEATURES)
    // ★★★ [1] 섹션별 프롬프트 ★★★
    sectionBasePrompt?: string;        // 섹션별 기본 프롬프트 (buildSharedSectionPrompt - MAIN, HERO, FEATURES 등)
    orchestrationPrompt?: string;      // 오케스트레이션 AI가 생성한 시나리오 프롬프트
    categoryTemplatePrompt?: string;   // (deprecated) 섹션 타입별 카테고리 템플릿 - sectionBasePrompt 사용
    i2iSystemPrompt?: string;          // I2I 시스템 프롬프트 (제품 재배치 규칙 등)
    // ★★★ [2] 카테고리별 프롬프트 (뷰티 서브카테고리) ★★★
    categoryPrompt?: string;           // 카테고리별 고도화 프롬프트 (스킨케어/립/선케어 등)
    subCategory?: string;              // 서브카테고리명 (skincare, lip, suncare 등)
    // ★★★ [3] 오버레이 텍스트 관련 프롬프트 ★★★
    overlayTextPrompt?: string;        // 섹션별 오버레이 텍스트 프롬프트 (buildOverlayTextPrompt)
    overlayGuidePrompt?: string;       // 오버레이 디자인 가이드 (buildCreativeOverlayGuide - 공통)
    // ★★★ [4] 공통 프롬프트 (Flash 모델 전용) ★★★
    noTextReinforcement?: string;      // Flash 모델용 텍스트 금지 강화 프롬프트
    // ★ 최종 결합된 프롬프트
    imagePrompt: string;               // 최종 사용된 전체 프롬프트
    // 생성된 이미지 URL
    generatedImageUrl?: string;
  }>;
  // 오버레이 텍스트 프롬프트
  overlayTextPrompts?: Array<{
    sectionType: string;
    blockIndex: number;
    overlayPrompt: string;
    generatedOverlay?: unknown;
  }>;
}

interface DevPromptViewerProps {
  prompts: DevPromptInfo | null | undefined;
  className?: string;
}

// 프롬프트 텍스트 복사 버튼 컴포넌트
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-2"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

// 프롬프트 내용 표시 컴포넌트
function PromptContent({ title, content, height = "h-[220px]" }: { title: string; content: string; height?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <CopyButton text={content} />
      </div>
      <ScrollArea className={`${height} rounded-md border bg-muted/50 p-3`}>
        <pre className="text-[10px] whitespace-pre-wrap font-mono leading-relaxed">{content}</pre>
      </ScrollArea>
    </div>
  );
}

export function DevPromptViewer({ prompts, className }: DevPromptViewerProps) {
  const hasPrompts = !!prompts;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className}`}
        >
          <Terminal className="h-4 w-4" />
          <span>DEV: 프롬프트 보기</span>
          <Badge variant="secondary" className="ml-1 text-[10px]">
            개발자 전용
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1600px] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            AI 생성 프롬프트 확인
            <Badge variant="destructive" className="ml-2">
              개발자 모드
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!hasPrompts ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Terminal className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">프롬프트 데이터 없음</h3>
            <p className="text-muted-foreground max-w-md">
              이 프로젝트는 프롬프트 저장 기능 추가 전에 생성되었습니다.<br />
              <strong>&quot;재생성&quot;</strong> 버튼을 클릭하면 프롬프트가 저장됩니다.
            </p>
          </div>
        ) : (
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">텍스트 생성</TabsTrigger>
            <TabsTrigger value="image">
              이미지 생성
              {prompts.sectionImagePrompts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {prompts.sectionImagePrompts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overlay">
              오버레이 텍스트
              {prompts.overlayTextPrompts && prompts.overlayTextPrompts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {prompts.overlayTextPrompts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 왼쪽: 생성된 결과 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-semibold text-green-600">생성된 결과</h3>
                </div>
                {prompts.textGeneration.generatedResult ? (
                  <ScrollArea className="h-[500px] rounded-md border bg-green-50 dark:bg-green-950/20 p-4">
                    <div className="space-y-4">
                      {/* Hook Message */}
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                        <Badge className="mb-2 bg-green-600">Hook Message</Badge>
                        <p className="text-sm font-medium">
                          {prompts.textGeneration.generatedResult.hookMessage}
                        </p>
                      </div>
                      {/* Sections */}
                      {prompts.textGeneration.generatedResult.sections.map((section, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{section.type}</Badge>
                            {section.title && (
                              <span className="text-xs text-muted-foreground">{section.title}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {section.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-[500px] rounded-md border bg-muted/30 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">생성된 결과 없음</p>
                  </div>
                )}
              </div>

              {/* 오른쪽: 프롬프트 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-600">사용된 프롬프트</h3>
                </div>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-2">
                    <PromptContent
                      title="System Prompt"
                      content={prompts.textGeneration.systemPrompt}
                    />
                    <PromptContent
                      title="User Prompt"
                      content={prompts.textGeneration.userPrompt}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            {prompts.sectionImagePrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                이미지 생성 프롬프트가 없습니다.
              </div>
            ) : (
              <ScrollArea className="h-[70vh]">
                <div className="space-y-8 pr-4">
                  {prompts.sectionImagePrompts.map((section, index) => (
                    <div key={index} className="rounded-lg border-2 p-5 bg-muted/20">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <Badge className="text-sm px-3 py-1">{section.sectionType}</Badge>
                        {/* ★ 생성 모드 태그 (T2I/I2I) */}
                        {section.generationMode && (
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${
                              section.generationMode === 'T2I'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-green-100 text-green-700 border-green-300'
                            }`}
                          >
                            {section.generationMode === 'T2I' ? '🎨 Text-to-Image' : '🖼️ Image-to-Image'}
                          </Badge>
                        )}
                        {/* ★ 섹션 타입 매핑 태그 (원본 → 매핑이 다른 경우만) */}
                        {section.sectionTypeOriginal && section.sectionTypeMapped &&
                         section.sectionTypeOriginal !== section.sectionTypeMapped && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            📍 {section.sectionTypeOriginal} → {section.sectionTypeMapped}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          섹션 이미지 #{index + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-[300px_1fr_1fr] gap-6">
                        {/* 왼쪽: 생성된 이미지 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">생성된 이미지</span>
                          </div>
                          {section.generatedImageUrl ? (
                            <div className="relative h-[400px] rounded-lg border-2 overflow-hidden bg-white shadow-sm">
                              <Image
                                src={section.generatedImageUrl}
                                alt={`${section.sectionType} 생성 이미지`}
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="h-[400px] rounded-lg border-2 bg-muted/30 flex items-center justify-center">
                              <div className="text-center">
                                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">이미지 없음</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 중앙: 개별 프롬프트 구성요소 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-600">프롬프트 구성요소</span>
                          </div>
                          <ScrollArea className="h-[400px] rounded-lg border-2 border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4">
                            <div className="space-y-4">
                              {/* ★★★ [1] 섹션별 프롬프트 ★★★ */}
                              {section.sectionBasePrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-1">
                                      📋 섹션 기본 프롬프트
                                    </Badge>
                                    <CopyButton text={section.sectionBasePrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    섹션 타입(MAIN/HERO/FEATURES 등)에 따른 레이아웃, 구도, 스타일 지침
                                  </p>
                                  <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/30 p-3 max-h-[120px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-blue-900 dark:text-blue-200 leading-relaxed">
                                      {section.sectionBasePrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* 오케스트레이션 AI 생성 시나리오 */}
                              {section.orchestrationPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300 px-2 py-1">
                                      🎭 오케스트레이션 시나리오
                                    </Badge>
                                    <CopyButton text={section.orchestrationPrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    AI가 생성한 이미지 시나리오 (제품 특징, 분위기, 연출 컨셉)
                                  </p>
                                  <div className="rounded-lg border bg-purple-50 dark:bg-purple-950/30 p-3 max-h-[120px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-purple-900 dark:text-purple-200 leading-relaxed">
                                      {section.orchestrationPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* I2I 시스템 프롬프트 (제품 재배치 규칙) */}
                              {section.i2iSystemPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 px-2 py-1">
                                      🖼️ I2I 시스템 프롬프트
                                    </Badge>
                                    <CopyButton text={section.i2iSystemPrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    제품 이미지 기반 생성 시 제품 형태 유지 및 재배치 규칙
                                  </p>
                                  <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 max-h-[100px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-green-900 dark:text-green-200 leading-relaxed">
                                      {section.i2iSystemPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* ★★★ [2] 카테고리별 프롬프트 (뷰티 서브카테고리) ★★★ */}
                              {section.categoryPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-pink-100 text-pink-700 border-pink-300 px-2 py-1">
                                      🏷️ 카테고리 프롬프트 {section.subCategory && `(${section.subCategory})`}
                                    </Badge>
                                    <CopyButton text={section.categoryPrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    뷰티 서브카테고리(스킨케어/립/선케어 등)별 특화 이미지 스타일
                                  </p>
                                  <div className="rounded-lg border bg-pink-50 dark:bg-pink-950/30 p-3 max-h-[150px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-pink-900 dark:text-pink-200 leading-relaxed">
                                      {section.categoryPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* ★★★ [3] 오버레이 텍스트 관련 프롬프트 ★★★ */}
                              {section.overlayTextPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 px-2 py-1">
                                      ✏️ 오버레이 텍스트 프롬프트
                                    </Badge>
                                    <CopyButton text={section.overlayTextPrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    이미지 위에 표시할 마케팅 텍스트 생성 지침 (위치, 스타일, 내용)
                                  </p>
                                  <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3 max-h-[100px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-amber-900 dark:text-amber-200 leading-relaxed">
                                      {section.overlayTextPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {section.overlayGuidePrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 px-2 py-1">
                                      🎨 오버레이 디자인 가이드
                                    </Badge>
                                    <CopyButton text={section.overlayGuidePrompt} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    오버레이 텍스트 디자인 규칙 (폰트 크기, 색상, 배치 가이드)
                                  </p>
                                  <div className="rounded-lg border bg-orange-50 dark:bg-orange-950/30 p-3 max-h-[100px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-orange-900 dark:text-orange-200 leading-relaxed">
                                      {section.overlayGuidePrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* ★★★ [4] 공통 프롬프트 (Flash 모델 전용) ★★★ */}
                              {section.noTextReinforcement && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300 px-2 py-1">
                                      ⚠️ 텍스트 금지 강화 (Flash 전용)
                                    </Badge>
                                    <CopyButton text={section.noTextReinforcement} />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    이미지 내 텍스트 생성 방지 강화 프롬프트 (Flash 모델은 텍스트 생성 경향이 있음)
                                  </p>
                                  <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 max-h-[100px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-red-900 dark:text-red-200 leading-relaxed">
                                      {section.noTextReinforcement}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* 프롬프트 구성요소가 전혀 없는 경우 - imagePrompt 표시 */}
                              {!section.sectionBasePrompt && !section.orchestrationPrompt && !section.overlayTextPrompt && !section.noTextReinforcement && !section.i2iSystemPrompt && section.imagePrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300 px-2 py-1">
                                      📝 이미지 생성 프롬프트 (분리 전)
                                    </Badge>
                                    <CopyButton text={section.imagePrompt} />
                                  </div>
                                  <div className="rounded-lg border bg-gray-50 dark:bg-gray-950/30 p-3 max-h-[350px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-200 leading-relaxed">
                                      {section.imagePrompt}
                                    </pre>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground italic">
                                    * 이 섹션은 프롬프트 분리 기능 추가 전에 생성되었습니다.
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* 오른쪽: 최종 결합 프롬프트 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Code className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-600">최종 결합 프롬프트</span>
                            <CopyButton text={section.imagePrompt} />
                          </div>
                          <ScrollArea className="h-[400px] rounded-lg border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                            <pre className="text-[11px] whitespace-pre-wrap font-mono leading-relaxed">
                              {section.imagePrompt}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="overlay" className="mt-4">
            {!prompts.overlayTextPrompts || prompts.overlayTextPrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                오버레이 텍스트 프롬프트가 없습니다.
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6 pr-4">
                  {prompts.overlayTextPrompts.map((overlay, index) => (
                    <div key={index} className="rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge>{overlay.sectionType}</Badge>
                        <Badge variant="outline">Block #{overlay.blockIndex + 1}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* 왼쪽: 생성된 오버레이 텍스트 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">생성된 오버레이</span>
                          </div>
                          {overlay.generatedOverlay ? (
                            <ScrollArea className="h-[200px] rounded-md border bg-green-50 dark:bg-green-950/20 p-3">
                              <pre className="text-[10px] whitespace-pre-wrap font-mono">
                                {JSON.stringify(overlay.generatedOverlay, null, 2)}
                              </pre>
                            </ScrollArea>
                          ) : (
                            <div className="h-[200px] rounded-md border bg-muted/30 flex items-center justify-center">
                              <p className="text-xs text-muted-foreground">생성된 오버레이 없음</p>
                            </div>
                          )}
                        </div>

                        {/* 오른쪽: 프롬프트 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">사용된 프롬프트</span>
                            <CopyButton text={overlay.overlayPrompt} />
                          </div>
                          <ScrollArea className="h-[200px] rounded-md border bg-muted/50 p-3">
                            <pre className="text-[10px] whitespace-pre-wrap font-mono">
                              {overlay.overlayPrompt}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 인라인 프롬프트 뷰어 (모달 없이 바로 표시)
export function DevPromptInlineViewer({ prompts }: DevPromptViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 개발 환경에서만 렌더링 (NEXT_PUBLIC_DEV_MODE 체크 강화)
  const devModeEnv = process.env.NEXT_PUBLIC_DEV_MODE?.toLowerCase();
  const isDev = process.env.NODE_ENV === 'development' || devModeEnv === 'true' || devModeEnv === '1';
  if (!isDev) {
    return null;
  }

  if (!prompts) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-sm">DEV: AI 생성 프롬프트</span>
          <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-600">
            개발자 전용
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '접기' : '펼치기'}
        </Button>
      </div>

      {isExpanded && (
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="text" className="text-xs">텍스트</TabsTrigger>
            <TabsTrigger value="image" className="text-xs">이미지</TabsTrigger>
            <TabsTrigger value="overlay" className="text-xs">오버레이</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">System Prompt</span>
                <CopyButton text={prompts.textGeneration.systemPrompt} />
              </div>
              <ScrollArea className="h-[150px] rounded border bg-background p-2">
                <pre className="text-[10px] whitespace-pre-wrap font-mono">
                  {prompts.textGeneration.systemPrompt}
                </pre>
              </ScrollArea>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">User Prompt</span>
                <CopyButton text={prompts.textGeneration.userPrompt} />
              </div>
              <ScrollArea className="h-[150px] rounded border bg-background p-2">
                <pre className="text-[10px] whitespace-pre-wrap font-mono">
                  {prompts.textGeneration.userPrompt}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-3">
            {prompts.sectionImagePrompts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                이미지 프롬프트 없음
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-2">
                  {prompts.sectionImagePrompts.map((section, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {section.sectionType}
                        </Badge>
                        <CopyButton text={section.imagePrompt} />
                      </div>
                      <ScrollArea className="h-[80px] rounded border bg-background p-2">
                        <pre className="text-[10px] whitespace-pre-wrap font-mono">
                          {section.imagePrompt}
                        </pre>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="overlay" className="space-y-3">
            {!prompts.overlayTextPrompts || prompts.overlayTextPrompts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                오버레이 프롬프트 없음
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3 pr-2">
                  {prompts.overlayTextPrompts.map((overlay, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {overlay.sectionType}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            #{overlay.blockIndex + 1}
                          </Badge>
                        </div>
                        <CopyButton text={overlay.overlayPrompt} />
                      </div>
                      <ScrollArea className="h-[80px] rounded border bg-background p-2">
                        <pre className="text-[10px] whitespace-pre-wrap font-mono">
                          {overlay.overlayPrompt}
                        </pre>
                      </ScrollArea>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
