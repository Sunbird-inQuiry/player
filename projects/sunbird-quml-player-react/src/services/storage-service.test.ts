import { describe, it, expect, beforeEach } from 'vitest';
import {
  persistAnswersToLocalStorage,
  restoreAnswersFromLocalStorage,
  clearPersistedAnswers,
} from './storage-service';
import type { AnswersMap } from '../types';

describe('StorageService', () => {
  const testKey = 'test-quiz-answers';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should persist answers to localStorage', () => {
    const answers: AnswersMap = { q1: { value: 0 }, q2: { value: 1 } };
    persistAnswersToLocalStorage(answers, testKey);

    const stored = localStorage.getItem(testKey);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(answers);
  });

  it('should restore answers from localStorage', () => {
    const answers: AnswersMap = { q1: { value: 0 } };
    persistAnswersToLocalStorage(answers, testKey);

    const restored = restoreAnswersFromLocalStorage(testKey);
    expect(restored).toEqual(answers);
  });

  it('should return empty object if no saved data', () => {
    const restored = restoreAnswersFromLocalStorage('nonexistent');
    expect(restored).toEqual({});
  });

  it('should clear persisted answers', () => {
    persistAnswersToLocalStorage({ q1: { value: 0 } }, testKey);
    clearPersistedAnswers(testKey);

    const restored = restoreAnswersFromLocalStorage(testKey);
    expect(restored).toEqual({});
  });
});
