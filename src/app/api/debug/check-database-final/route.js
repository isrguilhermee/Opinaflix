import { db } from '../../../../lib/db';

export async function GET(req) {
  try {
    console.log('=== DEBUG FINAL - VERIFICAÇÃO COMPLETA ===');
    
    // 1. Verificar estrutura da tabela de usuários
    const [usersStructure] = await db.query('DESCRIBE tb_users');
    console.log('Estrutura tb_users:', usersStructure);
    
    // 2. Verificar estrutura da tabela de reviews
    const [reviewsStructure] = await db.query('DESCRIBE tb_reviews');
    console.log('Estrutura tb_reviews:', reviewsStructure);
    
    // 3. Buscar todos os usuários
    const [allUsers] = await db.query('SELECT id, username, email FROM tb_users ORDER BY id');
    console.log('Todos os usuários:', allUsers);
    
    // 4. Buscar todas as avaliações com JOIN
    const [allReviews] = await db.query(`
      SELECT r.id, r.userId, r.movieId, r.rating, r.content, 
             u.id as user_table_id, u.username, u.email
      FROM tb_reviews r 
      LEFT JOIN tb_users u ON r.userId = u.id 
      WHERE r.movieId = 1232546
      ORDER BY r.id
    `);
    console.log('Todas as avaliações:', allReviews);
    
    // 5. Verificar tipos de dados específicos
    const typeAnalysis = allReviews.map(review => ({
      reviewId: review.id,
      userId_from_review: review.userId,
      userId_type: typeof review.userId,
      user_table_id: review.user_table_id,
      user_table_id_type: typeof review.user_table_id,
      username: review.username,
      match_check: review.userId === review.user_table_id
    }));
    
    console.log('Análise de tipos:', typeAnalysis);
    
    // 6. Teste específico para zezao
    const [zezaoUser] = await db.query('SELECT * FROM tb_users WHERE username = ?', ['zezao']);
    console.log('Usuário zezao:', zezaoUser);
    
    const [zezaoReviews] = await db.query(`
      SELECT r.*, u.username 
      FROM tb_reviews r 
      LEFT JOIN tb_users u ON r.userId = u.id 
      WHERE r.userId = ? AND r.movieId = 1232546
    `, [zezaoUser[0]?.id]);
    console.log('Avaliações do zezao:', zezaoReviews);
    
    return Response.json({
      success: true,
      data: {
        usersStructure,
        reviewsStructure,
        allUsers,
        allReviews,
        typeAnalysis,
        zezaoUser: zezaoUser[0],
        zezaoReviews,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro no debug final:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 