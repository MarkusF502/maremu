// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor, insira e-mail e senha.");
        }

        // 1. Procura o usuário pelo e-mail no PostgreSQL via Prisma
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.senhaHash) {
          throw new Error("E-mail não cadastrado ou usuário inválido.");
        }

        // 2. Compara a senha digitada com o hash salvo no banco
        const isPasswordValid = await bcrypt.compare(credentials.password, user.senhaHash);

        if (!isPasswordValid) {
          throw new Error("Senha incorreta.");
        }

        // 3. Retorna os dados que ficarão guardados na sessão criptografada
        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          perfil: user.perfil,
          lojaId: user.lojaId
        };
      }
    })
  ],
  pages: {
    signIn: "/login", // Redireciona para sua tela customizada se tentar acessar algo protegido
  },
  session: {
    strategy: "jwt", // Define o uso de tokens criptografados nos cookies
  },
  callbacks: {
    // Injeta os dados do usuário (como o id da loja e perfil) dentro do token JWT do NextAuth
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.perfil = (user as any).perfil;
        token.lojaId = (user as any).lojaId;
      }
      return token;
    },
    // Torna esses dados acessíveis no front-end via useSession()
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).perfil = token.perfil;
        (session.user as any).lojaId = token.lojaId;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };