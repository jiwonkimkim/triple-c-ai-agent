import { PrismaClient, TemplateCategory, TemplateCreator } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// SectionType as string literal (stored in JSON field)
type SectionType = 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo seller users for marketplace templates
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@demo.com' },
    update: {},
    create: {
      id: 'demo-seller-1',
      email: 'seller1@demo.com',
      name: '크리에이티브 스튜디오',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@demo.com' },
    update: {},
    create: {
      id: 'demo-seller-2',
      email: 'seller2@demo.com',
      name: '디자인 마스터',
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created demo seller accounts');

  // Create system templates
  const templates = [
    {
      name: 'Fashion Lookbook',
      category: TemplateCategory.FASHION,
      isReference: true,
      createdBy: 'SYSTEM' as const,
      sections: [
        {
          id: 'hero-1',
          type: 'HERO' as SectionType,
          title: 'New Collection',
          body: 'Discover the latest trends in fashion',
          order: 0,
        },
        {
          id: 'features-1',
          type: 'FEATURES' as SectionType,
          title: 'Key Features',
          body: 'Premium materials, Sustainable production, Modern design',
          order: 1,
        },
        {
          id: 'social-1',
          type: 'SOCIAL_PROOF' as SectionType,
          title: 'What Our Customers Say',
          body: 'Join thousands of satisfied customers',
          order: 2,
        },
        {
          id: 'faq-1',
          type: 'FAQ' as SectionType,
          title: 'Frequently Asked Questions',
          body: 'Everything you need to know',
          order: 3,
        },
      ],
    },
    {
      name: 'Food & Beverage',
      category: TemplateCategory.FOOD,
      isReference: true,
      createdBy: 'SYSTEM' as const,
      sections: [
        {
          id: 'hero-2',
          type: 'HERO' as SectionType,
          title: 'Taste the Difference',
          body: 'Fresh ingredients, authentic flavors',
          order: 0,
        },
        {
          id: 'features-2',
          type: 'FEATURES' as SectionType,
          title: 'Why Choose Us',
          body: 'Farm to table, No preservatives, Chef crafted',
          order: 1,
        },
        {
          id: 'howto-2',
          type: 'HOW_TO_USE' as SectionType,
          title: 'How to Enjoy',
          body: 'Step by step guide to the perfect experience',
          order: 2,
        },
        {
          id: 'social-2',
          type: 'SOCIAL_PROOF' as SectionType,
          title: 'Customer Reviews',
          body: 'See what food lovers are saying',
          order: 3,
        },
      ],
    },
    {
      name: 'Beauty & Skincare',
      category: TemplateCategory.BEAUTY,
      isReference: true,
      createdBy: 'SYSTEM' as const,
      sections: [
        {
          id: 'hero-3',
          type: 'HERO' as SectionType,
          title: 'Radiant Skin Starts Here',
          body: 'Science-backed skincare for visible results',
          order: 0,
        },
        {
          id: 'features-3',
          type: 'FEATURES' as SectionType,
          title: 'Key Ingredients',
          body: 'Hyaluronic acid, Vitamin C, Retinol',
          order: 1,
        },
        {
          id: 'howto-3',
          type: 'HOW_TO_USE' as SectionType,
          title: 'Application Guide',
          body: 'Morning and evening routine steps',
          order: 2,
        },
        {
          id: 'social-3',
          type: 'SOCIAL_PROOF' as SectionType,
          title: 'Before & After',
          body: 'Real results from real customers',
          order: 3,
        },
        {
          id: 'faq-3',
          type: 'FAQ' as SectionType,
          title: 'Skincare FAQ',
          body: 'Common questions answered',
          order: 4,
        },
      ],
    },
    {
      name: 'Digital Product',
      category: TemplateCategory.DIGITAL,
      isReference: true,
      createdBy: 'SYSTEM' as const,
      sections: [
        {
          id: 'hero-4',
          type: 'HERO' as SectionType,
          title: 'Transform Your Workflow',
          body: 'Powerful tools for modern professionals',
          order: 0,
        },
        {
          id: 'features-4',
          type: 'FEATURES' as SectionType,
          title: 'Core Features',
          body: 'AI-powered, Cloud sync, Team collaboration',
          order: 1,
        },
        {
          id: 'howto-4',
          type: 'HOW_TO_USE' as SectionType,
          title: 'Getting Started',
          body: 'Quick start guide in 3 easy steps',
          order: 2,
        },
        {
          id: 'social-4',
          type: 'SOCIAL_PROOF' as SectionType,
          title: 'Trusted by Teams',
          body: 'Used by over 10,000+ companies worldwide',
          order: 3,
        },
        {
          id: 'faq-4',
          type: 'FAQ' as SectionType,
          title: 'FAQ',
          body: 'Technical and billing questions',
          order: 4,
        },
      ],
    },
    {
      name: 'Generic Product',
      category: TemplateCategory.GENERIC,
      isReference: true,
      createdBy: 'SYSTEM' as const,
      sections: [
        {
          id: 'hero-5',
          type: 'HERO' as SectionType,
          title: 'Introducing Our Product',
          body: 'The solution you have been waiting for',
          order: 0,
        },
        {
          id: 'features-5',
          type: 'FEATURES' as SectionType,
          title: 'Features & Benefits',
          body: 'What makes us different',
          order: 1,
        },
        {
          id: 'social-5',
          type: 'SOCIAL_PROOF' as SectionType,
          title: 'Customer Testimonials',
          body: 'Hear from our happy customers',
          order: 2,
        },
        {
          id: 'faq-5',
          type: 'FAQ' as SectionType,
          title: 'Common Questions',
          body: 'Everything you need to know',
          order: 3,
        },
      ],
    },
  ];

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: template.name.toLowerCase().replace(/\s+/g, '-'),
        ...template,
      },
    });
  }

  console.log(`✅ Created ${templates.length} system templates`);

  // Create marketplace templates (published, with prices)
  const marketplaceTemplates = [
    {
      id: 'marketplace-fashion-premium',
      name: '프리미엄 패션 룩북',
      category: TemplateCategory.FASHION,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller1.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 15,
      description: '고급스러운 패션 브랜드를 위한 프리미엄 템플릿입니다. 미니멀한 디자인과 세련된 레이아웃으로 브랜드 가치를 높여줍니다.',
      tags: ['패션', '프리미엄', '룩북', '미니멀', '고급'],
      downloadCount: 128,
      rating: 4.8,
      ratingCount: 24,
      sections: [
        { id: 'mp-hero-1', type: 'HERO' as SectionType, title: '2024 S/S Collection', body: '새로운 시즌, 새로운 스타일을 만나보세요', order: 0 },
        { id: 'mp-features-1', type: 'FEATURES' as SectionType, title: '컬렉션 하이라이트', body: '이번 시즌의 핵심 아이템들', order: 1 },
        { id: 'mp-social-1', type: 'SOCIAL_PROOF' as SectionType, title: '스타일 인플루언서 PICK', body: '트렌드세터들의 선택', order: 2 },
        { id: 'mp-howto-1', type: 'HOW_TO_USE' as SectionType, title: '스타일링 가이드', body: '완벽한 룩을 완성하는 방법', order: 3 },
        { id: 'mp-faq-1', type: 'FAQ' as SectionType, title: '자주 묻는 질문', body: '사이즈, 배송, 반품 안내', order: 4 },
      ],
    },
    {
      id: 'marketplace-food-restaurant',
      name: '레스토랑 메뉴 쇼케이스',
      category: TemplateCategory.FOOD,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller1.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 10,
      description: '레스토랑과 카페를 위한 메뉴 소개 템플릿입니다. 음식 사진을 돋보이게 하는 레이아웃과 식욕을 자극하는 디자인.',
      tags: ['음식', '레스토랑', '메뉴', '카페', '맛집'],
      downloadCount: 256,
      rating: 4.9,
      ratingCount: 42,
      sections: [
        { id: 'mp-hero-2', type: 'HERO' as SectionType, title: '오늘의 특선 메뉴', body: '셰프가 엄선한 신선한 재료로 만든 요리', order: 0 },
        { id: 'mp-features-2', type: 'FEATURES' as SectionType, title: '시그니처 메뉴', body: '우리 레스토랑만의 특별한 맛', order: 1 },
        { id: 'mp-howto-2', type: 'HOW_TO_USE' as SectionType, title: '예약 안내', body: '특별한 날을 위한 프라이빗 다이닝', order: 2 },
        { id: 'mp-social-2', type: 'SOCIAL_PROOF' as SectionType, title: '고객 리뷰', body: '맛있는 경험을 나눠주세요', order: 3 },
      ],
    },
    {
      id: 'marketplace-beauty-skincare',
      name: '스킨케어 브랜드 런칭',
      category: TemplateCategory.BEAUTY,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller2.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 20,
      description: '스킨케어 및 뷰티 브랜드를 위한 프리미엄 템플릿. 성분 설명, 사용법, 비포&애프터를 효과적으로 보여줍니다.',
      tags: ['뷰티', '스킨케어', '화장품', '브랜드', '프리미엄'],
      downloadCount: 89,
      rating: 4.7,
      ratingCount: 18,
      sections: [
        { id: 'mp-hero-3', type: 'HERO' as SectionType, title: '피부가 달라지는 경험', body: '과학적으로 검증된 스킨케어 솔루션', order: 0 },
        { id: 'mp-features-3', type: 'FEATURES' as SectionType, title: '핵심 성분', body: '히알루론산, 나이아신아마이드, 레티놀의 시너지', order: 1 },
        { id: 'mp-howto-3', type: 'HOW_TO_USE' as SectionType, title: '사용 가이드', body: '아침/저녁 루틴별 사용법', order: 2 },
        { id: 'mp-social-3', type: 'SOCIAL_PROOF' as SectionType, title: '실제 사용 후기', body: '2주 후 달라진 피부를 확인하세요', order: 3 },
        { id: 'mp-faq-3', type: 'FAQ' as SectionType, title: 'FAQ', body: '성분, 사용법 관련 궁금증 해결', order: 4 },
      ],
    },
    {
      id: 'marketplace-digital-saas',
      name: 'SaaS 제품 랜딩페이지',
      category: TemplateCategory.DIGITAL,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller2.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 25,
      description: 'SaaS 및 디지털 제품을 위한 전환율 최적화 템플릿. CTA, 기능 소개, 가격 정책을 효과적으로 전달합니다.',
      tags: ['SaaS', '디지털', '랜딩페이지', '스타트업', 'B2B'],
      downloadCount: 167,
      rating: 4.6,
      ratingCount: 31,
      sections: [
        { id: 'mp-hero-4', type: 'HERO' as SectionType, title: '업무 생산성을 10배로', body: 'AI 기반 협업 툴로 팀의 잠재력을 끌어올리세요', order: 0 },
        { id: 'mp-features-4', type: 'FEATURES' as SectionType, title: '핵심 기능', body: '실시간 협업, AI 자동화, 통합 대시보드', order: 1 },
        { id: 'mp-howto-4', type: 'HOW_TO_USE' as SectionType, title: '시작하기', body: '3분 만에 팀 설정 완료', order: 2 },
        { id: 'mp-social-4', type: 'SOCIAL_PROOF' as SectionType, title: '10,000+ 팀이 선택', body: '글로벌 기업들의 신뢰', order: 3 },
        { id: 'mp-faq-4', type: 'FAQ' as SectionType, title: '요금제 & FAQ', body: '무료 체험부터 엔터프라이즈까지', order: 4 },
      ],
    },
    {
      id: 'marketplace-generic-minimal',
      name: '미니멀 제품 소개',
      category: TemplateCategory.GENERIC,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller1.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 0, // Free template
      description: '어떤 제품에도 어울리는 깔끔한 미니멀 템플릿입니다. 무료로 제공되며, 빠르게 시작하기 좋습니다.',
      tags: ['미니멀', '무료', '범용', '심플', '클린'],
      downloadCount: 512,
      rating: 4.5,
      ratingCount: 67,
      sections: [
        { id: 'mp-hero-5', type: 'HERO' as SectionType, title: '심플하게, 강력하게', body: '본질에 집중한 디자인', order: 0 },
        { id: 'mp-features-5', type: 'FEATURES' as SectionType, title: '특징', body: '핵심 기능만 담았습니다', order: 1 },
        { id: 'mp-social-5', type: 'SOCIAL_PROOF' as SectionType, title: '고객 후기', body: '실제 사용자들의 이야기', order: 2 },
      ],
    },
    {
      id: 'marketplace-fashion-streetwear',
      name: '스트릿웨어 브랜드',
      category: TemplateCategory.FASHION,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller2.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 12,
      description: '힙하고 트렌디한 스트릿웨어 브랜드를 위한 템플릿. 볼드한 타이포그래피와 다이내믹한 레이아웃.',
      tags: ['스트릿', '힙합', '패션', '영', '트렌디'],
      downloadCount: 94,
      rating: 4.4,
      ratingCount: 15,
      sections: [
        { id: 'mp-hero-6', type: 'HERO' as SectionType, title: 'DROP 24.01', body: '한정판 컬렉션이 공개됩니다', order: 0 },
        { id: 'mp-features-6', type: 'FEATURES' as SectionType, title: 'NEW ARRIVALS', body: '이번 주 신상품', order: 1 },
        { id: 'mp-social-6', type: 'SOCIAL_PROOF' as SectionType, title: 'STREET SNAP', body: '고객들의 스타일링', order: 2 },
        { id: 'mp-faq-6', type: 'FAQ' as SectionType, title: 'INFO', body: '사이즈 가이드 & 배송 정보', order: 3 },
      ],
    },
    {
      id: 'marketplace-food-delivery',
      name: '배달 음식 프로모션',
      category: TemplateCategory.FOOD,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller1.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 8,
      description: '배달 앱, 음식 프로모션에 최적화된 템플릿. 할인 정보와 메뉴를 임팩트 있게 전달합니다.',
      tags: ['배달', '프로모션', '할인', '음식', '이벤트'],
      downloadCount: 203,
      rating: 4.3,
      ratingCount: 28,
      sections: [
        { id: 'mp-hero-7', type: 'HERO' as SectionType, title: '첫 주문 50% 할인!', body: '지금 바로 주문하세요', order: 0 },
        { id: 'mp-features-7', type: 'FEATURES' as SectionType, title: '베스트 메뉴', body: '주문율 1위 메뉴 모음', order: 1 },
        { id: 'mp-howto-7', type: 'HOW_TO_USE' as SectionType, title: '주문 방법', body: '간편한 3단계 주문', order: 2 },
        { id: 'mp-social-7', type: 'SOCIAL_PROOF' as SectionType, title: '리뷰', body: '평점 4.9점의 비결', order: 3 },
      ],
    },
    {
      id: 'marketplace-digital-app',
      name: '모바일 앱 소개',
      category: TemplateCategory.DIGITAL,
      isReference: false,
      createdBy: 'USER' as const,
      userId: seller2.id,
      isPublished: true,
      publishedAt: new Date(),
      price: 18,
      description: '모바일 앱 출시 및 프로모션을 위한 템플릿. 앱 스크린샷과 기능을 매력적으로 소개합니다.',
      tags: ['앱', '모바일', 'iOS', 'Android', '출시'],
      downloadCount: 145,
      rating: 4.7,
      ratingCount: 22,
      sections: [
        { id: 'mp-hero-8', type: 'HERO' as SectionType, title: '손 안의 모든 것', body: '지금 앱스토어에서 다운로드하세요', order: 0 },
        { id: 'mp-features-8', type: 'FEATURES' as SectionType, title: '주요 기능', body: '직관적인 UI, 빠른 성능, 오프라인 지원', order: 1 },
        { id: 'mp-howto-8', type: 'HOW_TO_USE' as SectionType, title: '사용 가이드', body: '앱 시작하기', order: 2 },
        { id: 'mp-social-8', type: 'SOCIAL_PROOF' as SectionType, title: '앱스토어 리뷰', body: '★★★★★ 4.8점', order: 3 },
        { id: 'mp-faq-8', type: 'FAQ' as SectionType, title: 'FAQ', body: '자주 묻는 질문', order: 4 },
      ],
    },
  ];

  for (const template of marketplaceTemplates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        isPublished: template.isPublished,
        publishedAt: template.publishedAt,
        price: template.price,
        description: template.description,
        tags: template.tags,
        downloadCount: template.downloadCount,
        rating: template.rating,
        ratingCount: template.ratingCount,
      },
      create: template,
    });
  }

  console.log(`✅ Created ${marketplaceTemplates.length} marketplace templates`);

  // Create seller balances for demo sellers
  await prisma.sellerBalance.upsert({
    where: { userId: seller1.id },
    update: {},
    create: {
      userId: seller1.id,
      availableCredits: 350,
      totalEarned: 520,
      totalWithdrawn: 170,
    },
  });

  await prisma.sellerBalance.upsert({
    where: { userId: seller2.id },
    update: {},
    create: {
      userId: seller2.id,
      availableCredits: 280,
      totalEarned: 410,
      totalWithdrawn: 130,
    },
  });

  console.log('✅ Created seller balances');

  // Seed Oliveyoung reference templates
  await seedOliveyoungTemplates();

  console.log('🎉 Seeding completed!');
}

