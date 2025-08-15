'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ReviewList.module.css';
import ReviewModal from './ReviewModal';

export default function ReviewList({ reviews, currentUser, onReviewUpdate, onReviewDelete }) {
  const [selectedReview, setSelectedReview] = useState(null);
  const [truncatedReviews, setTruncatedReviews] = useState({});
  const [editingReview, setEditingReview] = useState(null);

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    // Encontra o último espaço antes do limite para não cortar palavras no meio
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
    const truncatedText = text.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    return `${truncatedText}...`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para verificar se o texto está sendo truncado
  const checkIfTruncated = (reviewId, text) => {
    // Simula o comportamento do CSS -webkit-line-clamp
    // Aproximadamente 4 linhas com ~80 caracteres por linha
    const approximateMaxChars = 320;
    return text && text.length > approximateMaxChars;
  };

  useEffect(() => {
    const truncatedState = {};
    reviews.forEach(review => {
      truncatedState[review.id] = checkIfTruncated(review.id, review.content);
    });
    setTruncatedReviews(truncatedState);
  }, [reviews]);

  const handleEdit = (review) => {
    setEditingReview(review);
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      if (onReviewDelete) {
        await onReviewDelete(reviewId);
      }
    }
  };

  const canEditReview = (review) => {
    if (!currentUser) {
      return false;
    }
    
    // Converter ambos os IDs para números para comparação consistente
    const currentUserId = Number(currentUser.id);
    const reviewUserId = Number(review.userId);
    
    // Debug apenas quando necessário
    if (process.env.NODE_ENV === 'development') {
      console.log('Verificando permissão de edição para review:', review.id);
      console.log('Current user ID (original):', currentUser.id, 'tipo:', typeof currentUser.id);
      console.log('Review userId (original):', review.userId, 'tipo:', typeof review.userId);
      console.log('Current user ID (convertido):', currentUserId, 'tipo:', typeof currentUserId);
      console.log('Review userId (convertido):', reviewUserId, 'tipo:', typeof reviewUserId);
    }
    
    // Verificar se a conversão foi bem-sucedida
    if (isNaN(currentUserId) || isNaN(reviewUserId)) {
      console.warn('Erro na conversão de IDs para números:', {
        currentUserId: currentUser.id,
        reviewUserId: review.userId
      });
      return false;
    }
    
    // Comparação usando números convertidos
    const canEdit = currentUserId === reviewUserId;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Resultado da comparação:', canEdit);
      console.log('========================');
    }
    
    return canEdit;
  };

  // Função para obter a URL da imagem do usuário
  const getUserImage = (review) => {
    if (review.image_url) {
      // Se a image_url já for uma URL completa (http/https), usar diretamente
      if (review.image_url.startsWith('http://') || review.image_url.startsWith('https://')) {
        return review.image_url;
      }
      // Caso contrário, assumir que é um caminho relativo
      return review.image_url;
    }
    // Retornar imagem padrão se não houver imagem
    return '/default-avatar.svg';
  };

  return (
    <div className={styles.reviewsContainer}>
      {reviews.map((review) => {
        const canEdit = canEditReview(review);
        
        return (
          <div
            key={review.id}
            className={styles.reviewCard}
          >
            <div className={styles.reviewHeader}>
              <span className={styles.rating}>{review.rating}/10</span>
              <div className={styles.headerRight}>
                <span className={styles.date}>{formatDate(review.created_at)}</span>
                {canEdit && (
                  <div className={styles.reviewActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => handleEdit(review)}
                      title="Editar avaliação"
                    >
                      ✏️
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(review.id)}
                      title="Excluir avaliação"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.contentWrapper}>
              <p className={styles.content}>{review.content}</p>
              {truncatedReviews[review.id] && (
                <button 
                  className={styles.seeMoreButton}
                  onClick={() => setSelectedReview(review)}
                >
                  ver mais...
                </button>
              )}
            </div>
            
            <div className={styles.author}>
              <img 
                src={getUserImage(review)} 
                alt={`Foto de ${review.username || 'Usuário'}`}
                className={styles.userAvatar}
                onError={(e) => {
                  e.target.src = '/default-avatar.svg';
                }}
              />
              <span>Por: {review.username || 'Visitante'}</span>
            </div>
          </div>
        );
      })}

      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}

      {editingReview && (
        <EditReviewModal
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onSave={onReviewUpdate}
        />
      )}
    </div>
  );
}

// Componente Modal de Edição
function EditReviewModal({ review, onClose, onSave }) {
  const [rating, setRating] = useState(review.rating);
  const [content, setContent] = useState(review.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Por favor, escreva uma avaliação.');
      return;
    }

    const finalRating = Math.round(parseFloat(rating));
    if (finalRating < 0 || finalRating > 10) {
      alert('A nota deve ser um número inteiro entre 0 e 10.');
      return;
    }

    setSaving(true);
    try {
      await onSave(review.id, { rating: finalRating, content: content.trim() });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar avaliação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.editModalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.editModalHeader}>
          <h3>Editar Avaliação</h3>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.editModalBody}>
          <div className={styles.ratingSection}>
            <label>Nota (0-10):</label>
            <input
              type="number"
              min="0"
              max="10"
              step="1"
              value={Math.round(rating)}
              onChange={(e) => setRating(Math.round(e.target.value))}
              className={styles.ratingInput}
            />
          </div>
          
          <div className={styles.contentSection}>
            <label>Sua avaliação:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.contentTextarea}
              rows="6"
              placeholder="Escreva sua avaliação..."
            />
          </div>
        </div>
        
        <div className={styles.editModalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
} 