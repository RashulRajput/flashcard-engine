/**
 * localStorage wrapper for persisting decks and review states.
 */

const STORAGE_KEY = 'synapse_decks';

export function loadDecks() {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error('Failed to save decks:', e);
  }
}

export function addDeck(deck) {
  const decks = loadDecks();
  decks.push(deck);
  saveDecks(decks);
  return decks;
}

export function updateDeck(deckId, updater) {
  const decks = loadDecks();
  const idx = decks.findIndex((d) => d.id === deckId);
  if (idx !== -1) {
    decks[idx] = updater(decks[idx]);
    saveDecks(decks);
  }
  return decks;
}

export function deleteDeck(deckId) {
  const decks = loadDecks().filter((d) => d.id !== deckId);
  saveDecks(decks);
  return decks;
}

export function getDeck(deckId) {
  return loadDecks().find((d) => d.id === deckId) || null;
}
