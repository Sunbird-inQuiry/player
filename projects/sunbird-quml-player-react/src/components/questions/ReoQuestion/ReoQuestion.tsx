import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { firstInteractionOptions, resolveLabel } from '../question-utils';
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
  const options = useMemo(
    () => firstInteractionOptions(question),
    [question.identifier], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const [answer, setAnswer] = useState<Option[]>(() => {
    if (!savedResponse?.order) return [];
    return savedResponse.order.map((v) => byValue.get(v)).filter((o): o is Option => Boolean(o));
  });
  const [bank, setBank] = useState<Option[]>(() => {
    const used = new Set(savedResponse?.order ?? []);
    const remaining = options.filter((o) => !used.has(o.value));
    return shuffleOptions ? fisherYatesShuffle(remaining) : remaining;
  });

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (next: Option[]) =>
    onOptionSelected?.({ order: next.map((o) => o.value), timestamp: Date.now() });

  const addWord = (value: number | string) => {
    if (replayed) return;
    const opt = byValue.get(value);
    if (!opt || answer.some((a) => a.value === value)) return;
    const nextAnswer = [...answer, opt];
    setAnswer(nextAnswer);
    setBank(bank.filter((o) => o.value !== value));
    emit(nextAnswer);
  };

  const removeWord = (index: number) => {
    if (replayed) return;
    const opt = answer[index];
    const nextAnswer = answer.filter((_, i) => i !== index);
    setAnswer(nextAnswer);
    setBank([...bank, opt]);
    emit(nextAnswer);
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
              onClick={() => removeWord(index)}
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
