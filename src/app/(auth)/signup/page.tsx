'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  email: z.string().email('유효하지 않은 이메일 주소입니다'),
  password: z
    .string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다'
    ),
  confirmPassword: z.string(),
  name: z.string().min(1, '이름을 입력해 주세요'),
  userType: z.enum(['B2C', 'B2B']),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      userType: 'B2C',
    },
  });

  const userType = watch('userType');

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          userType: data.userType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '회원가입에 실패했습니다');
      }

      toast({
        title: '계정이 생성되었습니다!',
        description: '로그인하여 서비스를 이용해 주세요.',
      });

      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: error instanceof Error ? error.message : '문제가 발생했습니다',
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-8">
      <div className="w-full max-w-md bg-background border-2 border-border p-8 rounded-[var(--radius)]">
        <div className="space-y-1 text-center mb-8">
          <Link href="/" className="mb-4 inline-block">
            <span className="text-2xl font-black tracking-tighter uppercase">Triple C</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Create Account</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            마케팅 콘텐츠 제작을 시작하세요
          </p>
        </div>

        <div className="space-y-6">
          <Button
            variant="outline"
            className="w-full border-2 border-border hover:border-primary hover:bg-muted uppercase text-xs tracking-wider font-bold h-12"
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
              <span className="w-full border-t-2 border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground tracking-wider">
                또는
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType" className="uppercase text-xs tracking-wider font-bold">계정 유형</Label>
              <Select
                value={userType}
                onValueChange={(value: 'B2C' | 'B2B') => setValue('userType', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-2 border-border focus:border-primary h-12 uppercase text-xs tracking-wider">
                  <SelectValue placeholder="계정 유형 선택" />
                </SelectTrigger>
                <SelectContent className="border-2 border-border">
                  <SelectItem value="B2C" className="uppercase text-xs tracking-wider">개인 (B2C)</SelectItem>
                  <SelectItem value="B2B" className="uppercase text-xs tracking-wider">기업 (B2B)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="uppercase text-xs tracking-wider font-bold">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                {...register('name')}
                className="border-2 border-border focus:border-primary h-12"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive uppercase tracking-wider">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="uppercase text-xs tracking-wider font-bold">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className="border-2 border-border focus:border-primary h-12"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive uppercase tracking-wider">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="uppercase text-xs tracking-wider font-bold">비밀번호</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                className="border-2 border-border focus:border-primary h-12"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive uppercase tracking-wider">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="uppercase text-xs tracking-wider font-bold">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="border-2 border-border focus:border-primary h-12"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive uppercase tracking-wider">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/80 uppercase text-xs tracking-wider font-bold h-12" disabled={isLoading}>
              {isLoading ? '계정 생성 중...' : '계정 만들기'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">
            계정을 만들면{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              서비스 약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              개인정보 처리방침
            </Link>
            에 동의하게 됩니다.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-foreground font-bold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
