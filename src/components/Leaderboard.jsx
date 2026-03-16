import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Leaderboard component that fetches CSV data from a Google Sheet.
 * 
 * SETUP: Ensure your Google Sheet is set to "Anyone with the link can view"
 * Then append /export?format=csv to the sheet URL.
 * Set GOOGLE_SHEET_CSV_URL environment variable or update the URL below.
 */

const GOOGLE_SHEET_CSV_URL = import.meta.env.VITE_LEADERBOARD_SHEET_URL || '';

export default function Leaderboard() {
  const { i18n } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoUpdate, setAutoUpdate] = useState(true);

  // Parse CSV string into array of objects
  const parseCSV = (csv) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      return obj;
    });

    return data;
  };

  // Fetch and update leaderboard data
  const fetchLeaderboard = async () => {
    if (!GOOGLE_SHEET_CSV_URL) {
      setError('Leaderboard URL not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(GOOGLE_SHEET_CSV_URL, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Accept': 'text/csv',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const csv = await response.text();
      const data = parseCSV(csv);
      
      if (data.length === 0) {
        setError('No data in leaderboard');
        setLeaderboard([]);
      } else {
        setLeaderboard(data);
        setError(null);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoUpdate]);

  // Get headers from first data item (excluding common metadata columns)
  const getDisplayHeaders = () => {
    if (leaderboard.length === 0) return [];
    const headers = Object.keys(leaderboard[0]);
    // Filter out common metadata columns like timestamps, IDs, etc.
    return headers.filter(h => !h.toLowerCase().match(/^(timestamp|id|metadata|notes)$/));
  };

  const displayHeaders = getDisplayHeaders();

  // Sort leaderboard by "Totais" column in descending order
  const getSortedLeaderboard = () => {
    if (leaderboard.length === 0) return [];
    const sorted = [...leaderboard].sort((a, b) => {
      const aValue = parseFloat(a.Totais) || 0;
      const bValue = parseFloat(b.Totais) || 0;
      return bValue - aValue; // descending order (highest first)
    });
    return sorted;
  };

  const sortedLeaderboard = getSortedLeaderboard();

  return (
    <div className="bo-site">
      <header className="bo-header">
        <div className="wrap header-row">
          <div className="brand-left">
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>
              {i18n.language?.startsWith('pt') ? 'Classificações' : 'Leaderboard'}
            </h1>
          </div>
          <div className="brand-right">
            <button
              onClick={() => setAutoUpdate(!autoUpdate)}
              className={`lang-btn ${autoUpdate ? 'active' : ''}`}
              style={{ marginRight: '10px' }}
            >
              {autoUpdate ? '🔄' : '⏸'}  {i18n.language?.startsWith('pt') ? (autoUpdate ? 'Ao vivo' : 'Parado') : (autoUpdate ? 'Live' : 'Paused')}
            </button>
            <button
              onClick={fetchLeaderboard}
              className="lang-btn"
              disabled={loading}
              style={{ marginRight: '10px' }}
            >
              {i18n.language?.startsWith('pt') ? 'Atualizar' : 'Refresh'}
            </button>
            <a className="btn-cta" href="/">{i18n.language?.startsWith('pt') ? 'Início' : 'Home'}</a>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: '120px', minHeight: '100vh' }}>
        <section className="wrap section" style={{ marginTop: '40px' }}>
          <h2 style={{ marginBottom: '10px' }}>
            {i18n.language?.startsWith('pt') ? 'Classificações da Competição' : 'Competition Leaderboard'}
          </h2>
          
          {lastUpdated && (
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
              {i18n.language?.startsWith('pt') ? 'Atualizado' : 'Updated'}: {lastUpdated.toLocaleTimeString(i18n.language)}
            </p>
          )}

          {loading && leaderboard.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>{i18n.language?.startsWith('pt') ? 'A carregar...' : 'Loading...'}</p>
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '20px', 
              backgroundColor: 'rgba(255, 0, 0, 0.1)', 
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '8px',
              color: '#ff6b6b',
              marginBottom: '20px'
            }}>
              <strong>{i18n.language?.startsWith('pt') ? 'Erro' : 'Error'}:</strong> {error}
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="leaderboard-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#{i18n.language?.startsWith('pt') ? 'Pos' : 'Pos'}</th>
                    {displayHeaders.map(header => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((row, idx) => (
                    <tr key={idx} className={idx < 3 ? `leaderboard-top-${idx + 1}` : ''}>
                      <td className="leaderboard-rank">
                        <span className="rank-badge">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </span>
                      </td>
                      {displayHeaders.map(header => (
                        <td key={`${idx}-${header}`} className="leaderboard-cell">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && leaderboard.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              <p>{i18n.language?.startsWith('pt') ? 'Nenhum dado de classificação disponível' : 'No leaderboard data available'}</p>
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="wrap footer-inner" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
            {i18n.language?.startsWith('pt') ? 'A classificação atualiza-se automaticamente a cada 30 segundos' : 'Leaderboard updates automatically every 30 seconds'}
          </p>
        </div>
      </footer>
    </div>
  );
}
