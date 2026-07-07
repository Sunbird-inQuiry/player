import { describe, it, expect } from 'vitest';
import { hasEmbeddedQuestions, transformEmbeddedQuestionSet } from './data-service';

// Real metadata (trimmed) the editor/portal pass as playerConfig.metadata:
// the WHOLE questionset with question content embedded in the hierarchy —
// Section A [Q1 MCQ, Q2 SA], Section B [Q3 FTB, Q5 REO].
const metadata = {
  identifier: 'do_214609811633471488164',
  name: 'Sample question set',
  objectType: 'QuestionSetImage',
  timeLimits: { questionSet: { max: 0, min: 0 } },
  children: [
    {
      identifier: 'do_214609815842570240180',
      name: 'Section A',
      objectType: 'QuestionSet',
      index: 1,
      children: [
        {
          identifier: 'do_214609815842586624182',
          name: 'Q1',
          objectType: 'Question',
          primaryCategory: 'Multiple Choice Question',
          qType: 'MCQ',
          index: 1,
          maxScore: 5,
          body: '<div class="mcq-title">Which is the capital of France?</div>',
          interactions: {
            response1: {
              type: 'choice',
              options: [
                { label: { en: 'New York' }, value: 0 },
                { label: { en: 'Paris' }, value: 1 },
              ],
            },
          },
          responseDeclaration: {
            response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 1 } },
          },
        },
        {
          identifier: 'do_2146098163851018241112',
          name: 'Q2',
          objectType: 'Question',
          primaryCategory: 'Subjective Question',
          qType: 'SA',
          index: 2,
          maxScore: 5,
          body: 'When is Independence Day observed in India',
          interactions: {},
          answer: '<div class="answer-body">15th August</div>',
        },
      ],
    },
    {
      identifier: 'do_21460983368164147213',
      name: 'Section B',
      objectType: 'QuestionSet',
      index: 2,
      children: [
        {
          identifier: 'do_21460983367935590411',
          name: 'Q3',
          objectType: 'Question',
          primaryCategory: 'FTB Question',
          qType: 'FTB',
          index: 1,
          maxScore: 1,
          body: 'The tree is [[response1]]',
          interactions: { response1: { type: 'text' } },
          responseProcessing: { template: 'MAP_RESPONSE' },
          evalUnordered: true,
          responseDeclaration: {
            response1: {
              cardinality: 'single',
              type: 'string',
              correctResponse: { value: 'tall' },
              mapping: [{ value: 'tall', score: 1, caseSensitive: false }],
            },
          },
        },
        {
          identifier: 'do_21460983413725593617',
          name: 'Q5',
          objectType: 'Question',
          primaryCategory: 'Reorder Question',
          qType: 'REO',
          index: 2,
          maxScore: 1,
          body: '<div class="order-title">Reorder the sentence</div>',
          interactions: {
            response1: {
              type: 'order',
              options: [
                { value: 'A', label: 'Book' },
                { value: 'B', label: 'is' },
              ],
            },
          },
          responseProcessing: { template: 'MATCH_CORRECT' },
        },
      ],
    },
  ],
};

describe('embedded questionset metadata (editor/portal contract)', () => {
  it('detects embedded question content', () => {
    expect(hasEmbeddedQuestions(metadata)).toBe(true);
  });

  it('does NOT flag a stub-only hierarchy as embedded', () => {
    const stubHierarchy = {
      identifier: 'do_x',
      children: [
        {
          identifier: 'sec',
          objectType: 'QuestionSet',
          children: [{ identifier: 'q', objectType: 'Question', qType: 'MCQ' }], // no body/interactions
        },
      ],
    };
    expect(hasEmbeddedQuestions(stubHierarchy)).toBe(false);
  });

  it('builds 2 sections with the 4 embedded questions (no fetch)', () => {
    const sections = transformEmbeddedQuestionSet(metadata);
    expect(sections).toHaveLength(2);
    expect(sections[0].children.map((q) => q.qType)).toEqual(['MCQ', 'SA']);
    expect(sections[1].children.map((q) => q.qType)).toEqual(['FTB', 'REO']);
    // content survived the transform
    expect(sections[0].children[0].body).toContain('capital of France');
    expect(sections[1].children[0].body).toContain('[[response1]]');
    // scoring hints preserved for FTB
    expect(sections[1].children[0].responseProcessing?.template).toBe('MAP_RESPONSE');
    expect(sections[1].children[0].evalUnordered).toBe(true);
  });
});
