'use client';
import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: 'Distribuição de Avaliações',
      color: '#fff',
      font: {
        size: 18,
        weight: 'bold'
      },
      padding: {
        top: 15,
        bottom: 15
      }
    },
    tooltip: {
      backgroundColor: 'rgba(20, 20, 20, 0.9)',
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        title: (items) => `Nota ${items[0].label}`,
        label: (item) => `${item.raw} avaliação${item.raw !== 1 ? 'ões' : ''}`
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#fff',
        font: {
          size: 12
        }
      },
      title: {
        display: true,
        text: 'Nota',
        color: '#fff',
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: { top: 10 }
      }
    },
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#fff',
        stepSize: 1,
        font: {
          size: 12
        }
      },
      title: {
        display: false
      }
    },
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutQuart'
  }
};

export default function RatingChart({ reviews }) {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Inicializa um objeto para contar as avaliações (incluindo nota 0)
    const ratingCounts = {};
    for (let i = 0; i <= 10; i++) {
      ratingCounts[i] = 0;
    }

    // Conta as avaliações
    reviews.forEach((review) => {
      if (review.rating !== null && review.rating !== undefined) {
        ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
      }
    });

    // Prepara os dados para o gráfico
    const data = {
      labels: Object.keys(ratingCounts),
      datasets: [
        {
          data: Object.values(ratingCounts),
          backgroundColor: 'rgba(229, 9, 20, 0.8)',
          borderColor: 'rgba(229, 9, 20, 1)',
          borderWidth: 1,
          borderRadius: 8,
          hoverBackgroundColor: 'rgba(255, 0, 0, 0.9)',
          hoverBorderColor: 'rgba(255, 0, 0, 1)',
          hoverBorderWidth: 2,
        },
      ],
    };

    setChartData(data);
  }, [reviews]);

  return (
    <div style={{ 
      backgroundColor: '#141414', 
      padding: '25px', 
      borderRadius: '12px',
      marginTop: '20px',
      height: '300px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15), 0 3px 4px rgba(0, 0, 0, 0.12)'
      }
    }}>
      <Bar options={options} data={chartData} />
    </div>
  );
} 