import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Tentativa de login para:', email);

    // Buscar o usuário no MySQL
    const [rows] = await db.query('SELECT * FROM tb_users WHERE email = ?', [email]);

    const user = rows[0];

    if (!user) {
      console.log('Usuário não encontrado');
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Usuário encontrado:', { id: user.id, email: user.email, hasImage: !!user.image_url });

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('Senha inválida');
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'sua_chave_jwt_secreta_aqui',
      { expiresIn: '24h' }
    );

    // Certificar-se que a imagem esteja incluída, mesmo se for null
    const userWithImage = {
      ...user,
      image_url: user.image_url || null
    };

    // Remover a senha do retorno
    const { password: _, ...userWithoutPassword } = userWithImage;

    console.log('Login bem-sucedido. Dados retornados:', {
      id: userWithoutPassword.id,
      username: userWithoutPassword.username,
      email: userWithoutPassword.email,
      created_at: userWithoutPassword.created_at,
      image_url: userWithoutPassword.image_url
    });

    return new Response(
      JSON.stringify({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in login:', error);
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
