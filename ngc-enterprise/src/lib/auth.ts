import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { Role as PrismaRole, type Role } from "@prisma/client"

type AuthorizedUser = {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
  organizationId: string | null
}

const roles = new Set<string>(Object.values(PrismaRole))

function getTokenRole(role: unknown): Role {
  return typeof role === "string" && roles.has(role)
    ? (role as Role)
    : PrismaRole.READ_ONLY
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthorizedUser | null> {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : ""
        const password =
          typeof credentials?.password === "string" ? credentials.password : ""

        if (!email || !password) {
          return null
        }

        const { prisma } = await import("@/lib/db")

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            organizationId: true,
            passwordHash: true,
            isActive: true,
          },
        })

        if (!user?.passwordHash || !user.isActive) {
          return null
        }

        const passwordMatches = await compare(password, user.passwordHash)

        if (!passwordMatches) {
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          organizationId: user.organizationId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }

      return token
    },
    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : ""
      session.user.role = getTokenRole(token.role)
      session.user.organizationId =
        typeof token.organizationId === "string" ? token.organizationId : null
      session.user.name = typeof token.name === "string" ? token.name : null
      session.user.email = typeof token.email === "string" ? token.email : ""
      session.user.image =
        typeof token.picture === "string" ? token.picture : null

      return session
    },
  },
})
