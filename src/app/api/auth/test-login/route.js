import { db } from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    
    console.log('=== TESTE DE LOGIN ===');
    console.log('Email tentativa:', email);
    console.log('Password tentativa:', password);
    
    // Buscar usuário pelo email
    const [users] = await db.query('SELECT * FROM tb_users WHERE email = ?', [email]);
    
    console.log('Usuários encontrados:', users.length);
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado com email:', email);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Usuário não encontrado',
        debug: { email, found: false }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const user = users[0];
    console.log('Usuário encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      hasPassword: !!user.password
    });
    
    // Verificar senha
    if (!user.password) {
      console.log('❌ Usuário sem senha definida');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Senha não definida para este usuário',
        debug: { email, hasPassword: false }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Tentar verificar senha com bcrypt
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log('Verificação bcrypt:', passwordMatch);
    } catch (bcryptError) {
      console.log('Erro bcrypt, tentando comparação direta:', bcryptError.message);
      // Se bcrypt falhar, tentar comparação direta (caso a senha não esteja hasheada)
      passwordMatch = password === user.password;
      console.log('Comparação direta:', passwordMatch);
    }
    
    if (!passwordMatch) {
      console.log('❌ Senha incorreta');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Senha incorreta',
        debug: { 
          email, 
          passwordProvided: password,
          passwordInDb: user.password.substring(0, 10) + '...',
          bcryptAttempted: true
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ Login bem-sucedido');
    
    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Login realizado com sucesso',
      user: userData,
      token: 'test-token-' + user.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Erro no teste de login:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro interno do servidor',
      debug: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 