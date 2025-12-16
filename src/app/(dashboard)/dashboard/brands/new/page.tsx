'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandForm } from '@/components/brands';

export default function NewBrandPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">새 브랜드 만들기</h1>
          <p className="text-muted-foreground">
            브랜드 정보를 입력하여 일관된 콘텐츠를 생성하세요
          </p>
        </div>
      </div>

      {/* Form */}
      <BrandForm mode="create" />
    </div>
  );
}
