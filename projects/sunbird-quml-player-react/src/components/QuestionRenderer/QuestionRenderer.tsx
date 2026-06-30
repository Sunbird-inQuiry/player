import { getQuestionComponent } from '../../registry/question-type-registry';
import { useQuml } from '../../context/useQuml';
import type { Question, UserResponse } from '../../types';
import styles from './QuestionRenderer.module.scss';

/**
 * QuestionRenderer — dynamic dispatcher.
 * Looks up the renderer by primaryCategory and passes the cross-section
 * savedResponse (answers keyed by question.identifier). Reads ONLY language +
 * answers from Context; emits intent upward via callbacks.
 */
interface QuestionRendererProps {
  question: Question | null;
  replayed?: boolean;
  tryAgain?: boolean;
  baseUrl?: string;
  shuffleOptions?: boolean;
  /** Review/replay: per-question score for display (forwarded to the component). */
  score?: number | null;
  onOptionSelected?: (response: UserResponse) => void;
  onComponentLoaded?: () => void;
  onShowAnswerClicked?: () => void;
  onGoToNext?: () => void;
}

export function QuestionRenderer({
  question,
  replayed = false,
  tryAgain = false,
  baseUrl = '',
  shuffleOptions = true,
  score = null,
  onOptionSelected,
  onComponentLoaded,
  onShowAnswerClicked,
  onGoToNext,
}: QuestionRendererProps) {
  const { state } = useQuml();
  const language = state.language;
  // Content base URL for resolving relative image/asset paths: explicit prop wins,
  // otherwise fall back to the player config (set by the embedding app / API).
  const resolvedBaseUrl =
    baseUrl || (state.config?.baseUrl as string | undefined) || (state.config?.host as string | undefined) || '';

  if (!question) {
    return <div className={styles.error}>No question provided</div>;
  }

  // Cross-section restore: answers are keyed by globally-unique identifier.
  const savedResponse = state.answers[question.identifier] || null;
  const QuestionComponent = getQuestionComponent(question.primaryCategory);

  if (!QuestionComponent) {
    return <div className={styles.error}>Unknown question type: {question.primaryCategory}</div>;
  }

  return (
    <div className={styles.renderer}>
      <QuestionComponent
        question={question}
        replayed={replayed}
        tryAgain={tryAgain}
        language={language}
        baseUrl={resolvedBaseUrl}
        shuffleOptions={shuffleOptions}
        savedResponse={savedResponse}
        score={score}
        onOptionSelected={onOptionSelected}
        onComponentLoaded={onComponentLoaded}
        onShowAnswerClicked={onShowAnswerClicked}
        onGoToNext={onGoToNext}
      />
    </div>
  );
}
