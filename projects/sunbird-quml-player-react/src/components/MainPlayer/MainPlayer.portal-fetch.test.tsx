import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Simulate the PORTAL end-to-end: it passes SHALLOW metadata (identifier only,
// from /content/v1/read) and sets the /portal gateway URLs. The player must
// fetch hierarchy (stubs) + list (bodies) from those URLs, merge, and render.
vi.mock('../../services/http-client', () => ({ httpGet: vi.fn(), httpPost: vi.fn() }));
import { httpGet, httpPost } from '../../services/http-client';
const mockGet = httpGet as unknown as ReturnType<typeof vi.fn>;
const mockPost = httpPost as unknown as ReturnType<typeof vi.fn>;

// /portal/questionset/v2/hierarchy → sections with STUB questions (no body).
const hierarchy = {
  questionset: {
    identifier: 'do_qs',
    name: 'Sample question set',
    objectType: 'QuestionSetImage',
    children: [
      {
        identifier: 'do_secA',
        name: 'Section A',
        objectType: 'QuestionSet',
        index: 1,
        children: [
          { identifier: 'do_q1', objectType: 'Question', qType: 'MCQ', primaryCategory: 'Multiple Choice Question', index: 1 },
        ],
      },
    ],
  },
};

// /portal/question/v2/list → full question content (bodies + interactions).
const questions = [
  {
    identifier: 'do_q1',
    qType: 'MCQ',
    primaryCategory: 'Multiple Choice Question',
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
];

// Shallow metadata, exactly like the portal's content-read result.
const cfg: PlayerConfig = {
  context: {},
  config: { language: 'en' },
  metadata: { identifier: 'do_qs', name: 'Sample question set' },
  data: {},
};

describe('MainPlayer — full portal path (shallow metadata → /portal fetch → render)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    (window as any).questionSetHierarchyUrl = '/portal/questionset/v2/hierarchy/';
    (window as any).questionListUrl = '/portal/question/v2/list';
  });
  afterEach(() => {
    delete (window as any).questionSetHierarchyUrl;
    delete (window as any).questionListUrl;
  });

  it('fetches from the /portal gateway URLs, merges, and renders the question', async () => {
    mockGet.mockResolvedValue(hierarchy);
    mockPost.mockResolvedValue({ questions });

    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );

    // Hierarchy fetched from the portal gateway route (not /learner).
    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/portal/questionset/v2/hierarchy/do_qs', expect.anything()),
    );
    // Question list fetched from the portal gateway route (not /api or /action);
    // a ?lang= suffix is appended from config.language.
    expect(mockPost.mock.calls[0][0]).toContain('/portal/question/v2/list');

    // Overview shows, then enter the assessment and confirm the question paints.
    await waitFor(() => expect(screen.getByText('Sample question set')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /start assessment/i }));
    fireEvent.click(screen.getByRole('button', { name: /start section/i }));
    expect(screen.getByText(/capital of France/i)).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });
});
