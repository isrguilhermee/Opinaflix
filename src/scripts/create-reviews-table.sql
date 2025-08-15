-- Criar tabela de reviews caso não exista
CREATE TABLE IF NOT EXISTS tb_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  movieId VARCHAR(255) NOT NULL,
  movieTitle VARCHAR(500) NOT NULL,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 10),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES tb_users(id) ON DELETE CASCADE,
  INDEX idx_movie_id (movieId),
  INDEX idx_user_id (userId),
  INDEX idx_created_at (created_at)
); 