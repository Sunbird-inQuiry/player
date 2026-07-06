/**
 * Storage Service - Optional Persistence Layer
 *
 * SINGLE SOURCE OF TRUTH:
 * - Runtime answers are owned by Context.state.answers
 * - This service only handles persistence to localStorage
 * - DO NOT use this for runtime state management
 *
 * This service is OPTIONAL. Remove it if persistence isn't needed.
 */

import type { AnswersMap } from '../types';

/**
 * Persist answers to localStorage (optional, explicit call only).
 * @param answers - { questionId: response, ... }
 * @param key - Storage key
 */
export function persistAnswersToLocalStorage(answers: AnswersMap, key = 'quml-answers'): void {
  try {
    localStorage.setItem(key, JSON.stringify(answers));
    console.log('[StorageService] Answers persisted to localStorage');
  } catch (e) {
    console.warn('[StorageService] Failed to persist:', e);
  }
}

/**
 * Restore answers from localStorage (optional, explicit call only).
 * @param key - Storage key
 * @returns { questionId: response, ... } or {}
 */
export function restoreAnswersFromLocalStorage(key = 'quml-answers'): AnswersMap {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const answers = JSON.parse(data) as AnswersMap;
      console.log('[StorageService] Answers restored from localStorage');
      return answers;
    }
  } catch (e) {
    console.warn('[StorageService] Failed to restore:', e);
  }
  return {};
}

/**
 * Clear persisted answers from localStorage.
 * @param key - Storage key
 */
export function clearPersistedAnswers(key = 'quml-answers'): void {
  try {
    localStorage.removeItem(key);
    console.log('[StorageService] Persisted answers cleared');
  } catch (e) {
    console.warn('[StorageService] Failed to clear:', e);
  }
}
