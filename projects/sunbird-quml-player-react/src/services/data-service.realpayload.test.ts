import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./http-client', () => ({ httpGet: vi.fn(), httpPost: vi.fn() }));
import { httpGet, httpPost } from './http-client';
import { loadQuestionSet } from './data-service';

const mockGet = httpGet as unknown as ReturnType<typeof vi.fn>;
const mockPost = httpPost as unknown as ReturnType<typeof vi.fn>;

// Real payloads (trimmed) from the failing editor preview, questionset
// do_21460978863471001611 → Section-1 (objectType QuestionSet) → mcq question.
const hierarchy = {
  questionset: {
    identifier: 'do_21460978863471001611',
    name: 'questionset-t1',
    objectType: 'QuestionSet',
    children: [
      {
        identifier: 'do_214609803662934016110',
        name: 'Section-1',
        objectType: 'QuestionSet',
        primaryCategory: 'Practice Question Set',
        allowSkip: 'Yes',
        showFeedback: true,
        children: [
          {
            identifier: 'do_214609803972239360113',
            objectType: 'Question',
            primaryCategory: 'Multiple Choice Question',
            qType: 'MCQ',
            index: 1,
          },
        ],
      },
    ],
  },
};

const questions = [
  {
    identifier: 'do_214609803972239360113',
    qType: 'MCQ',
    primaryCategory: 'Multiple Choice Question',
    body: '<div class="mcq-title">smallest planet in solar system</div>',
    interactions: {
      response1: {
        type: 'choice',
        options: [
          { label: { en: 'Mercury' }, value: 0 },
          { label: { en: 'venus' }, value: 1 },
        ],
      },
    },
    responseDeclaration: {
      response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
    },
    maxScore: 1,
  },
];

describe('loadQuestionSet — real editor-preview payload', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('merges hierarchy + list into a section with the question (not 0)', async () => {
    mockGet.mockResolvedValue({ questionset: hierarchy.questionset });
    mockPost.mockResolvedValue({ questions });

    const { sections } = await loadQuestionSet('do_21460978863471001611');

    expect(sections).toHaveLength(1);
    expect(sections[0].children).toHaveLength(1); // ← the bug was 0
    const q = sections[0].children[0];
    expect(q.identifier).toBe('do_214609803972239360113');
    expect(q.body).toContain('smallest planet'); // fetched content merged in
    expect(q.qType).toBe('MCQ');
  });
});
