'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Store,
  Coins,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  History,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface DashboardData {
  balance: {
    available: number;
    totalEarned: number;
    totalWithdrawn: number;
  };
  stats: {
    publishedTemplates: number;
    totalSales: number;
    monthlySales: number;
    monthlyEarnings: number;
  };
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    balance: number;
    description?: string;
    createdAt: string;
  }[];
  topTemplates: {
    id: string;
    name: string;
    thumbnailUrl?: string | null;
    price: number;
    downloadCount: number;
    rating?: number | null;
  }[];
}

interface SellerTemplate {
  id: string;
  name: string;
  category: string;
  thumbnailUrl?: string | null;
  price: number;
  isPublished: boolean;
  downloadCount: number;
  salesCount: number;
  totalEarnings: number;
  createdAt: string;
}

export default function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [templates, setTemplates] = useState<SellerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardRes, templatesRes] = await Promise.all([
        fetch('/api/seller/dashboard'),
        fetch('/api/seller/templates'),
      ]);

      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setDashboard(data);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      alert('최소 출금 금액은 10 크레딧입니다.');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/seller/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Withdrawal failed');
      }

      setWithdrawOpen(false);
      setWithdrawAmount('');
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || '출금에 실패했습니다.');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard/marketplace">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Store className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">판매자 센터</h1>
            <p className="text-muted-foreground">
              템플릿 판매 현황과 수익을 관리하세요
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/marketplace?tab=my">
            <Plus className="h-4 w-4 mr-2" />
            새 템플릿 만들기
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              출금 가능 잔액
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.balance.available || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                크레딧
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setWithdrawOpen(true)}
              disabled={!dashboard?.balance.available}
            >
              출금하기
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 수익
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.balance.totalEarned || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                크레딧
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              출금: {dashboard?.balance.totalWithdrawn || 0} 크레딧
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 달 판매
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.stats.monthlySales || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                건
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              수익: {dashboard?.stats.monthlyEarnings || 0} 크레딧
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              등록된 템플릿
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.stats.publishedTemplates || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                개
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              총 판매: {dashboard?.stats.totalSales || 0}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">내 템플릿</TabsTrigger>
          <TabsTrigger value="transactions">거래 내역</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  아직 등록된 템플릿이 없습니다
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/marketplace?tab=my">템플릿 만들기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {template.thumbnailUrl ? (
                      <img
                        src={template.thumbnailUrl}
                        alt={template.name}
                        className="w-20 h-15 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-15 bg-muted rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{template.name}</h3>
                        <Badge
                          variant={template.isPublished ? 'default' : 'secondary'}
                        >
                          {template.isPublished ? '판매중' : '비공개'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>
                          {template.price === 0 ? '무료' : `${template.price} 크레딧`}
                        </span>
                        <span>판매 {template.salesCount}건</span>
                        <span>다운로드 {template.downloadCount}회</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {template.totalEarnings} 크레딧
                      </p>
                      <p className="text-xs text-muted-foreground">총 수익</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {!dashboard?.recentTransactions?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  아직 거래 내역이 없습니다
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>최근 거래 내역</CardTitle>
                <CardDescription>최근 거래 및 출금 내역입니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            tx.type === 'SALE'
                              ? 'bg-green-100 dark:bg-green-900'
                              : 'bg-orange-100 dark:bg-orange-900'
                          }`}
                        >
                          {tx.type === 'SALE' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.type === 'SALE' ? '판매 수익' : '출금'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.description || formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                          }`}
                        >
                          {tx.amount > 0 ? '+' : ''}
                          {tx.amount} 크레딧
                        </p>
                        <p className="text-xs text-muted-foreground">
                          잔액: {tx.balance}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수익 출금</DialogTitle>
            <DialogDescription>
              판매 수익을 내 크레딧으로 전환합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">출금 가능 잔액</span>
                <span className="font-bold">
                  {dashboard?.balance.available || 0} 크레딧
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">출금할 금액</Label>
              <Input
                id="amount"
                type="number"
                placeholder="출금할 크레딧 수"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min={10}
                max={dashboard?.balance.available || 0}
              />
              <p className="text-xs text-muted-foreground">
                최소 출금 금액: 10 크레딧
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              취소
            </Button>
            <Button onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                '출금하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
