import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the HTTP layer so the data service is tested in isolation (no axios/network).
vi.mock('./http-client', () => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
}));

import { httpGet, httpPost } from './http-client';
import { getQuestionSetHierarchy, getQuestions, loadQuestionSet } from './data-service';
import { ApiEndPoints } from '../utils/api-endpoints';
import { QumlApiError } from '../types/api';

const mockGet = httpGet as unknown as ReturnType<typeof vi.fn>;
const mockPost = httpPost as unknown as ReturnType<typeof vi.fn>;

// Minimal hierarchy: one section with two ordered question stubs (out of order to
// prove sorting by `index`).
const hierarchy = {
  questionset: {
    identifier: 'do_set',
    name: 'Sample Set',
    description: 'desc',
    timeLimits: { questionSet: { max: 300, min: 0 } },
    objectType: 'QuestionSet',
    children: [
      {
        identifier: 'do_section',
        objectType: 'QuestionSet',
        name: 'Section',
        allowSkip: 'Yes',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        children: [
          { identifier: 'q2', objectType: 'Question', index: 2, maxScore: 1 },
          { identifier: 'q1', objectType: 'Question', index: 1, maxScore: 3 },
        ],
      },
    ],
  },
};

// Full question content (as /question/v5/list returns it).
const questions = [
  {
    identifier: 'q1',
    primaryCategory: 'Multiple Choice Question',
    qType: 'MCQ',
    body: { en: '<p>Q1</p>' },
    interactions: { response1: { options: [{ value: 0, label: 'a' }] } },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    },
    maxScore: 3,
  },
  {
    identifier: 'q2',
    primaryCategory: 'Sequence Question',
    qType: 'SEQ',
    body: { en: '<p>Q2</p>' },
    interactions: { response1: { options: [{ value: 'A', label: 'x' }] } },
    responseDeclaration: {
      response1: { cardinality: 'ordered', type: 'string', correctResponse: { value: ['A'] } },
    },
    maxScore: 1,
  },
];

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
});

describe('data-service', () => {
  describe('getQuestionSetHierarchy', () => {
    it('unwraps result.questionset', async () => {
      mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
      const qs = await getQuestionSetHierarchy('do_set', { baseUrl: 'https://host' });
      expect(qs.identifier).toBe('do_set');
      expect(mockGet).toHaveBeenCalledWith(
        `${ApiEndPoints.getQuestionSetHierarchy}do_set?mode=edit`,
        { baseURL: 'https://host' },
      );
    });

    it('rejects without an identifier', async () => {
      await expect(getQuestionSetHierarchy('')).rejects.toBeInstanceOf(QumlApiError);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('honors a host-provided window.questionSetHierarchyUrl override', async () => {
      (window as any).questionSetHierarchyUrl = '/action/questionset/v2/hierarchy/';
      mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
      await getQuestionSetHierarchy('do_set');
      expect(mockGet).toHaveBeenCalledWith('/action/questionset/v2/hierarchy/do_set?mode=edit', {
        baseURL: undefined,
      });
      delete (window as any).questionSetHierarchyUrl;
    });

    it('prepends the host slug (pathPrefix) instead of the /api fallback', async () => {
      mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
      await getQuestionSetHierarchy('do_set', { pathPrefix: '/portal' });
      expect(mockGet).toHaveBeenCalledWith('/portal/questionset/v2/hierarchy/do_set?mode=edit', {
        baseURL: undefined,
      });
    });

    it('falls back to /api when no pathPrefix is given', async () => {
      mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
      await getQuestionSetHierarchy('do_set');
      expect(mockGet).toHaveBeenCalledWith('/api/questionset/v2/hierarchy/do_set?mode=edit', {
        baseURL: undefined,
      });
    });

    it('throws invalid when questionset is missing', async () => {
      mockGet.mockResolvedValue({});
      await expect(getQuestionSetHierarchy('do_set')).rejects.toMatchObject({ kind: 'invalid' });
    });
  });

  describe('getQuestions', () => {
    it('short-circuits on an empty id list (no request)', async () => {
      const result = await getQuestions([]);
      expect(result).toEqual([]);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('POSTs the search payload and forwards lang + baseUrl', async () => {
      mockPost.mockResolvedValue({ questions });
      const result = await getQuestions(['q1', 'q2'], { baseUrl: 'https://host', language: 'fr' });
      expect(result).toHaveLength(2);
      expect(mockPost).toHaveBeenCalledWith(
        `${ApiEndPoints.questionList}?lang=fr`,
        { request: { search: { identifier: ['q1', 'q2'] } } },
        { baseURL: 'https://host' },
      );
    });

    it('honors a host-provided window.questionListUrl override', async () => {
      (window as any).questionListUrl = '/action/question/v2/list';
      mockPost.mockResolvedValue({ questions });
      await getQuestions(['q1']);
      expect(mockPost).toHaveBeenCalledWith(
        '/action/question/v2/list',
        { request: { search: { identifier: ['q1'] } } },
        { baseURL: undefined },
      );
      delete (window as any).questionListUrl;
    });

    it('prepends the host slug (pathPrefix) to the question list, else /api', async () => {
      mockPost.mockResolvedValue({ questions });
      await getQuestions(['q1'], { pathPrefix: '/portal' });
      expect(mockPost.mock.calls[0][0]).toBe('/portal/question/v2/list');

      mockPost.mockClear();
      await getQuestions(['q1']);
      expect(mockPost.mock.calls[0][0]).toBe('/api/question/v2/list');
    });

    it('chunks large id lists into batches of 50 and concatenates results', async () => {
      const ids = Array.from({ length: 120 }, (_, i) => `q${i}`);
      // Each POST echoes back one question per requested id so we can count merge.
      mockPost.mockImplementation((_url, body: any) =>
        Promise.resolve({
          questions: body.request.search.identifier.map((id: string) => ({ identifier: id })),
        }),
      );
      const result = await getQuestions(ids);
      expect(mockPost).toHaveBeenCalledTimes(3); // 50 + 50 + 20
      expect(result).toHaveLength(120);
      // Each chunk stays within the cap.
      for (const call of mockPost.mock.calls) {
        expect(call[1].request.search.identifier.length).toBeLessThanOrEqual(50);
      }
    });
  });

  describe('loadQuestionSet', () => {
    it('merges hierarchy + questions and returns normalized sections', async () => {
      mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
      mockPost.mockResolvedValue({ questions });

      const { metadata, sections } = await loadQuestionSet('do_set', { baseUrl: 'https://host' });

      // Metadata is the raw questionset root (untransformed).
      expect(metadata.name).toBe('Sample Set');

      expect(sections).toHaveLength(1);
      const children = sections[0].children;
      expect(children).toHaveLength(2);

      // Ordered by stub `index` (q1 before q2, despite hierarchy listing q2 first).
      expect(children[0].identifier).toBe('q1');
      expect(children[1].identifier).toBe('q2');

      // Fetched content was merged in and normalized (primaryCategory lowercased).
      expect(children[0].primaryCategory).toBe('multiple choice question');
      expect(children[0].maxScore).toBe(3);
      expect(children[1].qType).toBe('SEQ');

      // One batched question request for both identifiers.
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost.mock.calls[0][1]).toEqual({
        request: { search: { identifier: ['q1', 'q2'] } },
      });
    });

    it('propagates a typed error from the HTTP layer', async () => {
      mockGet.mockRejectedValue(new QumlApiError('http', 'boom', 500));
      await expect(loadQuestionSet('do_set')).rejects.toMatchObject({ kind: 'http', status: 500 });
      expect(mockPost).not.toHaveBeenCalled();
    });
  });
});
