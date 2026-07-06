/**
 * HTTP client — the ONLY module that imports axios.
 *
 * Everything else (data-service, components) goes through the typed helpers
 * here. Axios errors are caught and re-thrown as QumlApiError so callers never
 * see a raw AxiosError and can branch on `.kind`/`.status`.
 *
 * Swappable/mockable: tests mock this module (`vi.mock('./http-client')`) or
 * override the instance via `configureHttpClient` / `setHttpClient`.
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { QumlApiError } from '../types/api';
import type { SunbirdApiEnvelope } from '../types/api';

/** Create a configured axios instance (baseURL + JSON headers). */
export function createHttpClient(baseURL = '', headers: Record<string, string> = {}): AxiosInstance {
  return axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// Module-level default instance. Kept mutable so hosts can point it at a base
// URL once and tests can swap in a stub.
let client: AxiosInstance = createHttpClient();

/** Point the shared client at a base URL / add default headers. */
export function configureHttpClient(baseURL = '', headers: Record<string, string> = {}): void {
  client = createHttpClient(baseURL, headers);
}

/** Replace the shared client entirely (primarily for tests). */
export function setHttpClient(instance: AxiosInstance): void {
  client = instance;
}

/** Current shared client (primarily for tests / advanced callers). */
export function getHttpClient(): AxiosInstance {
  return client;
}

/** Map any thrown axios/unknown error into a typed QumlApiError. */
function toApiError(error: unknown): QumlApiError {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return new QumlApiError(
        'http',
        `Request failed with status ${error.response.status}`,
        error.response.status,
        error,
      );
    }
    // Request made but no response (offline, DNS, CORS, timeout).
    return new QumlApiError('network', error.message || 'Network error', undefined, error);
  }
  return new QumlApiError('network', (error as Error)?.message || 'Unknown error', undefined, error);
}

/**
 * Unwrap a Sunbird envelope: verify responseCode === 'OK' and return `result`.
 * Throws QumlApiError('response') on a non-OK code.
 */
function unwrap<T>(envelope: SunbirdApiEnvelope<T> | undefined, status?: number): T {
  if (!envelope || typeof envelope !== 'object') {
    throw new QumlApiError('invalid', 'Empty or malformed API response', status);
  }
  if (envelope.responseCode !== 'OK') {
    const msg = envelope.params?.errmsg || envelope.responseCode || 'Non-OK response';
    throw new QumlApiError('response', `API responded with: ${msg}`, status);
  }
  if (envelope.result === undefined) {
    throw new QumlApiError('invalid', 'API response missing `result`', status);
  }
  return envelope.result;
}

/** GET a Sunbird endpoint and return the unwrapped `result`. */
export async function httpGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const res = await client.get<SunbirdApiEnvelope<T>>(url, config);
    return unwrap<T>(res.data, res.status);
  } catch (error) {
    if (error instanceof QumlApiError) throw error;
    throw toApiError(error);
  }
}

/** POST to a Sunbird endpoint and return the unwrapped `result`. */
export async function httpPost<T>(
  url: string,
  body: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res = await client.post<SunbirdApiEnvelope<T>>(url, body, config);
    return unwrap<T>(res.data, res.status);
  } catch (error) {
    if (error instanceof QumlApiError) throw error;
    throw toApiError(error);
  }
}
