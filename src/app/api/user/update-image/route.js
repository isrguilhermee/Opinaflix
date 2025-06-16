import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return new Response(JSON.stringify({ message: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verifica se o email do usuário está disponível
    if (!session.user.email) {
      return new Response(JSON.stringify({ message: 'Email do usuário não encontrado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file) {
      return new Response(JSON.stringify({ message: 'Nenhuma imagem fornecida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verifica o tipo do arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return new Response(JSON.stringify({ message: 'Tipo de arquivo inválido. Use JPEG, PNG ou WEBP.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verifica o tamanho do arquivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ message: 'Arquivo muito grande. Máximo de 5MB.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Define os caminhos
    const publicPath = join(process.cwd(), 'public', 'uploads');
    
    // Cria o diretório de uploads se não existir
    if (!existsSync(publicPath)) {
      await mkdir(publicPath, { recursive: true });
    }

    // Gera um nome único para o arquivo
    const ext = file.type.split('/')[1];
    const fileName = `user-${Date.now()}.${ext}`;
    const filePath = join(publicPath, fileName);
    
    try {
      // Converte o arquivo para um Buffer e salva
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);
      
      // Define o caminho relativo para o frontend
      const imageUrl = `/uploads/${fileName}`;
      
      // Verifica o usuário no banco de dados pelo email
      try {
        const [users] = await db.query('SELECT id, email FROM tb_users WHERE email = ?', [session.user.email]);
        
        if (users.length === 0) {
          throw new Error(`Usuário com email ${session.user.email} não encontrado no banco de dados`);
        }
        
        const userId = users[0].id;
        
        // Atualiza o banco de dados com a URL da imagem
        const [result] = await db.query('UPDATE tb_users SET image_url = ? WHERE id = ?', [imageUrl, userId]);
        
        if (result.affectedRows === 0) {
          throw new Error(`Nenhuma linha foi atualizada para o usuário ID: ${userId}`);
        }
        
        return new Response(JSON.stringify({ 
          message: 'Imagem atualizada com sucesso',
          imageUrl: imageUrl
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (dbError) {
        throw new Error(`Erro ao atualizar o banco de dados: ${dbError.message}`);
      }
    } catch (fileError) {
      return new Response(JSON.stringify({ 
        message: 'Erro ao salvar a imagem',
        error: fileError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      message: 'Erro interno do servidor',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 