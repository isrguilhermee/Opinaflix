'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './styles/Home.module.css';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function Home() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingMovie, setReviewingMovie] = useState(null);
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=pt-BR`
        );
        setTrendingMovies(response.data.results);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trending movies:', error);
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    const selectedMovieParam = searchParams.get('selectedMovie');
    if (selectedMovieParam) {
      try {
        const movie = JSON.parse(decodeURIComponent(selectedMovieParam));
        setSelectedMovie(movie);
      } catch (error) {
        console.error('Error parsing selectedMovie:', error);
      }
    }
  }, [searchParams]);

  const handleEvaluate = (movie, e) => {
    e.stopPropagation();
    if (!session) {
      alert('Você precisa estar logado para avaliar filmes');
      return;
    }
    setReviewingMovie(movie);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (rating, content) => {
    try {
      const response = await axios.post('/api/reviews', {
        movieId: reviewingMovie.id,
        movieTitle: reviewingMovie.title,
        rating: parseInt(rating),
        content: content,
      });

      if (response.data.success) {
        setShowReviewModal(false);
        setReviewingMovie(null);
        
        window.location.href = `/reviews?movieId=${reviewingMovie.id}`;
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  return (
    <>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Bem-vindo ao Opinaflix</h1>
          <p>Descubra e compartilhe seus filmes favoritos</p>
          <div className={styles.ctaButtons}>
            <Link href="/search">
              <button className={styles.primaryButton}>Buscar Filmes</button>
            </Link>
          </div>
        </div>
      </div>
      
      <section className={styles.trendingSection}>
        <h2>Filmes em Alta</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className={styles.movieGrid}>
            {trendingMovies.map((movie) => (
              <div
                key={movie.id}
                className={styles.movieCard}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => {
                  window.location.href = `/reviews?movieId=${movie.id}`;
                }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                />
                <h3>{movie.title}</h3>
                <p>Avaliação: <span>{movie.vote_average.toFixed(1)}</span>/10</p>
                <div className={styles.cardOverlay}>
                  <button
                    className={styles.cardButton}
                    onClick={e => handleEvaluate(movie, e)}
                  >Avaliar</button>
                  <button
                    className={styles.cardButton}
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/reviews?movieId=${movie.id}`;
                    }}
                  >Ver Avaliações</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal de Avaliação */}
      {showReviewModal && reviewingMovie && (
        <ReviewModalComponent
          movie={reviewingMovie}
          onClose={() => {
            setShowReviewModal(false);
            setReviewingMovie(null);
          }}
          onSubmit={handleSubmitReview}
        />
      )}
    </>
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
