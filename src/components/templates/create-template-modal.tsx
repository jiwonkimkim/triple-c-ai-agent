'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const categories = [
  { value: 'GENERIC', label: '일반' },
  { value: 'FASHION', label: '패션' },
  { value: 'FOOD', label: '음식' },
  { value: 'BEAUTY', label: '뷰티' },
  { value: 'DIGITAL', label: '디지털' },
];

const sectionTypes = [
  { value: 'HERO', label: '히어로 섹션', description: '메인 비주얼과 헤드라인' },
  { value: 'FEATURES', label: '특징/장점', description: '제품의 주요 특징' },
  { value: 'SOCIAL_PROOF', label: '사회적 증거', description: '리뷰, 수상 내역 등' },
  { value: 'HOW_TO_USE', label: '사용 방법', description: '제품 사용 가이드' },
  { value: 'FAQ', label: 'FAQ', description: '자주 묻는 질문' },
  { value: 'CUSTOM', label: '커스텀', description: '자유 형식 섹션' },
];

interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTemplateModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GENERIC');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { id: '1', type: 'HERO', title: '메인 히어로', content: '' },
  ]);

  const addSection = () => {
    const newSection: Section = {
      id: Date.now().toString(),
      type: 'CUSTOM',
      title: '새 섹션',
      content: '',
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter((s) => s.id !== id));
    }
  };

  const updateSection = (id: string, field: keyof Section, value: string) => {
    setSections(
      sections.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('템플릿 이름을 입력해주세요.');
      return;
    }

    if (sections.length === 0) {
      alert('최소 1개의 섹션이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      // Create template with sections
      const templateSections = sections.map((s, index) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content || `${s.title} 내용을 입력하세요.`,
        order: index,
      }));

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          sections: templateSections,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create template');
      }

      // Reset form
      setName('');
      setCategory('GENERIC');
      setDescription('');
      setSections([{ id: '1', type: 'HERO', title: '메인 히어로', content: '' }]);

      onSuccess?.();
      onClose();
      router.refresh();
    } catch (error: any) {
      alert(error.message || '템플릿 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 템플릿 만들기</DialogTitle>
          <DialogDescription>
            나만의 템플릿을 만들어 프로젝트에 활용하거나 마켓플레이스에서 판매하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">템플릿 이름 *</Label>
            <Input
              id="name"
              placeholder="예: 프리미엄 패션 룩북"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>섹션 구성 *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSection}
              >
                <Plus className="h-4 w-4 mr-1" />
                섹션 추가
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                >
                  <div className="text-muted-foreground pt-2">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <Select
                        value={section.type}
                        onValueChange={(v) => updateSection(section.id, 'type', v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sectionTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="섹션 제목"
                        value={section.title}
                        onChange={(e) =>
                          updateSection(section.id, 'title', e.target.value)
                        }
                        className="flex-1"
                      />
                      {sections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      placeholder="섹션 내용 (선택사항)"
                      value={section.content}
                      onChange={(e) =>
                        updateSection(section.id, 'content', e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              '템플릿 만들기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
