'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Modal from '../../../components/Modal';
import styles from './Dashboard.module.css';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState('6months'); // 1month, 3months, 6months, 1year, all
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc
  const [ratingFilter, setRatingFilter] = useState('all'); // all, high, medium, low
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modais
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  
  // Estados para filtros específicos dos modais
  const [modalFilters, setModalFilters] = useState({
    sortOrder: 'desc', // desc, asc
    userFilter: 'all', // all, active, inactive
    movieFilter: 'all', // all, popular, recent
  });
  
  // Estado para dados filtrados dos modais
  const [filteredModalData, setFilteredModalData] = useState(null);

  // Função para abrir modal com dados detalhados
  const openModal = async (type) => {
    console.log('Opening modal for type:', type);
    setActiveModal(type);
    setLoadingModal(true);
    setModalData(null);

    try {
      const queryParams = new URLSearchParams({
        type,
        dateFilter,
        ratingFilter
      });
      
      console.log('Fetching:', `/api/admin/details?${queryParams}`);
      const response = await fetch(`/api/admin/details?${queryParams}`);
      const result = await response.json();

      console.log('API Response:', result);

      if (result.success) {
        setModalData(result.data);
        console.log('Modal data set:', result.data);
      } else {
        console.error('Erro ao buscar dados:', result.message);
        alert('Erro: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar dados detalhados:', error);
      alert('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setFilteredModalData(null);
    // Resetar filtros para valores padrão
    setModalFilters({
      sortOrder: 'desc',
      userFilter: 'all',
      movieFilter: 'all',
    });
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    checkAdminPermissions();
  }, [session, status, router]);

  const checkAdminPermissions = async () => {
    try {
      const response = await fetch('/api/user/check-admin');
      const result = await response.json();

      if (result.success && result.isAdmin) {
        setIsAdmin(true);
        fetchDashboardData();
      } else {
        setError('Acesso negado - você não tem permissões de administrador');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setError('Erro ao verificar permissões de administrador');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const queryParams = new URLSearchParams({
        dateFilter,
        sortOrder,
        ratingFilter
      });
      
      const response = await fetch(`/api/admin/dashboard?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || 'Erro ao carregar dados do dashboard');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Atualizar dados quando os filtros mudarem
  useEffect(() => {
    if (isAdmin && dashboardData) {
      fetchDashboardData();
    }
  }, [dateFilter, sortOrder, ratingFilter]);

  // Função para aplicar filtros aos dados do modal
  const applyModalFilters = (data, type) => {
    if (!data || !Array.isArray(data)) return data;
    
    let filtered = [...data];
    
    // Aplicar filtros específicos por tipo
    switch (type) {
      case 'users':
        // Filtro por tipo de usuário
        if (modalFilters.userFilter === 'active') {
          filtered = filtered.filter(user => user.review_count > 0);
        } else if (modalFilters.userFilter === 'inactive') {
          filtered = filtered.filter(user => user.review_count === 0);
        }
        
        // Ordenação
        filtered.sort((a, b) => {
          switch (modalFilters.sortOrder) {
            case 'desc':
              return new Date(b.created_at) - new Date(a.created_at);
            case 'asc':
              return new Date(a.created_at) - new Date(b.created_at);
            case 'reviews_desc':
              return b.review_count - a.review_count;
            case 'reviews_asc':
              return a.review_count - b.review_count;
            default:
              return 0;
          }
        });
        break;
        
      case 'movies':
        // Filtro por popularidade
        if (modalFilters.movieFilter === 'popular') {
          filtered = filtered.filter(movie => movie.review_count >= 5);
        } else if (modalFilters.movieFilter === 'very_popular') {
          filtered = filtered.filter(movie => movie.review_count >= 10);
        }
        
        // Ordenação
        filtered.sort((a, b) => {
          switch (modalFilters.sortOrder) {
            case 'reviews_desc':
              return b.review_count - a.review_count;
            case 'reviews_asc':
              return a.review_count - b.review_count;
            case 'rating_desc':
              return parseFloat(b.avg_rating) - parseFloat(a.avg_rating);
            case 'rating_asc':
              return parseFloat(a.avg_rating) - parseFloat(b.avg_rating);
            case 'recent':
              return new Date(b.last_review) - new Date(a.last_review);
            default:
              return 0;
          }
        });
        break;
        
      case 'reviews':
        // Ordenação
        filtered.sort((a, b) => {
          switch (modalFilters.sortOrder) {
            case 'desc':
              return new Date(b.created_at) - new Date(a.created_at);
            case 'asc':
              return new Date(a.created_at) - new Date(b.created_at);
            case 'rating_desc':
              return b.rating - a.rating;
            case 'rating_asc':
              return a.rating - b.rating;
            default:
              return 0;
          }
        });
        break;
        
      case 'ratings':
        // Filtro por faixa de nota (usando ratingFilter global)
        switch (ratingFilter) {
          case 'high':
            filtered = filtered.filter(rating => rating.rating >= 7);
            break;
          case 'medium':
            filtered = filtered.filter(rating => rating.rating >= 4 && rating.rating < 7);
            break;
          case 'low':
            filtered = filtered.filter(rating => rating.rating < 4);
            break;
          default:
            // 'all' - não filtrar
            break;
        }
        
        // Ordenação
        filtered.sort((a, b) => {
          switch (modalFilters.sortOrder) {
            case 'desc':
              return new Date(b.created_at) - new Date(a.created_at);
            case 'asc':
              return new Date(a.created_at) - new Date(b.created_at);
            case 'rating_desc':
              return b.rating - a.rating;
            case 'rating_asc':
              return a.rating - b.rating;
            default:
              return 0;
          }
        });
        break;
    }
    
    return filtered;
  };

  // useEffect para aplicar filtros quando os modalFilters mudarem
  useEffect(() => {
    if (modalData && activeModal) {
      const filtered = applyModalFilters(modalData, activeModal);
      setFilteredModalData(filtered);
    }
  }, [modalFilters, modalData, activeModal, ratingFilter]);

  if (loading || checkingAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {checkingAdmin ? 'Verificando permissões...' : 'Carregando dashboard...'}
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error || 'Acesso negado - permissões de administrador necessárias'}
          <div style={{ marginTop: '1rem', fontSize: '1rem' }}>
            <a href="/" style={{ color: '#4fc3f7', textDecoration: 'underline' }}>
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1>Dashboard Administrativo</h1>
            <p>Painel de controle e estatísticas da plataforma Opinaflix</p>
          </div>
        </div>
      </div>

      {/* Filtros Principais */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label>Período:</label>
          <select 
            className={styles.filterSelect} 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="1month">Último mês</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="1year">Último ano</option>
            <option value="all">Todos os tempos</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Notas:</label>
          <select 
            className={styles.filterSelect} 
            value={ratingFilter} 
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">Todas as notas</option>
            <option value="high">Alta (7-10)</option>
            <option value="medium">Média (4-6)</option>
            <option value="low">Baixa (0-3)</option>
          </select>
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className={styles.statsGrid}>
        <div 
          className={`${styles.statCard} ${styles.clickable}`}
          onClick={() => openModal('users')}
          title="Clique para ver detalhes dos usuários"
        >
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>Total de Usuários</h3>
            <div className={styles.statNumber}>{dashboardData.totalUsers}</div>
          </div>
          <div className={styles.clickHint}>📊 Ver detalhes</div>
        </div>

        <div 
          className={`${styles.statCard} ${styles.clickable}`}
          onClick={() => openModal('reviews')}
          title="Clique para ver avaliações mais recentes"
        >
          <div className={styles.statIcon}>⭐</div>
          <div className={styles.statContent}>
            <h3>Total de Avaliações</h3>
            <div className={styles.statNumber}>{dashboardData.totalReviews || 0}</div>
          </div>
          <div className={styles.clickHint}>📊 Ver detalhes</div>
        </div>

        <div 
          className={`${styles.statCard} ${styles.clickable}`}
          onClick={() => openModal('movies')}
          title="Clique para ver filmes mais avaliados"
        >
          <div className={styles.statIcon}>🎬</div>
          <div className={styles.statContent}>
            <h3>Filmes Avaliados</h3>
            <div className={styles.statNumber}>{dashboardData.mostReviewedMovies?.length || 0}</div>
          </div>
          <div className={styles.clickHint}>📊 Ver detalhes</div>
        </div>
      </div>

      {/* Resto do dashboard... */}
      
      {/* Seção de Usuários */}
      <section className={`${styles.dashboardSection} ${styles.userSection}`}>
        <div className={styles.sectionHeader}>
          <h2>👥 Análise de Usuários</h2>
          <p>Dados sobre o cadastro e atividade dos usuários</p>
        </div>
        
        <div className={styles.sectionContent}>
          <div className={styles.chartCard}>
            <h3>Crescimento Mensal de Usuários</h3>
            <div className={styles.lineGraphContainer}>
              <svg className={styles.lineGraph} viewBox="0 0 400 200">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Line path */}
                {dashboardData.monthlyUsers?.length > 0 && (() => {
                  const validData = dashboardData.monthlyUsers.filter(item => item && typeof item.count === 'number');
                  if (validData.length === 0) return null;
                  
                  const maxCount = Math.max(...validData.map(u => u.count));
                  if (maxCount === 0) return null;
                  
                  const points = validData.map((item, index) => {
                    const x = validData.length > 1 ? (index / (validData.length - 1)) * 360 + 20 : 200;
                    const y = 180 - (item.count / maxCount) * 150;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#e50914"
                        strokeWidth="3"
                        points={points}
                        className={styles.lineGraphPath}
                      />
                      {/* Data points */}
                      {validData.map((item, index) => {
                        const x = validData.length > 1 ? (index / (validData.length - 1)) * 360 + 20 : 200;
                        const y = 180 - (item.count / maxCount) * 150;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#e50914"
                            className={styles.lineGraphPoint}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              
              {/* Labels */}
              <div className={styles.lineGraphLabels}>
                {dashboardData.monthlyUsers?.map((item, index) => (
                  <div key={index} className={styles.lineGraphLabel}>
                    <span className={styles.lineGraphMonth}>{item.formatted_month}</span>
                    <span className={styles.lineGraphValue}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <h3>Top 5 Usuários Mais Ativos</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Avaliações</th>
                  <th>Nota Média</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.mostActiveUsers?.slice(0, 5).map((user, index) => (
                  <tr key={index}>
                    <td>{user.username}</td>
                    <td>{user.review_count}</td>
                    <td>{parseFloat(user.avg_rating || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Seção de Avaliações */}
      <section className={`${styles.dashboardSection} ${styles.reviewSection}`}>
        <div className={styles.sectionHeader}>
          <h2>⭐ Análise de Avaliações</h2>
          <p>Estatísticas sobre as avaliações da plataforma</p>
        </div>
        
        <div className={styles.sectionContent}>
          <div className={styles.chartCard}>
            <h3>Crescimento Mensal de Avaliações</h3>
            <div className={styles.lineGraphContainer}>
              <svg className={styles.lineGraph} viewBox="0 0 400 200">
                {/* Grid lines */}
                <defs>
                  <pattern id="reviewGrid" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#333" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#reviewGrid)" />
                
                {/* Line path */}
                {dashboardData.monthlyReviews?.length > 0 && (() => {
                  const validData = dashboardData.monthlyReviews.filter(item => item && typeof item.count === 'number');
                  if (validData.length === 0) return null;
                  
                  const maxCount = Math.max(...validData.map(r => r.count));
                  if (maxCount === 0) return null;
                  
                  const points = validData.map((item, index) => {
                    const x = validData.length > 1 ? (index / (validData.length - 1)) * 360 + 20 : 200;
                    const y = 180 - (item.count / maxCount) * 150;
                    return `${x},${y}`;
                  }).join(' ');
                  
                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#4fc3f7"
                        strokeWidth="3"
                        points={points}
                        className={styles.lineGraphPath}
                      />
                      {/* Data points */}
                      {validData.map((item, index) => {
                        const x = validData.length > 1 ? (index / (validData.length - 1)) * 360 + 20 : 200;
                        const y = 180 - (item.count / maxCount) * 150;
                        return (
                          <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#4fc3f7"
                            className={styles.lineGraphPoint}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
              
              {/* Labels */}
              <div className={styles.lineGraphLabels}>
                {dashboardData.monthlyReviews?.map((item, index) => (
                  <div key={index} className={styles.lineGraphLabel}>
                    <span className={styles.lineGraphMonth}>{item.formatted_month}</span>
                    <span className={styles.lineGraphValue}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.statsCard}>
            <h3>Estatísticas de Atividade</h3>
            <div className={styles.statsGrid}>
              <div className={styles.miniStat}>
                <span className={styles.miniStatLabel}>Média de Avaliações por Usuário</span>
                <span className={styles.miniStatValue}>{dashboardData.avgReviewsPerUser}</span>
              </div>
              <div className={styles.miniStat}>
                <span className={styles.miniStatLabel}>Usuários Ativos</span>
                <span className={styles.miniStatValue}>
                  {dashboardData.mostActiveUsers?.filter(u => u.review_count > 0).length || 0}
                </span>
              </div>
              <div className={styles.miniStat}>
                <span className={styles.miniStatLabel}>Usuários Inativos</span>
                <span className={styles.miniStatValue}>
                  {(dashboardData.totalUsers || 0) - (dashboardData.mostActiveUsers?.filter(u => u.review_count > 0).length || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modais */}
      <Modal 
        isOpen={activeModal === 'users'} 
        onClose={closeModal} 
        title="Detalhes dos Usuários"
        size="large"
      >
        {loadingModal ? (
          <div className={styles.modalLoading}>Carregando dados...</div>
        ) : (filteredModalData || modalData) ? (
          <div className={styles.modalContent}>
            <div className={styles.modalFilters}>
              <div className={styles.modalFilterGroup}>
                <label>Ordenar por:</label>
                <select 
                  value={modalFilters.sortOrder}
                  onChange={(e) => setModalFilters({...modalFilters, sortOrder: e.target.value})}
                >
                  <option value="desc">Mais recente</option>
                  <option value="asc">Mais antigo</option>
                  <option value="reviews_desc">Mais avaliações</option>
                  <option value="reviews_asc">Menos avaliações</option>
                </select>
              </div>
              
              <div className={styles.modalFilterGroup}>
                <label>Tipo:</label>
                <select 
                  value={modalFilters.userFilter}
                  onChange={(e) => setModalFilters({...modalFilters, userFilter: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="active">Com avaliações</option>
                  <option value="inactive">Sem avaliações</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalStats}>
              <span>Total: {(filteredModalData || modalData).length} usuários</span>
              <span>Com avaliações: {(filteredModalData || modalData).filter(u => u.review_count > 0).length}</span>
              <span>Sem avaliações: {(filteredModalData || modalData).filter(u => u.review_count === 0).length}</span>
            </div>
            
            <div className={styles.modalTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Avaliações</th>
                    <th>Nota Média</th>
                    <th>Cadastro</th>
                    <th>Última Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredModalData || modalData).map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.review_count}</td>
                      <td>{user.avg_rating ? parseFloat(user.avg_rating).toFixed(1) : 'N/A'}</td>
                      <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>{user.last_review ? new Date(user.last_review).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.modalError}>Erro ao carregar dados</div>
        )}
      </Modal>

      <Modal 
        isOpen={activeModal === 'reviews'} 
        onClose={closeModal} 
        title="Todas as Avaliações"
        size="large"
      >
        {loadingModal ? (
          <div className={styles.modalLoading}>Carregando dados...</div>
        ) : (filteredModalData || modalData) ? (
          <div className={styles.modalContent}>
            <div className={styles.modalFilters}>
              <div className={styles.modalFilterGroup}>
                <label>Ordenar por:</label>
                <select 
                  value={modalFilters.sortOrder}
                  onChange={(e) => setModalFilters({...modalFilters, sortOrder: e.target.value})}
                >
                  <option value="desc">Mais recente</option>
                  <option value="asc">Mais antigo</option>
                  <option value="rating_desc">Maior nota</option>
                  <option value="rating_asc">Menor nota</option>
                </select>
              </div>
              
              <div className={styles.modalFilterGroup}>
                <label>Período:</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="1month">Último mês</option>
                  <option value="3months">Últimos 3 meses</option>
                  <option value="6months">Últimos 6 meses</option>
                  <option value="1year">Último ano</option>
                  <option value="all">Todos os tempos</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalStats}>
              <span>Total: {(filteredModalData || modalData).length} avaliações</span>
              <span>Filmes únicos: {new Set((filteredModalData || modalData).map(r => r.movieId)).size}</span>
              <span>Usuários únicos: {new Set((filteredModalData || modalData).map(r => r.userId)).size}</span>
            </div>
            
            <div className={styles.modalTable}>
              <table>
                <thead>
                  <tr>
                    <th>Filme</th>
                    <th>Usuário</th>
                    <th>Nota</th>
                    <th>Avaliação</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredModalData || modalData).map((review, index) => (
                    <tr key={index}>
                      <td>{review.movieTitle}</td>
                      <td>{review.username}</td>
                      <td className={styles.ratingCell}>{review.rating}/10</td>
                      <td className={styles.reviewContent}>{review.content?.substring(0, 100)}...</td>
                      <td>{new Date(review.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.modalError}>Erro ao carregar dados</div>
        )}
      </Modal>

      <Modal 
        isOpen={activeModal === 'movies'} 
        onClose={closeModal} 
        title="Filmes Mais Avaliados"
        size="large"
      >
        {loadingModal ? (
          <div className={styles.modalLoading}>Carregando dados...</div>
        ) : (filteredModalData || modalData) ? (
          <div className={styles.modalContent}>
            <div className={styles.modalFilters}>
              <div className={styles.modalFilterGroup}>
                <label>Ordenar por:</label>
                <select 
                  value={modalFilters.sortOrder}
                  onChange={(e) => setModalFilters({...modalFilters, sortOrder: e.target.value})}
                >
                  <option value="reviews_desc">Mais avaliações</option>
                  <option value="reviews_asc">Menos avaliações</option>
                  <option value="rating_desc">Maior nota</option>
                  <option value="rating_asc">Menor nota</option>
                  <option value="recent">Mais recente</option>
                </select>
              </div>
              
              <div className={styles.modalFilterGroup}>
                <label>Mín. avaliações:</label>
                <select 
                  value={modalFilters.movieFilter}
                  onChange={(e) => setModalFilters({...modalFilters, movieFilter: e.target.value})}
                >
                  <option value="all">Todos</option>
                  <option value="popular">5+ avaliações</option>
                  <option value="very_popular">10+ avaliações</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalStats}>
              <span>Total: {(filteredModalData || modalData).length} filmes</span>
              <span>Média geral: {((filteredModalData || modalData).reduce((sum, m) => sum + parseFloat(m.avg_rating), 0) / (filteredModalData || modalData).length).toFixed(1)}/10</span>
            </div>
            
            <div className={styles.modalTable}>
              <table>
                <thead>
                  <tr>
                    <th>Filme</th>
                    <th>Avaliações</th>
                    <th>Nota Média</th>
                    <th>Nota Mín</th>
                    <th>Nota Máx</th>
                    <th>Última Avaliação</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredModalData || modalData).map((movie, index) => (
                    <tr key={index}>
                      <td>{movie.movieTitle}</td>
                      <td>{movie.review_count}</td>
                      <td className={styles.ratingCell}>{parseFloat(movie.avg_rating).toFixed(1)}/10</td>
                      <td>{movie.min_rating}/10</td>
                      <td>{movie.max_rating}/10</td>
                      <td>{new Date(movie.last_review).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.modalError}>Erro ao carregar dados</div>
        )}
      </Modal>

      <Modal 
        isOpen={activeModal === 'ratings'} 
        onClose={closeModal} 
        title="Distribuição de Notas"
        size="large"
      >
        {loadingModal ? (
          <div className={styles.modalLoading}>Carregando dados...</div>
        ) : (filteredModalData || modalData) ? (
          <div className={styles.modalContent}>
            <div className={styles.modalFilters}>
              <div className={styles.modalFilterGroup}>
                <label>Ordenar por:</label>
                <select 
                  value={modalFilters.sortOrder}
                  onChange={(e) => setModalFilters({...modalFilters, sortOrder: e.target.value})}
                >
                  <option value="desc">Mais recente</option>
                  <option value="asc">Mais antigo</option>
                  <option value="rating_desc">Maior nota</option>
                  <option value="rating_asc">Menor nota</option>
                </select>
              </div>
              
              <div className={styles.modalFilterGroup}>
                <label>Faixa de nota:</label>
                <select 
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="high">Altas (7-10)</option>
                  <option value="medium">Médias (4-6)</option>
                  <option value="low">Baixas (0-3)</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalStats}>
              <span>Total: {(filteredModalData || modalData).length} avaliações</span>
              <span>Nota média: {((filteredModalData || modalData).reduce((sum, r) => sum + r.rating, 0) / (filteredModalData || modalData).length).toFixed(1)}/10</span>
              <span>Maior nota: {Math.max(...(filteredModalData || modalData).map(r => r.rating))}/10</span>
              <span>Menor nota: {Math.min(...(filteredModalData || modalData).map(r => r.rating))}/10</span>
            </div>
            
            <div className={styles.modalTable}>
              <table>
                <thead>
                  <tr>
                    <th>Nota</th>
                    <th>Filme</th>
                    <th>Usuário</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredModalData || modalData).map((rating, index) => (
                    <tr key={index}>
                      <td className={styles.ratingCell}>{rating.rating}/10</td>
                      <td>{rating.movieTitle}</td>
                      <td>{rating.username}</td>
                      <td>{new Date(rating.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={styles.modalError}>Erro ao carregar dados</div>
        )}
      </Modal>
    </div>
  );
} 