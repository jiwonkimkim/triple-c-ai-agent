import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import type { Section, EditorBlock } from '@/stores/editor-store';

export const dynamic = 'force-dynamic';

const exportSchema = z.object({
  sections: z.array(z.any()),
  format: z.enum(['html', 'json']),
});

// POST /api/projects/[id]/export - Export detail page
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id,
      },
      include: {
        brandProfile: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sections, format } = exportSchema.parse(body);

    if (format === 'html') {
      const html = generateHTML(sections as Section[], {
        title: project.title,
        brandName: project.brandProfile?.name,
      });

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="detail-page-${projectId}.html"`,
        },
      });
    } else {
      return new NextResponse(JSON.stringify(sections, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="detail-page-${projectId}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export' },
      { status: 500 }
    );
  }
}

function generateHTML(
  sections: Section[],
  options: { title?: string; brandName?: string }
): string {
  const { title = 'Product Detail Page', brandName } = options;

  const renderBlock = (block: EditorBlock): string => {
    switch (block.type) {
      case 'heading':
        const headingTag = `h${block.level}`;
        const headingClass = {
          1: 'text-4xl font-bold mb-4',
          2: 'text-3xl font-bold mb-3',
          3: 'text-2xl font-semibold mb-3',
          4: 'text-xl font-semibold mb-2',
        }[block.level];
        return `<${headingTag} class="${headingClass}">${escapeHtml(block.content)}</${headingTag}>`;

      case 'text':
        const textStyles = [];
        if (block.style?.textAlign) textStyles.push(`text-align: ${block.style.textAlign}`);
        if (block.style?.fontSize) textStyles.push(`font-size: ${getFontSize(block.style.fontSize)}`);
        const textStyle = textStyles.length ? ` style="${textStyles.join('; ')}"` : '';
        return `<p class="mb-4 leading-relaxed"${textStyle}>${escapeHtml(block.content)}</p>`;

      case 'image':
        const imgCaption = block.caption
          ? `<figcaption class="text-center text-sm text-gray-600 mt-2">${escapeHtml(block.caption)}</figcaption>`
          : '';
        return `
          <figure class="mb-6">
            <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" class="w-full rounded-lg shadow-md" />
            ${imgCaption}
          </figure>
        `;

      case 'button':
        const btnClass = {
          primary: 'bg-blue-600 text-white hover:bg-blue-700',
          secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
          outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
        }[block.variant];
        const href = block.url ? ` href="${escapeHtml(block.url)}"` : '';
        return `<a${href} class="inline-block px-6 py-3 rounded-lg font-medium transition-colors ${btnClass}">${escapeHtml(block.text)}</a>`;

      case 'divider':
        return '<hr class="my-8 border-t border-gray-300" />';

      case 'spacer':
        return `<div style="height: ${block.height}px"></div>`;

      case 'list':
        const listTag = block.listType === 'bullet' ? 'ul' : 'ol';
        const listClass = block.listType === 'bullet' ? 'list-disc' : 'list-decimal';
        const listItems = block.items
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('\n');
        return `<${listTag} class="${listClass} ml-6 mb-4 space-y-1">\n${listItems}\n</${listTag}>`;

      case 'quote':
        const author = block.author
          ? `<footer class="mt-2 text-sm text-gray-600">— ${escapeHtml(block.author)}</footer>`
          : '';
        return `
          <blockquote class="border-l-4 border-blue-500 pl-4 py-2 mb-4 italic text-lg">
            <p>"${escapeHtml(block.content)}"</p>
            ${author}
          </blockquote>
        `;

      case 'image-overlay':
        const overlayTextsHtml = block.overlayTexts
          .map((text) => {
            const textStyles = [
              `position: absolute`,
              `left: ${text.style.x}%`,
              `top: ${text.style.y}%`,
              `transform: translate(-50%, -50%)${text.style.rotation ? ` rotate(${text.style.rotation}deg)` : ''}`,
              text.style.width ? `width: ${text.style.width}%` : '',
              text.style.color ? `color: ${text.style.color}` : 'color: white',
              text.style.backgroundColor ? `background-color: ${text.style.backgroundColor}` : '',
              text.style.padding ? `padding: ${text.style.padding}` : '',
              text.style.fontSize ? `font-size: ${text.style.fontSize}px` : '',
              text.style.fontWeight ? `font-weight: ${getFontWeight(text.style.fontWeight)}` : '',
              text.style.fontFamily ? `font-family: ${text.style.fontFamily}` : '',
              text.style.textShadow ? `text-shadow: 2px 2px 4px rgba(0,0,0,0.5)` : '',
              text.style.textAlign ? `text-align: ${text.style.textAlign}` : '',
              text.style.letterSpacing ? `letter-spacing: ${text.style.letterSpacing}px` : '',
              text.style.lineHeight ? `line-height: ${text.style.lineHeight}` : '',
              text.style.opacity !== undefined ? `opacity: ${text.style.opacity}` : '',
              text.zIndex ? `z-index: ${text.zIndex}` : '',
            ].filter(Boolean).join('; ');
            return `<div style="${textStyles}">${escapeHtml(text.content)}</div>`;
          })
          .join('\n');

        const gradientStyle = block.overlayGradient
          ? `<div style="position: absolute; inset: 0; background: ${block.overlayGradient};"></div>`
          : '';

        return `
          <div class="relative mb-6" style="width: 100%;">
            <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" class="w-full" style="${block.width ? `max-width: ${block.width}px;` : ''}" />
            ${gradientStyle}
            ${overlayTextsHtml}
          </div>
        `;

      default:
        return '';
    }
  };

  const renderSection = (section: Section): string => {
    const sectionStyles = [];
    if (section.backgroundColor) sectionStyles.push(`background-color: ${section.backgroundColor}`);
    if (section.padding) sectionStyles.push(`padding: ${section.padding}`);
    const styleAttr = sectionStyles.length ? ` style="${sectionStyles.join('; ')}"` : '';

    const blocksHtml = section.blocks.map(renderBlock).join('\n');

    return `
      <section${styleAttr} class="py-8">
        <div class="container mx-auto px-4">
          ${blocksHtml}
        </div>
      </section>
    `;
  };

  const sectionsHtml = sections.map(renderSection).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}${brandName ? ` | ${escapeHtml(brandName)}` : ''}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-white text-gray-900">
  <main>
    ${sectionsHtml}
  </main>

  <!-- Generated by Triple C Marketing Agent -->
  <!-- https://triplec.io -->
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

function getFontSize(size: string): string {
  const sizes: Record<string, string> = {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  };
  return sizes[size] || '1rem';
}

function getFontWeight(weight: string): string {
  const weights: Record<string, string> = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };
  return weights[weight] || '400';
}
