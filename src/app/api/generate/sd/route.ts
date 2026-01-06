import { NextRequest, NextResponse } from 'next/server';
import { getComfyUIService, ModelType } from '@/lib/services/comfyui';

export const dynamic = 'force-dynamic';

/**
 * POST /api/generate/sd
 * Generate image using local Stable Diffusion / Flux (ComfyUI)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      negativePrompt,
      width = 1024,
      height = 1024,
      steps,
      cfg,
      seed,
      model = 'sd35-medium',
    } = body;

    // Set defaults based on model
    const defaultSteps = model === 'sdxl-base' ? 25 : 28;
    const defaultCfg = model === 'sdxl-base' ? 7 : 4.5;
    const finalSteps = steps ?? defaultSteps;
    const finalCfg = cfg ?? defaultCfg;

    if (!prompt) {
      return NextResponse.json(
        { error: '프롬프트가 필요합니다.' },
        { status: 400 }
      );
    }

    const comfyui = getComfyUIService();

    // Check if ComfyUI is available
    const isAvailable = await comfyui.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        {
          error: 'ComfyUI 서버가 실행 중이지 않습니다.',
          message: 'ComfyUI를 먼저 시작해주세요: cd ~/Desktop/ComfyUI && source venv/bin/activate && python main.py --force-fp16',
        },
        { status: 503 }
      );
    }

    // Generate image
    const result = await comfyui.generate({
      prompt,
      negativePrompt,
      width,
      height,
      steps: finalSteps,
      cfg: finalCfg,
      seed,
      model: model as ModelType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          promptId: result.promptId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        filename: result.filename,
        promptId: result.promptId,
        executionTime: result.executionTime,
        generator: model,
        settings: {
          prompt,
          negativePrompt,
          width,
          height,
          steps: finalSteps,
          cfg: finalCfg,
          model,
        },
      },
    });
  } catch (error) {
    console.error('SD image generation error:', error);
    return NextResponse.json(
      { error: 'Stable Diffusion 이미지 생성 중 오류가 발생했습니다.', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate/sd
 * Check ComfyUI server status
 */
export async function GET() {
  try {
    const comfyui = getComfyUIService();

    const [isAvailable, queueStatus, checkpoints] = await Promise.all([
      comfyui.isAvailable(),
      comfyui.getQueueStatus(),
      comfyui.getCheckpoints(),
    ]);

    return NextResponse.json({
      available: isAvailable,
      queue: queueStatus,
      checkpoints,
      model: 'sd3.5-medium',
      serverUrl: process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188',
    });
  } catch (error) {
    return NextResponse.json(
      { available: false, error: String(error) },
      { status: 500 }
    );
  }
}
