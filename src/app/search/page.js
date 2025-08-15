'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import SearchInput from '@/components/SearchInput';
import styles from '../styles/Search.module.css';

export default function Search() {
  const [searchResults, setSearchResults] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingMovie, setReviewingMovie] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=f77ef14fb43c96a368bee73dfd8e42af&language=pt-BR`
        );
        setTrendingMovies(response.data.results);
      } catch (error) {
        console.error('Erro ao buscar filmes em alta:', error);
      }
    };

    fetchTrendingMovies();
  }, []);

  const handleMovieSelect = async (movie) => {
    // This function is no longer used in the new version
  };

  const handleSearch = (results) => {
    setSearchResults(results);
    setHasSearched(true);
  };

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
    if (!session) {
      alert('Você precisa estar logado para avaliar um filme');
      return;
    }

    try {
      await axios.post('/api/reviews', {
        movieId: reviewingMovie.id,
        movieTitle: reviewingMovie.title,
        rating: parseInt(rating),
        content
      });
      
      setShowReviewModal(false);
      setReviewingMovie(null);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  const handleCardClick = (movie) => {
    window.location.href = `/reviews?movieId=${movie.id}`;
  };

  const moviesToShow = hasSearched ? searchResults : trendingMovies;
  
  const sectionTitle = hasSearched 
    ? `Resultados da Busca (${searchResults.length} filmes encontrados)`
    : "Filmes em Alta";

  return (
    <div className={styles.container}>
      <h1>Buscar Filmes</h1>
      
      <div className={styles.searchSection}>
        <SearchInput
          onSelect={handleMovieSelect}
          onSearch={handleSearch}
          placeholder="Digite o nome do filme e pressione Enter..."
        />
      </div>

      {moviesToShow.length > 0 && (
        <div>
          <h2>{sectionTitle}</h2>
          <div className={styles.searchResults}>
            {moviesToShow.map((movie) => (
              <div
                key={movie.id}
                className={styles.movieCard}
                onClick={() => handleCardClick(movie)}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                  alt={movie.title}
                />
                <div className={styles.movieInfo}>
                  <h3>{movie.title}</h3>
                  <p>{movie.release_date?.split('-')[0]}</p>
                </div>
                <div className={styles.cardOverlay}>
                  <button
                    className={styles.cardButton}
                    onClick={(e) => handleEvaluate(movie, e)}
                  >
                    Avaliar
                  </button>
                  <button
                    className={styles.cardButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(movie);
                    }}
                  >
                    Ver Avaliações
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSearched && searchResults.length === 0 && (
        <div className={styles.noResults}>
          <h2>Nenhum filme encontrado</h2>
          <p>Tente buscar com outros termos.</p>
        </div>
      )}

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

  const handleRatingChange = (e) => {
    const value = e.target.value;
    // Permitir apenas números inteiros de 0 a 10
    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 10 && Number.isInteger(Number(value)))) {
      setRating(value);
    }
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