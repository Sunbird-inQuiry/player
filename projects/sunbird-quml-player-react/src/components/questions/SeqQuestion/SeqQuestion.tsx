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
import { firstInteractionOptions, resolveLabel } from '../question-utils';
import { fisherYatesShuffle } from '../../../utils/shuffle';
import type { Option } from '../../../types';
import type { QuestionComponentProps } from '../types';
import type { MediaItem, MediaResolveContext } from '../../../utils/media';
import styles from './SeqQuestion.module.scss';

interface SeqRowProps {
  /** Stable sortable id (the option value). */
  id: string;
  index: number;
  label: string;
  disabled: boolean;
}

/**
 * One sequence item — a dnd-kit sortable row. The WHOLE row is the drag handle
 * (drag from anywhere on it), working on desktop AND touch (react-dnd's HTML5
 * backend was mouse-only), matching the Angular CDK ordered component. The grip
 * (⠿) is a purely visual "draggable" affordance.
 */
function SeqRow({ id, index, label, disabled }: SeqRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${styles.row} ${isDragging ? styles.dragging : ''}`.trim()}
      aria-label={`Item ${index + 1}: drag to reorder`}
      {...attributes}
      {...listeners}
    >
      <span className={styles.grip} aria-hidden="true">
        ⠿
      </span>
      <span className={styles.label} dangerouslySetInnerHTML={{ __html: label }} />
    </li>
  );
}

/**
 * SEQ (Sequence) — pure renderer with dnd-kit drag-and-drop reordering (mouse +
 * touch + keyboard). Emits { order: [values…] }.
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
    const from = items.findIndex((o) => String(o.value) === active.id);
    const to = items.findIndex((o) => String(o.value) === over.id);
    if (from < 0 || to < 0) return;
    commit(arrayMove(items, from, to));
  };

  const sortableIds = items.map((o) => String(o.value));

  return (
    <div className={styles.seqWrap}>
      <QuestionBody question={question} language={language} mediaCtx={ctx} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <ol className={styles.seq} aria-label="Arrange in order">
            {items.map((item, index) => (
              <SeqRow
                key={String(item.value)}
                id={String(item.value)}
                index={index}
                disabled={replayed}
                label={resolveLabel(item.label, language, ctx)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}
