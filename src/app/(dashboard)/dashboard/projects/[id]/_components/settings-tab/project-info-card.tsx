'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandSelect } from '@/components/brands';
import type { SettingsFormState } from '../../_types';

interface ProjectInfoCardProps {
  settingsForm: SettingsFormState;
  onUpdate: (updates: Partial<SettingsFormState>) => void;
}

export function ProjectInfoCard({ settingsForm, onUpdate }: ProjectInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>프로젝트 정보</CardTitle>
        <CardDescription>
          프로젝트의 기본 정보를 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-title">프로젝트 제목 *</Label>
          <Input
            id="settings-title"
            value={settingsForm.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="프로젝트 제목"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-description">설명</Label>
          <Textarea
            id="settings-description"
            value={settingsForm.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="프로젝트에 대한 간단한 설명..."
            rows={3}
          />
        </div>

        <BrandSelect
          value={settingsForm.brandProfileId}
          onChange={(value) => onUpdate({ brandProfileId: value })}
        />
      </CardContent>
    </Card>
  );
}
