import { useEffect, useRef, useState } from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { firstInteractionOptions, resolveLabel } from '../question-utils';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './McqQuestion.module.scss';

/**
 * MCQ (Multiple Choice Question) — pure single-select renderer.
 * Reads options from `interactions.responseN.options`. Exactly one option is
 * correct, so selection is single-choice (radio) and emits a clean UserResponse:
 * { value }. No scoring/telemetry/storage.
 */
export function McqQuestion({
  question,
  replayed = false,
  language = 'en',
  mediaCtx,
  savedResponse = null,
  score = null,
  onOptionSelected,
  onComponentLoaded,
}: QuestionComponentProps) {
  const options = firstInteractionOptions(question);
  const ctx: MediaResolveContext = {
    ...mediaCtx,
    media: mediaCtx?.media ?? (question.media as MediaItem[] | undefined),
  };

  const [selected, setSelected] = useState<number | string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (savedResponse?.value !== undefined && savedResponse?.value !== null) {
      setSelected(savedResponse.value);
    }
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
    // Re-run only when the question identity changes.
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (value: number | string) => {
    if (replayed) return;
    setSelected(value);
    onOptionSelected?.({ value, timestamp: Date.now() });
  };

  return (
    <div className={styles.mcq}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />

      <div className={styles.options} role="radiogroup" aria-label="Answer options">
        {options.map((opt, index) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={`${opt.value}-${index}`}
              type="button"
              className={`${styles.option} ${isSelected ? styles.selected : ''}`.trim()}
              role="radio"
              aria-checked={isSelected}
              disabled={replayed}
              onClick={() => handleSelect(opt.value)}
            >
              <span className={`${styles.indicator} ${styles.radio}`} aria-hidden="true">
                {isSelected && <span className={styles.indicatorMark} />}
              </span>
              <span className={styles.alpha} aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <span
                className={styles.label}
                dangerouslySetInnerHTML={{ __html: resolveLabel(opt.label, language, ctx) }}
              />
            </button>
          );
        })}
      </div>

      {replayed && score !== null && score !== undefined && (
        <div className={styles.review}>Score: {score}</div>
      )}
    </div>
  );
}
