'use client';

import { Coins, AlertCircle, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MarketplaceTemplateData } from './marketplace-template-card';

interface PurchaseConfirmDialogProps {
  template: MarketplaceTemplateData | null;
  userCredits: number | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PurchaseConfirmDialog({
  template,
  userCredits,
  onConfirm,
  onCancel,
}: PurchaseConfirmDialogProps) {
  if (!template) return null;

  const isFree = template.price === 0;
  const hasEnoughCredits = userCredits !== null && userCredits >= template.price;
  const creditsAfterPurchase =
    userCredits !== null ? userCredits - template.price : null;

  return (
    <AlertDialog open={!!template} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isFree ? '무료 템플릿 받기' : '템플릿 구매'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Template Info */}
              <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                {template.thumbnailUrl ? (
                  <img
                    src={template.thumbnailUrl}
                    alt={template.name}
                    className="w-20 h-15 object-cover rounded"
                  />
                ) : (
                  <div className="w-20 h-15 bg-muted-foreground/10 rounded flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">
                    {template.name}
                  </h4>
                  {template.seller && (
                    <p className="text-sm text-muted-foreground">
                      판매자: {template.seller.name}
                    </p>
                  )}
                  <div className="mt-2">
                    <Badge variant={isFree ? 'secondary' : 'default'}>
                      {isFree ? (
                        '무료'
                      ) : (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {template.price} 크레딧
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Credit Balance */}
              {!isFree && userCredits !== null && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">현재 크레딧</span>
                    <span className="font-medium">{userCredits} 크레딧</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">구매 가격</span>
                    <span className="font-medium text-red-500">
                      -{template.price} 크레딧
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">구매 후 잔액</span>
                    <span
                      className={`font-semibold ${
                        hasEnoughCredits ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {creditsAfterPurchase} 크레딧
                    </span>
                  </div>
                </div>
              )}

              {/* Warning if not enough credits */}
              {!isFree && !hasEnoughCredits && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    크레딧이 부족합니다. 크레딧을 충전해주세요.
                  </p>
                </div>
              )}

              {/* Success indicator for free or sufficient credits */}
              {(isFree || hasEnoughCredits) && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    {isFree
                      ? '무료로 이 템플릿을 받을 수 있습니다.'
                      : '구매를 진행할 수 있습니다.'}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!isFree && !hasEnoughCredits}
          >
            {isFree ? '무료로 받기' : '구매하기'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
