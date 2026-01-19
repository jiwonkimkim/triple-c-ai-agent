import {
    env,
    AutoTokenizer,
    AutoProcessor,
    CLIPTextModelWithProjection,
    CLIPVisionModelWithProjection,
    RawImage
} from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Configuration for local execution
env.allowLocalModels = false;
env.useBrowserCache = false;

const CLIP_MODEL_ID = 'Xenova/clip-vit-base-patch32';
const EMBEDDING_DIMENSION = 512;

// Singleton instances
let tokenizer: any = null;
let textModel: any = null;
let processor: any = null;
let visionModel: any = null;

async function loadTextModel() {
    if (!tokenizer || !textModel) {
        console.log('⏳ Loading local CLIP Text model...');
        tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID);
        textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, { quantized: true });
        console.log('✅ CLIP Text model loaded.');
    }
    return { tokenizer, textModel };
}

async function loadVisionModel() {
    if (!processor || !visionModel) {
        console.log('⏳ Loading local CLIP Vision model...');
        processor = await AutoProcessor.from_pretrained(CLIP_MODEL_ID);
        visionModel = await CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL_ID, { quantized: true });
        console.log('✅ CLIP Vision model loaded.');
    }
    return { processor, visionModel };
}

async function writeTempImage(buffer: Buffer): Promise<string> {
    const tempDir = os.tmpdir();
    // Simple random filename
    const filename = `clip_temp_${Date.now()}_${Math.random().toString(36).substring(7)}.png`; // Assume PNG or generally handled
    const filePath = path.join(tempDir, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
}

/**
 * Generate CLIP embedding for an image
 * @param imageInput - Image URL or Buffer
 */
export async function generateClipImageEmbedding(imageInput: string | Buffer): Promise<number[]> {
    let tempFilePath: string | null = null;

    try {
        const { processor, visionModel } = await loadVisionModel();

        let image: any;
        if (Buffer.isBuffer(imageInput)) {
            // Robust approach: Write to temp file and read
            tempFilePath = await writeTempImage(imageInput);
            image = await RawImage.read(tempFilePath);
        } else {
            image = await RawImage.read(imageInput);
        }

        const image_inputs = await processor(image);
        const { image_embeds } = await visionModel(image_inputs);

        // image_embeds is a Tensor [1, 512]
        return Array.from(image_embeds.data);
    } catch (error) {
        console.error('Error generating image embedding locally:', error);
        throw new Error(`Local CLIP (Image) error: ${error}`);
    } finally {
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
            } catch (e) {
                console.warn('Failed to cleanup temp file:', tempFilePath);
            }
        }
    }
}

/**
 * Generate CLIP embedding for text
 */
export async function generateClipTextEmbedding(text: string): Promise<number[]> {
    try {
        const { tokenizer, textModel } = await loadTextModel();

        const text_inputs = await tokenizer([text], { padding: true, truncation: true });
        const { text_embeds } = await textModel(text_inputs);

        // text_embeds is a Tensor [1, 512]
        return Array.from(text_embeds.data);
    } catch (error) {
        console.error('Error generating text embedding locally:', error);
        throw new Error(`Local CLIP (Text) error: ${error}`);
    }
}

export function getClipEmbeddingDimension(): number {
    return EMBEDDING_DIMENSION;
}
