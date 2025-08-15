import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new Response(JSON.stringify({ message: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({ message: 'Campos obrigatórios ausentes' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (newPassword.length < 4) {
      return new Response(JSON.stringify({ message: 'A nova senha deve ter pelo menos 4 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificar o usuário no banco de dados pelo email
    const [users] = await db.query('SELECT id, email, password FROM tb_users WHERE email = ?', [session.user.email]);
    
    if (users.length === 0) {
      return new Response(JSON.stringify({ message: 'Usuário não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const user = users[0];

    // Verificar a senha atual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: 'Senha atual incorreta' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar a senha no banco de dados
    const [result] = await db.query(
      'UPDATE tb_users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );
    
    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ message: 'Falha ao atualizar a senha' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Senha atualizada com sucesso',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return new Response(JSON.stringify({ 
      message: 'Erro interno do servidor',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 