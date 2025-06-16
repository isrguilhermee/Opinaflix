// app/api/auth/register/route.js
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return new Response(JSON.stringify({ message: 'Campos requisitados faltando.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verifica se usuário já existe
    const [existingUser] = await db.query(
      'SELECT * FROM tb_users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return new Response(JSON.stringify({ message: 'Já existe uma conta com esse nome de usuário ou email.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insere novo usuário
    const [result] = await db.query(
      'INSERT INTO tb_users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    return new Response(
      JSON.stringify({
        message: 'Usuário criado com sucesso!',
        userId: result.insertId,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in registration:', error);
    return new Response(JSON.stringify({ message: 'Erro interno no servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
