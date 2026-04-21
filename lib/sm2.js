/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 * 
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect; correct answer remembered after seeing it
 * 2 - Incorrect; correct answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect response
 */

/**
 * Creates a new card state with default SM-2 values.
 */
export function createCardState(cardId) {
  return {
    cardId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewDate: null,
  };
}

/**
 * Processes a review for a card and returns the updated state.
 * @param {object} cardState - Current state of the card
 * @param {number} quality - Quality of the response (0-5)
 * @returns {object} Updated card state
 */
export function processReview(cardState, quality) {
  quality = Math.max(0, Math.min(5, Math.round(quality)));

  let { repetitions, easeFactor, interval } = cardState;

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  let newInterval;
  let newRepetitions;

  if (quality < 3) {
    // Failed — reset
    newRepetitions = 0;
    newInterval = 0;
  } else {
    // Success
    newRepetitions = repetitions + 1;

    if (repetitions === 0) {
      newInterval = 1; // 1 day
    } else if (repetitions === 1) {
      newInterval = 6; // 6 days
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + Math.max(newInterval, 0));

  return {
    ...cardState,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextReviewDate: nextReview.toISOString(),
    lastReviewDate: now.toISOString(),
  };
}

/**
 * Check if a card is due for review.
 */
export function isDue(cardState) {
  if (!cardState.nextReviewDate) return true;
  return new Date() >= new Date(cardState.nextReviewDate);
}

/**
 * Maps a user-friendly rating to SM-2 quality.
 * "again" -> 1, "hard" -> 3, "good" -> 4, "easy" -> 5
 */
export function ratingToQuality(rating) {
  const map = {
    again: 1,
    hard: 3,
    good: 4,
    easy: 5,
  };
  return map[rating] ?? 4;
}

/**
 * Returns a human-readable string for the next review interval.
 */
export function formatInterval(cardState, rating) {
  const simulated = processReview(cardState, ratingToQuality(rating));
  const days = simulated.interval;
  if (days === 0) return '< 1 min';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.round(days / 30)} mo`;
  return `${(days / 365).toFixed(1)} yr`;
}
