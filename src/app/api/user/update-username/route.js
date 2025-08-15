import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export async function POST(req) {
  try {
    console.log('Iniciando atualização de nome de usuário');
    const session = await getServerSession();
    
    if (!session) {
      console.log('Usuário não autenticado');
      return new Response(JSON.stringify({ message: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Sessão do usuário:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    });

    const { username } = await req.json();
    console.log('Novo nome recebido:', username);

    if (!username || username.trim().length === 0) {
      console.log('Nome de usuário inválido');
      return new Response(JSON.stringify({ message: 'Nome de usuário inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verifica o usuário no banco de dados pelo email
    console.log('Verificando usuário no banco de dados...');
    const [users] = await db.query('SELECT id, email FROM tb_users WHERE email = ?', [session.user.email]);
    
    if (users.length === 0) {
      console.log(`Usuário com email ${session.user.email} não encontrado no banco de dados`);
      return new Response(JSON.stringify({ 
        message: 'Usuário não encontrado',
        details: `Usuário com email ${session.user.email} não encontrado` 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const userId = users[0].id;
    console.log(`Usuário encontrado no banco de dados. ID: ${userId}`);

    // Atualiza o nome do usuário no banco de dados
    console.log(`Atualizando nome de usuário para "${username}" no banco de dados...`);
    const [result] = await db.query(
      'UPDATE tb_users SET username = ? WHERE id = ?',
      [username, userId]
    );
    
    console.log('Resultado da atualização:', result);
    if (result.affectedRows === 0) {
      console.log(`Nenhuma linha atualizada para o usuário ID: ${userId}`);
      return new Response(JSON.stringify({ 
        message: 'Falha ao atualizar o nome',
        details: 'Nenhuma linha foi atualizada no banco de dados' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Nome atualizado com sucesso no banco de dados');
    return new Response(JSON.stringify({ 
      message: 'Nome atualizado com sucesso',
      userId: userId,
      newUsername: username
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar nome de usuário:', error);
    return new Response(JSON.stringify({ 
      message: 'Erro interno do servidor',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 