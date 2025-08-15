'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/Reviews.module.css';
import Link from 'next/link';
import RatingChart from '../../components/RatingChart';
import ReviewList from '../../components/ReviewList';
import ReviewFilters from '../../components/ReviewFilters';

export default function MovieReviews() {
  const { data: session, status } = useSession();
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const searchParams = useSearchParams();

  // Criar currentUser a partir da sessão NextAuth
  const currentUser = session?.user ? {
    id: session.user.id,
    username: session.user.name,
    email: session.user.email
  } : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const movieId = searchParams.get('movieId');
      
      if (!movieId) {
        setLoading(false);
        return;
      }
      
      try {
        // Buscar detalhes do filme
        const movieResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        setMovie(movieResponse.data);
        
        // Buscar avaliações
        const reviewsResponse = await axios.get(`/api/reviews?movieId=${movieId}`);
        if (reviewsResponse.data && reviewsResponse.data.reviews) {
          setReviews(reviewsResponse.data.reviews);
          setFilteredReviews(reviewsResponse.data.reviews);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar dados quando a sessão não estiver carregando
    if (status !== 'loading') {
      fetchData();
    }
  }, [searchParams, status]);

  const handleFilterChange = (filters) => {
    let filtered = [...reviews];

    // Filtrar por notas selecionadas (múltiplas)
    if (filters.selectedRatings && filters.selectedRatings.length > 0) {
      filtered = filtered.filter(review => {
        const reviewRating = Math.floor(review.rating);
        return filters.selectedRatings.includes(reviewRating);
      });
    }

    // Filtrar apenas avaliações do usuário
    if (filters.showOnlyUserReviews && currentUser) {
      console.log('Aplicando filtro "minhas avaliações" para usuário:', currentUser.id);
      filtered = filtered.filter(review => {
        // Converter ambos os IDs para números para comparação consistente
        const currentUserId = Number(currentUser.id);
        const reviewUserId = Number(review.userId);
        
        // Verificar se a conversão foi bem-sucedida
        if (isNaN(currentUserId) || isNaN(reviewUserId)) {
          console.warn('Erro na conversão de IDs para números no filtro:', {
            currentUserId: currentUser.id,
            reviewUserId: review.userId
          });
          return false;
        }
        
        const isUserReview = currentUserId === reviewUserId;
        
        console.log(`Review ${review.id}: ${isUserReview ? 'INCLUÍDA' : 'EXCLUÍDA'}`, {
          reviewUserId: review.userId,
          currentUserId: currentUser.id,
          reviewUserIdConverted: reviewUserId,
          currentUserIdConverted: currentUserId,
          match: isUserReview
        });
        
        return isUserReview;
      });
      console.log('Reviews do usuário encontradas:', filtered.length);
    }

    setFilteredReviews(filtered);
  };

  const handleEvaluate = () => {
    if (!session) {
      alert('Você precisa estar logado para avaliar filmes');
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (rating, content) => {
    try {
      const response = await axios.post('/api/reviews', {
        movieId: movie.id,
        movieTitle: movie.title,
        rating: parseInt(rating),
        content: content,
      });

      if (response.data.success) {
        setShowReviewModal(false);
        
        // Recarregar avaliações
        const reviewsResponse = await axios.get(`/api/reviews?movieId=${movie.id}`);
        if (reviewsResponse.data && reviewsResponse.data.reviews) {
          setReviews(reviewsResponse.data.reviews);
          setFilteredReviews(reviewsResponse.data.reviews);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  const handleReviewUpdate = async (reviewId, updatedData) => {
    try {
      console.log('Enviando atualização para review:', reviewId, updatedData);
      const response = await axios.put(`/api/reviews/${reviewId}`, updatedData);
      
      console.log('Resposta da API:', response.data);
      
      if (response.data.success) {
        // Atualizar a lista de avaliações (sem updated_at)
        const updatedReviews = reviews.map(review => 
          review.id === reviewId 
            ? { ...review, ...updatedData }
            : review
        );
        setReviews(updatedReviews);
        setFilteredReviews(updatedReviews);
      } else {
        throw new Error(response.data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert('Erro ao atualizar avaliação: ' + errorMessage);
      throw error;
    }
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      console.log('Excluindo review:', reviewId);
      const response = await axios.delete(`/api/reviews/${reviewId}`);
      
      console.log('Resposta da exclusão:', response.data);
      
      if (response.data.success) {
        // Remover da lista de avaliações
        const updatedReviews = reviews.filter(review => review.id !== reviewId);
        setReviews(updatedReviews);
        setFilteredReviews(updatedReviews);
      } else {
        throw new Error(response.data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
      alert('Erro ao excluir avaliação: ' + errorMessage);
    }
  };

  if (loading || status === 'loading') {
    return <div className={styles.container}>Carregando...</div>;
  }

  if (!movie) {
    return (
      <div className={styles.container}>
        <h1>Filme não encontrado</h1>
        <Link href="/">Voltar para a página inicial</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.movieHeader}>
        <img
          src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
          alt={movie.title}
        />
        <div>
          <h1>{movie.title}</h1>
          <p><strong>Lançamento:</strong> {movie.release_date ? new Date(movie.release_date).toLocaleDateString('pt-BR') : 'Data desconhecida'}</p>
          <p><strong>Avaliação TMDB:</strong> <span className={styles.ratingHighlight}>{movie.vote_average}</span>/10</p>
          <p><strong>Sinopse:</strong> {movie.overview}</p>
          <div className={styles.actions}>
            <button onClick={handleEvaluate} className={styles.actionButton}>
              Avaliar este filme
            </button>
          </div>
        </div>
      </div>

      <div className={styles.reviewsHeader}>
        <h2>Todas as Avaliações ({reviews.length})</h2>
        <div className={styles.headerActions}>
          {reviews.length > 0 && (
            <button 
              className={styles.statsButton}
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? 'Ocultar' : 'Mostrar'} Estatísticas
            </button>
          )}
        </div>
      </div>
      
      {showStats && reviews.length > 0 && (
        <div className={styles.statsContainer}>
          <RatingChart reviews={reviews} />
        </div>
      )}
      
      <ReviewFilters 
        onFilterChange={handleFilterChange}
        currentUser={currentUser}
      />
      
      {filteredReviews.length > 0 ? (
        <ReviewList 
          reviews={filteredReviews} 
          currentUser={currentUser}
          onReviewUpdate={handleReviewUpdate}
          onReviewDelete={handleReviewDelete}
        />
      ) : (
        <p className={styles.noResults}>
          {reviews.length === 0 
            ? 'Ainda não há avaliações para este filme. Seja o primeiro a avaliar!' 
            : 'Nenhuma avaliação encontrada com os filtros aplicados.'
          }
        </p>
      )}

      {/* Modal de Avaliação */}
      {showReviewModal && movie && (
        <ReviewModalComponent
          movie={movie}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}

// Componente Modal de Avaliação
function ReviewModalComponent({ movie, onClose, onSubmit }) {
  const [rating, setRating] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || !content.trim()) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    const ratingNum = parseInt(rating);
    if (ratingNum < 0 || ratingNum > 10) {
      alert('A nota deve estar entre 0 e 10');
      return;
    }
    onSubmit(rating, content);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Avaliar: {movie.title}</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <div className={styles.formGroup}>
            <label htmlFor="rating">Nota (0-10):</label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className={styles.ratingInput}
              required
            >
              <option value="">Selecione uma nota</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="content">Sua avaliação:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.contentTextarea}
              rows="5"
              placeholder="Conte o que achou do filme..."
              required
            />
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton}>
              Enviar Avaliação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 