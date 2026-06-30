import { useEffect, useRef, useState } from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { firstCardinality, firstInteractionOptions, resolveLabel } from '../question-utils';
import type { QuestionComponentProps } from '../types';
import styles from './McqQuestion.module.scss';

/**
 * MCQ (Multiple Choice Question) — pure renderer.
 * Reads options from `interactions.responseN.options` and cardinality from
 * `responseDeclaration.responseN.cardinality`. Emits a clean UserResponse:
 * single → { value }, multiple → { values }. No scoring/telemetry/storage.
 */
export function McqQuestion({
  question,
  replayed = false,
  language = 'en',
  savedResponse = null,
  score = null,
  onOptionSelected,
  onComponentLoaded,
}: QuestionComponentProps) {
  const options = firstInteractionOptions(question);
  const isMultiple = firstCardinality(question) === 'multiple';

  const [selected, setSelected] = useState<Array<number | string>>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (savedResponse?.values) {
      setSelected(savedResponse.values);
    } else if (savedResponse?.value !== undefined && savedResponse?.value !== null) {
      setSelected([savedResponse.value]);
    }
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
    // Re-run only when the question identity changes.
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (value: number | string) => {
    if (replayed) return;
    const next = isMultiple
      ? selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
      : [value];
    setSelected(next);
    onOptionSelected?.(
      isMultiple
        ? { values: next, timestamp: Date.now() }
        : { value: next[0], timestamp: Date.now() },
    );
  };

  return (
    <div className={styles.mcq}>
      <QuestionBody question={question} language={language} />

      <div
        className={styles.options}
        role={isMultiple ? 'group' : 'radiogroup'}
        aria-label="Answer options"
      >
        {options.map((opt, index) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={`${opt.value}-${index}`}
              type="button"
              className={`${styles.option} ${isSelected ? styles.selected : ''}`.trim()}
              role={isMultiple ? 'checkbox' : 'radio'}
              aria-checked={isSelected}
              disabled={replayed}
              onClick={() => handleSelect(opt.value)}
            >
              <span
                className={`${styles.indicator} ${isMultiple ? styles.checkbox : styles.radio}`}
                aria-hidden="true"
              >
                {isSelected && <span className={styles.indicatorMark} />}
              </span>
              <span className={styles.alpha} aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <span
                className={styles.label}
                dangerouslySetInnerHTML={{ __html: resolveLabel(opt.label, language) }}
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
