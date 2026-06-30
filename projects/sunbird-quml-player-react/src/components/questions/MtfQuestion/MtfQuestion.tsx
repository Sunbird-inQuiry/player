import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { mtfColumns, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import styles from './MtfQuestion.module.scss';

const ITEM_TYPE = 'mtf-right';
interface DragItem {
  value: string;
}

interface RightChipProps {
  label: string;
  value: string;
  disabled: boolean;
}

function RightChip({ label, value, disabled }: RightChipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { value },
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(ref);
  return (
    <div
      ref={ref}
      className={`${styles.rightChip} ${isDragging ? styles.dragging : ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

interface LeftRowProps {
  left: Option;
  rightOptions: Option[];
  language: string;
  value: string;
  disabled: boolean;
  onAssign: (leftValue: string, rightValue: string) => void;
}

function LeftRow({ left, rightOptions, language, value, disabled, onAssign }: LeftRowProps) {
  const leftValue = String(left.value);
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => onAssign(leftValue, item.value),
  });
  drop(ref);

  const leftLabel = resolveLabel(left.label, language);

  return (
    <div ref={ref} className={`${styles.leftRow} ${isOver ? styles.over : ''}`.trim()}>
      <span className={styles.term} dangerouslySetInnerHTML={{ __html: leftLabel }} />
      <select
        className={styles.select}
        aria-label={`Match for ${leftLabel}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onAssign(leftValue, e.target.value)}
      >
        <option value="">—</option>
        {rightOptions.map((r) => (
          <option key={String(r.value)} value={String(r.value)}>
            {resolveLabel(r.label, language)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * MTF (Match The Following) — pure renderer. Drag a right item onto a left row
 * (react-dnd) or use the per-row select (keyboard accessible). Emits
 * { matches: { leftValue: rightValue } }. Assumes a DndProvider ancestor.
 */
export function MtfQuestion({
  question,
  replayed = false,
  language = 'en',
  shuffleOptions = true,
  savedResponse = null,
  onOptionSelected,
  onComponentLoaded,
}: QuestionComponentProps) {
  const { left, right } = useMemo(
    () => mtfColumns(question),
    [question.identifier], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const rightOptions = useMemo(
    () => (shuffleOptions ? fisherYatesShuffle(right) : right),
    [right, shuffleOptions],
  );

  const [matches, setMatches] = useState<Record<string, string>>(() => savedResponse?.matches ?? {});

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const assign = (leftValue: string, rightValue: string) => {
    if (replayed) return;
    const next = { ...matches };
    if (rightValue === '') {
      delete next[leftValue];
    } else {
      next[leftValue] = rightValue;
    }
    setMatches(next);
    onOptionSelected?.({ matches: next, timestamp: Date.now() });
  };

  return (
    <div className={styles.mtf}>
      <div className={styles.columns}>
        <div className={styles.leftCol}>
          {left.map((l) => (
            <LeftRow
              key={String(l.value)}
              left={l}
              rightOptions={right}
              language={language}
              value={matches[String(l.value)] ?? ''}
              disabled={replayed}
              onAssign={assign}
            />
          ))}
        </div>
        {!replayed && (
          <div className={styles.rightCol} aria-label="Match options">
            {rightOptions.map((r) => (
              <RightChip
                key={String(r.value)}
                value={String(r.value)}
                label={resolveLabel(r.label, language)}
                disabled={replayed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
