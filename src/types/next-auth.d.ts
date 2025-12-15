import 'next-auth';
import { UserType } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      userType: UserType;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    userType: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    userType: UserType;
  }
}
