import { db } from '../../../../lib/db';
import { NextResponse } from 'next/server';

// PUT - Atualizar avaliação
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { rating, content } = await request.json();

    console.log('Tentativa de atualizar avaliação:', { id, rating, content });

    if (rating === null || rating === undefined || !content) {
      return NextResponse.json(
        { success: false, error: 'Rating e content são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se rating está no range correto
    if (rating < 0 || rating > 10) {
      return NextResponse.json(
        { success: false, error: 'A nota deve estar entre 0 e 10' },
        { status: 400 }
      );
    }

    try {
      // Primeiro, buscar a avaliação para verificar se existe e quem é o dono
      const [existingReviews] = await db.query(
        'SELECT userId FROM tb_reviews WHERE id = ?',
        [id]
      );

      if (existingReviews.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Avaliação não encontrada' },
          { status: 404 }
        );
      }

      const review = existingReviews[0];
      console.log('Avaliação encontrada:', { reviewId: id, reviewUserId: review.userId });

      // NOTA: Como estamos usando localStorage, não podemos verificar autenticação no servidor
      // A verificação de permissão deve ser feita no frontend
      // Aqui vamos apenas atualizar a avaliação

      const [result] = await db.query(
        'UPDATE tb_reviews SET rating = ?, content = ? WHERE id = ?',
        [rating, content, id]
      );

      console.log('Resultado da atualização:', result);

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: 'Nenhuma avaliação foi atualizada' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Avaliação atualizada com sucesso!' },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar no banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir avaliação
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    console.log('Tentativa de excluir avaliação:', { id });

    try {
      // Primeiro, buscar a avaliação para verificar se existe
      const [existingReviews] = await db.query(
        'SELECT userId FROM tb_reviews WHERE id = ?',
        [id]
      );

      if (existingReviews.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Avaliação não encontrada' },
          { status: 404 }
        );
      }

      const review = existingReviews[0];
      console.log('Avaliação encontrada para exclusão:', { reviewId: id, reviewUserId: review.userId });

      // NOTA: Como estamos usando localStorage, não podemos verificar autenticação no servidor
      // A verificação de permissão deve ser feita no frontend

      const [result] = await db.query(
        'DELETE FROM tb_reviews WHERE id = ?',
        [id]
      );

      console.log('Resultado da exclusão:', result);

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: 'Nenhuma avaliação foi excluída' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, message: 'Avaliação excluída com sucesso!' },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Erro no banco de dados:', dbError);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir do banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 