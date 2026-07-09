import { useEffect, useRef, useState } from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { readI18n, t } from '../../../i18n/translations';
import { resolveMediaHtml } from '../../../utils/media';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import type { QuestionComponentProps } from '../types';
import styles from './SaQuestion.module.scss';

/**
 * SA (Subjective / Short Answer) — read-only display.
 * Subjective answers are reviewed manually, so this renderer does NOT collect a
 * scored answer and emits nothing. It shows the question body and (if present)
 * the model answer, which is BLURRED behind a "Show Answer" button until the
 * learner chooses to reveal it.
 */
export function SaQuestion({
  question,
  language = 'en',
  mediaCtx,
  savedResponse = null,
  onOptionSelected,
  onComponentLoaded,
}: QuestionComponentProps) {
  const loadedRef = useRef(false);
  const [revealed, setRevealed] = useState(Boolean(savedResponse?.shown));

  // Revealing the model answer self-marks the SA question correct (full score),
  // mirroring the Angular player. Emits so SectionPlayer stores/scores it.
  const handleReveal = () => {
    setRevealed(true);
    onOptionSelected?.({ shown: true, timestamp: Date.now() });
  };

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const ctx: MediaResolveContext = {
    ...mediaCtx,
    media: mediaCtx?.media ?? (question.media as MediaItem[] | undefined),
  };
  const modelAnswer = question.answer
    ? resolveMediaHtml(readI18n(question.answer, language), ctx)
    : '';

  return (
    <div className={styles.sa}>
      {revealed && <p className={styles.label}>{t(language, 'QUESTION')}</p>}
      <QuestionBody question={question} language={language} mediaCtx={ctx} />

      {modelAnswer && (
        <>
          {!revealed && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.revealBtn}
                onClick={handleReveal}
                aria-expanded={false}
              >
                {t(language, 'SHOW_ANSWER')}
              </button>
            </div>
          )}

          <div
            className={`${styles.answer} ${revealed ? '' : styles.blurred}`.trim()}
            aria-hidden={revealed ? undefined : true}
          >
            <p className={styles.label}>{t(language, 'ANSWER')}</p>
            <div className={styles.answerText} dangerouslySetInnerHTML={{ __html: modelAnswer }} />
          </div>
        </>
      )}
    </div>
  );
}
