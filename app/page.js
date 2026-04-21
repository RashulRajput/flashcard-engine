'use client';

import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import ReviewSession from '../components/ReviewSession';
import { loadDecks, saveDecks, deleteDeck as removeDeck } from '../lib/storage';
import { isDue, createCardState } from '../lib/sm2';

export default function Home() {
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState('dashboard'); // dashboard | review
  const [activeDeck, setActiveDeck] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDecks(loadDecks());
    setMounted(true);
  }, []);

  const handleDeckGenerated = (deck) => {
    const updated = [...decks, deck];
    setDecks(updated);
    saveDecks(updated);
  };

  const handleStartReview = (deck) => {
    setActiveDeck(deck);
    setView('review');
  };

  const handleUpdateDeck = (updatedDeck) => {
    const updated = decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d));
    setDecks(updated);
    saveDecks(updated);
    setActiveDeck(updatedDeck);
  };

  const handleDeleteDeck = (deckId) => {
    const updated = removeDeck(deckId);
    setDecks(updated);
  };

  const handleExitReview = () => {
    setView('dashboard');
    setActiveDeck(null);
    setDecks(loadDecks()); // Refresh
  };

  const getDeckStats = (deck) => {
    const total = deck.cards.length;
    let due = 0;
    let mastered = 0;

    deck.cards.forEach((card) => {
      const state = deck.cardStates?.[card.id];
      if (!state || isDue(state)) {
        due++;
      }
      if (state && state.repetitions >= 3) {
        mastered++;
      }
    });

    return { total, due, mastered };
  };

  if (!mounted) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (view === 'review' && activeDeck) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Synapse</span>
          </div>
          <div className="header-deck-name">{activeDeck.title}</div>
        </header>
        <ReviewSession
          deck={activeDeck}
          onUpdateDeck={handleUpdateDeck}
          onExit={handleExitReview}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">Synapse</span>
        </div>
        <div className="header-right">
          <span className="badge badge-accent">AI Powered</span>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title animate-fade-in-up">
          Learn smarter with <span className="text-gradient">AI flashcards</span>
        </h1>
        <p className="hero-subtitle animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          Drop any PDF and let Gemini transform it into intelligent study decks with spaced repetition.
        </p>
      </section>

      {/* Upload */}
      <section className="upload-section">
        <FileUpload
          onGenerated={handleDeckGenerated}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
      </section>

      {/* Decks */}
      {decks.length > 0 && (
        <section className="decks-section animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="section-header">
            <h2>Your Decks</h2>
            <span className="text-secondary" style={{ fontSize: '0.85rem' }}>{decks.length} {decks.length === 1 ? 'deck' : 'decks'}</span>
          </div>

          <div className="decks-grid stagger">
            {decks.map((deck) => {
              const stats = getDeckStats(deck);
              const masteryPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

              return (
                <div
                  key={deck.id}
                  className="deck-card glass-card animate-fade-in-up"
                  id={`deck-${deck.id}`}
                >
                  <div className="deck-card-header">
                    <h3 className="deck-title">{deck.title}</h3>
                    <button
                      className="btn btn-icon btn-secondary"
                      onClick={() => handleDeleteDeck(deck.id)}
                      title="Delete Deck"
                      id={`delete-deck-${deck.id}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div className="deck-stats">
                    <div className="deck-stat">
                      <span className="deck-stat-value">{stats.total}</span>
                      <span className="deck-stat-label">Cards</span>
                    </div>
                    <div className="deck-stat">
                      <span className="deck-stat-value" style={{ color: stats.due > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                        {stats.due}
                      </span>
                      <span className="deck-stat-label">Due</span>
                    </div>
                    <div className="deck-stat">
                      <span className="deck-stat-value" style={{ color: 'var(--accent-success)' }}>{masteryPct}%</span>
                      <span className="deck-stat-label">Mastered</span>
                    </div>
                  </div>

                  <div className="progress-bar" style={{ margin: '12px 0' }}>
                    <div className="progress-bar-fill" style={{ width: `${masteryPct}%` }} />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleStartReview(deck)}
                    id={`review-deck-${deck.id}`}
                  >
                    {stats.due > 0 ? `Study ${stats.due} Due Cards` : 'Review All'}
                  </button>

                  <div className="deck-meta">
                    Created {new Date(deck.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {decks.length === 0 && !isGenerating && (
        <section className="empty-state animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="empty-icon">📚</div>
          <p>Upload a PDF above to create your first deck</p>
        </section>
      )}

      <style jsx>{`
        .app-shell {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 24px 64px;
          min-height: 100vh;
        }

        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          margin-bottom: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-deck-name {
          font-family: var(--font-display);
          font-weight: 600;
          color: var(--text-secondary);
        }

        .hero {
          text-align: center;
          margin-bottom: 40px;
        }

        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .hero-subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .upload-section {
          margin-bottom: 48px;
        }

        .decks-section {
          margin-bottom: 48px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
        }

        .decks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .deck-card {
          padding: 24px;
        }

        .deck-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .deck-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          line-height: 1.3;
          flex: 1;
          margin-right: 8px;
          word-break: break-word;
        }

        .deck-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .deck-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .deck-stat-value {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
        }

        .deck-stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .deck-meta {
          margin-top: 12px;
          font-size: 0.7rem;
          color: var(--text-muted);
          text-align: center;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: var(--text-muted);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 0.95rem;
        }

        @media (max-width: 600px) {
          .hero-title {
            font-size: 1.6rem;
          }
          .decks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
