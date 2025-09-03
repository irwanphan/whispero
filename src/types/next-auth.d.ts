declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      globalRole: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    globalRole: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    globalRole: string;
  }
}
