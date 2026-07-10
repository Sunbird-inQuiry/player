import type { Question, UserResponse } from '../../types';
import type { MediaResolveContext } from '../../utils/media';

/**
 * Shared props for every question-type renderer (the IQuestionPlayer contract).
 *
 * Renderers are PURE: they render UI and emit a normalized `UserResponse` via
 * `onOptionSelected`. No Context, no services, no scoring/telemetry/storage.
 */
export interface QuestionComponentProps {
  question: Question;
  replayed?: boolean;
  language?: string;
  shuffleOptions?: boolean;
  savedResponse?: UserResponse | null;
  baseUrl?: string;
  /** Media + offline resolution inputs, built by QuestionRenderer. */
  mediaCtx?: MediaResolveContext;
  score?: number | null;
  onOptionSelected?: (response: UserResponse) => void;
  onComponentLoaded?: () => void;
  onGoToNext?: () => void; // FTB: advance after the last blank
}
