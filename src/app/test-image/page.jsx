'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './test-image.module.css';

export default function TestImagePage() {
  const [imagePath, setImagePath] = useState('/default-avatar.svg');
  const [error, setError] = useState(false);

  const handleImageChange = (e) => {
    setImagePath(e.target.value);
    setError(false);
  };

  const handleImageError = () => {
    console.error('Erro ao carregar imagem:', imagePath);
    setError(true);
  };

  return (
    <div className={styles.container}>
      <h1>Teste de Imagem</h1>
      
      <div className={styles.content}>
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <Image
              src={imagePath}
              alt="Imagem de teste"
              width={150}
              height={150}
              className={styles.image}
              onError={handleImageError}
              priority
            />
            {error && <div className={styles.errorOverlay}>Erro ao carregar imagem</div>}
          </div>
          
          <div className={styles.imageInfo}>
            <span>Status: {error ? 'Erro' : 'Carregada'}</span>
            <span>Caminho: {imagePath}</span>
          </div>
        </div>
        
        <div className={styles.controls}>
          <label htmlFor="imagePath">Caminho da imagem:</label>
          <input
            id="imagePath"
            type="text"
            value={imagePath}
            onChange={handleImageChange}
            placeholder="/caminho/para/imagem.jpg"
            className={styles.input}
          />
          
          <button 
            onClick={() => setImagePath('/default-avatar.svg')}
            className={styles.button}
          >
            Usar padrão
          </button>
        </div>
      </div>
      
      <div className={styles.help}>
        <h2>Exemplos de caminhos:</h2>
        <ul>
          <li onClick={() => setImagePath('/default-avatar.svg')}>/default-avatar.svg (SVG padrão)</li>
          <li onClick={() => setImagePath('/uploads/exemplo.jpg')}>/uploads/exemplo.jpg (Caminho relativo)</li>
          <li onClick={() => setImagePath('http://localhost:3000/uploads/exemplo.jpg')}>http://localhost:3000/uploads/exemplo.jpg (URL absoluta)</li>
        </ul>
      </div>
    </div>
  );
} 