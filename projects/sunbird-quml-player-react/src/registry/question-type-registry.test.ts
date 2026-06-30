import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerQuestionType,
  getQuestionComponent,
  isQuestionTypeRegistered,
  getAllRegisteredTypes,
  clearRegistry,
  questionTypeRegistry,
} from './question-type-registry';
import type { QuestionComponent } from './question-type-registry';

const Dummy: QuestionComponent = () => null;

describe('question-type-registry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts empty (no components registered in Phase 2)', () => {
    expect(questionTypeRegistry.size).toBe(0);
  });

  it('registers and retrieves a component (case-insensitive)', () => {
    registerQuestionType('Multiple Choice Question', Dummy);
    expect(getQuestionComponent('multiple choice question')).toBe(Dummy);
    expect(getQuestionComponent('MULTIPLE CHOICE QUESTION')).toBe(Dummy);
  });

  it('isQuestionTypeRegistered reflects registration', () => {
    expect(isQuestionTypeRegistered('mcq')).toBe(false);
    registerQuestionType('mcq', Dummy);
    expect(isQuestionTypeRegistered('MCQ')).toBe(true);
  });

  it('getQuestionComponent returns null for unknown / empty input', () => {
    expect(getQuestionComponent('unknown')).toBeNull();
    expect(getQuestionComponent('')).toBeNull();
    expect(getQuestionComponent(null)).toBeNull();
    expect(getQuestionComponent(undefined)).toBeNull();
  });

  it('ignores invalid registration and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    registerQuestionType('', Dummy);
    expect(warn).toHaveBeenCalled();
    expect(questionTypeRegistry.size).toBe(0);
  });

  it('getAllRegisteredTypes lists entries', () => {
    registerQuestionType('a', Dummy);
    registerQuestionType('b', Dummy);
    expect(getAllRegisteredTypes()).toHaveLength(2);
  });
});
