'use client';

import styles from './ReviewList.module.css';

export default function ReviewModal({ review, onClose }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalRating}>
              {review.rating}/10 <span>★</span>
            </div>
            <div className={styles.modalDate}>
              {formatDate(review.created_at)}
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <p>{review.content}</p>
        </div>
        
        <div className={styles.modalAuthor}>
          Avaliado por: {review.username || 'Visitante'}
        </div>
      </div>
    </div>
  );
} 