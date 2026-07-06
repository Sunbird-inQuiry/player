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
  // The HTML most recently written to the container. Parents rebuild the
  // `question`/`mediaCtx` props as fresh object literals on every render (and
  // the shell timer re-renders the tree every second), so the effect must NOT
  // rewrite innerHTML unless the RESOLVED content actually changed — rewriting
  // destroys and recreates embedded <video>/<audio> elements mid-playback.
  const renderedHtmlRef = useRef<string | null>(null);

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
      const resolvedHtml = resolveMediaHtml(bodyHtml, ctx);
      if (resolvedHtml === renderedHtmlRef.current) return; // content unchanged
      renderedHtmlRef.current = resolvedHtml;
      el.innerHTML = resolvedHtml;

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
    // Depend on the VALUES that affect the resolved HTML, not the (unstable)
    // object identities of `question`/`mediaCtx`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    question?.body,
    mediaCtx?.media ?? question?.media,
    mediaCtx?.basePath,
    mediaCtx?.isAvailableLocally,
    mediaCtx?.sectionId,
    mediaCtx?.questionId,
    language,
  ]);

  return (
    // dir="auto": direction follows the CONTENT's first strong character —
    // Arabic-authored bodies render RTL, while English/math fallback content
    // (e.g. "1+1=?") keeps its LTR character order instead of being reversed
    // by a forced RTL direction. Layout mirroring for `ar` is applied by the
    // QuestionRenderer wrapper, not here.
    <div ref={containerRef} className={styles.body} lang={language} dir="auto" />
  );
}
