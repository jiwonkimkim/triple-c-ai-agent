'use client';

import { useState } from 'react';
import { Video, Sparkles, Upload, AlertCircle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VideoStyleSelector } from './video-style-selector';
import { VideoOptions } from './video-options';
import type {
  VideoStyle,
  VideoAspectRatio,
  VideoDuration,
} from '@/services/video';

interface VideoGeneratorProps {
  projectId: string;
  onVideoGenerated?: (videoUrl: string) => void;
  disabled?: boolean;
}

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  jobId: string | null;
}

export function VideoGenerator({
  projectId,
  onVideoGenerated,
  disabled = false,
}: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<VideoStyle>('cinematic');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>(4);
  const [motionIntensity, setMotionIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    error: null,
    jobId: null,
  });

  // Calculate credits
  const estimatedCredits = Math.ceil((duration / 4) * 10 * (aspectRatio === '16:9' ? 1.2 : 1));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    setShowConfirmDialog(false);
    setGenerationState({
      isGenerating: true,
      progress: 0,
      currentStep: '영상 생성 준비 중...',
      error: null,
      jobId: null,
    });

    try {
      // Start video generation
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          prompt,
          negativePrompt: negativePrompt || undefined,
          style,
          aspectRatio,
          duration,
          referenceImage: referenceImage || undefined,
          motionIntensity,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start generation');
      }

      const data = await response.json();
      const jobId = data.data.jobId;

      setGenerationState((prev) => ({
        ...prev,
        jobId,
        currentStep: '영상 생성 중...',
      }));

      // Poll for progress
      await pollForCompletion(jobId);
    } catch (error) {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      }));
    }
  };

  const pollForCompletion = async (jobId: string) => {
    const maxAttempts = 120; // 2 minutes max
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await fetch(`/api/generate/video?jobId=${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check status');
        }

        const { status, progress, resultVideoUrl } = data.data;

        setGenerationState((prev) => ({
          ...prev,
          progress: progress || prev.progress + 2,
          currentStep: getStepMessage(progress || prev.progress + 2),
        }));

        if (status === 'COMPLETED' && resultVideoUrl) {
          setGenerationState((prev) => ({
            ...prev,
            isGenerating: false,
            progress: 100,
            currentStep: '완료!',
          }));
          onVideoGenerated?.(resultVideoUrl);
          return;
        }

        if (status === 'FAILED') {
          throw new Error('Video generation failed');
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else {
          throw new Error('Generation timeout');
        }
      } catch (error) {
        setGenerationState((prev) => ({
          ...prev,
          isGenerating: false,
          error: error instanceof Error ? error.message : 'Generation failed',
        }));
      }
    };

    poll();
  };

  const getStepMessage = (progress: number): string => {
    if (progress < 20) return '프롬프트 분석 중...';
    if (progress < 40) return '키프레임 생성 중...';
    if (progress < 60) return '프레임 보간 중...';
    if (progress < 80) return '영상 렌더링 중...';
    if (progress < 95) return '최종 처리 중...';
    return '완료!';
  };

  const canGenerate = prompt.trim().length >= 10 && !disabled && !generationState.isGenerating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Video className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">AI 영상 생성</h3>
          <p className="text-sm text-muted-foreground">
            텍스트 프롬프트로 짧은 광고 영상을 생성합니다
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {generationState.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{generationState.error}</AlertDescription>
        </Alert>
      )}

      {/* Generation Progress */}
      {generationState.isGenerating && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{generationState.currentStep}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(generationState.progress)}%
            </span>
          </div>
          <Progress value={generationState.progress} />
          <p className="text-xs text-muted-foreground text-center">
            영상 생성은 약 {duration * 15}초 정도 소요됩니다
          </p>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-3">
        <Label>프롬프트</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="생성할 영상을 설명해주세요. 예: 현대적인 스마트폰이 하얀 배경에서 천천히 회전하며 제품의 세련된 디자인을 보여줍니다."
          rows={4}
          disabled={disabled || generationState.isGenerating}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          최소 10자 이상, 최대 500자
          <span className="float-right">{prompt.length}/500</span>
        </p>
      </div>

      {/* Negative Prompt (Optional) */}
      <div className="space-y-3">
        <Label className="text-muted-foreground">제외할 요소 (선택사항)</Label>
        <Textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="영상에서 제외할 요소를 입력하세요. 예: 흐릿한, 저품질, 텍스트"
          rows={2}
          disabled={disabled || generationState.isGenerating}
          className="resize-none"
        />
      </div>

      {/* Reference Image Upload */}
      <div className="space-y-3">
        <Label>참조 이미지 (선택사항)</Label>
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
            referenceImage ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
          )}
        >
          {referenceImage ? (
            <div className="relative">
              <img
                src={referenceImage}
                alt="Reference"
                className="max-h-32 mx-auto rounded"
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setReferenceImage(null)}
              >
                이미지 제거
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                클릭하여 이미지 업로드
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={disabled || generationState.isGenerating}
              />
            </label>
          )}
        </div>
      </div>

      {/* Style Selector */}
      <VideoStyleSelector
        value={style}
        onChange={setStyle}
        disabled={disabled || generationState.isGenerating}
      />

      {/* Video Options */}
      <VideoOptions
        aspectRatio={aspectRatio}
        duration={duration}
        motionIntensity={motionIntensity}
        onAspectRatioChange={setAspectRatio}
        onDurationChange={setDuration}
        onMotionIntensityChange={setMotionIntensity}
        disabled={disabled || generationState.isGenerating}
      />

      {/* Credits Info */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <span className="font-medium">예상 크레딧</span>
        </div>
        <span className="text-lg font-bold text-primary">{estimatedCredits}</span>
      </div>

      {/* Generate Button */}
      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={!canGenerate}
        className="w-full"
        size="lg"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        영상 생성하기
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>영상 생성 확인</DialogTitle>
            <DialogDescription>
              다음 설정으로 영상을 생성합니다:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">스타일</span>
              <span className="font-medium">{style}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">화면 비율</span>
              <span className="font-medium">{aspectRatio}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">길이</span>
              <span className="font-medium">{duration}초</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">모션 강도</span>
              <span className="font-medium">{motionIntensity}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="font-medium">사용 크레딧</span>
              <span className="font-bold text-primary">{estimatedCredits}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={startGeneration}>
              <Sparkles className="h-4 w-4 mr-2" />
              생성 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
