import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { mtfColumns, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './MtfQuestion.module.scss';

const ITEM_TYPE = 'mtf-right';
interface DragItem {
  index: number;
}

interface RightCellProps {
  option: Option;
  index: number;
  language: string;
  mediaCtx: MediaResolveContext;
  disabled: boolean;
  /** Swap the right images at positions `from` and `to`. */
  onSwap: (from: number, to: number) => void;
}

/**
 * A right-column image that is both a drag source and a drop target, so the
 * learner rearranges the right images (by swapping) until the correct one sits
 * next to each left prompt.
 */
function RightCell({ option, index, language, mediaCtx, disabled, onSwap }: RightCellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { index },
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    drop: (item) => onSwap(item.index, index),
  });
  drag(drop(ref));

  const label = resolveLabel(option.label, language, mediaCtx);
  return (
    <div
      ref={ref}
      className={`${styles.rightCell} ${isDragging ? styles.dragging : ''} ${isOver ? styles.over : ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

/**
 * MTF (Match The Following) — pure renderer. Each left prompt sits on a row with
 * its answer image on the right; the right images start shuffled and the learner
 * drags/swaps them so the correct image lands next to each prompt. Emits
 * { matches: { leftValue: rightValue } } (rightValue = whatever sits in that
 * row's right cell). Assumes a DndProvider ancestor.
 */
export function MtfQuestion({
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
  const { left, right } = useMemo(
    () => mtfColumns(question),
    [question.identifier], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Current right-image order (one per row). Restored from a saved arrangement,
  // else shuffled so the initial layout is not already correct.
  const [order, setOrder] = useState<Option[]>(() => {
    const saved = savedResponse?.matches;
    if (saved) {
      const byValue = new Map(right.map((r) => [String(r.value), r]));
      const restored = left.map((l) => byValue.get(String(saved[String(l.value)])));
      if (restored.every(Boolean)) return restored as Option[];
    }
    return shuffleOptions ? fisherYatesShuffle(right) : [...right];
  });

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  // matches[leftValue] = value of the right image currently in that row.
  const emit = (nextOrder: Option[]) => {
    const matches: Record<string, string> = {};
    left.forEach((l, i) => {
      if (nextOrder[i]) matches[String(l.value)] = String(nextOrder[i].value);
    });
    onOptionSelected?.({ matches, timestamp: Date.now() });
  };

  const swap = (from: number, to: number) => {
    if (replayed || from === to) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
    emit(next);
  };

  return (
    <div className={styles.mtf}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />

      {/* Brown board: each row is a left prompt with its answer image on the
          right; the right images are draggable and swap on drop. */}
      <div className={styles.board}>
        {left.map((l, i) => (
          <div className={styles.row} key={String(l.value)}>
            <div className={styles.leftCard}>
              <span
                className={styles.term}
                dangerouslySetInnerHTML={{ __html: resolveLabel(l.label, language, ctx) }}
              />
            </div>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
            {order[i] && (
              <RightCell
                option={order[i]}
                index={i}
                language={language}
                mediaCtx={ctx}
                disabled={replayed}
                onSwap={swap}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
