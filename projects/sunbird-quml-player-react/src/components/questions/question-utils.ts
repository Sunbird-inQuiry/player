import type { Question, Option } from '../../types';
import { readI18n } from '../../i18n/translations';
import { resolveMediaHtml } from '../../utils/media';

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

/** Cardinality of the first responseN declaration (defaults to 'single'). */
export function firstCardinality(question: Question): string {
  const rd = question.responseDeclaration || {};
  const key = Object.keys(rd)[0];
  return (key && rd[key]?.cardinality) || 'single';
}

/** Ordered responseN keys (FTB blanks come from these). */
export function responseKeys(question: Question): string[] {
  return Object.keys(question.responseDeclaration || {});
}

/**
 * Resolve an option/answer label (string or I18nValue) to localized HTML, with
 * image references resolved (relative `<img src>` / asset variables → baseUrl).
 */
export function resolveLabel(label: Option['label'], language: string, baseUrl = ''): string {
  return resolveMediaHtml(readI18n(label, language), [], baseUrl);
}
