import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { resolveMediaHtml } from '../../utils/media';
import type { MediaItem, MediaResolveContext } from '../../utils/media';
import { readI18n } from '../../i18n/translations';
import type { Question } from '../../types';
import styles from './QuestionBody.module.scss';

/**
 * QuestionBody — generic, shared renderer for question text.
 *
 * Responsibilities ONLY:
 * - Render raw HTML body (may contain images, tables, etc.)
 * - Render KaTeX math found in `.math` / `.math-block` elements
 * - RTL support (Arabic)
 *
 * It is question-type AGNOSTIC: no MCQ/SA/MTF/SEQ/REO/FTB logic, no answer
 * handling, no scoring/telemetry/navigation. Every Phase 4 question type reuses
 * this component to render its stem.
 */
interface QuestionBodyProps {
  question: Pick<Question, 'body' | 'media'>;
  language?: string;
  /**
   * Media + offline resolution inputs. When supplied (e.g. by Hint for solution
   * content), its `media` takes precedence over `question.media`.
   */
  mediaCtx?: MediaResolveContext;
}

export function QuestionBody({ question, language = 'en', mediaCtx }: QuestionBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !question?.body) return;

    try {
      // Body may be a plain HTML string (embedded) or an I18nValue map (API);
      // localize first, then resolve images and KaTeX.
      const bodyHtml = readI18n(question.body, language);
      // Resolve media (asset-variable images, figure placeholders, video/audio)
      // via the Angular-parity resolver, then render KaTeX.
      const ctx: MediaResolveContext = {
        ...mediaCtx,
        media: mediaCtx?.media ?? (question.media as MediaItem[] | undefined),
      };
      el.innerHTML = resolveMediaHtml(bodyHtml, ctx);

      // Find and render KaTeX expressions.
      const mathElements = el.querySelectorAll('.math');
      mathElements.forEach((elem) => {
        try {
          const text = elem.textContent || '';
          const isBlock = elem.classList.contains('math-block');
          katex.render(text, elem as HTMLElement, { displayMode: isBlock });
        } catch (err) {
          console.warn('[QuestionBody] KaTeX render error:', err);
        }
      });
    } catch (err) {
      console.error('[QuestionBody] Error rendering body:', err);
    }
  }, [question?.body, question?.media, mediaCtx, language]);

  const isRtl = language === 'ar';

  return (
    <div
      ref={containerRef}
      className={`${styles.body} ${isRtl ? styles.rtl : ''}`.trim()}
      lang={language}
      dir={isRtl ? 'rtl' : undefined}
    />
  );
}
