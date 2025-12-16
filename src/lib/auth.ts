import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          userType: 'B2C',
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          userType: user.userType,
        };
      },
    }),
    // Development-only login provider (no authentication required)
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            id: 'dev-login',
            name: 'dev-login',
            credentials: {},
            async authorize() {
              // Find or create dev user in database
              const devEmail = 'dev@example.com';

              let user = await prisma.user.findUnique({
                where: { email: devEmail },
              });

              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email: devEmail,
                    name: 'Developer',
                    emailVerified: new Date(),
                    userType: 'B2C',
                    trialCredits: 100,
                  },
                });
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                userType: user.userType,
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
    newUser: '/onboarding',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name;
        token.image = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as 'B2C' | 'B2B';
      }
      return session;
    },
    async signIn({ user, account }) {
      // Allow OAuth sign in
      if (account?.provider !== 'credentials') {
        return true;
      }

      // For credentials, user is already validated in authorize
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Give new users trial credits
      await prisma.user.update({
        where: { id: user.id },
        data: { trialCredits: 3 },
      });
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate email verification token
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
