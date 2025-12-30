'use client';

import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectInfoCard } from './project-info-card';
import { ProductInfoCard } from './product-info-card';
import { DangerZoneCard } from './danger-zone-card';
import type { SettingsFormState } from '../../_types';

interface SettingsTabProps {
  settingsForm: SettingsFormState;
  isSaving: boolean;
  updateForm: (updates: Partial<SettingsFormState>) => void;
  addFeature: () => void;
  updateFeature: (index: number, value: string) => void;
  removeFeature: (index: number) => void;
  handleSave: () => void;
}

export function SettingsTab({
  settingsForm,
  isSaving,
  updateForm,
  addFeature,
  updateFeature,
  removeFeature,
  handleSave,
}: SettingsTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl space-y-6 p-6">
        {/* Project Info */}
        <ProjectInfoCard
          settingsForm={settingsForm}
          onUpdate={updateForm}
        />

        {/* Product Info */}
        <ProductInfoCard
          settingsForm={settingsForm}
          onUpdate={updateForm}
          onAddFeature={addFeature}
          onUpdateFeature={updateFeature}
          onRemoveFeature={removeFeature}
        />

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                설정 저장
              </>
            )}
          </Button>
        </div>

        {/* Danger Zone */}
        <DangerZoneCard />
      </div>
    </ScrollArea>
  );
}
