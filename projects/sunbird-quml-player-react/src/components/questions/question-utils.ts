import type { Question, Option } from '../../types';
import { readI18n } from '../../i18n/translations';
import { resolveMediaHtml } from '../../utils/media';
import type { MediaResolveContext } from '../../utils/media';

/** Options of the first responseN interaction (MCQ / SEQ / REO). */
export function firstInteractionOptions(question: Question): Option[] {
  const interactions = question.interactions || {};
  const key = Object.keys(interactions)[0];
  const opts = key ? interactions[key].options : undefined;
  return Array.isArray(opts) ? opts : [];
}

/** Left/right columns of the first responseN interaction (MTF). */
export function mtfColumns(question: Question): { left: Option[]; right: Option[] } {
  const interactions = question.interactions || {};
  const key = Object.keys(interactions)[0];
  const opts = key ? interactions[key].options : undefined;
  if (opts && !Array.isArray(opts)) {
    return { left: opts.left || [], right: opts.right || [] };
  }
  return { left: [], right: [] };
}

/** Ordered responseN keys (FTB blanks come from these). */
export function responseKeys(question: Question): string[] {
  return Object.keys(question.responseDeclaration || {});
}

/**
 * Resolve an option/answer label (string or I18nValue) to localized HTML with its
 * media references resolved. The question's `media` MUST be supplied via `ctx` so
 * `data-asset-variable` images in option labels resolve exactly like Angular
 * (setImageZoom resolves ALL asset-variable images, including option labels).
 */
export function resolveLabel(
  label: Option['label'],
  language: string,
  ctx: MediaResolveContext = {},
): string {
  return resolveMediaHtml(readI18n(label, language), ctx);
}
