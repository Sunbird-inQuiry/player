import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpGet, httpPost, setHttpClient } from './http-client';
import { QumlApiError } from '../types/api';

/** Minimal axios-instance stub — only get/post are used by http-client. */
function stubClient(overrides: { get?: unknown; post?: unknown }) {
  setHttpClient({
    get: overrides.get ?? vi.fn(),
    post: overrides.post ?? vi.fn(),
  } as never);
}

// axios.isAxiosError checks this flag.
function axiosError(partial: Record<string, unknown>) {
  return { isAxiosError: true, ...partial };
}

beforeEach(() => {
  setHttpClient({ get: vi.fn(), post: vi.fn() } as never);
});

describe('http-client', () => {
  it('unwraps a successful envelope to result', async () => {
    stubClient({ get: vi.fn().mockResolvedValue({ status: 200, data: { responseCode: 'OK', result: { a: 1 } } }) });
    await expect(httpGet('/x')).resolves.toEqual({ a: 1 });
  });

  it('throws response error on non-OK responseCode', async () => {
    stubClient({
      get: vi.fn().mockResolvedValue({
        status: 200,
        data: { responseCode: 'CLIENT_ERROR', params: { errmsg: 'bad' } },
      }),
    });
    await expect(httpGet('/x')).rejects.toMatchObject({ kind: 'response' });
  });

  it('throws invalid when result is absent', async () => {
    stubClient({ get: vi.fn().mockResolvedValue({ status: 200, data: { responseCode: 'OK' } }) });
    await expect(httpGet('/x')).rejects.toMatchObject({ kind: 'invalid' });
  });

  it('maps an HTTP error response to kind=http with status', async () => {
    stubClient({ post: vi.fn().mockRejectedValue(axiosError({ response: { status: 404 } })) });
    await expect(httpPost('/x', {})).rejects.toMatchObject({ kind: 'http', status: 404 });
  });

  it('maps a no-response axios error to kind=network', async () => {
    stubClient({ get: vi.fn().mockRejectedValue(axiosError({ message: 'offline' })) });
    const err = (await httpGet('/x').catch((e) => e)) as QumlApiError;
    expect(err).toBeInstanceOf(QumlApiError);
    expect(err.kind).toBe('network');
  });
});
