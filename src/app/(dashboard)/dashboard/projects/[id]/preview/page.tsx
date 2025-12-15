'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { Section, EditorBlock } from '@/stores/editor-store';

interface VersionData {
  id: string;
  content: Section[];
}

async function fetchLatestVersion(projectId: string): Promise<VersionData | null> {
  const response = await fetch(`/api/projects/${projectId}/drafts`);
  if (!response.ok) return null;
  const data = await response.json();
  return data.data;
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

  const sections = data?.content || [];

  return (
    <div className="min-h-screen bg-white">
      {sections.map((section) => (
        <PreviewSection key={section.id} section={section} />
      ))}

      {sections.length === 0 && (
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">
          No content to preview
        </div>
      )}
    </div>
  );
}

function PreviewSection({ section }: { section: Section }) {
  const sectionStyles: React.CSSProperties = {};
  if (section.backgroundColor) {
    sectionStyles.backgroundColor = section.backgroundColor;
  }
  if (section.padding) {
    sectionStyles.padding = section.padding;
  }

  return (
    <section style={sectionStyles} className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {section.blocks.map((block) => (
          <PreviewBlock key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}

function PreviewBlock({ block }: { block: EditorBlock }) {
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
