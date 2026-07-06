/**
 * Data service — the only place React talks to for assessment data.
 *
 * Responsibilities (per the approved architecture):
 *   - call the APIs via the shared Axios http-client,
 *   - fetch the questionset hierarchy,
 *   - fetch the question list,
 *   - MERGE the raw responses,
 *   - hand the merged RAW data to transformation-service, and
 *   - return the normalized result.
 *
 * It deliberately owns NO normalization logic — transformation-service is the
 * single source of truth for that. Errors surface as typed QumlApiError.
 */

import { httpGet, httpPost } from './http-client';
import { transformSection, transformQuestion } from './transformation-service';
import { ApiEndPoints } from '../utils/api-endpoints';
import { QumlApiError } from '../types/api';
import type {
  QuestionSetHierarchyResult,
  QuestionListResult,
  RawQuestionSet,
  RawQuestionSetChild,
  RawQuestion,
} from '../types/api';
import type { Question, Section } from '../types';

export interface LoadOptions {
  /** Content base URL; forwarded to axios per-request so it can differ per call. */
  baseUrl?: string;
  /** Language passed to /question/v5/list as `?lang=`. */
  language?: string;
}

export interface LoadedQuestionSet {
  /** Raw questionset root — assessment-level metadata (name, timeLimits, …). */
  metadata: RawQuestionSet;
  /** Normalized sections, each with its normalized child questions. */
  sections: Section[];
}

/** Fetch the raw questionset hierarchy (`result.questionset`). */
export async function getQuestionSetHierarchy(
  identifier: string,
  opts: LoadOptions = {},
): Promise<RawQuestionSet> {
  if (!identifier) {
    throw new QumlApiError('invalid', 'getQuestionSetHierarchy: identifier is required');
  }
  const url = `${ApiEndPoints.getQuestionSetHierarchy}${identifier}`;
  const result = await httpGet<QuestionSetHierarchyResult>(url, { baseURL: opts.baseUrl });
  if (!result?.questionset) {
    throw new QumlApiError('invalid', 'Hierarchy response missing `questionset`');
  }
  return result.questionset;
}

/**
 * Max identifiers per /question/v5/list POST. Large question sets are chunked to
 * stay under backend request-body/item caps (Angular batched similarly via
 * _.chunk); chunks are fetched concurrently and their results concatenated.
 */
const QUESTION_BATCH_SIZE = 50;

/** Fetch raw question objects for the given identifiers (`result.questions`). */
export async function getQuestions(
  identifiers: string[],
  opts: LoadOptions = {},
): Promise<RawQuestion[]> {
  if (!identifiers || identifiers.length === 0) return [];
  const url = opts.language
    ? `${ApiEndPoints.questionList}?lang=${opts.language}`
    : ApiEndPoints.questionList;

  const chunks: string[][] = [];
  for (let i = 0; i < identifiers.length; i += QUESTION_BATCH_SIZE) {
    chunks.push(identifiers.slice(i, i + QUESTION_BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      httpPost<QuestionListResult>(
        url,
        { request: { search: { identifier: chunk } } },
        { baseURL: opts.baseUrl },
      ),
    ),
  );
  return results.flatMap((r) => r?.questions ?? []);
}

/** Top-level children that represent sections (question stubs live under them). */
function extractSectionNodes(questionSet: RawQuestionSet): RawQuestionSetChild[] {
  const children = questionSet.children ?? [];
  if (children.length === 0) return [];
  // Flat set: questions directly under the root, no sections → wrap as one section.
  const allQuestions = children.every((c) => c.objectType === 'Question');
  if (allQuestions) return [questionSet as unknown as RawQuestionSetChild];
  // Mixed layout (Section + bare Question siblings) is unsupported; the loose
  // questions are not rendered. Warn instead of dropping them silently.
  const loose = children.filter((c) => c.objectType === 'Question');
  if (loose.length > 0) {
    console.warn(
      `[data-service] ${loose.length} root-level question(s) ignored (mixed section/question layout unsupported):`,
      loose.map((q) => q.identifier),
    );
  }
  return children.filter((c) => c.objectType !== 'Question');
}

/** Question stubs within a section, ordered by `index` when present. */
function orderedQuestionStubs(section: RawQuestionSetChild): RawQuestionSetChild[] {
  const stubs = (section.children ?? []).filter((c) => c.objectType === 'Question' || !c.children);
  return [...stubs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/**
 * Fetch hierarchy + questions, merge raw, and normalize via transformation-service.
 * The stub (hierarchy) supplies ordering/section context; the fetched question
 * supplies the real content — fetched fields win on the merge.
 */
export async function loadQuestionSet(
  identifier: string,
  opts: LoadOptions = {},
): Promise<LoadedQuestionSet> {
  const questionSet = await getQuestionSetHierarchy(identifier, opts);
  const sectionNodes = extractSectionNodes(questionSet);

  // Collect every question identifier across all sections (one batched call).
  const stubsBySection = sectionNodes.map(orderedQuestionStubs);
  const allIds = stubsBySection.flat().map((s) => s.identifier);
  const questions = await getQuestions(allIds, opts);
  const questionById = new Map<string, RawQuestion>(questions.map((q) => [q.identifier, q]));

  const sections = sectionNodes
    .map((node, i): Section | null => {
      const normalizedSection = transformSection(node);
      if (!normalizedSection) return null;
      const children = stubsBySection[i]
        .map((stub) => {
          const fetched = questionById.get(stub.identifier);
          // Merge raw: stub metadata + fetched content (fetched wins), then normalize.
          const mergedRaw = { ...stub, ...(fetched ?? {}) };
          return transformQuestion(mergedRaw);
        })
        .filter((q): q is Question => Boolean(q));
      return { ...normalizedSection, children };
    })
    .filter((s): s is Section => Boolean(s));

  return { metadata: questionSet, sections };
}
