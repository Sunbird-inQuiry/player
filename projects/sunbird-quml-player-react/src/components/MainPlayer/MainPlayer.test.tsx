import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QumlProvider } from '../../context/QumlContext';
import { MainPlayer } from './MainPlayer';
import type { PlayerConfig } from '../../types';

// Raw-ish embedded config (MainPlayer normalizes via the transformation service).
const cfg: PlayerConfig = {
  context: {},
  config: { language: 'en', showFeedback: true },
  data: {
    sections: [
      {
        identifier: 's1',
        name: 'Section 1',
        timeLimits: { questionSet: { max: 0, min: 0 } },
        children: [
          {
            identifier: 'q1',
            body: '<p>Q1</p>',
            primaryCategory: 'Multiple Choice Question',
            interactions: { response1: { options: [{ value: 0, label: 'Apple' }, { value: 1, label: 'Banana' }] } },
            responseDeclaration: {
              response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
            },
          },
        ],
      },
    ],
  },
};

const renderPlayer = () =>
  render(
    <QumlProvider playerConfig={cfg}>
      <MainPlayer playerConfig={cfg} />
    </QumlProvider>,
  );

describe('MainPlayer', () => {
  it('initializes from playerConfig and renders the first section question', () => {
    renderPlayer();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 1/i)).toBeInTheDocument();
  });

  it('shows feedback when configured and an answer is selected', () => {
    renderPlayer();
    fireEvent.click(screen.getAllByRole('radio')[0]); // correct option (value 0)
    expect(screen.getByRole('alert')).toHaveTextContent(/correct answer/i);
  });

  it('shows the scoreboard summary after submitting the final section', () => {
    renderPlayer();
    fireEvent.click(screen.getAllByRole('radio')[0]); // answer correctly
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('region', { name: /quiz summary/i })).toBeInTheDocument();
    expect(screen.getByText(/\/1/)).toBeInTheDocument(); // totalScore / maxScore
  });
});
