import { useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { firstInteractionOptions, resolveLabel } from '../question-utils';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './BooleanQuestion.module.scss';

/**
 * BooleanQuestion (True/False) — pure renderer.
 *
 * primaryCategory : 'boolean question'
 * qType           : 'BOOL'
 * templateId      : 'boolean'
 *
 * Always has exactly 2 options (True / False) and is always single-cardinality.
 * Emits { value, timestamp } via onOptionSelected — same shape as MCQ single.
 */
export function BooleanQuestion({
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
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (replayed) {
      setSelected(null);
    }
  }, [replayed]);

  const handleSelect = (value: number | string) => {
    if (replayed) return;
    setSelected(value);
    onOptionSelected?.({ value, timestamp: Date.now() });
  };

  const handleKeyDown = (event: React.KeyboardEvent, value: number | string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(value);
    }
  };

  return (
    <div className={styles.boolean}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />

      <div
        className={styles.optionsRow}
        role="radiogroup"
        aria-label="True or False"
      >
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          const labelHtml = resolveLabel(opt.label, language, ctx);

          return (
            <button
              key={opt.value}
              type="button"
              className={`${styles.card} ${isSelected ? styles.selected : ''}`.trim()}
              role="radio"
              aria-checked={isSelected}
              disabled={replayed}
              onClick={() => handleSelect(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, opt.value)}
            >
              <span
                className={styles.cardLabel}
                dangerouslySetInnerHTML={{ __html: labelHtml }}
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
