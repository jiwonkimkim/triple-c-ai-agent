import { PrismaClient, TemplateCategory } from '@prisma/client';

const prisma = new PrismaClient();

// SectionType as string literal (stored in JSON field)
type SectionType = 'HERO' | 'FEATURES' | 'SOCIAL_PROOF' | 'HOW_TO_USE' | 'FAQ' | 'CUSTOM';

async function main() {
  console.log('🌱 Seeding database...');

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
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
