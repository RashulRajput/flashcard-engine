'use client';

import { useState } from 'react';

export default function Flashcard({ card, showAnswer: controlledShow, onFlip }) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledShow !== undefined ? controlledShow : internalFlipped;

  const handleClick = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  return (
    <div className="flashcard-wrapper" onClick={handleClick} id={`flashcard-${card.id}`}>
      <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="flashcard-face flashcard-front">
          <div className="card-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Question
          </div>
          <p className="card-text">{card.question}</p>
          <span className="tap-hint">Click to reveal</span>
        </div>

        {/* Back */}
        <div className="flashcard-face flashcard-back">
          <div className="card-label answer-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Answer
          </div>
          <p className="card-text">{card.answer}</p>
        </div>
      </div>

      <style jsx>{`
        .flashcard-wrapper {
          perspective: 1200px;
          width: 100%;
          max-width: 520px;
          height: 320px;
          cursor: pointer;
          margin: 0 auto;
        }

        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s var(--ease-out-expo);
          transform-style: preserve-3d;
        }

        .flashcard-inner.flipped {
          transform: rotateY(180deg);
        }

        .flashcard-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 32px;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
        }

        .flashcard-front {
          background: linear-gradient(145deg, rgba(30, 30, 55, 0.8), rgba(20, 20, 40, 0.9));
          box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .flashcard-back {
          background: linear-gradient(145deg, rgba(108, 99, 255, 0.12), rgba(0, 212, 255, 0.08));
          border-color: var(--border-accent);
          transform: rotateY(180deg);
          box-shadow: var(--shadow-md), var(--shadow-glow);
        }

        .card-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .answer-label {
          color: var(--accent-secondary);
        }

        .card-text {
          font-size: 1.1rem;
          line-height: 1.7;
          text-align: center;
          color: var(--text-primary);
          max-height: 180px;
          overflow-y: auto;
          padding: 0 8px;
        }

        .tap-hint {
          position: absolute;
          bottom: 16px;
          font-size: 0.72rem;
          color: var(--text-muted);
          opacity: 0.6;
        }

        .flashcard-wrapper:hover .flashcard-front {
          border-color: var(--border-accent);
        }
      `}</style>
    </div>
  );
}
