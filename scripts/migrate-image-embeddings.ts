import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';
import { embedTemplates } from '../src/services/marketplace/template-embedding';

async function main() {
    console.log('=== Starting Image Embedding Migration ===');

    // 1. Fetch all published templates
    console.log('Fetching all published templates...');
    const templates = await prisma.template.findMany({
        where: { isPublished: true },
        select: { id: true, name: true, thumbnailUrl: true },
    });

    console.log(`Found ${templates.length} templates.`);

    // Filter templates that have a thumbnail (required for image embedding)
    const templatesWithThumbnail = templates.filter(t => t.thumbnailUrl);
    console.log(`${templatesWithThumbnail.length} templates have thumbnails.`);

    if (templatesWithThumbnail.length === 0) {
        console.log('No templates to process.');
        return;
    }

    const ids = templatesWithThumbnail.map(t => t.id);

    // 2. Process in batches
    // embedTemplates function in src/services/marketplace/template-embedding.ts
    // has been updated to generate CLIP image embeddings.
    // We can reuse it to update both text and image embeddings.

    console.log('Processing embeddings (Text + Image)...');
    const result = await embedTemplates(ids, {
        batchSize: 5, // Smaller batch size due to local model processing intensity
        onProgress: (count, total) => {
            console.log(`Progress: ${count}/${total} templates processed.`);
        },
    });

    console.log('\n=== Migration Complete ===');
    console.log(`Success: ${result.success}`);
    console.log(`Failed: ${result.failed.length}`);

    if (result.failed.length > 0) {
        console.log('Failed IDs:', result.failed);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
