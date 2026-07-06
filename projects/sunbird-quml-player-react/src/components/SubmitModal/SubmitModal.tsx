import { useEffect, useRef } from 'react';
import { t } from '../../i18n/translations';
import { CloseIcon } from '../icons';
import styles from './SubmitModal.module.scss';

/**
 * SubmitModal — submit confirmation dialog (spec §7.1).
 *
 * Pure dialog: shows answered vs unanswered counts and Confirm/Cancel. Focus is
 * trapped while open, `Esc` cancels, `aria-modal`. No Context mutation — emits
 * intent via callbacks.
 */
export interface SubmitModalProps {
  answeredCount: number;
  unansweredCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  language?: string;
}

export function SubmitModal({
  answeredCount,
  unansweredCount,
  onConfirm,
  onCancel,
  language = 'en',
}: SubmitModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="submit-modal-title" className={styles.title}>
            {t(language, 'SUBMIT_TITLE')}
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label={t(language, 'CLOSE')}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <p className={styles.body}>{t(language, 'SUBMIT_BODY')}</p>

        <dl className={styles.counts}>
          <div className={`${styles.count} ${styles.answered}`}>
            <dt className={styles.countLabel}>{t(language, 'ANSWERED')}</dt>
            <dd className={styles.countValue}>{answeredCount}</dd>
          </div>
          <div className={`${styles.count} ${styles.unanswered}`}>
            <dt className={styles.countLabel}>{t(language, 'UNANSWERED')}</dt>
            <dd className={styles.countValue}>{unansweredCount}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            {t(language, 'CANCEL')}
          </button>
          <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
            {t(language, 'SUBMIT')}
          </button>
        </div>
      </div>
    </div>
  );
}
