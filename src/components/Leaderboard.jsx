import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
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
  const [rowAnimations, setRowAnimations] = useState({}); // Track animations for each row
  const rowRefsMap = useRef(new Map()); // Store refs to row elements
  const prevPositions = useRef(new Map()); // Store previous positions for FLIP

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

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [autoUpdate]);

  // Get headers from first data item (excluding common metadata columns)
  const displayHeaders = useMemo(() => {
    if (leaderboard.length === 0) return [];
    const headers = Object.keys(leaderboard[0]);
    // Filter out common metadata columns like timestamps, IDs, etc.
    return headers.filter(h => !h.toLowerCase().match(/^(timestamp|id|metadata|notes)$/));
  }, [leaderboard]);

  // Sort leaderboard by "Totais" column in descending order
  const sortedLeaderboard = useMemo(() => {
    if (leaderboard.length === 0) return [];
    const sorted = [...leaderboard].sort((a, b) => {
      const aValue = parseFloat(a.Totais) || 0;
      const bValue = parseFloat(b.Totais) || 0;
      return bValue - aValue; // descending order (highest first)
    });
    return sorted;
  }, [leaderboard]);

  // FLIP animation: measure after render and animate position changes
  useLayoutEffect(() => {
    if (sortedLeaderboard.length === 0) return;

    // Capture current positions after render
    const currentPositions = new Map();
    const initialAnimations = {};

    sortedLeaderboard.forEach((row, idx) => {
      // Use team name as unique key (first column value or index as fallback)
      const teamKey = row[displayHeaders[0]] || `row-${idx}`;
      const rowElement = rowRefsMap.current.get(teamKey);

      if (rowElement) {
        const rect = rowElement.getBoundingClientRect();
        currentPositions.set(teamKey, rect.top);

        // If we have a previous position, calculate the delta
        const prevPos = prevPositions.current.get(teamKey);
        if (prevPos !== undefined && prevPos !== rect.top) {
          const delta = prevPos - rect.top; // Distance row needs to travel back to old position
          // Start animation with no transition (rows at old position instantly)
          initialAnimations[teamKey] = {
            deltaY: delta,
            shouldTransition: false // No transition yet, just apply transform
          };
        }
      }
    });

    // Set initial state with transforms but NO transitions
    setRowAnimations(initialAnimations);

    // Update previous positions for next cycle
    prevPositions.current = currentPositions;

    // Trigger animation in next frame
    requestAnimationFrame(() => {
      // Now add transitions and remove transforms (animate back to final position)
      const animatedAnimations = {};
      Object.keys(initialAnimations).forEach(teamKey => {
        animatedAnimations[teamKey] = {
          deltaY: initialAnimations[teamKey].deltaY,
          shouldTransition: true // Add transition for animation
        };
      });
      setRowAnimations(animatedAnimations);
    });

    // Clear animations after transition completes
    const timer = setTimeout(() => {
      setRowAnimations({});
    }, 1000); // Match CSS transition duration

    return () => clearTimeout(timer);
  }, [sortedLeaderboard, displayHeaders]);

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
              className={`btn-cta ${autoUpdate ? 'active' : ''}`}
              style={{ marginRight: '10px' }}
            >
              {i18n.language?.startsWith('pt') ? (autoUpdate ? 'Ao vivo' : 'Parado') : (autoUpdate ? 'Live' : 'Paused')}
            </button>
            <button
              onClick={fetchLeaderboard}
              className="btn-cta"
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
            {i18n.language?.startsWith('pt') ? 'Classificações' : 'Leaderboard'}
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
                  {sortedLeaderboard.map((row, idx) => {
                    const teamKey = row[displayHeaders[0]] || `row-${idx}`;
                    const animation = rowAnimations[teamKey];
                    const rowStyle = animation
                      ? {
                          transform: animation.shouldTransition
                            ? 'translateY(0)' // Animate back to final position
                            : `translateY(${animation.deltaY}px)`, // Instantly move to old position
                          transition: animation.shouldTransition
                            ? 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' // Smooth animation
                            : 'none', // No transition for initial placement
                          willChange: 'transform'
                        }
                      : {
                          transform: 'translateY(0)',
                          willChange: 'transform'
                        };

                    return (
                      <tr
                        key={idx}
                        ref={(el) => {
                          if (el) rowRefsMap.current.set(teamKey, el);
                          else rowRefsMap.current.delete(teamKey);
                        }}
                        className={idx < 3 ? `leaderboard-top-${idx + 1}` : ''}
                        style={rowStyle}
                      >
                        <td className="leaderboard-rank">
                          <span className="rank-badge">
                            {idx + 1}
                          </span>
                        </td>
                        {displayHeaders.map(header => (
                          <td key={`${idx}-${header}`} className="leaderboard-cell">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
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
            {i18n.language?.startsWith('pt') ? 'A classificação atualiza-se automaticamente a cada 5 segundos' : 'Leaderboard updates automatically every 5 seconds'}
          </p>
        </div>
      </footer>
    </div>
  );
}
