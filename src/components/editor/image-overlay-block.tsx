'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Settings,
  Type,
  Layers,
  ChevronUp,
  ChevronDown,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Upload,
  X,
  Paintbrush,
  ClipboardPaste,
  Eye,
  EyeOff,
  Group,
  Ungroup,
  Lock,
  Unlock,
  Folder,
  FolderOpen,
  ChevronRight,
  CornerDownRight,
} from 'lucide-react';
import type { ImageOverlayBlock, OverlayText, OverlayTextStyle } from '@/stores/editor-store';

interface ImageOverlayBlockRendererProps {
  block: ImageOverlayBlock & { id: string };
  isSelected: boolean;
  isMain?: boolean;  // MAIN 섹션 여부 - 1:1 비율 적용
  previewMode?: 'desktop' | 'tablet' | 'mobile';  // 미리보기 모드 (텍스트 크기 비율 조절)
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageOverlayBlock>) => void;
}

// 미리보기 모드별 스케일 비율 (데스크톱 기준)
const previewScales = {
  desktop: 1,
  tablet: 0.75,    // 672/896 ≈ 0.75
  mobile: 0.43,    // 384/896 ≈ 0.43
};

// 폰트 옵션 (카테고리별 분류)
const fontOptions = [
  // 고딕 계열 (Sans-serif)
  { value: 'Pretendard, sans-serif', label: 'Pretendard', category: '고딕' },
  { value: 'Noto Sans KR, sans-serif', label: 'Noto Sans KR', category: '고딕' },
  { value: 'Nanum Gothic, sans-serif', label: '나눔고딕', category: '고딕' },
  { value: 'Spoqa Han Sans Neo, sans-serif', label: '스포카 한 산스', category: '고딕' },
  { value: 'IBM Plex Sans KR, sans-serif', label: 'IBM Plex Sans', category: '고딕' },

  // 명조 계열 (Serif)
  { value: 'Nanum Myeongjo, serif', label: '나눔명조', category: '명조' },
  { value: 'Noto Serif KR, serif', label: 'Noto Serif KR', category: '명조' },
  { value: 'KoPub Batang, serif', label: '코퍼브 바탕', category: '명조' },

  // 디스플레이/타이틀 (Display)
  { value: 'Black Han Sans, sans-serif', label: '검은고딕', category: '타이틀' },
  { value: 'Jua, sans-serif', label: '주아', category: '타이틀' },
  { value: 'Do Hyeon, sans-serif', label: '도현', category: '타이틀' },
  { value: 'Gugi, sans-serif', label: '구기', category: '타이틀' },
  { value: 'Sunflower, sans-serif', label: '해바라기', category: '타이틀' },

  // 손글씨/캘리 (Handwriting)
  { value: 'Gaegu, cursive', label: '개구', category: '손글씨' },
  { value: 'Hi Melody, cursive', label: '하이멜로디', category: '손글씨' },
  { value: 'Gamja Flower, cursive', label: '감자꽃', category: '손글씨' },
  { value: 'Cute Font, cursive', label: '귀여운 폰트', category: '손글씨' },

  // 영문 (English)
  { value: 'Arial, sans-serif', label: 'Arial', category: '영문' },
  { value: 'Georgia, serif', label: 'Georgia', category: '영문' },
  { value: 'Impact, sans-serif', label: 'Impact', category: '영문' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat', category: '영문' },
  { value: 'Playfair Display, serif', label: 'Playfair Display', category: '영문' },
];

// 텍스트 타입별 기본 스타일
// width가 설정되면 화면 안에서 줄바꿈됨, 이동해도 동적으로 줄어들지 않음
const defaultStylesByType: Record<OverlayText['type'], Partial<OverlayTextStyle>> = {
  headline: {
    x: 50,
    y: 30,
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
    width: 80,  // 기본 너비 80% - 화면 안에서 줄바꿈
  },
  subheadline: {
    x: 50,
    y: 45,
    fontSize: 24,
    fontWeight: 'medium',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
    width: 70,  // 기본 너비 70%
  },
  body: {
    x: 50,
    y: 60,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
    width: 80,  // 기본 너비 80%
  },
  statistic: {
    x: 50,
    y: 50,
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: true,
    textAlign: 'center',
    // 통계 숫자는 보통 짧아서 width 없음
  },
  cta: {
    x: 50,
    y: 80,
    fontSize: 18,
    fontWeight: 'semibold',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '12px 24px',
    textAlign: 'center',
    // CTA 버튼은 보통 짧아서 width 없음
  },
  folder: {
    // 폴더는 컨테이너 레이어이므로 렌더링되지 않음
    x: 0,
    y: 0,
    fontSize: 0,
    fontWeight: 'normal',
    color: 'transparent',
  },
};

const generateId = () => `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function ImageOverlayBlockRenderer({
  block,
  isSelected,
  isMain = false,
  previewMode = 'desktop',
  onSelect,
  onUpdate,
}: ImageOverlayBlockRendererProps) {
  // 미리보기 모드에 따른 스케일 계산
  const scale = previewScales[previewMode];
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set()); // 멀티 선택
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());
  const [lockedLayerIds, setLockedLayerIds] = useState<Set<string>>(new Set()); // 잠금 상태
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | 'both' | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br'>('both');
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeStartFontSize, setResizeStartFontSize] = useState(0);
  const [resizeStartPosX, setResizeStartPosX] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState<Partial<OverlayTextStyle> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 서식 복사 - 위치(x, y)는 제외하고 스타일만 복사
  const handleCopyStyle = useCallback(() => {
    if (!selectedTextId) return;
    const text = block.overlayTexts.find(t => t.id === selectedTextId);
    if (!text) return;

    // 위치와 크기 정보는 제외하고 순수 스타일만 복사
    const { x, y, width, ...styleOnly } = text.style;
    setCopiedStyle(styleOnly);
  }, [selectedTextId, block.overlayTexts]);

  // 서식 붙여넣기
  const handlePasteStyle = useCallback(() => {
    if (!selectedTextId || !copiedStyle) return;

    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === selectedTextId
          ? { ...text, style: { ...text.style, ...copiedStyle } }
          : text
      ),
    });
  }, [selectedTextId, copiedStyle, block.overlayTexts, onUpdate]);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTextId(textId);
    setIsDragging(true);
  }, []);

  // 드래그 중 - 범위 제한 없이 자유롭게 이동 가능 (밖으로 나갈 수 있음)
  // ★ 그룹화된 레이어들은 함께 이동
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedTextId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    const newY = ((e.clientY - rect.top) / rect.height) * 100;

    // 선택된 텍스트 찾기
    const selectedText = block.overlayTexts.find(t => t.id === selectedTextId);
    if (!selectedText) return;

    // 이동량 계산
    const deltaX = newX - selectedText.style.x;
    const deltaY = newY - selectedText.style.y;

    // 같은 그룹의 레이어들도 함께 이동
    const groupId = selectedText.groupId;

    onUpdate({
      overlayTexts: block.overlayTexts.map((text) => {
        // 선택된 텍스트이거나, 같은 그룹에 속한 텍스트인 경우 이동
        if (text.id === selectedTextId || (groupId && text.groupId === groupId)) {
          return {
            ...text,
            style: {
              ...text.style,
              x: text.style.x + deltaX,
              y: text.style.y + deltaY,
            },
          };
        }
        return text;
      }),
    });
  }, [isDragging, selectedTextId, block.overlayTexts, onUpdate]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent, textId: string, direction: 'left' | 'right' | 'both' | 'corner-tl' | 'corner-tr' | 'corner-bl' | 'corner-br' = 'both') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTextId(textId);
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStartX(e.clientX);
    setResizeStartY(e.clientY);
    const text = block.overlayTexts.find(t => t.id === textId);
    setResizeStartWidth(text?.style.width || 30); // 기본 너비 30%
    setResizeStartFontSize(text?.style.fontSize || 16);
    setResizeStartPosX(text?.style.x || 50);
  }, [block.overlayTexts]);

  // 리사이즈 중
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !selectedTextId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;
    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    let newWidth: number = resizeStartWidth;
    let newX: number = resizeStartPosX;
    let newFontSize: number = resizeStartFontSize;

    // 모서리 리사이즈: 너비 + 폰트 크기 동시 조절
    if (resizeDirection.startsWith('corner-')) {
      const isLeft = resizeDirection === 'corner-tl' || resizeDirection === 'corner-bl';
      const isTop = resizeDirection === 'corner-tl' || resizeDirection === 'corner-tr';

      // 너비 조절 (좌우 방향) - 최소 5%만 유지, 최대 제한 없음
      if (isLeft) {
        newWidth = Math.max(5, resizeStartWidth - deltaPercentX);
        const widthDiff = newWidth - resizeStartWidth;
        newX = resizeStartPosX - widthDiff / 2; // 범위 제한 없음
      } else {
        newWidth = Math.max(5, resizeStartWidth + deltaPercentX);
      }

      // 폰트 크기 조절 (상하 방향) - 위로 드래그하면 커지고, 아래로 드래그하면 작아짐
      const fontDelta = isTop ? -deltaPercentY : deltaPercentY;
      newFontSize = Math.max(8, Math.min(200, resizeStartFontSize + fontDelta * 1.5));
    } else if (resizeDirection === 'right') {
      // 오른쪽만 확장: 위치 고정, 너비만 증가 (최소 5%만 유지)
      newWidth = Math.max(5, resizeStartWidth + deltaPercentX);
    } else if (resizeDirection === 'left') {
      // 왼쪽만 확장: 위치 이동, 너비 증가 (최소 5%만 유지)
      newWidth = Math.max(5, resizeStartWidth - deltaPercentX);
      const widthDiff = newWidth - resizeStartWidth;
      newX = resizeStartPosX - widthDiff / 2; // 범위 제한 없음
    } else {
      // 양쪽 확장 (기존 동작) - 최소 5%만 유지
      newWidth = Math.max(5, resizeStartWidth + deltaPercentX * 2);
    }

    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === selectedTextId
          ? {
              ...text,
              style: {
                ...text.style,
                width: newWidth,
                x: newX,
                ...(resizeDirection.startsWith('corner-') && { fontSize: Math.round(newFontSize) })
              }
            }
          : text
      ),
    });
  }, [isResizing, selectedTextId, resizeStartX, resizeStartY, resizeStartWidth, resizeStartFontSize, resizeStartPosX, resizeDirection, block.overlayTexts, onUpdate]);

  // 리사이즈 종료
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection('both');
  }, []);

  // 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isDragging, isResizing, handleDrag, handleDragEnd, handleResize, handleResizeEnd]);

  // 오버레이 텍스트 추가
  const handleAddOverlayText = (type: OverlayText['type']) => {
    const defaultStyle = defaultStylesByType[type];
    const maxZIndex = Math.max(...block.overlayTexts.map((t) => t.zIndex || 0), 0);
    const newText: OverlayText = {
      id: generateId(),
      type,
      content: type === 'headline' ? '헤드라인을 입력하세요' :
               type === 'subheadline' ? '서브헤드라인' :
               type === 'statistic' ? '92%' :
               type === 'cta' ? '지금 만나보세요' : '본문 텍스트를 입력하세요',
      style: {
        x: defaultStyle.x || 50,
        y: defaultStyle.y || 50,
        fontSize: defaultStyle.fontSize || 16,
        fontWeight: defaultStyle.fontWeight || 'normal',
        fontFamily: 'Pretendard, sans-serif',
        color: defaultStyle.color || '#ffffff',
        backgroundColor: defaultStyle.backgroundColor,
        padding: defaultStyle.padding,
        textShadow: defaultStyle.textShadow,
        textAlign: defaultStyle.textAlign || 'center',
        opacity: 100,
        rotation: 0,
      },
      zIndex: maxZIndex + 1,
    };

    onUpdate({
      overlayTexts: [...block.overlayTexts, newText],
    });
    setSelectedTextId(newText.id);
  };

  // 오버레이 텍스트 업데이트
  const handleUpdateOverlayText = (textId: string, updates: Partial<OverlayText>) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === textId ? { ...text, ...updates } : text
      ),
    });
  };

  // 오버레이 텍스트 스타일 업데이트
  const handleUpdateStyle = (textId: string, styleUpdates: Partial<OverlayTextStyle>) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === textId ? { ...text, style: { ...text.style, ...styleUpdates } } : text
      ),
    });
  };

  // 오버레이 텍스트 삭제
  const handleDeleteOverlayText = (textId: string) => {
    onUpdate({
      overlayTexts: block.overlayTexts.filter((text) => text.id !== textId),
    });
    setSelectedTextId(null);
  };

  // 레이어 순서 변경
  const handleMoveLayer = (textId: string, direction: 'up' | 'down') => {
    const sortedTexts = [...block.overlayTexts].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const index = sortedTexts.findIndex((t) => t.id === textId);

    if (direction === 'up' && index < sortedTexts.length - 1) {
      const temp = sortedTexts[index].zIndex;
      sortedTexts[index].zIndex = sortedTexts[index + 1].zIndex;
      sortedTexts[index + 1].zIndex = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = sortedTexts[index].zIndex;
      sortedTexts[index].zIndex = sortedTexts[index - 1].zIndex;
      sortedTexts[index - 1].zIndex = temp;
    }

    onUpdate({ overlayTexts: sortedTexts });
  };

  // 레이어 복제
  const handleDuplicateLayer = (textId: string) => {
    const text = block.overlayTexts.find((t) => t.id === textId);
    if (!text) return;

    const maxZIndex = Math.max(...block.overlayTexts.map((t) => t.zIndex || 0), 0);
    const newText: OverlayText = {
      ...text,
      id: generateId(),
      style: {
        ...text.style,
        x: text.style.x + 5,
        y: text.style.y + 5,
      },
      zIndex: maxZIndex + 1,
    };

    onUpdate({ overlayTexts: [...block.overlayTexts, newText] });
    setSelectedTextId(newText.id);
  };

  // 레이어 숨기기/보이기 토글
  const handleToggleLayerVisibility = (textId: string) => {
    setHiddenLayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(textId)) {
        newSet.delete(textId);
      } else {
        newSet.add(textId);
      }
      return newSet;
    });
  };

  // 레이어 잠금/잠금해제 토글
  const handleToggleLayerLock = (textId: string) => {
    setLockedLayerIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(textId)) {
        newSet.delete(textId);
      } else {
        newSet.add(textId);
      }
      return newSet;
    });
  };

  // 멀티 선택 토글 (Ctrl/Cmd + 클릭)
  const handleLayerSelect = (textId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setSelectedLayerIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(textId)) {
          newSet.delete(textId);
        } else {
          newSet.add(textId);
        }
        return newSet;
      });
    } else {
      setSelectedLayerIds(new Set([textId]));
    }
    setSelectedTextId(textId);
  };

  // 선택된 레이어들 그룹화 (스타일과 위치 유지, 함께 이동)
  const handleGroupLayers = () => {
    if (selectedLayerIds.size < 2) return;

    // 잠긴 레이어는 제외
    const selectableIds = Array.from(selectedLayerIds).filter(id => !lockedLayerIds.has(id));
    if (selectableIds.length < 2) return;

    // 새 그룹 ID 생성
    const newGroupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 선택된 레이어들에 같은 groupId 부여 (기존 스타일과 위치 유지)
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        selectableIds.includes(text.id)
          ? { ...text, groupId: newGroupId }
          : text
      ),
    });

    // 선택 해제
    setSelectedLayerIds(new Set());
  };

  // 그룹 해제
  const handleUngroupLayers = () => {
    if (selectedLayerIds.size === 0 && !selectedTextId) return;

    // 선택된 레이어들 또는 현재 선택된 레이어의 그룹 해제
    const idsToUngroup = selectedLayerIds.size > 0
      ? Array.from(selectedLayerIds)
      : selectedTextId ? [selectedTextId] : [];

    if (idsToUngroup.length === 0) return;

    // 선택된 레이어들의 groupId 찾기
    const groupIdsToRemove = new Set<string>();
    block.overlayTexts.forEach((text) => {
      if (idsToUngroup.includes(text.id) && text.groupId) {
        groupIdsToRemove.add(text.groupId);
      }
    });

    // 해당 그룹의 모든 레이어에서 groupId 제거
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.groupId && groupIdsToRemove.has(text.groupId)
          ? { ...text, groupId: undefined }
          : text
      ),
    });

    setSelectedLayerIds(new Set());
  };

  // 선택된 레이어 중 그룹화된 것이 있는지 확인
  const hasGroupedSelection = Array.from(selectedLayerIds).some((id) => {
    const text = block.overlayTexts.find((t) => t.id === id);
    return text?.groupId;
  }) || (selectedTextId && block.overlayTexts.find((t) => t.id === selectedTextId)?.groupId);

  // 전체 선택
  const handleSelectAll = () => {
    const allIds = new Set(block.overlayTexts.map((t) => t.id));
    setSelectedLayerIds(allIds);
  };

  // 선택 해제
  const handleDeselectAll = () => {
    setSelectedLayerIds(new Set());
    setSelectedTextId(null);
  };

  // ★ 폴더 레이어 생성
  const handleCreateFolder = () => {
    const maxZIndex = Math.max(...block.overlayTexts.map((t) => t.zIndex || 0), 0);
    const newFolder: OverlayText = {
      id: generateId(),
      type: 'folder',
      content: '새 폴더',
      style: {
        x: 50,
        y: 50,
        fontSize: 16,
        fontWeight: 'normal',
        color: '#ffffff',
      },
      zIndex: maxZIndex + 1,
      isFolder: true,
      isExpanded: true,
    };

    onUpdate({ overlayTexts: [...block.overlayTexts, newFolder] });
    setSelectedTextId(newFolder.id);
  };

  // ★ 선택된 레이어들을 폴더 안으로 이동
  const handleMoveToFolder = (folderId: string) => {
    if (selectedLayerIds.size === 0) return;

    // 폴더 자체는 이동 대상에서 제외
    const layersToMove = Array.from(selectedLayerIds).filter((id) => {
      const layer = block.overlayTexts.find((t) => t.id === id);
      return layer && !layer.isFolder && id !== folderId;
    });

    if (layersToMove.length === 0) return;

    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        layersToMove.includes(text.id)
          ? { ...text, parentId: folderId }
          : text
      ),
    });

    setSelectedLayerIds(new Set());
  };

  // ★ 레이어를 폴더에서 꺼내기 (최상위로)
  const handleRemoveFromFolder = (layerId: string) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === layerId ? { ...text, parentId: undefined } : text
      ),
    });
  };

  // ★ 폴더 펼치기/접기 토글
  const handleToggleFolderExpand = (folderId: string) => {
    onUpdate({
      overlayTexts: block.overlayTexts.map((text) =>
        text.id === folderId ? { ...text, isExpanded: !text.isExpanded } : text
      ),
    });
  };

  // ★ 폴더 목록 가져오기 (선택된 레이어를 넣을 수 있는 폴더들)
  const availableFolders = block.overlayTexts.filter((t) => t.isFolder);

  // ★ 중첩 레이어 구조를 트리 형태로 정렬
  const getLayerTree = () => {
    const rootLayers = block.overlayTexts.filter((t) => !t.parentId);
    const childrenMap = new Map<string, OverlayText[]>();

    block.overlayTexts.forEach((layer) => {
      if (layer.parentId) {
        const children = childrenMap.get(layer.parentId) || [];
        children.push(layer);
        childrenMap.set(layer.parentId, children);
      }
    });

    // 재귀적으로 트리 구조 생성
    const buildTree = (layers: OverlayText[], depth: number = 0): Array<{ layer: OverlayText; depth: number }> => {
      const result: Array<{ layer: OverlayText; depth: number }> = [];

      layers
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
        .forEach((layer) => {
          result.push({ layer, depth });

          // 폴더이고 펼쳐져 있으면 자식 레이어 추가
          if (layer.isFolder && layer.isExpanded) {
            const children = childrenMap.get(layer.id) || [];
            result.push(...buildTree(children, depth + 1));
          }
        });

      return result;
    };

    return buildTree(rootLayers);
  };

  // 이미지 업로드
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate({ src: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const selectedText = block.overlayTexts.find((t) => t.id === selectedTextId);

  return (
    <div
      className={cn(
        'relative transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      {/* 이미지 캔버스 - overflow-visible로 텍스트가 이미지 밖으로 나갈 수 있음 */}
      {/* 가로 폭 100%, 세로는 이미지 비율에 맞춤 */}
      <div
        ref={containerRef}
        className="relative bg-muted overflow-visible"
        onClick={(e) => {
          // 이미지 빈 공간 클릭 시 텍스트 선택 해제
          if (e.target === containerRef.current || e.target === containerRef.current?.querySelector('img')) {
            setSelectedTextId(null);
          }
        }}
      >
        {block.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.src}
            alt={block.alt || '상세페이지 이미지'}
            className="w-full h-auto block"
          />
        ) : (
          <div
            className="w-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 cursor-pointer"
            style={{ aspectRatio: '3/4' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center text-white/70">
              <Upload className="h-12 w-12 mx-auto mb-2" />
              <p>클릭하여 이미지 업로드</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* 오버레이 그라데이션 */}
        {block.overlayGradient && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: block.overlayGradient }}
          />
        )}

        {/* 오버레이 텍스트들 (레이어) - 숨겨진 레이어 제외 */}
        {block.overlayTexts
          .filter((t) => !hiddenLayerIds.has(t.id))
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((overlayText) => (
            <div
              key={overlayText.id}
              className={cn(
                'absolute cursor-move select-none transition-shadow',
                (isDragging || isResizing) && selectedTextId === overlayText.id && 'cursor-grabbing'
              )}
              style={{
                left: `${overlayText.style.x}%`,
                top: `${overlayText.style.y}%`,
                // textAlign에 따라 변환 기준점 조정: left=왼쪽기준, center=중앙기준, right=오른쪽기준
                transform: `translate(${
                  overlayText.style.textAlign === 'left' ? '0' :
                  overlayText.style.textAlign === 'right' ? '-100%' : '-50%'
                }, -50%) rotate(${overlayText.style.rotation || 0}deg)`,
                zIndex: overlayText.zIndex || 0,
                opacity: (overlayText.style.opacity || 100) / 100,
                width: overlayText.style.width ? `${overlayText.style.width}%` : 'auto',
              }}
              onMouseDown={(e) => handleDragStart(e, overlayText.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setSelectedTextId(overlayText.id);
                setIsEditing(true);
              }}
            >
              {isEditing && selectedTextId === overlayText.id ? (
                <textarea
                  value={overlayText.content}
                  onChange={(e) => handleUpdateOverlayText(overlayText.id, { content: e.target.value })}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none resize-none w-full min-w-[100px]"
                  style={{
                    color: overlayText.style.color || '#ffffff',
                    // ★ 미리보기 모드에 따라 폰트 크기 비율 조절
                    fontSize: `${(overlayText.style.fontSize || 16) * scale}px`,
                    fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                               overlayText.style.fontWeight === 'semibold' ? 600 :
                               overlayText.style.fontWeight === 'medium' ? 500 : 400,
                    fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
                    textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
                    textAlign: overlayText.style.textAlign || 'center',
                    letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing * scale}px` : undefined,
                    lineHeight: overlayText.style.lineHeight || 1.4,
                  }}
                />
              ) : (
                <div
                  style={{
                    color: overlayText.style.color || '#ffffff',
                    backgroundColor: overlayText.style.backgroundColor,
                    padding: overlayText.style.padding,
                    // ★ 미리보기 모드에 따라 폰트 크기 비율 조절
                    fontSize: `${(overlayText.style.fontSize || 16) * scale}px`,
                    fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                               overlayText.style.fontWeight === 'semibold' ? 600 :
                               overlayText.style.fontWeight === 'medium' ? 500 : 400,
                    fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
                    textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
                    textAlign: overlayText.style.textAlign || 'center',
                    letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing * scale}px` : undefined,
                    lineHeight: overlayText.style.lineHeight || 1.4,
                    borderRadius: overlayText.style.padding ? '4px' : undefined,
                    // width 설정 시: 사용자가 조절한 너비 내에서 줄바꿈 허용
                    // width 미설정 시: 자동 줄바꿈 방지 (이동해도 줄어들지 않음)
                    whiteSpace: overlayText.style.width ? 'pre-wrap' : 'nowrap',
                  }}
                >
                  {overlayText.content}
                </div>
              )}
              {/* 리사이즈 핸들 - 선택된 텍스트에만 표시 (8개: 4모서리 + 4변) */}
              {selectedTextId === overlayText.id && !isEditing && (
                <>
                  {/* 왼쪽 변 핸들 */}
                  <div
                    className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-yellow-400 rounded cursor-ew-resize hover:bg-yellow-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'left');
                    }}
                    title="왼쪽으로 확장"
                  />
                  {/* 오른쪽 변 핸들 */}
                  <div
                    className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-8 bg-yellow-400 rounded cursor-ew-resize hover:bg-yellow-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'right');
                    }}
                    title="오른쪽으로 확장"
                  />
                  {/* 왼쪽 상단 모서리 - 너비 + 폰트 크기 조절 */}
                  <div
                    className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-sm cursor-nwse-resize hover:bg-blue-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'corner-tl');
                    }}
                    title="대각선 리사이즈 (너비 + 폰트 크기)"
                  />
                  {/* 오른쪽 상단 모서리 - 너비 + 폰트 크기 조절 */}
                  <div
                    className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-sm cursor-nesw-resize hover:bg-blue-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'corner-tr');
                    }}
                    title="대각선 리사이즈 (너비 + 폰트 크기)"
                  />
                  {/* 왼쪽 하단 모서리 - 너비 + 폰트 크기 조절 */}
                  <div
                    className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-blue-400 rounded-sm cursor-nesw-resize hover:bg-blue-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'corner-bl');
                    }}
                    title="대각선 리사이즈 (너비 + 폰트 크기)"
                  />
                  {/* 오른쪽 하단 모서리 - 너비 + 폰트 크기 조절 */}
                  <div
                    className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-4 h-4 bg-blue-400 rounded-sm cursor-nwse-resize hover:bg-blue-500 border-2 border-white shadow-lg z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleResizeStart(e, overlayText.id, 'corner-br');
                    }}
                    title="대각선 리사이즈 (너비 + 폰트 크기)"
                  />
                  {/* 선택 테두리 표시 */}
                  <div className="absolute inset-0 border-2 border-dashed border-yellow-400 pointer-events-none rounded" />
                </>
              )}
            </div>
          ))}
      </div>

      {/* 상단 도구 버튼 */}
      {isSelected && (
        <div className="absolute top-2 right-2 flex gap-1">
          {/* 레이어 패널 토글 */}
          <Button
            variant={showLayerPanel ? 'default' : 'secondary'}
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setShowLayerPanel(!showLayerPanel);
            }}
          >
            <Layers className="h-4 w-4" />
          </Button>

          {/* 이미지 설정 */}
          <Dialog open={showImageSettings} onOpenChange={setShowImageSettings}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>이미지 설정</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>이미지 URL</Label>
                  <Input
                    value={block.src}
                    onChange={(e) => onUpdate({ src: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>이미지 업로드</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>오버레이 효과</Label>
                  <Select
                    value={block.overlayGradient || 'none'}
                    onValueChange={(value) => onUpdate({ overlayGradient: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="효과 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      <SelectItem value="linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))">하단 어둡게</SelectItem>
                      <SelectItem value="linear-gradient(to top, transparent, rgba(0,0,0,0.5))">상단 어둡게</SelectItem>
                      <SelectItem value="linear-gradient(to bottom, rgba(0,0,0,0.3), transparent, rgba(0,0,0,0.3))">상하단 어둡게</SelectItem>
                      <SelectItem value="radial-gradient(circle, transparent 50%, rgba(0,0,0,0.5))">비네팅</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 텍스트 추가 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAddOverlayText('headline')}>
                <Type className="h-4 w-4 mr-2" />
                헤드라인 (대제목)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('subheadline')}>
                <Type className="h-4 w-4 mr-2" />
                서브헤드라인
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('body')}>
                <Type className="h-4 w-4 mr-2" />
                본문
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddOverlayText('statistic')}>
                <Type className="h-4 w-4 mr-2" />
                통계 (수치)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddOverlayText('cta')}>
                <Type className="h-4 w-4 mr-2" />
                CTA (버튼)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* 레이어 패널 - 포토샵 스타일 (텍스트 편집 패널이 있으면 오른쪽, 없으면 왼쪽) */}
      {isSelected && showLayerPanel && (
        <div className={cn(
          "fixed top-[224px] bottom-6 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col transition-all duration-200",
          selectedText ? "left-[330px]" : "left-6"
        )}>
          {/* 헤더 - 포토샵 스타일 */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
            <span className="text-xs font-medium text-zinc-300">레이어</span>
            <div className="flex items-center gap-1">
              {/* 선택된 레이어 수 표시 */}
              {selectedLayerIds.size > 1 && (
                <span className="text-[10px] text-zinc-500 mr-2">
                  {selectedLayerIds.size}개 선택됨
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                onClick={() => setShowLayerPanel(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 툴바 - 그룹, 폴더 등 */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-zinc-850 border-b border-zinc-700 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              onClick={handleSelectAll}
              title="전체 선택"
            >
              전체
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
              onClick={handleDeselectAll}
              title="선택 해제"
            >
              해제
            </Button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] hover:bg-zinc-700 flex items-center gap-1",
                selectedLayerIds.size >= 2
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-zinc-600 cursor-not-allowed"
              )}
              onClick={handleGroupLayers}
              disabled={selectedLayerIds.size < 2}
              title="선택한 레이어 그룹화 (함께 이동)"
            >
              <Group className="h-3 w-3" />
              그룹
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-2 text-[10px] hover:bg-zinc-700 flex items-center gap-1",
                hasGroupedSelection
                  ? "text-orange-400 hover:text-orange-300"
                  : "text-zinc-600 cursor-not-allowed"
              )}
              onClick={handleUngroupLayers}
              disabled={!hasGroupedSelection}
              title="그룹 해제"
            >
              <Ungroup className="h-3 w-3" />
              해제
            </Button>
            <div className="w-px h-4 bg-zinc-700 mx-1" />
            {/* ★ 폴더 생성 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-zinc-700 flex items-center gap-1"
              onClick={handleCreateFolder}
              title="새 폴더 만들기"
            >
              <Folder className="h-3 w-3" />
              폴더
            </Button>
            {/* ★ 폴더로 이동 드롭다운 */}
            {selectedLayerIds.size > 0 && availableFolders.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-green-400 hover:text-green-300 hover:bg-zinc-700 flex items-center gap-1"
                  >
                    <CornerDownRight className="h-3 w-3" />
                    이동
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 bg-zinc-800 border-zinc-600">
                  {availableFolders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={() => handleMoveToFolder(folder.id)}
                      className="text-xs text-zinc-200 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      <Folder className="h-3 w-3 mr-2 text-yellow-400" />
                      {folder.content}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 미니 프리뷰 */}
          <div className="relative w-full aspect-[3/4] bg-zinc-950 border-b border-zinc-700 overflow-hidden flex-shrink-0">
            {block.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={block.src}
                alt="미니 프리뷰"
                className="w-full h-full object-cover opacity-40"
              />
            )}
            {/* 레이어 위치 표시 */}
            {block.overlayTexts.map((text) => (
              <div
                key={text.id}
                className={cn(
                  'absolute transition-all cursor-pointer',
                  hiddenLayerIds.has(text.id)
                    ? 'bg-zinc-600/30 border border-dashed border-zinc-500'
                    : selectedLayerIds.has(text.id)
                      ? 'bg-blue-500/60 border-2 border-blue-400'
                      : selectedTextId === text.id
                        ? 'bg-blue-500/40 border border-blue-400'
                        : 'bg-white/20 border border-white/40 hover:bg-white/30'
                )}
                style={{
                  left: `${Math.max(2, Math.min(88, text.style.x - 5))}%`,
                  top: `${Math.max(2, Math.min(88, text.style.y - 5))}%`,
                  width: `${Math.max(8, Math.min(25, text.style.width || 12))}%`,
                  height: '8%',
                  borderRadius: '2px',
                }}
                onClick={(e) => handleLayerSelect(text.id, e.ctrlKey || e.metaKey)}
                title={text.content}
              />
            ))}
          </div>

          {/* 레이어 리스트 - 트리 구조 (폴더 지원) */}
          <div className="flex-1 overflow-y-auto">
            {block.overlayTexts.length === 0 ? (
              <div className="text-xs text-zinc-500 text-center py-6">
                레이어가 없습니다
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {getLayerTree().map(({ layer: text, depth }) => (
                    <div
                      key={text.id}
                      className={cn(
                        'flex items-center gap-1 py-2 cursor-pointer transition-colors',
                        selectedLayerIds.has(text.id)
                          ? 'bg-blue-600/30'
                          : selectedTextId === text.id
                            ? 'bg-zinc-700/50'
                            : 'hover:bg-zinc-800',
                        hiddenLayerIds.has(text.id) && 'opacity-40'
                      )}
                      style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: '8px' }}
                      onClick={(e) => handleLayerSelect(text.id, e.ctrlKey || e.metaKey)}
                    >
                      {/* ★ 폴더 펼치기/접기 버튼 (폴더인 경우만) */}
                      {text.isFolder ? (
                        <button
                          className="w-5 h-5 flex items-center justify-center text-yellow-400 hover:text-yellow-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFolderExpand(text.id);
                          }}
                        >
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 transition-transform',
                              text.isExpanded && 'rotate-90'
                            )}
                          />
                        </button>
                      ) : (
                        <div className="w-5" /> // 폴더 아닌 경우 여백
                      )}

                      {/* 가시성 토글 */}
                      <button
                        className={cn(
                          'w-5 h-5 flex items-center justify-center rounded transition-colors',
                          hiddenLayerIds.has(text.id)
                            ? 'text-zinc-600 hover:text-zinc-400'
                            : 'text-zinc-400 hover:text-zinc-200'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLayerVisibility(text.id);
                        }}
                      >
                        {hiddenLayerIds.has(text.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* 잠금 토글 */}
                      <button
                        className={cn(
                          'w-5 h-5 flex items-center justify-center rounded transition-colors',
                          lockedLayerIds.has(text.id)
                            ? 'text-yellow-500 hover:text-yellow-400'
                            : 'text-zinc-600 hover:text-zinc-400'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLayerLock(text.id);
                        }}
                      >
                        {lockedLayerIds.has(text.id) ? (
                          <Lock className="h-3 w-3" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                      </button>

                      {/* 레이어 썸네일 */}
                      <div
                        className="w-8 h-8 rounded border border-zinc-600 flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: text.isFolder ? '#3b3b3b' : (text.style.backgroundColor || 'transparent'),
                        }}
                      >
                        {text.isFolder ? (
                          text.isExpanded ? (
                            <FolderOpen className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Folder className="h-4 w-4 text-yellow-400" />
                          )
                        ) : (
                          <span
                            className="text-[7px] font-bold truncate px-0.5"
                            style={{
                              color: text.style.color || '#fff',
                              fontFamily: text.style.fontFamily,
                            }}
                          >
                            {text.content.substring(0, 3)}
                          </span>
                        )}
                      </div>

                      {/* 레이어 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-200 truncate flex items-center gap-1">
                          {text.groupId && (
                            <Group className="h-3 w-3 text-blue-400 flex-shrink-0" />
                          )}
                          {text.content}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                          {text.isFolder ? (
                            <span className="text-yellow-400/70">폴더</span>
                          ) : (
                            <>
                              {text.type} · {text.style.fontSize}px
                            </>
                          )}
                          {text.groupId && (
                            <span className="text-blue-400/70">그룹</span>
                          )}
                          {text.parentId && (
                            <button
                              className="text-red-400/70 hover:text-red-400 ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromFolder(text.id);
                              }}
                              title="폴더에서 꺼내기"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 순서 조절 버튼 */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(text.id, 'up');
                          }}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          className="w-4 h-4 flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLayer(text.id, 'down');
                          }}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 하단 액션 바 */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-800 border-t border-zinc-700">
            <div className="flex gap-1">
              <button
                className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded"
                onClick={() => handleDuplicateLayer(selectedTextId!)}
                disabled={!selectedTextId}
                title="레이어 복제"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded"
                onClick={() => {
                  if (selectedLayerIds.size > 0) {
                    selectedLayerIds.forEach((id) => handleDeleteOverlayText(id));
                    setSelectedLayerIds(new Set());
                  } else if (selectedTextId) {
                    handleDeleteOverlayText(selectedTextId);
                  }
                }}
                disabled={!selectedTextId && selectedLayerIds.size === 0}
                title="레이어 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-zinc-500">
              {block.overlayTexts.length}개 레이어
            </span>
          </div>
        </div>
      )}

      {/* 선택된 텍스트 편집 패널 - 다크 테마 (레이어 패널과 동일) */}
      {isSelected && selectedText && (
        <div className="fixed top-[224px] bottom-6 left-6 w-72 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col">
          {/* 헤더 - 포토샵 스타일 */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
            <span className="text-xs font-medium text-zinc-300">텍스트 편집</span>
            <div className="flex gap-0.5">
              {/* 서식 복사 */}
              <button
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded hover:bg-zinc-700",
                  copiedStyle ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"
                )}
                onClick={handleCopyStyle}
                title="서식 복사"
              >
                <Paintbrush className="h-3.5 w-3.5" />
              </button>
              {/* 서식 붙여넣기 */}
              <button
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded",
                  copiedStyle
                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                    : "text-zinc-600 cursor-not-allowed"
                )}
                onClick={handlePasteStyle}
                disabled={!copiedStyle}
                title={copiedStyle ? "서식 붙여넣기" : "복사된 서식 없음"}
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
              </button>
              {/* 삭제 */}
              <button
                className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-300 hover:bg-zinc-700"
                onClick={() => handleDeleteOverlayText(selectedTextId!)}
                title="텍스트 삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {/* 닫기 */}
              <button
                className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                onClick={() => setSelectedTextId(null)}
                title="닫기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 스크롤 가능한 컨텐츠 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* 폰트 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">폰트</label>
              <Select
                value={selectedText.style.fontFamily || 'Pretendard, sans-serif'}
                onValueChange={(value) => handleUpdateStyle(selectedTextId!, { fontFamily: value })}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-zinc-800 border-zinc-600 text-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-600">
                  {fontOptions.map((font) => (
                    <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }} className="text-zinc-200 focus:bg-zinc-700 focus:text-zinc-100">
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 크기 & 굵기 */}
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs text-zinc-400">크기</label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={selectedText.style.fontSize || 16}
                    onChange={(e) => handleUpdateStyle(selectedTextId!, { fontSize: Number(e.target.value) })}
                    className="w-full h-8 text-xs bg-zinc-800 border-zinc-600 text-zinc-200"
                    min={8}
                    max={200}
                  />
                  <span className="text-xs text-zinc-500">px</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs text-zinc-400">굵기</label>
                <Select
                  value={selectedText.style.fontWeight || 'normal'}
                  onValueChange={(value) => handleUpdateStyle(selectedTextId!, { fontWeight: value as 'normal' | 'medium' | 'semibold' | 'bold' })}
                >
                  <SelectTrigger className="w-full h-8 text-xs bg-zinc-800 border-zinc-600 text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    <SelectItem value="normal" className="text-zinc-200 focus:bg-zinc-700">Regular</SelectItem>
                    <SelectItem value="medium" className="text-zinc-200 focus:bg-zinc-700">Medium</SelectItem>
                    <SelectItem value="semibold" className="text-zinc-200 focus:bg-zinc-700">Semibold</SelectItem>
                    <SelectItem value="bold" className="text-zinc-200 focus:bg-zinc-700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 색상 */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">색상</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedText.style.color || '#ffffff'}
                  onChange={(e) => handleUpdateStyle(selectedTextId!, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-zinc-600 flex-shrink-0 bg-zinc-800"
                  title="텍스트 색상"
                />
                <Input
                  type="text"
                  value={selectedText.style.color || '#ffffff'}
                  onChange={(e) => handleUpdateStyle(selectedTextId!, { color: e.target.value })}
                  className="flex-1 h-8 text-xs font-mono bg-zinc-800 border-zinc-600 text-zinc-200"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* 정렬 */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">정렬</label>
              <div className="flex border border-zinc-600 rounded w-full overflow-hidden">
                <button
                  className={cn(
                    'flex-1 p-1.5 flex justify-center transition-colors',
                    selectedText.style.textAlign === 'left'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  )}
                  onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'left' })}
                  title="왼쪽 정렬"
                >
                  <AlignLeft className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    'flex-1 p-1.5 flex justify-center border-x border-zinc-600 transition-colors',
                    selectedText.style.textAlign === 'center'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  )}
                  onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'center' })}
                  title="가운데 정렬"
                >
                  <AlignCenter className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    'flex-1 p-1.5 flex justify-center transition-colors',
                    selectedText.style.textAlign === 'right'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  )}
                  onClick={() => handleUpdateStyle(selectedTextId!, { textAlign: 'right' })}
                  title="오른쪽 정렬"
                >
                  <AlignRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 너비 */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">텍스트 박스 너비</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedText.style.width || 0]}
                  onValueChange={([value]) => handleUpdateStyle(selectedTextId!, { width: value === 0 ? undefined : value })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={selectedText.style.width || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Math.max(0, Math.min(100, Number(e.target.value)));
                    handleUpdateStyle(selectedTextId!, { width: value === 0 ? undefined : value });
                  }}
                  placeholder="자동"
                  className="w-14 h-7 text-xs text-center px-1 bg-zinc-800 border-zinc-600 text-zinc-200"
                  min={0}
                  max={100}
                />
                <span className="text-xs text-zinc-500">%</span>
              </div>
            </div>

            {/* 투명도 */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">투명도</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[selectedText.style.opacity || 100]}
                  onValueChange={([value]) => handleUpdateStyle(selectedTextId!, { opacity: value })}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-10 text-right text-zinc-400">{selectedText.style.opacity || 100}%</span>
              </div>
            </div>

            {/* 그림자 토글 */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">텍스트 그림자</label>
              <button
                className={cn(
                  'px-3 py-1 text-xs border border-zinc-600 rounded transition-colors',
                  selectedText.style.textShadow
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                )}
                onClick={() => handleUpdateStyle(selectedTextId!, { textShadow: !selectedText.style.textShadow })}
              >
                {selectedText.style.textShadow ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 미리보기용 렌더러 (편집 불가)
export function ImageOverlayBlockPreview({
  block,
  isMain = false,
}: {
  block: ImageOverlayBlock & { id: string };
  isMain?: boolean;  // MAIN 섹션 여부
}) {
  return (
    <div className="relative rounded-lg overflow-hidden">
      {block.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.src}
          alt={block.alt || '상세페이지 이미지'}
          className="w-full h-auto block"
        />
      ) : (
        <div className="w-full bg-muted" style={{ aspectRatio: '3/4' }} />
      )}

      {block.overlayGradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: block.overlayGradient }}
        />
      )}

      {block.overlayTexts
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((overlayText) => (
          <div
            key={overlayText.id}
            className="absolute"
            style={{
              left: `${overlayText.style.x}%`,
              top: `${overlayText.style.y}%`,
              // textAlign에 따라 변환 기준점 조정: left=왼쪽기준, center=중앙기준, right=오른쪽기준
              transform: `translate(${
                overlayText.style.textAlign === 'left' ? '0' :
                overlayText.style.textAlign === 'right' ? '-100%' : '-50%'
              }, -50%) rotate(${overlayText.style.rotation || 0}deg)`,
              zIndex: overlayText.zIndex || 0,
              opacity: (overlayText.style.opacity || 100) / 100,
              width: overlayText.style.width ? `${overlayText.style.width}%` : 'auto',
              color: overlayText.style.color || '#ffffff',
              backgroundColor: overlayText.style.backgroundColor,
              padding: overlayText.style.padding,
              fontSize: `${overlayText.style.fontSize || 16}px`,
              fontWeight: overlayText.style.fontWeight === 'bold' ? 700 :
                         overlayText.style.fontWeight === 'semibold' ? 600 :
                         overlayText.style.fontWeight === 'medium' ? 500 : 400,
              fontFamily: overlayText.style.fontFamily || 'Pretendard, sans-serif',
              textShadow: overlayText.style.textShadow ? '0 2px 8px rgba(0,0,0,0.8)' : undefined,
              textAlign: overlayText.style.textAlign || 'center',
              letterSpacing: overlayText.style.letterSpacing ? `${overlayText.style.letterSpacing}px` : undefined,
              lineHeight: overlayText.style.lineHeight || 1.4,
              borderRadius: overlayText.style.padding ? '4px' : undefined,
              whiteSpace: overlayText.style.width ? 'pre-wrap' : 'nowrap',
            }}
          >
            {overlayText.content}
          </div>
        ))}
    </div>
  );
}
