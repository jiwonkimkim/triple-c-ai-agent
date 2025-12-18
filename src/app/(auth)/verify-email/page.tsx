'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Mail, RefreshCw, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: '이메일을 입력해주세요',
        description: '인증 이메일을 받을 이메일 주소를 입력해주세요.',
      });
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '인증 이메일 발송 완료',
          description: '이메일을 확인해주세요. (개발 모드: 서버 콘솔에서 링크 확인)',
        });
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        toast({
          variant: 'destructive',
          title: '이메일 발송 실패',
          description: data.error || '잠시 후 다시 시도해주세요.',
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '서버 연결에 실패했습니다.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Success state
  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">이메일 인증 완료!</CardTitle>
          <CardDescription>
            이메일이 성공적으로 인증되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>이제 Triple C의 모든 기능을 이용하실 수 있습니다.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/login">로그인하기</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Error state
  if (error) {
    const errorMessages: Record<string, { title: string; description: string }> = {
      invalid_params: {
        title: '잘못된 요청',
        description: '인증 링크가 올바르지 않습니다.',
      },
      invalid_token: {
        title: '유효하지 않은 토큰',
        description: '인증 링크가 유효하지 않거나 이미 사용되었습니다.',
      },
      expired: {
        title: '만료된 링크',
        description: '인증 링크가 만료되었습니다. 새 인증 이메일을 요청해주세요.',
      },
      server_error: {
        title: '서버 오류',
        description: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
    };

    const errorInfo = errorMessages[error] || errorMessages.server_error;

    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">새 인증 이메일 요청</label>
            <Input
              type="email"
              placeholder="이메일 주소 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                발송 중...
              </>
            ) : resendCooldown > 0 ? (
              `${resendCooldown}초 후 재발송 가능`
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                인증 이메일 다시 받기
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
            로그인 페이지로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Default state (waiting for verification)
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <Mail className="h-10 w-10 text-indigo-600" />
        </div>
        <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
        <CardDescription>
          가입하신 이메일로 인증 링크를 보내드렸습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-2">이메일이 도착하지 않았나요?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>스팸 폴더를 확인해주세요</li>
            <li>이메일 주소가 정확한지 확인해주세요</li>
            <li>몇 분 후에 다시 시도해주세요</li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">인증 이메일 재발송</label>
          <Input
            type="email"
            placeholder="이메일 주소 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={handleResendEmail}
          disabled={isResending || resendCooldown > 0}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              발송 중...
            </>
          ) : resendCooldown > 0 ? (
            `${resendCooldown}초 후 재발송 가능`
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              인증 이메일 다시 받기
            </>
          )}
        </Button>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-800">개발 모드 안내</p>
          <p className="text-amber-700 mt-1">
            개발 환경에서는 인증 링크가 서버 콘솔에 출력됩니다.
            터미널에서 인증 URL을 확인하세요.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
          로그인 페이지로 돌아가기
        </Link>
      </CardFooter>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <Suspense fallback={<LoadingFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
