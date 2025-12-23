import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

// Validation schemas
const b2cSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1, 'Name is required').optional(),
  nickname: z.string().optional(),
  industry: z.string().optional(),
  userType: z.literal('B2C'),
});

const b2bSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1, 'Name is required'),
  userType: z.literal('B2B'),
  companyName: z.string().min(1, 'Company name is required'),
  companyDomain: z.string().min(1, 'Company domain is required'),
  businessNumber: z.string().optional(),
  companySize: z.enum(['SMB', 'Mid', 'Enterprise']).optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactPosition: z.string().optional(),
  contactPhone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userType = body.userType;

    // Validate based on user type
    let validatedData;
    if (userType === 'B2B') {
      validatedData = b2bSignupSchema.parse(body);
    } else {
      validatedData = b2cSignupSchema.parse(body);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user based on type
    if (userType === 'B2B') {
      const b2bData = validatedData as z.infer<typeof b2bSignupSchema>;

      // Extract domain from email for validation
      const emailDomain = b2bData.email.split('@')[1];
      if (emailDomain !== b2bData.companyDomain && !b2bData.companyDomain.includes(emailDomain)) {
        return NextResponse.json(
          { success: false, error: 'Email domain must match company domain' },
          { status: 400 }
        );
      }

      // Create company
      let company = await prisma.company.findUnique({
        where: { domain: b2bData.companyDomain },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: b2bData.companyName,
            domain: b2bData.companyDomain,
            businessNumber: b2bData.businessNumber,
            size: b2bData.companySize,
          },
        });
      }

      // Create user with emailVerified set immediately
      const user = await prisma.user.create({
        data: {
          email: b2bData.email,
          passwordHash,
          name: b2bData.name,
          userType: 'B2B',
          trialCredits: 3,
          emailVerified: new Date(),
        },
      });

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: `${b2bData.companyName} Workspace`,
          companyId: company.id,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            message: '계정이 생성되었습니다. 로그인해 주세요.',
          },
        },
        { status: 201 }
      );
    } else {
      // B2C signup
      const b2cData = validatedData as z.infer<typeof b2cSignupSchema>;

      const user = await prisma.user.create({
        data: {
          email: b2cData.email,
          passwordHash,
          name: b2cData.name,
          nickname: b2cData.nickname,
          industry: b2cData.industry,
          userType: 'B2C',
          trialCredits: 3,
          emailVerified: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: {
            userId: user.id,
            message: '계정이 생성되었습니다. 로그인해 주세요.',
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
