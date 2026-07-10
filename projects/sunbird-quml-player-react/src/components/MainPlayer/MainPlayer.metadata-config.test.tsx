import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// The Sunbird editor/portal pass the questionset under `playerConfig.metadata`
// (Angular contract) with `data` empty. Mock the data service to assert the
// player fetches using the identifier taken from metadata.
const { loadQuestionSet } = vi.hoisted(() => ({ loadQuestionSet: vi.fn() }));
// These configs carry no embedded question content, so force the fetch path.
vi.mock('../../services/data-service', () => ({
  loadQuestionSet,
  hasEmbeddedQuestions: () => false,
  transformEmbeddedQuestionSet: () => [],
}));

describe('MainPlayer — metadata config contract (editor/portal)', () => {
  it('fetches by identifier from playerConfig.metadata when data is empty', async () => {
    loadQuestionSet.mockResolvedValue({
      metadata: { name: 'questionset-t1' },
      sections: [],
    });
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { identifier: 'do_qs1', name: 'questionset-t1' },
      data: {},
    };

    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );

    await waitFor(() =>
      expect(loadQuestionSet).toHaveBeenCalledWith('do_qs1', expect.anything()),
    );
    // The overview title reflects the fetched metadata name, not the fallback.
    await waitFor(() => expect(screen.getByText('questionset-t1')).toBeInTheDocument());
  });

  it('does not fetch when neither data nor metadata carries an identifier', async () => {
    loadQuestionSet.mockClear();
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: {},
      data: {},
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    // Flush effects with a single microtask tick; the no-identifier path returns
    // synchronously, so loadQuestionSet must not be called.
    await act(async () => {});
    expect(loadQuestionSet).not.toHaveBeenCalled();
  });

  it('does not fetch when the identifier is a non-string (guards against .../[object Object])', async () => {
    loadQuestionSet.mockClear();
    const cfg: PlayerConfig = {
      context: {},
      config: { language: 'en' },
      metadata: { identifier: { bad: true } as unknown as string },
      data: {},
    };
    render(
      <QumlProvider playerConfig={cfg}>
        <MainPlayer playerConfig={cfg} />
      </QumlProvider>,
    );
    await act(async () => {});
    expect(loadQuestionSet).not.toHaveBeenCalled();
  });
});
