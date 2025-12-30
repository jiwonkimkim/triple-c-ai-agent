'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Section, EditorBlock, OverlayText } from '@/stores/editor-store';

interface VersionData {
  id: string;
  content: Section[] | { sections?: Section[]; elements?: EditorBlock[] };
}

async function fetchLatestVersion(projectId: string): Promise<VersionData | null> {
  // 먼저 content API 시도 (최신 형식)
  const contentResponse = await fetch(`/api/projects/${projectId}/content`);
  if (contentResponse.ok) {
    const contentData = await contentResponse.json();
    if (contentData.success && contentData.data) {
      // editorSections 형식 처리 (최신: 각 섹션 분리)
      if (contentData.data.editorSections?.length > 0) {
        return {
          id: contentData.data.versionId || 'preview',
          content: contentData.data.editorSections,
        };
      }
      // imageOverlayBlocks 형식 처리 (레거시)
      if (contentData.data.imageOverlayBlocks?.length > 0) {
        return {
          id: contentData.data.versionId || 'preview',
          content: [{
            id: 'main-section',
            name: '메인 섹션',
            blocks: contentData.data.imageOverlayBlocks,
          }],
        };
      }
      // elements 형식 처리 (레거시)
      if (contentData.data.elements?.length > 0) {
        return {
          id: contentData.data.versionId || 'preview',
          content: [{
            id: 'main-section',
            name: '메인 섹션',
            blocks: contentData.data.elements,
          }],
        };
      }
    }
  }

  // Fallback: drafts API 시도
  const response = await fetch(`/api/projects/${projectId}/drafts`);
  if (!response.ok) return null;
  const data = await response.json();

  if (!data.data) return null;

  // contentJson 형식 처리
  const content = data.data.content || data.data.contentJson;
  if (!content) return null;

  // sections 배열인지 확인
  if (Array.isArray(content)) {
    return { id: data.data.id, content };
  }

  // { sections: [...] } 형식
  if (content.sections) {
    return { id: data.data.id, content: content.sections };
  }

  return null;
}

export default function ProjectPreviewPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['project-preview', projectId],
    queryFn: () => fetchLatestVersion(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // content를 Section[] 형식으로 변환
  const sections: Section[] = (() => {
    if (!data?.content) return [];
    if (Array.isArray(data.content)) return data.content;
    return [];
  })();

  // MAIN 섹션과 나머지 섹션 분리
  const mainSection = sections.find((s) => s.name === '메인' || s.id.includes('MAIN'));
  const otherSections = sections.filter((s) => s.name !== '메인' && !s.id.includes('MAIN'));

  return (
    <div className="min-h-screen bg-white">
      {/* MAIN 섹션 - 따로 표시 */}
      {mainSection && (
        <div className="mb-8">
          <PreviewSection section={mainSection} isMain />
        </div>
      )}

      {/* 나머지 섹션들 - 여백 없이 합쳐서 표시 */}
      {otherSections.length > 0 && (
        <div className="detail-sections">
          {otherSections.map((section) => (
            <PreviewSection key={section.id} section={section} isMain={false} />
          ))}
        </div>
      )}

      {sections.length === 0 && (
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">
          미리보기할 콘텐츠가 없습니다
        </div>
      )}
    </div>
  );
}

function PreviewSection({ section, isMain = false }: { section: Section; isMain?: boolean }) {
  const sectionStyles: React.CSSProperties = {};
  if (section.backgroundColor) {
    sectionStyles.backgroundColor = section.backgroundColor;
  }
  if (section.padding) {
    sectionStyles.padding = section.padding;
  }

  // MAIN 섹션은 패딩 있게, 나머지는 여백 없이
  if (isMain) {
    return (
      <section style={sectionStyles} className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {section.blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} isMain />
          ))}
        </div>
      </section>
    );
  }

  // 나머지 섹션들은 여백 없이 연결
  return (
    <section style={sectionStyles}>
      <div className="max-w-4xl mx-auto">
        {section.blocks.map((block) => (
          <PreviewBlock key={block.id} block={block} isMain={false} />
        ))}
      </div>
    </section>
  );
}

