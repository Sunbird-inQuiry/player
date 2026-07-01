import { getQuestionComponent } from '../../registry/question-type-registry';
import { useQuml } from '../../context/useQuml';
import type { MediaItem, MediaResolveContext } from '../../utils/media';
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
  shuffleOptions = true,
  score = null,
  onOptionSelected,
  onComponentLoaded,
  onShowAnswerClicked,
  onGoToNext,
}: QuestionRendererProps) {
  const { state } = useQuml();
  const language = state.language;

  if (!question) {
    return <div className={styles.error}>No question provided</div>;
  }

  // Build the media-resolution context (Angular parity). Online image host comes
  // from media[].baseUrl; basePath/isAvailableLocally drive the offline packaged
  // flow (mirrors main-player.component.ts:243). Section id is looked up from the
  // question's parent so both live play and review resolve correctly.
  const offline = state.playerConfig?.metadata;
  const sectionId = state.sections.find((s) =>
    s.children.some((q) => q.identifier === question.identifier),
  )?.identifier;
  const mediaCtx: MediaResolveContext = {
    media: question.media as MediaItem[] | undefined,
    basePath: offline?.basePath,
    isAvailableLocally: offline?.isAvailableLocally,
    sectionId,
    questionId: question.identifier,
  };

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
        mediaCtx={mediaCtx}
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
