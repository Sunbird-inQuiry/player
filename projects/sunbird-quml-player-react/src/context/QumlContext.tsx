/**
 * QUML Context - Global state management for the player
 *
 * SINGLE SOURCE OF TRUTH FOR RUNTIME STATE:
 * This context owns:
 * - playerConfig (configuration)
 * - sections (quiz structure)
 * - questions (current section's questions)
 * - answers (learner responses) ← THE OWNER
 * - language, UI flags, etc.
 *
 * Nothing else owns these. No services, no localStorage, no duplicate copies.
 * Services like storage-service only persist/restore from this context.
 */

import { createContext, useReducer, useCallback, useMemo } from 'react';
import type { Dispatch, ReactNode } from 'react';
import { Languages } from '../utils/constants';
import type {
  AssessmentState,
  PlayerConfig,
  Section,
  Question,
  UserResponse,
} from '../types';

// Initial state shape
export const initialState: AssessmentState = {
  // Config
  playerConfig: null,
  context: null,
  config: null,

  // Data
  sections: [],
  currentSectionIndex: 0,
  questions: [],
  currentQuestionIndex: 0,

  // State
  answers: {},
  loading: false,
  error: null,
  isDurationExpired: false,

  // UI
  language: Languages.EN,
  showFeedback: false,
  showSolutions: false,
  attemptNumber: 1,
};

// Action types
export const QumlActionTypes = {
  SET_PLAYER_CONFIG: 'SET_PLAYER_CONFIG',
  SET_SECTIONS: 'SET_SECTIONS',
  SET_QUESTIONS: 'SET_QUESTIONS',
  SET_CURRENT_SECTION: 'SET_CURRENT_SECTION',
  SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
  STORE_ANSWER: 'STORE_ANSWER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_SHOW_FEEDBACK: 'SET_SHOW_FEEDBACK',
  RESET_STATE: 'RESET_STATE',
  CLEAR_ERROR: 'CLEAR_ERROR',
} as const;

// Strongly-typed, discriminated-union actions
export type QumlAction =
  | { type: typeof QumlActionTypes.SET_PLAYER_CONFIG; payload: PlayerConfig }
  | { type: typeof QumlActionTypes.SET_SECTIONS; payload: Section[] }
  | { type: typeof QumlActionTypes.SET_QUESTIONS; payload: Question[] }
  | { type: typeof QumlActionTypes.SET_CURRENT_SECTION; payload: number }
  | { type: typeof QumlActionTypes.SET_CURRENT_QUESTION; payload: number }
  | { type: typeof QumlActionTypes.STORE_ANSWER; payload: { identifier: string; response: UserResponse } }
  | { type: typeof QumlActionTypes.SET_LOADING; payload: boolean }
  | { type: typeof QumlActionTypes.SET_ERROR; payload: string | null }
  | { type: typeof QumlActionTypes.SET_LANGUAGE; payload: string }
  | { type: typeof QumlActionTypes.SET_SHOW_FEEDBACK; payload: boolean }
  | { type: typeof QumlActionTypes.RESET_STATE }
  | { type: typeof QumlActionTypes.CLEAR_ERROR };

/**
 * Reducer function for state updates. Pure: (state, action) → new state.
 */
