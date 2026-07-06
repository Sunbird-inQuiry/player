import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  QumlProvider,
  QumlActionTypes,
  qumlReducer,
  initialState,
} from './QumlContext';
import type { QumlAction } from './QumlContext';
import { useQuml } from './useQuml';
import type { PlayerConfig, Section, Question } from '../types';

const mockPlayerConfig: PlayerConfig = {
  context: { uid: '123', sid: '456', channel: 'test' },
  config: { language: 'en' },
  data: {},
};

const makeSection = (id: string): Section => ({
  identifier: id,
  name: id,
  children: [],
  timeLimits: { max: 0, min: 0 },
  allowSkip: true,
  shuffle: false,
});

const makeQuestion = (id: string): Question => ({
  identifier: id,
  body: '',
  primaryCategory: 'multiple choice question',
  maxScore: 1,
});

// ---------------------------------------------------------------------------
// Reducer (pure) unit tests
// ---------------------------------------------------------------------------
describe('qumlReducer', () => {
  it('returns the initial state with all expected fields', () => {
    expect(initialState.currentSectionIndex).toBe(0);
    expect(initialState.currentQuestionIndex).toBe(0);
    expect(initialState.answers).toEqual({});
    expect(initialState.language).toBe('en');
    expect(initialState.loading).toBe(false);
    expect(initialState.error).toBeNull();
  });

  it('SET_PLAYER_CONFIG stores config/context and derives language', () => {
    const next = qumlReducer(initialState, {
      type: QumlActionTypes.SET_PLAYER_CONFIG,
      payload: { ...mockPlayerConfig, config: { language: 'fr' } },
    });
    expect(next.playerConfig).not.toBeNull();
    expect(next.context).toEqual(mockPlayerConfig.context);
    expect(next.language).toBe('fr');
  });

  it('SET_PLAYER_CONFIG falls back to EN when no language set', () => {
    const next = qumlReducer(initialState, {
      type: QumlActionTypes.SET_PLAYER_CONFIG,
      payload: { context: {}, config: {} },
    });
    expect(next.language).toBe('en');
  });

  it('SET_SECTIONS sets sections and resets section index', () => {
    const seeded = { ...initialState, currentSectionIndex: 3 };
    const next = qumlReducer(seeded, {
      type: QumlActionTypes.SET_SECTIONS,
      payload: [makeSection('s1'), makeSection('s2')],
    });
    expect(next.sections).toHaveLength(2);
    expect(next.currentSectionIndex).toBe(0);
  });

  it('SET_QUESTIONS sets questions, resets index, clears loading', () => {
    const seeded = { ...initialState, loading: true, currentQuestionIndex: 5 };
    const next = qumlReducer(seeded, {
      type: QumlActionTypes.SET_QUESTIONS,
      payload: [makeQuestion('q1')],
    });
    expect(next.questions).toHaveLength(1);
    expect(next.currentQuestionIndex).toBe(0);
    expect(next.loading).toBe(false);
  });

  it('SET_CURRENT_SECTION / SET_CURRENT_QUESTION update indices', () => {
    let next = qumlReducer(initialState, {
      type: QumlActionTypes.SET_CURRENT_SECTION,
      payload: 2,
    });
    expect(next.currentSectionIndex).toBe(2);
    next = qumlReducer(next, { type: QumlActionTypes.SET_CURRENT_QUESTION, payload: 4 });
    expect(next.currentQuestionIndex).toBe(4);
  });

  it('STORE_ANSWER adds an answer keyed by identifier (immutably)', () => {
    const next = qumlReducer(initialState, {
      type: QumlActionTypes.STORE_ANSWER,
      payload: { identifier: 'q1', response: { value: 0 } },
    });
    expect(next.answers.q1).toEqual({ value: 0 });
    // original state not mutated
    expect(initialState.answers.q1).toBeUndefined();
  });

  it('STORE_ANSWER overwrites the answer for the same identifier', () => {
    const first = qumlReducer(initialState, {
      type: QumlActionTypes.STORE_ANSWER,
      payload: { identifier: 'q1', response: { value: 0 } },
    });
    const second = qumlReducer(first, {
      type: QumlActionTypes.STORE_ANSWER,
      payload: { identifier: 'q1', response: { value: 1 } },
    });
    expect(second.answers.q1).toEqual({ value: 1 });
  });

  it('SET_LOADING toggles loading', () => {
    expect(qumlReducer(initialState, { type: QumlActionTypes.SET_LOADING, payload: true }).loading).toBe(true);
  });

  it('SET_ERROR sets error and clears loading', () => {
    const seeded = { ...initialState, loading: true };
    const next = qumlReducer(seeded, { type: QumlActionTypes.SET_ERROR, payload: 'boom' });
    expect(next.error).toBe('boom');
    expect(next.loading).toBe(false);
  });

  it('CLEAR_ERROR resets error to null', () => {
    const seeded = { ...initialState, error: 'boom' };
    expect(qumlReducer(seeded, { type: QumlActionTypes.CLEAR_ERROR }).error).toBeNull();
  });

  it('SET_LANGUAGE updates the language', () => {
    expect(qumlReducer(initialState, { type: QumlActionTypes.SET_LANGUAGE, payload: 'pt' }).language).toBe('pt');
  });

  it('SET_SHOW_FEEDBACK toggles showFeedback', () => {
    expect(qumlReducer(initialState, { type: QumlActionTypes.SET_SHOW_FEEDBACK, payload: true }).showFeedback).toBe(true);
  });

  it('SET_ATTEMPT updates the attempt number (Phase 7 retake)', () => {
    const next = qumlReducer(initialState, { type: QumlActionTypes.SET_ATTEMPT, payload: 2 });
    expect(next.attemptNumber).toBe(2);
  });

  it('RESET_STATE returns the initial state', () => {
    const seeded = { ...initialState, language: 'fr', answers: { q1: { value: 0 } } };
    expect(qumlReducer(seeded, { type: QumlActionTypes.RESET_STATE })).toEqual(initialState);
  });

  it('ignores an unknown/invalid action and returns the same state', () => {
    const invalid = { type: 'NOPE', payload: 1 } as unknown as QumlAction;
    expect(qumlReducer(initialState, invalid)).toBe(initialState);
  });
});

