import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubmitModal } from './SubmitModal';

const baseProps = {
  answeredCount: 7,
  unansweredCount: 2,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('SubmitModal', () => {
  it('renders as a modal dialog with answered/unanswered counts', () => {
    render(<SubmitModal {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('fires confirm and cancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<SubmitModal {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on Escape', () => {
    const onCancel = vi.fn();
    render(<SubmitModal {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });
});
