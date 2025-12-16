import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Block types
export type BlockType = 'heading' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'list' | 'quote';

export interface BlockStyle {
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: string;
  backgroundColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  content: string;
  style?: BlockStyle;
}

export interface TextBlock {
  type: 'text';
  content: string;
  style?: BlockStyle;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  style?: BlockStyle;
}

export interface ButtonBlock {
  type: 'button';
  text: string;
  url?: string;
  variant: 'primary' | 'secondary' | 'outline';
  style?: BlockStyle;
}

export interface DividerBlock {
  type: 'divider';
  style?: BlockStyle;
}

export interface SpacerBlock {
  type: 'spacer';
  height: number;
}

export interface ListBlock {
  type: 'list';
  listType: 'bullet' | 'number';
  items: string[];
  style?: BlockStyle;
}

export interface QuoteBlock {
  type: 'quote';
  content: string;
  author?: string;
  style?: BlockStyle;
}

export type EditorBlock = (
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock
  | ListBlock
  | QuoteBlock
) & {
  id: string;
};

export interface Section {
  id: string;
  name: string;
  blocks: EditorBlock[];
  backgroundColor?: string;
  padding?: string;
}

export interface EditorState {
  // State
  sections: Section[];
  selectedBlockId: string | null;
  selectedSectionId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  history: Section[][];
  historyIndex: number;

  // Actions
  setSections: (sections: Section[]) => void;
  addSection: (section: Omit<Section, 'id'>) => void;
  updateSection: (sectionId: string, updates: Partial<Omit<Section, 'id'>>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;

  addBlock: (sectionId: string, block: Omit<EditorBlock, 'id'>, index?: number) => void;
  updateBlock: (sectionId: string, blockId: string, updates: Partial<EditorBlock>) => void;
  deleteBlock: (sectionId: string, blockId: string) => void;
  reorderBlocks: (sectionId: string, startIndex: number, endIndex: number) => void;
  moveBlockToSection: (fromSectionId: string, toSectionId: string, blockId: string, toIndex: number) => void;

  selectBlock: (blockId: string | null) => void;
  selectSection: (sectionId: string | null) => void;

  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  reset: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState = {
  sections: [],
  selectedBlockId: null,
  selectedSectionId: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  history: [],
  historyIndex: -1,
};

export const useEditorStore = create<EditorState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      setSections: (sections) => {
        set({ sections, isDirty: true });
        get().pushHistory();
      },

      addSection: (section) => {
        const newSection: Section = {
          ...section,
          id: generateId(),
        };
        set((state) => ({
          sections: [...state.sections, newSection],
          isDirty: true,
        }));
        get().pushHistory();
      },

      updateSection: (sectionId, updates) => {
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId ? { ...s, ...updates } : s
          ),
          isDirty: true,
        }));
        get().pushHistory();
      },

      deleteSection: (sectionId) => {
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== sectionId),
          selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
          isDirty: true,
        }));
        get().pushHistory();
      },

      reorderSections: (startIndex, endIndex) => {
        set((state) => {
          const newSections = [...state.sections];
          const [removed] = newSections.splice(startIndex, 1);
          newSections.splice(endIndex, 0, removed);
          return { sections: newSections, isDirty: true };
        });
        get().pushHistory();
      },

      addBlock: (sectionId, block, index) => {
        const newBlock: EditorBlock = {
          ...block,
          id: generateId(),
        } as EditorBlock;

        set((state) => ({
          sections: state.sections.map((section) => {
            if (section.id !== sectionId) return section;
            const newBlocks = [...section.blocks];
            if (index !== undefined) {
              newBlocks.splice(index, 0, newBlock);
            } else {
              newBlocks.push(newBlock);
            }
            return { ...section, blocks: newBlocks };
          }),
          isDirty: true,
        }));
        get().pushHistory();
      },

      updateBlock: (sectionId, blockId, updates) => {
        set((state) => ({
          sections: state.sections.map((section) => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              blocks: section.blocks.map((block) =>
                block.id === blockId ? ({ ...block, ...updates } as EditorBlock) : block
              ),
            };
          }),
          isDirty: true,
        }));
        get().pushHistory();
      },

      deleteBlock: (sectionId, blockId) => {
        set((state) => ({
          sections: state.sections.map((section) => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              blocks: section.blocks.filter((b) => b.id !== blockId),
            };
          }),
          selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
          isDirty: true,
        }));
        get().pushHistory();
      },

      reorderBlocks: (sectionId, startIndex, endIndex) => {
        set((state) => ({
          sections: state.sections.map((section) => {
            if (section.id !== sectionId) return section;
            const newBlocks = [...section.blocks];
            const [removed] = newBlocks.splice(startIndex, 1);
            newBlocks.splice(endIndex, 0, removed);
            return { ...section, blocks: newBlocks };
          }),
          isDirty: true,
        }));
        get().pushHistory();
      },

      moveBlockToSection: (fromSectionId, toSectionId, blockId, toIndex) => {
        set((state) => {
          let movedBlock: EditorBlock | undefined;

          const newSections = state.sections.map((section) => {
            if (section.id === fromSectionId) {
              movedBlock = section.blocks.find((b) => b.id === blockId);
              return {
                ...section,
                blocks: section.blocks.filter((b) => b.id !== blockId),
              };
            }
            return section;
          });

          if (!movedBlock) return state;

          return {
            sections: newSections.map((section) => {
              if (section.id === toSectionId) {
                const newBlocks = [...section.blocks];
                newBlocks.splice(toIndex, 0, movedBlock!);
                return { ...section, blocks: newBlocks };
              }
              return section;
            }),
            isDirty: true,
          };
        });
        get().pushHistory();
      },

      selectBlock: (blockId) => set({ selectedBlockId: blockId }),
      selectSection: (sectionId) => set({ selectedSectionId: sectionId }),

      setDirty: (dirty) => set({ isDirty: dirty }),
      setSaving: (saving) => set({ isSaving: saving }),
      setLastSavedAt: (date) => set({ lastSavedAt: date }),

      pushHistory: () => {
        const { sections, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(sections)));

        // Limit history to 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            sections: JSON.parse(JSON.stringify(history[newIndex])),
            historyIndex: newIndex,
            isDirty: true,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            sections: JSON.parse(JSON.stringify(history[newIndex])),
            historyIndex: newIndex,
            isDirty: true,
          });
        }
      },

      reset: () => set(initialState),
    })),
    { name: 'editor-store' }
  )
);

// Selectors
export const selectAllBlocks = (state: EditorState) =>
  state.sections.flatMap((s) => s.blocks);

export const selectBlockById = (state: EditorState, blockId: string) =>
  selectAllBlocks(state).find((b) => b.id === blockId);

export const selectSectionByBlockId = (state: EditorState, blockId: string) =>
  state.sections.find((s) => s.blocks.some((b) => b.id === blockId));
