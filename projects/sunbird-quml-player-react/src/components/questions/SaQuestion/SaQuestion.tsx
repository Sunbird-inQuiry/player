import { useEffect, useRef, useState } from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { readI18n, t } from '../../../i18n/translations';
import { resolveMediaHtml } from '../../../utils/media';
import type { MediaItem } from '../../../utils/media';
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
  baseUrl = '',
  onComponentLoaded,
}: QuestionComponentProps) {
  const loadedRef = useRef(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const modelAnswer = question.answer
    ? resolveMediaHtml(readI18n(question.answer, language), question.media as MediaItem[], baseUrl)
    : '';

  return (
    <div className={styles.sa}>
      {revealed && <p className={styles.label}>{t(language, 'QUESTION')}</p>}
      <QuestionBody question={question} language={language} baseUrl={baseUrl} />

      {modelAnswer && (
        <>
          {!revealed && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setRevealed(true)}
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
