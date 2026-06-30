import { useEffect, useRef } from 'react';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { readI18n, t } from '../../../i18n/translations';
import type { QuestionComponentProps } from '../types';
import styles from './SaQuestion.module.scss';

/**
 * SA (Subjective / Short Answer) — read-only display.
 * Subjective answers are reviewed manually, so this renderer does NOT collect a
 * scored answer and emits nothing. It shows the question body and (if present)
 * the model answer.
 */
export function SaQuestion({ question, language = 'en', onComponentLoaded }: QuestionComponentProps) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const modelAnswer = question.answer ? readI18n(question.answer, language) : '';

  return (
    <div className={styles.sa}>
      <QuestionBody question={question} language={language} />

      {modelAnswer && (
        <div className={styles.answer}>
          <p className={styles.answerLabel}>{t(language, 'EXPECTED_ANSWER')}</p>
          <div
            className={styles.answerText}
            dangerouslySetInnerHTML={{ __html: modelAnswer }}
          />
        </div>
      )}
    </div>
  );
}
