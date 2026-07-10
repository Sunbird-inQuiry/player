import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionBody } from '../../QuestionBody/QuestionBody';
import { mtfColumns, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './MtfQuestion.module.scss';

interface RightCellProps {
  option: Option;
  /** Stable sortable id (the option value). */
  id: string;
  language: string;
  mediaCtx: MediaResolveContext;
  disabled: boolean;
}

/**
 * A right-column image that is a dnd-kit sortable item, so the learner drags it
 * to a new row to rearrange the right column. dnd-kit's Mouse/Touch/Keyboard
 * sensors make the drag work on desktop AND touch (react-dnd's HTML5 backend was
 * mouse-only), matching the Angular CDK MTF behaviour.
 */
function RightCell({ option, id, language, mediaCtx, disabled }: RightCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const label = resolveLabel(option.label, language, mediaCtx);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.rightCell} ${isDragging ? styles.dragging : ''}`.trim()}
      {...attributes}
      {...listeners}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}

/**
 * MTF (Match The Following) — pure renderer. Each left prompt sits on a row with
 * its answer image on the right; the right images start shuffled and the learner
 * drags them to reorder the right column so the correct image lands next to each
 * prompt. Emits { matches: { leftValue: rightValue } } (rightValue = whatever
 * sits in that row's right cell).
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

  // dnd-kit sensors: Mouse for desktop (immediate), Touch with a short press
  // delay so the page can still scroll until a drag is intended, Keyboard for a11y.
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (replayed || !over || active.id === over.id) return;
    const from = order.findIndex((o) => String(o.value) === active.id);
    const to = order.findIndex((o) => String(o.value) === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(order, from, to);
    setOrder(next);
    emit(next);
  };

  const sortableIds = order.map((o) => String(o.value));

  return (
    <div className={styles.mtf}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />

      {/* Brown board: each row is a left prompt with its answer image on the
          right; the right images are draggable and reorder on drop.
          dir="ltr": the board keeps its prompt-left / draggable-right layout
          even in the RTL (Arabic) UI — mirroring it moved the DRAGGABLE column
          to the left while learners kept grabbing the (static) right one. */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className={styles.board} dir="ltr">
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
                    id={String(order[i].value)}
                    option={order[i]}
                    language={language}
                    mediaCtx={ctx}
                    disabled={replayed}
                  />
                )}
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
