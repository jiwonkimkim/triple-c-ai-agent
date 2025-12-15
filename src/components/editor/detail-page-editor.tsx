'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore, type Section, type EditorBlock } from '@/stores/editor-store';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './editor-toolbar';
import { EditorSection } from './editor-section';

interface DetailPageEditorProps {
  projectId: string;
  versionId?: string;
  initialSections?: Section[];
  onSaveSuccess?: () => void;
}

const previewWidths = {
  desktop: 'max-w-4xl',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
};

export function DetailPageEditor({
  projectId,
  versionId,
  initialSections,
  onSaveSuccess,
}: DetailPageEditorProps) {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    sections,
    selectedBlockId,
    selectedSectionId,
    isDirty,
    isSaving,
    lastSavedAt,
    historyIndex,
    history,
    setSections,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    selectBlock,
    selectSection,
    undo,
    redo,
    pushHistory,
  } = useEditorStore();

  // Initialize editor with initial sections
  useEffect(() => {
    if (initialSections && initialSections.length > 0) {
      setSections(initialSections);
    } else {
      // Create default section if none provided
      addSection({
        name: 'Hero Section',
        blocks: [],
      });
    }
    pushHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save functionality
  const { save } = useAutoSave({
    projectId,
    versionId,
    interval: 30000, // 30 seconds
    onSave: (success) => {
      if (success) {
        onSaveSuccess?.();
      } else {
        toast({
          variant: 'destructive',
          title: 'Auto-save failed',
          description: 'Unable to save your changes. Please try saving manually.',
        });
      }
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Delete selected block: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && selectedSectionId) {
        // Only delete if not editing a text input
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          deleteBlock(selectedSectionId, selectedBlockId);
        }
      }
      // Deselect: Escape
      if (e.key === 'Escape') {
        selectBlock(null);
        selectSection(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedBlockId, selectedSectionId, deleteBlock, selectBlock, selectSection]);

  const handleAddSection = useCallback(() => {
    addSection({
      name: `Section ${sections.length + 1}`,
      blocks: [],
    });
  }, [addSection, sections.length]);

  const handleDuplicateSection = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (section) {
        addSection({
          name: `${section.name} (Copy)`,
          blocks: JSON.parse(JSON.stringify(section.blocks)).map((b: EditorBlock) => ({
            ...b,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })),
          backgroundColor: section.backgroundColor,
          padding: section.padding,
        });
      }
    },
    [sections, addSection]
  );

  const handleMoveSection = useCallback(
    (sectionIndex: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      if (newIndex >= 0 && newIndex < sections.length) {
        reorderSections(sectionIndex, newIndex);
      }
    },
    [sections.length, reorderSections]
  );

  const handleExport = useCallback(
    async (format: 'html' | 'json') => {
      try {
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(sections, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `detail-page-${projectId}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // Generate HTML export
          const response = await fetch(`/api/projects/${projectId}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sections, format: 'html' }),
          });

          if (!response.ok) throw new Error('Export failed');

          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `detail-page-${projectId}.html`;
          a.click();
          URL.revokeObjectURL(url);
        }

        toast({
          title: 'Export successful',
          description: `Your detail page has been exported as ${format.toUpperCase()}.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Export failed',
          description: 'Unable to export your detail page. Please try again.',
        });
      }
    },
    [sections, projectId, toast]
  );

  const handlePreview = useCallback(() => {
    setIsPreviewOpen(true);
    // Open preview in new tab
    window.open(`/dashboard/projects/${projectId}/preview`, '_blank');
  }, [projectId]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <EditorToolbar
        isDirty={isDirty}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        previewMode={previewMode}
        onUndo={undo}
        onRedo={redo}
        onSave={save}
        onPreview={handlePreview}
        onExport={handleExport}
        onAddSection={handleAddSection}
        onSetPreviewMode={setPreviewMode}
      />

      {/* Editor canvas */}
      <div
        className="flex-1 overflow-y-auto bg-muted/30 p-6"
        onClick={() => {
          selectBlock(null);
          selectSection(null);
        }}
      >
        <div className={cn('mx-auto transition-all duration-300', previewWidths[previewMode])}>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <EditorSection
                key={section.id}
                section={section}
                sectionIndex={index}
                totalSections={sections.length}
                selectedBlockId={selectedBlockId}
                isSelected={selectedSectionId === section.id}
                onSelectSection={() => selectSection(section.id)}
                onSelectBlock={selectBlock}
                onUpdateSection={(updates) => updateSection(section.id, updates)}
                onDeleteSection={() => deleteSection(section.id)}
                onMoveSection={(direction) => handleMoveSection(index, direction)}
                onDuplicateSection={() => handleDuplicateSection(section.id)}
                onAddBlock={(block, blockIndex) => addBlock(section.id, block, blockIndex)}
                onUpdateBlock={(blockId, updates) => updateBlock(section.id, blockId, updates)}
                onDeleteBlock={(blockId) => deleteBlock(section.id, blockId)}
                onReorderBlocks={(start, end) => reorderBlocks(section.id, start, end)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
