'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from './SearchInput.module.css';

export default function SearchInput({ onSelect, onSearch, placeholder = 'Busque por um filme...' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    // Função para fechar sugestões ao clicar fora
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/search/movie?api_key=f77ef14fb43c96a368bee73dfd8e42af&query=${searchQuery}&language=pt-BR`
        );
        setSuggestions(response.data.results.slice(0, 5)); // Limita a 5 sugestões
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce para evitar muitas requisições
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (movie) => {
    setSearchQuery(movie.title);
    setShowSuggestions(false);
    
    // Redirecionar para a página de avaliações do filme
    window.location.href = `/reviews?movieId=${movie.id}`;
  };

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        setLoading(true);
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=f77ef14fb43c96a368bee73dfd8e42af&query=${searchQuery}&language=pt-BR`
          );
          onSearch(response.data.results);
        } catch (error) {
          console.error('Erro ao buscar filmes:', error);
          onSearch([]);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className={styles.searchContainer} ref={searchContainerRef}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className={styles.searchInput}
        />
        {loading && <div className={styles.loader}></div>}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((movie) => (
            <li
              key={movie.id}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(movie)}
            >
              <div className={styles.suggestionContent}>
                {movie.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title}
                    className={styles.suggestionImage}
                  />
                )}
                <div className={styles.suggestionInfo}>
                  <h4>{movie.title}</h4>
                  <p>{movie.release_date?.split('-')[0]}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 