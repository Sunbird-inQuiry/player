import { useEffect, useRef, useState } from 'react';
import { responseKeys } from '../question-utils';
import { resolveMediaHtml } from '../../../utils/media';
import { readI18n } from '../../../i18n/translations';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import type { QuestionComponentProps } from '../types';
import styles from './FtbQuestion.module.scss';

/**
 * FTB (Fill The Blank) — pure renderer.
 * Parses `body` for `[[responseN]]` tokens and renders an input per blank.
 * Emits { responses: { responseN: text } }. Calls onGoToNext when Enter is
 * pressed in the last blank. No scoring/telemetry/storage.
 */
export function FtbQuestion({
  question,
  replayed = false,
  language = 'en',
  mediaCtx,
  savedResponse = null,
  onOptionSelected,
  onComponentLoaded,
  onGoToNext,
}: QuestionComponentProps) {
  const keys = responseKeys(question);
  const ctx: MediaResolveContext = {
    ...mediaCtx,
    media: mediaCtx?.media ?? (question.media as MediaItem[] | undefined),
  };
  const [values, setValues] = useState<Record<string, string>>(() => savedResponse?.responses ?? {});
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body may be a plain string (embedded) or an I18nValue map (API) — localize first.
  const bodyHtml = readI18n(question.body, language);
  const parts = bodyHtml.split(/\[\[(response\d+)\]\]/g);
  const lastKey = keys[keys.length - 1];

  const handleChange = (key: string, value: string) => {
    if (replayed) return;
    const next = { ...values, [key]: value };
    setValues(next);
    onOptionSelected?.({ responses: next, timestamp: Date.now() });
  };

  let blankNumber = 0;
  const renderBlank = (key: string) => {
    blankNumber += 1;
    const num = blankNumber;
    return (
      <span key={`blank-${key}`} className={styles.blankWrap}>
        <span className={styles.blankNum} aria-hidden="true">
          {num}
        </span>
        <input
          type="text"
          className={`${styles.blank} ${values[key] ? styles.filled : ''}`.trim()}
          value={values[key] || ''}
          disabled={replayed}
          aria-label={`Blank ${num}`}
          onChange={(e) => handleChange(key, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && key === lastKey) onGoToNext?.();
          }}
        />
      </span>
    );
  };

  const hasTokens = parts.length > 1;

  return (
    // dir="auto": sentence direction follows the authored content (Arabic → RTL,
    // English fallback keeps LTR order); layout mirroring comes from the renderer.
    <div className={styles.ftb} lang={language} dir="auto">
      {hasTokens ? (
        <p className={styles.template}>
          {parts.map((part, i) =>
            i % 2 === 0 ? (
              <span
                key={`text-${i}`}
                dangerouslySetInnerHTML={{ __html: resolveMediaHtml(part, ctx) }}
              />
            ) : (
              renderBlank(part)
            ),
          )}
        </p>
      ) : (
        <>
          <div
            dangerouslySetInnerHTML={{ __html: resolveMediaHtml(bodyHtml, ctx) }}
          />
          <div className={styles.fallbackBlanks}>{keys.map((key) => renderBlank(key))}</div>
        </>
      )}
    </div>
  );
}
