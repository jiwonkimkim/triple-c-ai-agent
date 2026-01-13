require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const projectId = 'cmkalf2py000110w15tugnn5z';

// Section type to Korean name mapping
const sectionTypeNames = {
  MAIN: '메인',
  HERO: '히어로',
  FEATURES: '제품 특징',
  SOCIAL_PROOF: '고객 후기',
  HOW_TO_USE: '사용 방법',
  FAQ: 'FAQ',
  LIFESTYLE: '라이프스타일',
  CTA: '구매하기',
  CUSTOM: '커스텀',
};

// Convert AI sections to editor format
function convertAIToEditorFormat(aiSections) {
  const editorSections = [];

  for (const section of aiSections) {
    const overlayTexts = [];
    let zIndex = 1;

    const sectionType = section.type;
    const isMain = sectionType === 'MAIN';

    const textPosition = isMain ? {
      headline: { x: 5, y: 8, align: 'left' },
      body: { x: 5, y: 22, align: 'left' },
    } : {
      headline: { x: 50, y: 5, align: 'center' },
      body: { x: 50, y: 92, align: 'center' },
    };

    // AI overlay text
    const aiOverlayText = section.overlayText;

    if (aiOverlayText) {
      // headline
      const headlineData = typeof aiOverlayText.headline === 'string'
        ? { text: aiOverlayText.headline }
        : aiOverlayText.headline;
      if (headlineData?.text || section.title) {
        overlayTexts.push({
          id: `${section.id}-headline`,
          type: 'headline',
          content: headlineData?.text || section.title || '',
          style: {
            x: headlineData?.x ?? textPosition.headline.x,
            y: headlineData?.y ?? textPosition.headline.y,
            fontSize: headlineData?.fontSize ?? (isMain ? 32 : 28),
            fontWeight: headlineData?.fontWeight ?? 'bold',
            fontFamily: headlineData?.fontFamily ?? 'Pretendard, sans-serif',
            color: headlineData?.color ?? '#ffffff',
            textShadow: true,
            textAlign: headlineData?.textAlign ?? textPosition.headline.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      // subheadline
      const subheadlineData = typeof aiOverlayText.subheadline === 'string'
        ? { text: aiOverlayText.subheadline }
        : aiOverlayText.subheadline;
      if (subheadlineData?.text) {
        overlayTexts.push({
          id: `${section.id}-subheadline`,
          type: 'subheadline',
          content: subheadlineData.text,
          style: {
            x: subheadlineData.x ?? textPosition.body.x,
            y: subheadlineData.y ?? (textPosition.headline.y + 12),
            fontSize: subheadlineData.fontSize ?? (isMain ? 18 : 16),
            fontWeight: subheadlineData.fontWeight ?? 'medium',
            fontFamily: subheadlineData.fontFamily ?? 'Pretendard, sans-serif',
            color: subheadlineData.color ?? '#ffffff',
            textShadow: true,
            textAlign: subheadlineData.textAlign ?? textPosition.body.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 70,
          },
          zIndex: zIndex++,
        });
      }

      // body
      const bodyData = typeof aiOverlayText.body === 'string'
        ? { text: aiOverlayText.body }
        : aiOverlayText.body;
      const bodyText = bodyData?.text || (section.body ? (Array.isArray(section.body) ? section.body.join('\n') : String(section.body)) : null);
      if (bodyText) {
        overlayTexts.push({
          id: `${section.id}-body`,
          type: 'body',
          content: bodyText,
          style: {
            x: bodyData?.x ?? textPosition.body.x,
            y: bodyData?.y ?? (isMain ? 40 : 85),
            fontSize: bodyData?.fontSize ?? 14,
            fontWeight: bodyData?.fontWeight ?? 'normal',
            fontFamily: bodyData?.fontFamily ?? 'Pretendard, sans-serif',
            color: bodyData?.color ?? '#ffffff',
            textShadow: true,
            textAlign: bodyData?.textAlign ?? textPosition.body.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      // statistics
      if (aiOverlayText.statistics && aiOverlayText.statistics.length > 0) {
        aiOverlayText.statistics.forEach((stat, idx) => {
          const statData = typeof stat === 'string' ? { text: stat } : stat;
          overlayTexts.push({
            id: `${section.id}-stat-${idx}`,
            type: 'statistic',
            content: statData.text || '',
            style: {
              x: statData.x ?? 50,
              y: statData.y ?? (50 + (idx * 15)),
              fontSize: statData.fontSize ?? 48,
              fontWeight: statData.fontWeight ?? 'bold',
              fontFamily: statData.fontFamily ?? 'Montserrat, sans-serif',
              color: statData.color ?? '#ffffff',
              textShadow: true,
              textAlign: 'center',
              opacity: 100,
              rotation: 0,
            },
            zIndex: zIndex++,
          });
        });
      }

      // cta
      const ctaData = typeof aiOverlayText.cta === 'string'
        ? { text: aiOverlayText.cta }
        : aiOverlayText.cta;
      if (ctaData?.text) {
        overlayTexts.push({
          id: `${section.id}-cta`,
          type: 'cta',
          content: ctaData.text,
          style: {
            x: ctaData.x ?? 50,
            y: ctaData.y ?? 90,
            fontSize: ctaData.fontSize ?? 16,
            fontWeight: ctaData.fontWeight ?? 'semibold',
            fontFamily: ctaData.fontFamily ?? 'Pretendard, sans-serif',
            color: ctaData.color ?? '#ffffff',
            textShadow: true,
            textAlign: 'center',
            opacity: 100,
            rotation: 0,
          },
          zIndex: zIndex++,
        });
      }
    } else {
      // Fallback: use section.title and section.body
      if (section.title) {
        overlayTexts.push({
          id: `${section.id}-title`,
          type: 'headline',
          content: section.title,
          style: {
            x: textPosition.headline.x,
            y: textPosition.headline.y,
            fontSize: isMain ? 32 : 28,
            fontWeight: 'bold',
            fontFamily: 'Pretendard, sans-serif',
            color: '#ffffff',
            textShadow: true,
            textAlign: textPosition.headline.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }

      if (section.body) {
        const bodyText = Array.isArray(section.body) ? section.body.join('\n') : String(section.body);
        overlayTexts.push({
          id: `${section.id}-body`,
          type: 'body',
          content: bodyText,
          style: {
            x: textPosition.body.x,
            y: isMain ? 40 : 85,
            fontSize: 14,
            fontWeight: 'normal',
            fontFamily: 'Pretendard, sans-serif',
            color: '#ffffff',
            textShadow: true,
            textAlign: textPosition.body.align,
            opacity: 100,
            rotation: 0,
            width: isMain ? 35 : 80,
          },
          zIndex: zIndex++,
        });
      }
    }

    // Skip if no image
    if (!section.imageUrl && (!section.imageUrls || section.imageUrls.length === 0)) {
      continue;
    }

    const sectionName = sectionTypeNames[section.type] || section.title || '섹션';
    const images = section.imageUrls && section.imageUrls.length > 0
      ? section.imageUrls
      : section.imageUrl ? [section.imageUrl] : [''];

    const blocks = images.map((imageUrl, imgIndex) => ({
      id: `${section.id}-img-${imgIndex}`,
      type: 'image-overlay',
      src: imageUrl,
      alt: `${section.title || 'Section image'} ${imgIndex + 1}`,
      overlayTexts: imgIndex === 0 ? overlayTexts : [],
      overlayGradient: undefined,
    }));

    editorSections.push({
      id: `section-${section.id}`,
      name: `${sectionName}${images.length > 1 ? ` (${images.length}장)` : ''}`,
      blocks,
    });
  }

  return editorSections;
}

async function forceRestoreV29() {
  console.log('Starting force restore of version 29...');

  // Get version 29
  const v29 = await prisma.projectVersion.findFirst({
    where: { projectId, versionNumber: 29 },
  });

  if (!v29) {
    console.error('Version 29 not found!');
    return;
  }

  console.log('Found version 29:', v29.id);

  const content = v29.content;
  if (!content || !content.sections) {
    console.error('Version 29 has no content.sections!');
    return;
  }

  console.log('Converting', content.sections.length, 'AI sections to editor format...');

  // Convert to editor format
  const editorSections = convertAIToEditorFormat(content.sections);
  console.log('Converted to', editorSections.length, 'editor sections');

  // Get latest version numbers
  const latestProjectVersion = await prisma.projectVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });
  const latestDetailVersion = await prisma.detailPageVersion.findFirst({
    where: { projectId },
    orderBy: { versionNumber: 'desc' },
  });

  const newProjectVersionNumber = (latestProjectVersion?.versionNumber || 0) + 1;
  const newDetailVersionNumber = (latestDetailVersion?.versionNumber || 0) + 1;

  console.log('Creating new ProjectVersion:', newProjectVersionNumber);
  console.log('Creating new DetailPageVersion:', newDetailVersionNumber);

  // Create new ProjectVersion
  const newProjectVersion = await prisma.projectVersion.create({
    data: {
      projectId,
      versionNumber: newProjectVersionNumber,
      action: 'RESTORE',
      description: 'v29에서 강제 복원 (에디터 포맷 변환)',
      content: { sections: editorSections, devPrompts: content.devPrompts, hookMessage: content.hookMessage },
      createdById: 'cmjtry0ta0000at4rino267bb', // project owner
    },
  });

  // Create new DetailPageVersion with converted content
  const newDetailVersion = await prisma.detailPageVersion.create({
    data: {
      projectId,
      versionNumber: newDetailVersionNumber,
      contentJson: editorSections,
      status: 'DRAFT',
    },
  });

  // Update project's current version
  await prisma.project.update({
    where: { id: projectId },
    data: {
      content: { sections: editorSections, devPrompts: content.devPrompts, hookMessage: content.hookMessage },
      currentVersion: newProjectVersionNumber,
      updatedAt: new Date(),
    },
  });

  console.log('');
  console.log('=== Force Restore Complete ===');
  console.log('New ProjectVersion:', newProjectVersion.id, '(v' + newProjectVersionNumber + ')');
  console.log('New DetailPageVersion:', newDetailVersion.id, '(v' + newDetailVersionNumber + ')');
  console.log('');
  console.log('Please refresh the page to see the restored content.');
}

forceRestoreV29().catch(console.error).finally(() => prisma.$disconnect());
