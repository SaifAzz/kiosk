import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../lib/prisma";
import * as bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        isAdmin: { label: "Is Admin", type: "boolean" },
        countryId: { label: "Country ID", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.password || !credentials?.countryId) {
          return null;
        }

        const isAdmin = credentials.isAdmin === "true";

        if (isAdmin) {
          const admin = await prisma.admin.findFirst({
            where: {
              username: credentials.phoneNumber,
              countryId: credentials.countryId,
            },
          });

          if (!admin) return null;

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            admin.password
          );

          if (!isValidPassword) return null;

          return {
            id: admin.id,
            name: admin.username,
            countryId: admin.countryId,
            role: "admin",
          };
        } else {
          const user = await prisma.user.findFirst({
            where: {
              phoneNumber: credentials.phoneNumber,
              countryId: credentials.countryId,
            },
          });

          if (!user) return null;

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValidPassword) return null;

          return {
            id: user.id,
            name: user.phoneNumber,
            countryId: user.countryId,
            role: "user",
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.countryId = user.countryId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.countryId = token.countryId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 