import { Sentence, SentenceProgress } from '../types';
import { DEFAULT_SENTENCES } from '../constants';

const SENTENCES_STORAGE_KEY = 'shadowpop_sentences_v2';
const PROGRESS_STORAGE_KEY = 'shadowpop_progress_v1';

// In-memory fallback
let memorySentences: Sentence[] = [...DEFAULT_SENTENCES];
let memoryProgress: Record<number, SentenceProgress> = {};

export function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(SENTENCES_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_SENTENCES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load sentences from localStorage, using memory/default:', err);
  }
  return memorySentences;
}

export function saveSentences(sentences: Sentence[]): void {
  memorySentences = [...sentences];
  try {
    localStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
  } catch (err) {
    console.warn('Failed to save sentences to localStorage, stored in memory:', err);
  }
}

export function loadAllProgress(): Record<number, SentenceProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load progress from localStorage:', err);
  }
  return { ...memoryProgress };
}

export function saveSentenceProgress(progress: SentenceProgress): void {
  memoryProgress[progress.id] = { ...progress };
  try {
    const current = loadAllProgress();
    // Strip in-memory blob URLs before serializing to localStorage
    const toSave: Record<number, SentenceProgress> = {
      ...current,
      [progress.id]: {
        ...progress,
        recordedAudioUrl: undefined, // blob URLs shouldn't be stored in localStorage
      },
    };
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn('Failed to save progress to localStorage, stored in memory:', err);
  }
}

export function resetSentencesToDefault(): Sentence[] {
  saveSentences(DEFAULT_SENTENCES);
  return [...DEFAULT_SENTENCES];
}

export function resetAllProgress(): void {
  memoryProgress = {};
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear progress in localStorage:', err);
  }
}
