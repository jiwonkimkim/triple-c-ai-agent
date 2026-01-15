// Test script for bge-m3 embedding model
// Run: npx ts-node scripts/test-bge-m3.ts

const BGE_M3_URL = 'https://router.huggingface.co/hf-inference/models/BAAI/bge-m3';
const BGE_LARGE_URL = 'https://router.huggingface.co/hf-inference/models/BAAI/bge-large-en-v1.5';

async function testModel(modelName: string, url: string) {
  console.log(`\n🔍 Testing ${modelName}...`);

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    console.error('❌ HUGGINGFACE_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: '한국어 테스트 문장입니다. This is a test sentence.',
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ ${modelName} failed:`, error);
      return null;
    }

    const result = await response.json();

    // Get embedding array
    let embedding: number[];
    if (Array.isArray(result) && Array.isArray(result[0])) {
      embedding = result[0];
    } else if (Array.isArray(result)) {
      embedding = result;
    } else {
      console.error(`❌ Unexpected response format:`, typeof result);
      return null;
    }

    console.log(`✅ ${modelName} works!`);
    console.log(`   Dimension: ${embedding.length}`);
    console.log(`   Sample values: [${embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}, ...]`);

    return embedding.length;
  } catch (error) {
    console.error(`❌ ${modelName} error:`, error);
    return null;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('Embedding Model Test');
  console.log('='.repeat(50));

  // Test bge-m3 first
  const m3Dim = await testModel('bge-m3', BGE_M3_URL);

  // Test bge-large as fallback
  const largeDim = await testModel('bge-large-en-v1.5', BGE_LARGE_URL);

  console.log('\n' + '='.repeat(50));
  console.log('Summary');
  console.log('='.repeat(50));

  if (m3Dim) {
    console.log(`✅ bge-m3 사용 가능 (${m3Dim}차원) - 한국어 최적!`);
  } else if (largeDim) {
    console.log(`⚠️  bge-m3 안됨, bge-large 사용 가능 (${largeDim}차원)`);
  } else {
    console.log('❌ 두 모델 모두 실패');
  }
}

main();
