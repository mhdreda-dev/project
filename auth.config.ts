import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'

// Edge-safe config: no Prisma adapter, no bcrypt, no Node.js-only imports.
// Used by middleware. The full auth (lib/auth.ts) extends this with the adapter + providers.
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: Role }).role
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
