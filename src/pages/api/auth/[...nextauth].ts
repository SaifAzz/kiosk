import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();

// Extend the built-in types
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    role: string;
    countryId: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      role: string;
      countryId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    countryId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        token: { label: "Token", type: "text" },
        isAdmin: { label: "Is Admin", type: "text" },
        countryId: { label: "Country ID", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials) {
          return null;
        }
        
        // Handle token-based authentication (from OTP flow)
        if (credentials.token) {
          try {
            const decoded = verify(
              credentials.token,
              process.env.NEXTAUTH_SECRET || 'secret'
            ) as any;
            
            return {
              id: decoded.id,
              name: decoded.name,
              role: decoded.role,
              countryId: decoded.countryId,
            };
          } catch (error) {
            console.error("Token verification error:", error);
            return null;
          }
        }
        
        // For backwards compatibility, keep password-based auth
        // This would be removed in production once fully migrated to OTP
        const { phoneNumber, password, isAdmin, countryId } = credentials;
        
        try {
          if (isAdmin === 'true') {
            const admin = await prisma.admin.findUnique({
              where: { username: phoneNumber },
            });
            
            if (admin && admin.password === password) {
              return {
                id: admin.id,
                name: admin.username,
                role: 'admin',
                countryId: countryId || null,
              };
            }
          } else {
            const user = await prisma.user.findFirst({
              where: { 
                phoneNumber,
                countryId: countryId || undefined
              },
            });
            
            if (user && user.password === password) {
              return {
                id: user.id,
                name: user.phoneNumber, // Using phone number as name since it's always available
                role: 'user',
                countryId: user.countryId,
              };
            }
          }
        } catch (error) {
          console.error("Authentication error:", error);
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.countryId = user.countryId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.countryId = token.countryId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions); 