function PreviewBlock({ block, isMain = false }: { block: EditorBlock; isMain?: boolean }) {
  switch (block.type) {
    case 'heading': {
      const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
      const headingClasses = {
        1: 'text-4xl font-bold mb-4',
        2: 'text-3xl font-bold mb-3',
        3: 'text-2xl font-semibold mb-3',
        4: 'text-xl font-semibold mb-2',
      };
      return (
        <HeadingTag className={headingClasses[block.level as 1 | 2 | 3 | 4]}>
          {block.content}
        </HeadingTag>
      );
    }

    case 'text': {
      const textStyles: React.CSSProperties = {};
      if (block.style?.textAlign) textStyles.textAlign = block.style.textAlign;
      if (block.style?.backgroundColor) textStyles.backgroundColor = block.style.backgroundColor;
      if (block.style?.padding) textStyles.padding = block.style.padding;
      if (block.style?.borderRadius) textStyles.borderRadius = block.style.borderRadius;

      return (
        <p className="mb-4 leading-relaxed whitespace-pre-wrap" style={textStyles}>
          {block.content}
        </p>
      );
    }

    case 'image':
      return (
        <figure className="mb-6">
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-lg shadow-md"
          />
          {block.caption && (
            <figcaption className="text-center text-sm text-gray-600 mt-2">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'button': {
      const buttonClasses = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border-2 border-primary text-primary hover:bg-primary/10',
      };
      const alignClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
      };
      return (
        <div className={`flex mb-4 ${alignClasses[block.style?.textAlign || 'left']}`}>
          {block.url ? (
            <a
              href={block.url}
              className={`inline-block px-6 py-3 rounded-md font-medium transition-colors ${buttonClasses[block.variant]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {block.text}
            </a>
          ) : (
            <button
              type="button"
              className={`px-6 py-3 rounded-md font-medium transition-colors ${buttonClasses[block.variant]}`}
            >
              {block.text}
            </button>
          )}
        </div>
      );
    }

    case 'divider':
      return <hr className="my-8 border-t border-gray-300" />;

    case 'spacer':
      return <div style={{ height: block.height }} />;

    case 'image-overlay':
      return <PreviewImageOverlay block={block} isMain={isMain} />;

    case 'list': {
      const ListTag = block.listType === 'bullet' ? 'ul' : 'ol';
      const listClass = block.listType === 'bullet' ? 'list-disc' : 'list-decimal';
      return (
        <ListTag className={`${listClass} ml-6 mb-4 space-y-1`}>
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ListTag>
      );
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 mb-4 italic text-lg">
          <p>"{block.content}"</p>
          {block.author && (
            <footer className="mt-2 text-sm text-gray-600 not-italic">
              — {block.author}
            </footer>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}

// Image Overlay 블록 미리보기 컴포넌트
// MAIN 섹션: 1:1 정사각형 비율
// 나머지 섹션: 원래 비율 (3:4)
function PreviewImageOverlay({ block, isMain = false }: { block: EditorBlock; isMain?: boolean }) {
  if (block.type !== 'image-overlay') return null;

  const overlayTexts = block.overlayTexts || [];
  const aspectRatio = isMain ? '1/1' : '3/4';

  return (
    <div
      className={`relative w-full overflow-hidden ${isMain ? 'mb-6 rounded-lg' : ''}`}
      style={{ aspectRatio }}
    >
      {/* 배경 이미지 */}
      {block.src ? (
        <img
          src={block.src}
          alt={block.alt || '상세페이지 이미지'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-gray-500">이미지 없음</span>
        </div>
      )}

      {/* 그라데이션 오버레이 */}
      {block.overlayGradient && (
        <div
          className={`absolute inset-0 ${isMain ? 'rounded-lg' : ''}`}
          style={{ background: block.overlayGradient }}
        />
      )}

      {/* 오버레이 텍스트들 */}
      {overlayTexts.map((text: OverlayText) => {
        const style = text.style || {};
        const textStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${style.x || 50}%`,
          top: `${style.y || 50}%`,
          transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
          fontSize: `${style.fontSize || 24}px`,
          fontWeight: style.fontWeight || 'normal',
          fontFamily: style.fontFamily || 'inherit',
          color: style.color || '#ffffff',
          textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
          opacity: (style.opacity ?? 100) / 100,
          textShadow: style.textShadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
          zIndex: text.zIndex || 1,
          width: style.width ? `${style.width}%` : 'auto',
          // width 설정 시: 사용자가 조절한 너비 내에서 줄바꿈 허용
          // width 미설정 시: 자동 줄바꿈 방지
          whiteSpace: style.width ? 'pre-wrap' : 'nowrap',
        };

        return (
          <div key={text.id} style={textStyle}>
            {text.content}
          </div>
        );
      })}
    </div>
  );
}
