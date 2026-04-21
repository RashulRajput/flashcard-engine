'use client';

import { useState, useCallback } from 'react';
import Flashcard from './Flashcard';
import { processReview, ratingToQuality, formatInterval, createCardState, isDue } from '../lib/sm2';

const RATINGS = [
  { key: 'again', label: 'Again', color: 'var(--accent-danger)', icon: '✕' },
  { key: 'hard', label: 'Hard', color: 'var(--accent-warning)', icon: '⚡' },
  { key: 'good', label: 'Good', color: 'var(--accent-primary)', icon: '✓' },
  { key: 'easy', label: 'Easy', color: 'var(--accent-success)', icon: '★' },
];

export default function ReviewSession({ deck, onUpdateDeck, onExit }) {
  const dueCards = deck.cards.filter((card) => {
    const state = deck.cardStates?.[card.id];
    return !state || isDue(state);
  });
  const reviewCards = dueCards.length > 0 ? dueCards : deck.cards;

  const [queue, setQueue] = useState(() => shuffleArray([...reviewCards]));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 });
  const [isComplete, setIsComplete] = useState(reviewCards.length === 0);

  const currentCard = queue[currentIndex];

  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const handleRate = useCallback((rating) => {
    if (!currentCard) return;

    const quality = ratingToQuality(rating);
    const currentState = deck.cardStates?.[currentCard.id] || createCardState(currentCard.id);
    const newState = processReview(currentState, quality);

    const updatedDeck = {
      ...deck,
      cardStates: {
        ...deck.cardStates,
        [currentCard.id]: newState,
      },
    };

    onUpdateDeck(updatedDeck);

    setSessionStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      [rating]: prev[rating] + 1,
    }));

    setShowAnswer(false);

    if (rating === 'again') {
      // Put card back in queue
      setQueue((prev) => {
        const updated = [...prev];
        updated.splice(currentIndex, 1);
        const insertAt = Math.min(currentIndex + 3, updated.length);
        updated.splice(insertAt, 0, currentCard);
        return updated;
      });
    } else {
      if (currentIndex + 1 >= queue.length) {
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }
  }, [currentCard, currentIndex, deck, onUpdateDeck, queue.length]);

  if (isComplete) {
    const total = sessionStats.reviewed;
    const accuracy = total > 0 ? Math.round(((sessionStats.good + sessionStats.easy) / total) * 100) : 0;

    return (
      <div className="review-complete animate-scale-in">
        <div className="complete-icon">🎉</div>
        <h2>Session Complete!</h2>
        <p className="complete-subtitle">You&apos;ve reviewed all due cards in this deck.</p>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Reviewed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--accent-success)' }}>{accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--accent-danger)' }}>{sessionStats.again}</span>
            <span className="stat-label">Again</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--accent-primary)' }}>{sessionStats.good + sessionStats.easy}</span>
            <span className="stat-label">Correct</span>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={onExit} id="back-to-decks-btn">
          Back to Decks
        </button>

        <style jsx>{`
          .review-complete {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 48px 24px;
            text-align: center;
          }
          .complete-icon {
            font-size: 4rem;
            margin-bottom: 8px;
          }
          .review-complete h2 {
            font-family: var(--font-display);
            font-size: 2rem;
            font-weight: 700;
          }
          .complete-subtitle {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-bottom: 16px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            width: 100%;
            max-width: 420px;
            margin-bottom: 24px;
          }
          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 16px 8px;
            background: var(--bg-glass);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
          }
          .stat-value {
            font-family: var(--font-display);
            font-size: 1.5rem;
            font-weight: 700;
          }
          .stat-label {
            font-size: 0.7rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        `}</style>
      </div>
    );
  }

  const remaining = queue.length - currentIndex;
  const progressPct = queue.length > 0 ? Math.round((currentIndex / queue.length) * 100) : 0;

  return (
    <div className="review-session animate-fade-in">
      {/* Header */}
      <div className="review-header">
        <button className="btn btn-secondary btn-sm" onClick={onExit} id="exit-review-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Exit
        </button>
        <div className="review-progress-info">
          <span className="remaining-count">{remaining} remaining</span>
          <div className="progress-bar" style={{ width: '120px' }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="review-card-area">
        <Flashcard
          card={currentCard}
          showAnswer={showAnswer}
          onFlip={() => setShowAnswer(!showAnswer)}
        />
      </div>

      {/* Rating Buttons */}
      <div className={`rating-area ${showAnswer ? 'visible' : ''}`}>
        {showAnswer ? (
          <div className="rating-buttons">
            {RATINGS.map((r) => {
              const cardState = deck.cardStates?.[currentCard.id] || createCardState(currentCard.id);
              return (
                <button
                  key={r.key}
                  className="rating-btn"
                  onClick={() => handleRate(r.key)}
                  id={`rate-${r.key}-btn`}
                >
                  <span className="rating-icon" style={{ color: r.color }}>{r.icon}</span>
                  <span className="rating-label">{r.label}</span>
                  <span className="rating-interval">{formatInterval(cardState, r.key)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            className="btn btn-primary btn-lg show-answer-btn"
            onClick={() => setShowAnswer(true)}
            id="show-answer-btn"
          >
            Show Answer
          </button>
        )}
      </div>

      <style jsx>{`
        .review-session {
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 120px);
          padding: 0 24px;
        }

        .review-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .review-progress-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .remaining-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        .review-card-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 0;
        }

        .rating-area {
          padding: 24px 0 32px;
          display: flex;
          justify-content: center;
          min-height: 100px;
        }

        .show-answer-btn {
          min-width: 220px;
        }

        .rating-buttons {
          display: flex;
          gap: 12px;
          animation: fadeInUp 0.3s var(--ease-out-expo) both;
        }

        .rating-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 20px;
          min-width: 85px;
          background: var(--bg-glass);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-normal);
          font-family: var(--font-body);
        }

        .rating-btn:hover {
          background: var(--bg-glass-hover);
          border-color: var(--border-accent);
          transform: translateY(-2px);
        }

        .rating-icon {
          font-size: 1.2rem;
        }

        .rating-label {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .rating-interval {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .rating-buttons {
            gap: 8px;
          }
          .rating-btn {
            min-width: 70px;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}
