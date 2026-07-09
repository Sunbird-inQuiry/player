/**
 * API layer types — request/response envelopes for the Sunbird backend and the
 * typed error the data layer propagates upward.
 *
 * These describe the RAW backend shape only. All normalization into the domain
 * model (Section/Question) stays in transformation-service — the single source
 * of truth. Nothing here transforms data.
 */

/** Standard Sunbird API response envelope. */
export interface SunbirdApiEnvelope<T> {
  id?: string;
  ver?: string;
  ts?: string;
  params?: {
    resmsgid?: string | null;
    msgid?: string | null;
    err?: string | null;
    status?: string | null;
    errmsg?: string | null;
  };
  responseCode?: string;
  result?: T;
}

/** `result` of /questionset/v5/hierarchy/:id — the raw questionset tree. */
export interface QuestionSetHierarchyResult {
  questionset?: RawQuestionSet;
}

/** `result` of /question/v5/list — raw question objects. */
export interface QuestionListResult {
  questions?: RawQuestion[];
  count?: number;
}

/**
 * Raw questionset / section node. Intentionally loose: only the fields the data
 * layer needs to traverse and merge are named; everything else is passed
 * through untouched to transformation-service.
 */
export interface RawQuestionSet {
  identifier: string;
  objectType?: string;
  children?: RawQuestionSetChild[];
  [key: string]: unknown;
}

/** A child node in the hierarchy — either a nested section or a question stub. */
export interface RawQuestionSetChild {
  identifier: string;
  objectType?: string;
  index?: number;
  children?: RawQuestionSetChild[];
  [key: string]: unknown;
}

/** Raw question object as returned by /question/v5/list. */
export interface RawQuestion {
  identifier: string;
  [key: string]: unknown;
}

/** How a data-layer request failed, for callers that want to branch on cause. */
export type QumlApiErrorKind =
  | 'network' // no response received (offline / DNS / CORS)
  | 'http' // non-2xx HTTP status
  | 'response' // 2xx but responseCode !== 'OK'
  | 'invalid'; // 2xx OK but the payload was missing/malformed

/** Typed error propagated out of the data layer (never a raw AxiosError). */
export class QumlApiError extends Error {
  readonly kind: QumlApiErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(kind: QumlApiErrorKind, message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = 'QumlApiError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
    // Preserve prototype chain when compiled down to ES5.
    Object.setPrototypeOf(this, QumlApiError.prototype);
  }
}
