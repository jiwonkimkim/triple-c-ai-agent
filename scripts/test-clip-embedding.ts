import { generateClipTextEmbedding, generateClipImageEmbedding } from '../src/services/rag/image-embeddings';

async function main() {
    console.log('=== Testing Local CLIP Embedding Service (Transformers.js) ===');

    // 1. Test Text Embedding
    console.log('\n1. Testing Text Retrieval (Text-to-Image style)...');
    try {
        const textQuery = 'A modern minimalist business presentation';
        console.log(`Query: "${textQuery}"`);
        console.log('Generating embedding locally...');
        const textEmb = await generateClipTextEmbedding(textQuery);
        console.log(`✅ Success! Embedding dimension: ${textEmb.length}`);

        if (textEmb.length !== 512) {
            console.error('❌ Error: Expected 512 dimensions');
        }
    } catch (e) {
        console.error('❌ Failed:', e);
    }

    // 2. Test Image Embedding
    console.log('\n2. Testing Image Retrieval (Image-to-Image)...');
    try {
        // 1x1 pixel red PNG
        const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
        const buffer = Buffer.from(base64Image, 'base64');

        console.log('Input: 1x1 Pixel Red PNG (Buffer)');
        console.log('Generating embedding locally...');
        const imgEmb = await generateClipImageEmbedding(buffer);
        console.log(`✅ Success! Embedding dimension: ${imgEmb.length}`);

        if (imgEmb.length !== 512) {
            console.error('❌ Error: Expected 512 dimensions');
        }
    } catch (e) {
        console.error('❌ Failed:', e);
    }
}

main();
