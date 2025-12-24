'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Wallet, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarketplaceGallery } from '@/components/marketplace';
import { MyTemplatesTab } from '@/components/marketplace/my-templates-tab';
import { PurchasedTemplatesTab } from '@/components/marketplace/purchased-templates-tab';
import { QuickUploadModal } from '@/components/marketplace/quick-upload-modal';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Handle tab query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['all', 'my', 'purchased'].includes(tab)) {
      setActiveTab(tab);
      router.replace('/dashboard/marketplace', { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">템플릿 마켓플레이스</h1>
            <p className="text-muted-foreground mt-1">
              템플릿을 탐색하고, 만들고, 판매하세요
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            업로드
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/seller">
              <Wallet className="h-4 w-4 mr-2" />
              판매자 센터
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="my">내 템플릿</TabsTrigger>
          <TabsTrigger value="purchased">구매함</TabsTrigger>
        </TabsList>

        {/* All Templates Tab */}
        <TabsContent value="all" className="mt-6">
          <MarketplaceGallery />
        </TabsContent>

        {/* My Templates Tab */}
        <TabsContent value="my" className="mt-6">
          <MyTemplatesTab />
        </TabsContent>

        {/* Purchased Templates Tab */}
        <TabsContent value="purchased" className="mt-6">
          <PurchasedTemplatesTab />
        </TabsContent>
      </Tabs>

      {/* Quick Upload Modal */}
      <QuickUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
