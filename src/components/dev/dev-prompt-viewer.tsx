'use client';

import { useState } from 'react';
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
import { Code, Copy, Check, Terminal } from 'lucide-react';

// 개발자 프롬프트 정보 타입
export interface DevPromptInfo {
  textGeneration: {
    systemPrompt: string;
    userPrompt: string;
  };
  sectionImagePrompts: Array<{
    sectionType: string;
    imagePrompt: string;
    imagePromptMidjourney?: string;
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
function PromptContent({ title, content }: { title: string; content: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <CopyButton text={content} />
      </div>
      <ScrollArea className="h-[300px] rounded-md border bg-muted/50 p-4">
        <pre className="text-xs whitespace-pre-wrap font-mono">{content}</pre>
      </ScrollArea>
    </div>
  );
}

export function DevPromptViewer({ prompts, className }: DevPromptViewerProps) {
  // 개발 환경에서만 렌더링
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">텍스트 생성 프롬프트</TabsTrigger>
            <TabsTrigger value="image">
              이미지 생성 프롬프트
              {prompts.sectionImagePrompts.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {prompts.sectionImagePrompts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-4">
            <PromptContent
              title="System Prompt"
              content={prompts.textGeneration.systemPrompt}
            />
            <PromptContent
              title="User Prompt"
              content={prompts.textGeneration.userPrompt}
            />
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            {prompts.sectionImagePrompts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                이미지 생성 프롬프트가 없습니다.
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6 pr-4">
                  {prompts.sectionImagePrompts.map((section, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{section.sectionType}</Badge>
                        <span className="text-sm text-muted-foreground">
                          섹션 이미지 프롬프트
                        </span>
                      </div>
                      <PromptContent
                        title="Gemini / DALL-E Prompt"
                        content={section.imagePrompt}
                      />
                      {section.imagePromptMidjourney && (
                        <PromptContent
                          title="Midjourney Prompt"
                          content={section.imagePromptMidjourney}
                        />
                      )}
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

  // 개발 환경에서만 렌더링
  if (process.env.NODE_ENV !== 'development') {
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
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="text-xs">텍스트 프롬프트</TabsTrigger>
            <TabsTrigger value="image" className="text-xs">이미지 프롬프트</TabsTrigger>
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
        </Tabs>
      )}
    </div>
  );
}
