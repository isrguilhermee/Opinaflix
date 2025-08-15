'use client';

import { useState, useEffect } from 'react';
import styles from './ReviewFilters.module.css';

export default function ReviewFilters({ onFilterChange, currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    selectedRatings: [],
    showOnlyUserReviews: false
  });

  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRatingClick = (rating) => {
    const currentRatings = [...filters.selectedRatings];
    const ratingIndex = currentRatings.indexOf(rating);
    
    if (ratingIndex > -1) {
      currentRatings.splice(ratingIndex, 1);
    } else {
      currentRatings.push(rating);
    }
    
    handleFilterChange({
      ...filters,
      selectedRatings: currentRatings
    });
  };

  const resetFilters = () => {
    const resetFilters = {
      selectedRatings: [],
      showOnlyUserReviews: false
    };
    handleFilterChange(resetFilters);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const hasActiveFilters = filters.selectedRatings.length > 0 || filters.showOnlyUserReviews;

  return (
    <>
      <button 
        className={`${styles.filterButton} ${hasActiveFilters ? styles.active : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <span>🔍 Filtrar</span>
        {hasActiveFilters && <span className={styles.badge}>●</span>}
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Filtrar Avaliações</h3>
              <button className={styles.closeButton} onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.filterGroup}>
                <label>Filtrar por Nota (múltipla seleção):</label>
                <div className={styles.ratingButtons}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                    <button
                      key={rating}
                      className={`${styles.ratingButton} ${filters.selectedRatings.includes(rating) ? styles.selected : ''}`}
                      onClick={() => handleRatingClick(rating)}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {filters.selectedRatings.length > 0 && (
                  <div className={styles.selectedInfo}>
                    Notas selecionadas: {filters.selectedRatings.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={filters.showOnlyUserReviews}
                    onChange={(e) => handleFilterChange({
                      ...filters,
                      showOnlyUserReviews: e.target.checked
                    })}
                    className={styles.checkbox}
                  />
                  <span>Mostrar apenas minhas avaliações</span>
                </label>
                {!currentUser && (
                  <div className={styles.loginPrompt}>
                    <a href="/login">Faça login</a> para filtrar suas avaliações
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={resetFilters}
                className={styles.resetButton}
                disabled={!hasActiveFilters}
              >
                Limpar Filtros
              </button>
              <button 
                onClick={closeModal}
                className={styles.applyButton}
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 