// ---------------------------------------------------------------------------
// Provider integration tests
// ---------------------------------------------------------------------------
function TestComponent() {
  const { state, storeAnswer } = useQuml();
  return (
    <div>
      <div data-testid="language">{state.language}</div>
      <button onClick={() => storeAnswer('q1', { value: 0 })}>Store Answer</button>
      <div data-testid="answer-q1">{state.answers.q1?.value ?? 'No answer'}</div>
    </div>
  );
}

const wrapper =
  (playerConfig?: PlayerConfig) =>
  ({ children }: { children: ReactNode }) =>
    <QumlProvider playerConfig={playerConfig}>{children}</QumlProvider>;

describe('QumlProvider', () => {
  it('provides context to children and initializes language from config', () => {
    render(
      <QumlProvider playerConfig={mockPlayerConfig}>
        <TestComponent />
      </QumlProvider>,
    );
    expect(screen.getByTestId('language')).toHaveTextContent('en');
  });

  it('defaults language to EN when no playerConfig provided', () => {
    const { result } = renderHook(() => useQuml(), { wrapper: wrapper() });
    expect(result.current.state.language).toBe('en');
  });

  it('stores answers via the storeAnswer action creator', () => {
    render(
      <QumlProvider playerConfig={mockPlayerConfig}>
        <TestComponent />
      </QumlProvider>,
    );
    act(() => {
      screen.getByRole('button').click();
    });
    expect(screen.getByTestId('answer-q1')).toHaveTextContent('0');
  });

  it('supports section and question changes', () => {
    const { result } = renderHook(() => useQuml(), { wrapper: wrapper(mockPlayerConfig) });
    act(() => result.current.setSections([makeSection('s1'), makeSection('s2')]));
    act(() => result.current.setCurrentSection(1));
    expect(result.current.state.currentSectionIndex).toBe(1);
    act(() => result.current.setQuestions([makeQuestion('q1')]));
    act(() => result.current.setCurrentQuestion(0));
    expect(result.current.state.questions).toHaveLength(1);
  });

  it('handles loading, error, and clearError flows', () => {
    const { result } = renderHook(() => useQuml(), { wrapper: wrapper(mockPlayerConfig) });
    act(() => result.current.setLoading(true));
    expect(result.current.state.loading).toBe(true);
    act(() => result.current.setError('network'));
    expect(result.current.state.error).toBe('network');
    expect(result.current.state.loading).toBe(false);
    act(() => result.current.clearError());
    expect(result.current.state.error).toBeNull();
  });

  it('changes language and resets state', () => {
    const { result } = renderHook(() => useQuml(), { wrapper: wrapper(mockPlayerConfig) });
    act(() => result.current.setLanguage('ar'));
    expect(result.current.state.language).toBe('ar');
    act(() => result.current.resetState());
    expect(result.current.state).toEqual(initialState);
  });

  it('sets the attempt number via setAttempt', () => {
    const { result } = renderHook(() => useQuml(), { wrapper: wrapper(mockPlayerConfig) });
    act(() => result.current.setAttempt(3));
    expect(result.current.state.attemptNumber).toBe(3);
  });
});
