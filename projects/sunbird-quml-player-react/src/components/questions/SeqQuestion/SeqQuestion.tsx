import { useEffect, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { firstInteractionOptions, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './SeqQuestion.module.scss';

const ITEM_TYPE = 'seq-item';
interface DragItem {
  index: number;
}

interface SeqRowProps {
  index: number;
  total: number;
  label: string;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onNudge: (index: number, delta: number) => void;
}

function SeqRow({ index, total, label, disabled, onMove, onNudge }: SeqRowProps) {
  const ref = useRef<HTMLLIElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: { index },
    canDrag: !disabled,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover: (item) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`${styles.row} ${isDragging ? styles.dragging : ''} ${isOver ? styles.over : ''}`.trim()}
    >
      <span className={styles.grip} aria-hidden="true">
        ⠿
      </span>
      <span className={styles.label} dangerouslySetInnerHTML={{ __html: label }} />
      <span className={styles.controls}>
        <button
          type="button"
          className={styles.nudge}
          aria-label={`Move item ${index + 1} up`}
          disabled={disabled || index === 0}
          onClick={() => onNudge(index, -1)}
        >
          ↑
        </button>
        <button
          type="button"
          className={styles.nudge}
          aria-label={`Move item ${index + 1} down`}
          disabled={disabled || index === total - 1}
          onClick={() => onNudge(index, 1)}
        >
          ↓
        </button>
      </span>
    </li>
  );
}

/**
 * SEQ (Sequence) — pure renderer with drag-and-drop reordering (react-dnd) plus
 * keyboard move-up/down controls. Emits { order: [values…] }. Assumes a
 * DndProvider ancestor (provided by the app / tests).
 */
export function SeqQuestion({
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

  const [items, setItems] = useState<Option[]>(() => {
    if (savedResponse?.order) {
      const byValue = new Map(options.map((o) => [o.value, o]));
      const ordered = savedResponse.order
        .map((v) => byValue.get(v))
        .filter((o): o is Option => Boolean(o));
      if (ordered.length === options.length) return ordered;
    }
    return shuffleOptions ? fisherYatesShuffle(options) : [...options];
  });

  const loadedRef = useRef(false);
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      onComponentLoaded?.();
    }
  }, [question.identifier]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: Option[]) => {
    setItems(next);
    onOptionSelected?.({ order: next.map((o) => o.value), timestamp: Date.now() });
  };

  const move = (from: number, to: number) => {
    if (replayed || to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  return (
    <div className={styles.seqWrap}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />
      <ol className={styles.seq} aria-label="Arrange in order">
        {items.map((item, index) => (
          <SeqRow
            key={String(item.value)}
            index={index}
            total={items.length}
            disabled={replayed}
            label={resolveLabel(item.label, language, ctx)}
            onMove={move}
            onNudge={(i, delta) => move(i, i + delta)}
          />
        ))}
      </ol>
    </div>
  );
}