/**
 * Oliveyoung 참조 템플릿 시드
 */
async function seedOliveyoungTemplates() {
  const templatesDir = path.join(process.cwd(), 'public/templates/oliveyoung');

  // 템플릿 폴더가 없으면 스킵
  if (!fs.existsSync(templatesDir)) {
    console.log('⏭️ Oliveyoung templates directory not found, skipping...');
    return;
  }

  const productFolders = fs.readdirSync(templatesDir).filter(f => {
    const stat = fs.statSync(path.join(templatesDir, f));
    return stat.isDirectory();
  });

  console.log(`📦 Found ${productFolders.length} Oliveyoung product folders`);

  for (const folder of productFolders) {
    const folderPath = path.join(templatesDir, folder);

    // JSON 파일 찾기
    const jsonFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) {
      console.log(`⏭️ No JSON file in ${folder}, skipping...`);
      continue;
    }

    const jsonPath = path.join(folderPath, jsonFiles[0]);
    const ocrData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const productCode = ocrData.product_code;
    const templateId = `oliveyoung-${productCode}`;
    const basePath = `/templates/oliveyoung/${folder}`;

    // 이미지 파일 목록
    const imageFiles = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
      .filter(f => !f.includes('detail_page'));

    const mainImage = imageFiles.find(f => f.startsWith('main'));
    const detailImages = imageFiles
      .filter(f => f.startsWith('detail_'))
      .sort();

    // thumbnailUrl
    const thumbnailUrl = mainImage ? `${basePath}/${mainImage}` : null;

    // previewImages
    const previewImages = detailImages.map(img => `${basePath}/${img}`);

    // sections from OCR data
    const sections = ocrData.images
      ?.filter((img: any) => img.image.startsWith('detail_') && img.image.endsWith('.jpg'))
      .sort((a: any, b: any) => a.image.localeCompare(b.image))
      .map((img: any, index: number) => ({
        id: `section_${index + 1}`,
        type: index === 0 ? 'HERO' : 'FEATURES',
        imageUrl: `${basePath}/${img.image}`,
        ocrText: img.ocr_text || '',
        description: img.description || '',
        prompt: img.prompt || '',
      })) || [];

    // 제품 설명 생성 (OCR 데이터에서 추출)
    const firstSection = ocrData.images?.find((img: any) => img.image === 'detail_002.jpg');
    const description = firstSection?.ocr_text?.split('\n').slice(0, 2).join(' ') ||
      `${ocrData.brand} ${ocrData.name}`;

    try {
      await prisma.template.upsert({
        where: { id: templateId },
        update: {
          thumbnailUrl,
          previewImages,
          sections,
          description,
        },
        create: {
          id: templateId,
          name: `[${ocrData.brand}] ${ocrData.name}`,
          category: TemplateCategory.BEAUTY,
          thumbnailUrl,
          previewImages,
          sections,
          isReference: true,
          createdBy: TemplateCreator.SYSTEM,
          isPublished: true,
          publishedAt: new Date(),
          price: 0,
          description,
          tags: [ocrData.brand, '올리브영', 'K-뷰티', '참조템플릿'],
          downloadCount: 0,
          ratingCount: 0,
        },
      });

      console.log(`✅ Seeded: [${ocrData.brand}] ${ocrData.name}`);
    } catch (error) {
      console.error(`❌ Failed to seed ${folder}:`, error);
    }
  }

  console.log('✅ Oliveyoung templates seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