export function qumlReducer(state: AssessmentState, action: QumlAction): AssessmentState {
  switch (action.type) {
    case QumlActionTypes.SET_PLAYER_CONFIG:
      return {
        ...state,
        playerConfig: action.payload,
        context: action.payload.context,
        config: action.payload.config,
        language: action.payload.config?.language || Languages.EN,
      };

    case QumlActionTypes.SET_SECTIONS:
      return {
        ...state,
        sections: action.payload,
        currentSectionIndex: 0,
      };

    case QumlActionTypes.SET_QUESTIONS:
      return {
        ...state,
        questions: action.payload,
        currentQuestionIndex: 0,
        loading: false,
      };

    case QumlActionTypes.SET_CURRENT_SECTION:
      return {
        ...state,
        currentSectionIndex: action.payload,
      };

    case QumlActionTypes.SET_CURRENT_QUESTION:
      return {
        ...state,
        currentQuestionIndex: action.payload,
      };

    case QumlActionTypes.STORE_ANSWER: {
      const { identifier, response } = action.payload;
      const newAnswers = { ...state.answers };
      newAnswers[identifier] = response;
      return {
        ...state,
        answers: newAnswers,
      };
    }

    case QumlActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case QumlActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case QumlActionTypes.SET_LANGUAGE:
      return {
        ...state,
        language: action.payload,
      };

    case QumlActionTypes.SET_SHOW_FEEDBACK:
      return {
        ...state,
        showFeedback: action.payload,
      };

    case QumlActionTypes.RESET_STATE:
      return initialState;

    case QumlActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

/** The value exposed by QumlContext. Action creators are the ONLY way to update state. */
export interface QumlContextValue {
  state: AssessmentState;
  dispatch: Dispatch<QumlAction>;
  setPlayerConfig: (config: PlayerConfig) => void;
  setSections: (sections: Section[]) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentSection: (index: number) => void;
  setCurrentQuestion: (index: number) => void;
  storeAnswer: (identifier: string, response: UserResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLanguage: (language: string) => void;
  setShowFeedback: (show: boolean) => void;
  resetState: () => void;
}

export const QumlContext = createContext<QumlContextValue | null>(null);

interface QumlProviderProps {
  children: ReactNode;
  playerConfig?: PlayerConfig | null;
}

/**
 * QuML Provider Component
 */
export function QumlProvider({ children, playerConfig }: QumlProviderProps) {
  const [state, dispatch] = useReducer(qumlReducer, {
    ...initialState,
    language: playerConfig?.config?.language || Languages.EN,
  });

  // Action creators (memoized)
  const setPlayerConfig = useCallback((config: PlayerConfig) => {
    dispatch({ type: QumlActionTypes.SET_PLAYER_CONFIG, payload: config });
    // ✓ No service call needed. Config is now stored in Context.
  }, []);

  const setSections = useCallback((sections: Section[]) => {
    dispatch({ type: QumlActionTypes.SET_SECTIONS, payload: sections });
  }, []);

  const setQuestions = useCallback((questions: Question[]) => {
    dispatch({ type: QumlActionTypes.SET_QUESTIONS, payload: questions });
  }, []);

  const setCurrentSection = useCallback((index: number) => {
    dispatch({ type: QumlActionTypes.SET_CURRENT_SECTION, payload: index });
  }, []);

  const setCurrentQuestion = useCallback((index: number) => {
    dispatch({ type: QumlActionTypes.SET_CURRENT_QUESTION, payload: index });
  }, []);

  const storeAnswer = useCallback((identifier: string, response: UserResponse) => {
    // ✓ ONLY update Context (single source of truth)
    dispatch({ type: QumlActionTypes.STORE_ANSWER, payload: { identifier, response } });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: QumlActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: QumlActionTypes.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: QumlActionTypes.CLEAR_ERROR });
  }, []);

  const setLanguage = useCallback((language: string) => {
    dispatch({ type: QumlActionTypes.SET_LANGUAGE, payload: language });
  }, []);

  const setShowFeedback = useCallback((show: boolean) => {
    dispatch({ type: QumlActionTypes.SET_SHOW_FEEDBACK, payload: show });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: QumlActionTypes.RESET_STATE });
  }, []);

  // Memoize context value
  const contextValue = useMemo<QumlContextValue>(
    () => ({
      state,
      dispatch,
      setPlayerConfig,
      setSections,
      setQuestions,
      setCurrentSection,
      setCurrentQuestion,
      storeAnswer,
      setLoading,
      setError,
      clearError,
      setLanguage,
      setShowFeedback,
      resetState,
    }),
    [
      state,
      setPlayerConfig,
      setSections,
      setQuestions,
      setCurrentSection,
      setCurrentQuestion,
      storeAnswer,
      setLoading,
      setError,
      clearError,
      setLanguage,
      setShowFeedback,
      resetState,
    ],
  );

  return <QumlContext.Provider value={contextValue}>{children}</QumlContext.Provider>;
}
