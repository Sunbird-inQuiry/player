import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { localizedInteractionOptions, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './ReoQuestion.module.scss';

const ITEM_TYPE = 'reo-word';
interface DragItem {
  value: number | string;
}

interface BankWordProps {
  option: Option;
  label: string;
  disabled: boolean;
  onAdd: (value: number | string) => void;
}

function BankWord({ option, label, disabled, onAdd }: BankWordProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { value: option.value },
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(ref);
  return (
    <button
      ref={ref}
      type="button"
      className={`${styles.bankWord} ${isDragging ? styles.dragging : ''}`.trim()}
      disabled={disabled}
      onClick={() => onAdd(option.value)}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

/**
 * REO (Reorder / word builder) — pure renderer. Drag words from the bank into
 * the answer (react-dnd) or tap to add; tap a selected chip to remove.
 * Emits { order: [values…] }. Assumes a DndProvider ancestor.
 */
export function ReoQuestion({
  question,
  replayed = false,
  language = 'en',
  mediaCtx,
  shuffleOptions = true,
  savedResponse = null,
  onOptionSelected,
  onComponentLoaded,
}: QuestionComponentProps) {
  const ctx: MediaResolveContext = {
    ...mediaCtx,
    media: mediaCtx?.media ?? (question.media as MediaItem[] | undefined),
  };
  // REO options are language-specific: the label text AND the option set both
  // vary by language (see localizedInteractionOptions). Recompute on language
  // switch so the word bank renders in the selected language.
  const options = useMemo(
    () => localizedInteractionOptions(question, language),
    [question.identifier, language], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const buildAnswer = (): Option[] =>
    (savedResponse?.order ?? [])
      .map((v) => byValue.get(v))
      .filter((o): o is Option => Boolean(o));
  const buildBank = (): Option[] => {
    const used = new Set(savedResponse?.order ?? []);
    const remaining = options.filter((o) => !used.has(o.value));
    return shuffleOptions ? fisherYatesShuffle(remaining) : remaining;
  };

  const [answer, setAnswer] = useState<Option[]>(buildAnswer);
  const [bank, setBank] = useState<Option[]>(buildBank);

  // Language switch → the option set changes (different words, even a different
  // count), so re-seed the bank/answer from the new language's options. Skips
  // the initial render (state was already seeded above).
  const prevLangRef = useRef(language);
  useEffect(() => {
    if (prevLangRef.current === language) return;
    prevLangRef.current = language;
    setAnswer(buildAnswer());
    setBank(buildBank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit whenever the committed answer order actually changes. Deriving the emit
  // from the committed state (via an effect keyed on `answer`) — instead of from
  // a value computed in the click/drop handler — means two interactions in the
  // same tick can't emit a stale order, and it avoids updating the parent during
  // this component's render. `lastEmitted` seeds from mount/restore without
  // emitting (also StrictMode-safe: the guarded effect never fires on mount).
  const lastEmitted = useRef<string | null>(null);
  useEffect(() => {
    const sig = JSON.stringify(answer.map((o) => o.value));
    if (lastEmitted.current === null) {
      lastEmitted.current = sig;
      return;
    }
    if (sig === lastEmitted.current) return;
    lastEmitted.current = sig;
    onOptionSelected?.({ order: answer.map((o) => o.value), timestamp: Date.now() });
  }, [answer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Both handlers use functional setState so rapid interactions always build on
  // the latest state (never a stale render snapshot), and the appends are
  // idempotent so a word can't be lost or duplicated.
  const addWord = (value: number | string) => {
    if (replayed) return;
    const opt = byValue.get(value);
    if (!opt) return;
    setAnswer((prev) => (prev.some((a) => a.value === value) ? prev : [...prev, opt]));
    setBank((prev) => prev.filter((o) => o.value !== value));
  };

  const removeWord = (value: number | string) => {
    if (replayed) return;
    const opt = byValue.get(value);
    setAnswer((prev) => prev.filter((a) => a.value !== value));
    setBank((prev) => (opt && !prev.some((o) => o.value === value) ? [...prev, opt] : prev));
  };

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => addWord(item.value),
  });
  const answerRef = useRef<HTMLDivElement>(null);
  drop(answerRef);

  return (
    <div className={styles.reo}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />
      <p className={styles.sectionLabel}>Your Answer</p>
      <div
        ref={answerRef}
        className={`${styles.answer} ${answer.length ? styles.filled : ''} ${isOver ? styles.over : ''}`.trim()}
        aria-label="Your answer"
      >
        {answer.length === 0 ? (
          <span className={styles.placeholder}>
            {replayed ? '— No answer —' : 'Tap or drag words to build your answer…'}
          </span>
        ) : (
          answer.map((word, index) => (
            <button
              key={`${word.value}-${index}`}
              type="button"
              className={styles.chip}
              disabled={replayed}
              aria-label={`Remove ${resolveLabel(word.label, language, ctx)}`}
              onClick={() => removeWord(word.value)}
            >
              <span dangerouslySetInnerHTML={{ __html: resolveLabel(word.label, language, ctx) }} />
              {!replayed && <span aria-hidden="true"> ×</span>}
            </button>
          ))
        )}
      </div>

      {!replayed && (
        <>
          <p className={styles.sectionLabel}>Word Bank</p>
          <div className={styles.bank}>
            {bank.length === 0 ? (
              <span className={styles.allUsed}>All words used</span>
            ) : (
              bank.map((opt, index) => (
                <BankWord
                  key={`${opt.value}-${index}`}
                  option={opt}
                  label={resolveLabel(opt.label, language, ctx)}
                  disabled={replayed}
                  onAdd={addWord}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
