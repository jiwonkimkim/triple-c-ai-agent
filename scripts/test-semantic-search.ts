/**
 * Test script for semantic search functionality
 * Run with: npx tsx scripts/test-semantic-search.ts
 */

import { prisma } from '../src/lib/prisma';
import { embedTemplate, buildTemplateSearchText } from '../src/services/marketplace/template-embedding';
import { semanticSearchTemplates, findSimilarTemplates } from '../src/services/marketplace/template-search';

async function main() {
  console.log('=== Semantic Search Test ===\n');

  // 1. Check templates
  console.log('1. Checking templates...');
  const templates = await prisma.template.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      name: true,
      description: true,
      tags: true,
      category: true,
    },
  });
  console.log(`   Found ${templates.length} published templates\n`);

  if (templates.length === 0) {
    console.log('   No published templates found. Exiting.');
    return;
  }

  // 2. Generate embeddings
  console.log('2. Generating embeddings...');
  for (const template of templates) {
    console.log(`   - ${template.name}`);
    const searchText = buildTemplateSearchText(template);
    console.log(`     Search text: ${searchText.substring(0, 100)}...`);

    try {
      await embedTemplate(template.id);
      console.log(`     ✓ Embedding created`);
    } catch (error) {
      console.log(`     ✗ Failed: ${error}`);
    }
  }
  console.log();

  // 3. Verify embeddings
  console.log('3. Verifying embeddings...');
  const embeddedCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM templates WHERE embedding IS NOT NULL
  `;
  console.log(`   ${embeddedCount[0].count} templates have embeddings\n`);

  // 4. Test semantic search
  console.log('4. Testing semantic search...');
  const testQueries = ['립스틱', '메이크업', '뷰티', '화장품'];

  for (const query of testQueries) {
    console.log(`\n   Query: "${query}"`);
    try {
      const results = await semanticSearchTemplates({
        query,
        limit: 3,
        minSimilarity: 0.1,
      });
      console.log(`   Found ${results.total} results`);
      results.templates.forEach((t, i) => {
        console.log(`     ${i + 1}. ${t.name} (similarity: ${t.similarity.toFixed(4)})`);
      });
    } catch (error) {
      console.log(`   Error: ${error}`);
    }
  }

  // 5. Test similar templates
  if (templates.length > 0) {
    console.log('\n5. Testing similar templates...');
    const firstTemplate = templates[0];
    console.log(`   Finding templates similar to: ${firstTemplate.name}`);
    try {
      const similar = await findSimilarTemplates(firstTemplate.id, 3);
      console.log(`   Found ${similar.length} similar templates`);
      similar.forEach((t, i) => {
        console.log(`     ${i + 1}. ${t.name} (similarity: ${t.similarity.toFixed(4)})`);
      });
    } catch (error) {
      console.log(`   Error: ${error}`);
    }
  }

  console.log('\n=== Test Complete ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
