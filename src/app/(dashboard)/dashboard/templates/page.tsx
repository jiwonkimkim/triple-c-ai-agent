'use client';

import { TemplateGallery } from '@/components/templates';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">템플릿 둘러보기</h1>
        <p className="text-muted-foreground">
          다양한 카테고리의 템플릿을 탐색하고 프로젝트에 적용해 보세요.
        </p>
      </div>

      <TemplateGallery />
    </div>
  );
}
