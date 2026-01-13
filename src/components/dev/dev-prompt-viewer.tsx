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
    // ★ 개별 프롬프트 구성요소
    orchestrationPrompt?: string;      // 오케스트레이션 AI가 생성한 시나리오 프롬프트
    categoryTemplatePrompt?: string;   // 섹션 타입별 카테고리 템플릿 프롬프트
    i2iSystemPrompt?: string;          // I2I 시스템 프롬프트 (제품 재배치 규칙 등)
    // ★★★ 고정/동적 프롬프트 분리 (NEW!)
    fixedPrompt?: string;              // 고정 프롬프트 (제품일관성, 품질, no-text, 네거티브)
    dynamicPrompt?: string;            // 동적 프롬프트 (테마, 섹션템플릿, 텍스트시각화 등)
    // ★ 최종 결합된 프롬프트 (이전 호환성)
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
  // devPrompts가 있으면 항상 표시 (DB에서 가져온 데이터 기반)
  const hasPrompts = !!prompts;

  // 프롬프트가 없으면 비활성화된 버튼만 표시
  if (!hasPrompts) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 ${className}`}
        disabled
      >
        <Terminal className="h-4 w-4" />
        <span>DEV: 프롬프트 보기</span>
        <Badge variant="secondary" className="ml-1 text-[10px]">
          생성 필요
        </Badge>
      </Button>
    );
  }

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
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="text-sm px-3 py-1">{section.sectionType}</Badge>
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
                              {/* ★ 고정 프롬프트 (모든 섹션 공통) */}
                              {section.fixedPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-300 px-2 py-1">
                                      🔒 고정 (공통)
                                    </Badge>
                                    <CopyButton text={section.fixedPrompt} />
                                  </div>
                                  <div className="rounded-lg border bg-slate-50 dark:bg-slate-950/30 p-3 max-h-[120px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                                      {section.fixedPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* ★ 동적 프롬프트 (섹션/카테고리별 변경) */}
                              {section.dynamicPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 px-2 py-1">
                                      🔄 동적 (섹션별)
                                    </Badge>
                                    <CopyButton text={section.dynamicPrompt} />
                                  </div>
                                  <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-3 max-h-[180px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-amber-900 dark:text-amber-200 leading-relaxed">
                                      {section.dynamicPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* I2I 시스템 프롬프트 (있으면 표시) */}
                              {section.i2iSystemPrompt && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300 px-2 py-1">
                                      🖼️ I2I 시스템
                                    </Badge>
                                    <CopyButton text={section.i2iSystemPrompt} />
                                  </div>
                                  <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3 max-h-[100px] overflow-y-auto">
                                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-green-900 dark:text-green-200 leading-relaxed">
                                      {section.i2iSystemPrompt}
                                    </pre>
                                  </div>
                                </div>
                              )}

                              {/* 프롬프트 구성요소가 없는 경우 */}
                              {!section.fixedPrompt && !section.dynamicPrompt && !section.i2iSystemPrompt && (
                                <div className="text-center py-8 text-muted-foreground">
                                  개별 프롬프트 구성요소 없음
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
