/**
 * ComfyUI API Service for Stable Diffusion image generation
 * Local ComfyUI server integration for Triple C
 */

export interface ComfyUIConfig {
  baseUrl: string;
  clientId: string;
}

export type ModelType = 'sd35-medium' | 'flux-schnell' | 'sdxl-base';

export interface GenerateOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  sampler?: string;
  model?: ModelType;
}

// Backwards compatibility
export type SD35GenerateOptions = GenerateOptions;

export interface ComfyUIGenerateResult {
  success: boolean;
  imageUrl?: string;
  filename?: string;
  promptId?: string;
  error?: string;
  executionTime?: number;
}

const DEFAULT_CONFIG: ComfyUIConfig = {
  baseUrl: process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188',
  clientId: 'triple-c',
};

export class ComfyUIService {
  private config: ComfyUIConfig;

  constructor(config: Partial<ComfyUIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if ComfyUI server is running
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/system_stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{ running: number; pending: number }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/queue`);
      const data = await response.json();
      return {
        running: data.queue_running?.length || 0,
        pending: data.queue_pending?.length || 0,
      };
    } catch {
      return { running: 0, pending: 0 };
    }
  }

  /**
   * Build Flux.1 Schnell workflow
   */
  private buildFluxSchnellWorkflow(options: GenerateOptions): Record<string, any> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      steps = 4, // Flux Schnell only needs 4 steps
      seed = Math.floor(Math.random() * 2147483647),
    } = options;

    return {
      '1': {
        class_type: 'UNETLoader',
        inputs: {
          unet_name: 'flux1-schnell.safetensors',
          weight_dtype: 'fp8_e4m3fn',
        },
      },
      '2': {
        class_type: 'DualCLIPLoader',
        inputs: {
          clip_name1: 'clip_l.safetensors',
          clip_name2: 't5xxl_fp8_e4m3fn.safetensors',
          type: 'flux',
        },
      },
      '3': {
        class_type: 'VAELoader',
        inputs: {
          vae_name: 'ae.safetensors',
        },
      },
      '4': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: prompt,
          clip: ['2', 0],
        },
      },
      '5': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width,
          height,
          batch_size: 1,
        },
      },
      '6': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg: 1, // Flux Schnell uses CFG 1
          sampler_name: 'euler',
          scheduler: 'simple',
          denoise: 1,
          model: ['1', 0],
          positive: ['4', 0],
          negative: ['4', 0], // Flux doesn't use negative prompt
          latent_image: ['5', 0],
        },
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['6', 0],
          vae: ['3', 0],
        },
      },
      '8': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'flux_schnell',
          images: ['7', 0],
        },
      },
    };
  }

  /**
   * Build SD 3.5 Medium workflow
   */
  private buildSD35Workflow(options: GenerateOptions): Record<string, any> {
    const {
      prompt,
      negativePrompt = '',
      width = 1024,
      height = 1024,
      steps = 28,
      cfg = 4.5,
      seed = Math.floor(Math.random() * 2147483647),
      sampler = 'euler',
    } = options;

    return {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'sd3.5_medium.safetensors',
        },
      },
      '2': {
        class_type: 'TripleCLIPLoader',
        inputs: {
          clip_name1: 'clip_l.safetensors',
          clip_name2: 'clip_g.safetensors',
          clip_name3: 't5xxl_fp8_e4m3fn.safetensors',
        },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: prompt,
          clip: ['2', 0],
        },
      },
      '4': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: negativePrompt,
          clip: ['2', 0],
        },
      },
      '5': {
        class_type: 'EmptySD3LatentImage',
        inputs: {
          width,
          height,
          batch_size: 1,
        },
      },
      '6': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg,
          sampler_name: sampler,
          scheduler: 'normal',
          denoise: 1,
          model: ['1', 0],
          positive: ['3', 0],
          negative: ['4', 0],
          latent_image: ['5', 0],
        },
      },
      '7': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['6', 0],
          vae: ['1', 2],
        },
      },
      '8': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'triple_c',
          images: ['7', 0],
        },
      },
    };
  }

  /**
   * Build SDXL Base workflow
   */
  private buildSDXLBaseWorkflow(options: GenerateOptions): Record<string, any> {
    const {
      prompt,
      negativePrompt = '',
      width = 1024,
      height = 1024,
      steps = 25,
      cfg = 7.0,
      seed = Math.floor(Math.random() * 2147483647),
      sampler = 'euler_ancestral',
    } = options;

    return {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'sd_xl_base_1.0.safetensors',
        },
      },
      '2': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: prompt,
          clip: ['1', 1],
        },
      },
      '3': {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: negativePrompt,
          clip: ['1', 1],
        },
      },
      '4': {
        class_type: 'EmptyLatentImage',
        inputs: {
          width,
          height,
          batch_size: 1,
        },
      },
      '5': {
        class_type: 'KSampler',
        inputs: {
          seed,
          steps,
          cfg,
          sampler_name: sampler,
          scheduler: 'normal',
          denoise: 1,
          model: ['1', 0],
          positive: ['2', 0],
          negative: ['3', 0],
          latent_image: ['4', 0],
        },
      },
      '6': {
        class_type: 'VAEDecode',
        inputs: {
          samples: ['5', 0],
          vae: ['1', 2],
        },
      },
      '7': {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: 'sdxl_base',
          images: ['6', 0],
        },
      },
    };
  }

  /**
   * Submit prompt to ComfyUI and wait for completion
   */
  async generate(options: GenerateOptions): Promise<ComfyUIGenerateResult> {
    const startTime = Date.now();
    const model = options.model || 'sd35-medium';

    try {
      // Check if server is available
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'ComfyUI server is not available. Please start the server first.',
        };
      }

      // Build workflow based on model selection
      let workflow: Record<string, any>;
      switch (model) {
        case 'flux-schnell':
          workflow = this.buildFluxSchnellWorkflow(options);
          break;
        case 'sdxl-base':
          workflow = this.buildSDXLBaseWorkflow(options);
          break;
        default:
          workflow = this.buildSD35Workflow(options);
      }

      const response = await fetch(`${this.config.baseUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: workflow,
          client_id: this.config.clientId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ComfyUI API error: ${response.status} - ${errorText}`);
      }

      const { prompt_id } = await response.json();

      // Poll for completion
      const result = await this.waitForCompletion(prompt_id);

      const executionTime = Date.now() - startTime;

      if (result.success && result.filename) {
        // Get the image as base64
        const imageData = await this.getImage(result.filename);

        return {
          success: true,
          imageUrl: imageData,
          filename: result.filename,
          promptId: prompt_id,
          executionTime,
        };
      }

      return {
        success: false,
        error: result.error || 'Unknown error during generation',
        promptId: prompt_id,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Wait for prompt execution to complete
   */
  private async waitForCompletion(
    promptId: string,
    timeout: number = 1800000 // 30 minutes max (SD 3.5는 이미지당 4-5분, 큐잉 고려)
  ): Promise<{ success: boolean; filename?: string; error?: string }> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.config.baseUrl}/history/${promptId}`);
        const history = await response.json();

        if (history[promptId]) {
          const result = history[promptId];

          // Check for errors
          if (result.status?.status_str === 'error') {
            return {
              success: false,
              error: result.status?.messages?.[0]?.[1] || 'Execution error',
            };
          }

          // Check for completion
          if (result.outputs) {
            // Find the SaveImage node output
            for (const nodeId in result.outputs) {
              const output = result.outputs[nodeId];
              if (output.images && output.images.length > 0) {
                return {
                  success: true,
                  filename: output.images[0].filename,
                };
              }
            }
          }
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('Error polling ComfyUI:', error);
      }
    }

    return {
      success: false,
      error: 'Generation timeout',
    };
  }

  /**
   * Get generated image as base64 data URL
   */
  async getImage(filename: string): Promise<string> {
    const response = await fetch(
      `${this.config.baseUrl}/view?filename=${encodeURIComponent(filename)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';

    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Get list of available checkpoints
   */
  async getCheckpoints(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/object_info/CheckpointLoaderSimple`);
      const data = await response.json();
      return data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
    } catch {
      return [];
    }
  }
}

// Singleton instance
let comfyuiService: ComfyUIService | null = null;

export function getComfyUIService(): ComfyUIService {
  if (!comfyuiService) {
    comfyuiService = new ComfyUIService();
  }
  return comfyuiService;
}
