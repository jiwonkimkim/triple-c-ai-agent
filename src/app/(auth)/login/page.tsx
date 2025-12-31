'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginInput } from '@/lib/validations';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'B2C' | 'B2B'>('B2C');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: result.error,
        });
      } else {
        toast({
          title: '환영합니다!',
          description: '성공적으로 로그인되었습니다.',
        });
        // Use hard redirect to ensure session cookie is properly set
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '문제가 발생했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: 'Google 로그인에 실패했습니다.',
      });
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signIn('dev-login', {
        userType,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: '개발 로그인 실패',
          description: result.error,
        });
      } else {
        toast({
          title: '개발자 모드',
          description: userType === 'B2C' ? '개인 개발자로 로그인 되었습니다.' : '기업 개발자로 로그인 되었습니다.',
        });
        // Use hard redirect to ensure session cookie is properly set
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '개발 로그인에 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="mb-4 inline-block">
            <span className="text-2xl font-bold text-primary">Triple C</span>
          </Link>
          <CardTitle className="text-2xl">다시 오신 것을 환영합니다</CardTitle>
          <CardDescription>
            계정에 로그인하려면 정보를 입력해 주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 사용자 유형 탭 */}
          <Tabs value={userType} onValueChange={(v) => setUserType(v as 'B2C' | 'B2B')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="B2C" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                개인 사용자
              </TabsTrigger>
              <TabsTrigger value="B2B" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                기업 사용자
              </TabsTrigger>
            </TabsList>

            <TabsContent value="B2C" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center">
                개인 크리에이터를 위한 로그인
              </p>
            </TabsContent>

            <TabsContent value="B2B" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground text-center">
                기업 및 팀을 위한 로그인
              </p>
            </TabsContent>
          </Tabs>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 계속하기
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는 이메일로 계속
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                error={!!errors.email}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                error={!!errors.password}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
              로그인
            </Button>
          </form>

          {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true') && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-dashed border-orange-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-orange-500">
                    개발자 전용
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                onClick={handleDevLogin}
                disabled={isLoading}
              >
                {userType === 'B2C' ? '🔧 개인 개발자 로그인 (인증 불필요)' : '🏢 기업 개발자 로그인 (인증 불필요)'}
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href={`/signup?type=${userType}`} className="text-primary hover:underline">
              {userType === 'B2C' ? '개인 회원가입' : '기업 회원가입'}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
