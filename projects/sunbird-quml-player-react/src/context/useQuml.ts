/**
 * Custom Hook - useQuml
 * Provides easy access to QuML context.
 */

import { useContext } from 'react';
import { QumlContext } from './QumlContext';
import type { QumlContextValue } from './QumlContext';
import type { AssessmentState } from '../types';

export function useQuml(): QumlContextValue {
  const context = useContext(QumlContext);

  if (!context) {
    throw new Error('useQuml must be used within QumlProvider');
  }

  return context;
}

/**
 * useQumlState - when you only need state (not dispatch or actions).
 */
export function useQumlState(): AssessmentState {
  const { state } = useQuml();
  return state;
}

/**
 * useQumlActions - when you only need actions (not state).
 */
export function useQumlActions() {
  const context = useQuml();
  return {
    setPlayerConfig: context.setPlayerConfig,
    setSections: context.setSections,
    setQuestions: context.setQuestions,
    setCurrentSection: context.setCurrentSection,
    setCurrentQuestion: context.setCurrentQuestion,
    storeAnswer: context.storeAnswer,
    setLoading: context.setLoading,
    setError: context.setError,
    setLanguage: context.setLanguage,
    setShowFeedback: context.setShowFeedback,
    resetState: context.resetState,
  };
}
