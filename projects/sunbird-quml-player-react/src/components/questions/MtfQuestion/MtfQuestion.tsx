import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
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
  language: string;
  baseUrl: string;
  /** Label of the currently matched right option, or '' when unmatched. */
  assignedLabel: string;
  disabled: boolean;
  onAssign: (leftValue: string, rightValue: string) => void;
  onClear: (leftValue: string) => void;
}

function LeftRow({ left, language, baseUrl, assignedLabel, disabled, onAssign, onClear }: LeftRowProps) {
  const leftValue = String(left.value);
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => onAssign(leftValue, item.value),
  });
  drop(ref);

  const leftLabel = resolveLabel(left.label, language, baseUrl);
  const isFilled = assignedLabel !== '';

  return (
    <div ref={ref} className={`${styles.leftRow} ${isOver ? styles.over : ''}`.trim()}>
      <span className={styles.term} dangerouslySetInnerHTML={{ __html: leftLabel }} />
      <button
        type="button"
        className={`${styles.slot} ${isFilled ? styles.slotFilled : ''}`.trim()}
        aria-label={
          isFilled ? `${leftLabel}: ${assignedLabel}. Clear match` : `Drop a match for ${leftLabel}`
        }
        disabled={disabled || !isFilled}
        onClick={() => onClear(leftValue)}
      >
        {isFilled ? (
          <span dangerouslySetInnerHTML={{ __html: assignedLabel }} />
        ) : (
          <span className={styles.placeholder}>—</span>
        )}
      </button>
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
  baseUrl = '',
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

  // value → resolved label, for showing the assigned match in a left slot.
  const rightLabelByValue = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of right) map[String(r.value)] = resolveLabel(r.label, language, baseUrl);
    return map;
  }, [right, language, baseUrl]);

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

  const clear = (leftValue: string) => assign(leftValue, '');

  return (
    <div className={styles.mtf}>
      <QuestionBody question={question} language={language} baseUrl={baseUrl} />
      <div className={styles.columns}>
        <div className={styles.leftCol}>
          {left.map((l) => {
            const matchedValue = matches[String(l.value)] ?? '';
            return (
              <LeftRow
                key={String(l.value)}
                left={l}
                language={language}
                baseUrl={baseUrl}
                assignedLabel={matchedValue ? rightLabelByValue[matchedValue] ?? '' : ''}
                disabled={replayed}
                onAssign={assign}
                onClear={clear}
              />
            );
          })}
        </div>
        {!replayed && (
          <div className={styles.rightCol} aria-label="Match options">
            {rightOptions.map((r) => (
              <RightChip
                key={String(r.value)}
                value={String(r.value)}
                label={resolveLabel(r.label, language, baseUrl)}
                disabled={replayed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
