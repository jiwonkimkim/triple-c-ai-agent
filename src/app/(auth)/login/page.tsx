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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { useStyleTheme } from '@/contexts/style-theme-context';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<'B2C' | 'B2B'>('B2C');
  const { styleTheme, isLoaded } = useStyleTheme();
  const isSmile = isLoaded && styleTheme === 'smile';

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
        router.push('/dashboard');
        router.refresh();
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
        router.push('/dashboard');
        router.refresh();
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
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className={cn(
        "w-full max-w-md bg-background p-8",
        isSmile ? "border-2 border-border" : "border border-border rounded-lg shadow-sm"
      )}>
        <div className="space-y-1 text-center mb-8">
          <Link href="/" className="mb-4 inline-block">
            <span className={cn(
              "text-2xl font-bold",
              isSmile && "font-black tracking-tighter uppercase"
            )}>Triple C</span>
          </Link>
          <h1 className={cn(
            "text-3xl",
            isSmile ? "font-black tracking-tighter uppercase" : "font-bold"
          )}>
            {isSmile ? "Welcome Back" : "로그인"}
          </h1>
          <p className={cn(
            "text-sm text-muted-foreground",
            isSmile && "uppercase tracking-wider"
          )}>
            계정에 로그인하세요
          </p>
        </div>

        <div className="space-y-6">
          {/* 사용자 유형 탭 */}
          <Tabs value={userType} onValueChange={(v) => setUserType(v as 'B2C' | 'B2B')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
              <TabsTrigger value="B2C" className={cn(
                "flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                isSmile && "uppercase text-xs tracking-wider font-bold"
              )}>
                <User className="h-4 w-4" />
                개인
              </TabsTrigger>
              <TabsTrigger value="B2B" className={cn(
                "flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                isSmile && "uppercase text-xs tracking-wider font-bold"
              )}>
                <Building2 className="h-4 w-4" />
                기업
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            className={cn(
              "w-full h-12",
              isSmile ? "border-2 border-border hover:border-primary hover:bg-muted uppercase text-xs tracking-wider font-bold" : ""
            )}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 계속하기
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className={cn(
                "w-full border-t",
                isSmile && "border-t-2 border-border"
              )} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={cn(
                "bg-background px-4 text-muted-foreground",
                isSmile && "tracking-wider"
              )}>
                또는
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(
                isSmile && "uppercase text-xs tracking-wider font-bold"
              )}>이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={cn(
                  "h-12",
                  isSmile && "border-2 border-border focus:border-primary"
                )}
                disabled={isLoading}
              />
              {errors.email && (
                <p className={cn(
                  "text-sm text-destructive",
                  isSmile && "uppercase tracking-wider"
                )}>{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className={cn(
                  isSmile && "uppercase text-xs tracking-wider font-bold"
                )}>비밀번호</Label>
                <Link href="/forgot-password" className={cn(
                  "text-xs hover:underline",
                  isSmile && "uppercase tracking-wider"
                )}>
                  비밀번호 찾기
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className={cn(
                  "h-12",
                  isSmile && "border-2 border-border focus:border-primary"
                )}
                disabled={isLoading}
              />
              {errors.password && (
                <p className={cn(
                  "text-sm text-destructive",
                  isSmile && "uppercase tracking-wider"
                )}>{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className={cn(
              "w-full h-12",
              isSmile && "uppercase text-xs tracking-wider font-bold"
            )} disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className={cn(
                    "w-full border-t border-dashed border-orange-300",
                    isSmile && "border-t-2"
                  )} />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-orange-500 tracking-wider font-bold">
                    DEV MODE
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600",
                  isSmile && "border-2 uppercase text-xs tracking-wider font-bold"
                )}
                onClick={handleDevLogin}
                disabled={isLoading}
              >
                {userType === 'B2C' ? '개인 개발자 로그인' : '기업 개발자 로그인'}
              </Button>
            </>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className={cn(
            "text-xs text-muted-foreground",
            isSmile && "uppercase tracking-wider"
          )}>
            계정이 없으신가요?{' '}
            <Link href={`/signup?type=${userType}`} className="text-foreground font-bold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
