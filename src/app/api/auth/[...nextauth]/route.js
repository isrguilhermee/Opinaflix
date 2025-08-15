import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "email@example.com" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          const res = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            headers: { "Content-Type": "application/json" }
          });
        
          if (!res.ok) {
            console.log('Falha na autenticação:', await res.text());
            return null;
          }
        
          const data = await res.json();
        
          if (data && data.user) {
            console.log('Dados do usuário recebidos:', data.user);
            const userInfo = {
              id: data.user.id.toString(),
              name: data.user.username,
              email: data.user.email,
              image: data.user.image_url || '/default-avatar.svg',
            };
            
            console.log('Informações do usuário formatadas:', userInfo);
            return userInfo;
          }
        
          return null;
        } catch (error) {
          console.error('Erro durante autorização:', error);
          return null;
        }
      }         
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async session({ session, token }) {
      console.log('Session callback - Token:', token);
      if (token) {
        // Garantir que o ID seja sempre uma string
        session.user = {
          ...session.user,
          id: token.sub || token.id,
          name: token.name,
          email: token.email,
          image: token.picture || '/default-avatar.svg'
        };
      }
      console.log('Session callback - Session atualizada:', session);
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      console.log('JWT callback - Token atual:', token);
      console.log('JWT callback - Usuário:', user);
      
      // Initial signin
      if (user) {
        console.log('JWT callback - Novo login, atualizando token com dados do usuário');
        // Garantir que o ID seja armazenado tanto em sub quanto em id
        token.sub = user.id;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      
      // Update token if session was updated
      if (trigger === 'update' && session) {
        console.log('JWT callback - Atualizando token com dados da sessão');
        // Importante: manter o ID e email constantes
        token.name = session.user.name;
        token.picture = session.user.image;
      }
      
      console.log('JWT callback - Token final:', token);
      return token;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || 'sua_chave_secreta_super_segura_aqui',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
