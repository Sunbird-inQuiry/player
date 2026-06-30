import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QuestionBody } from './QuestionBody';

describe('QuestionBody', () => {
  it('renders plain HTML body', () => {
    const { container } = render(<QuestionBody question={{ body: '<p>What is 2+2?</p>' }} />);
    expect(container.textContent).toContain('What is 2+2?');
  });

  it('renders images from the body', () => {
    const { container } = render(<QuestionBody question={{ body: '<img src="test.jpg" />' }} />);
    expect(container.querySelector('img')).toBeInTheDocument();
  });

  it('renders tables from the body', () => {
    const { container } = render(
      <QuestionBody question={{ body: '<table><tr><td>cell</td></tr></table>' }} />,
    );
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.textContent).toContain('cell');
  });

  it('applies RTL (dir + lang) for Arabic', () => {
    const { container } = render(
      <QuestionBody question={{ body: '<p>السلام عليكم</p>' }} language="ar" />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('lang', 'ar');
  });

  it('defaults to LTR (no dir) for non-Arabic', () => {
    const { container } = render(<QuestionBody question={{ body: '<p>Hello</p>' }} />);
    const root = container.firstElementChild;
    expect(root).not.toHaveAttribute('dir');
    expect(root).toHaveAttribute('lang', 'en');
  });

  it('renders KaTeX math from .math elements', () => {
    const { container } = render(
      <QuestionBody question={{ body: '<span class="math">x^2</span>' }} />,
    );
    // KaTeX replaces the element content with .katex markup
    expect(container.querySelector('.katex')).toBeInTheDocument();
  });

  it('does not crash on empty body', () => {
    const { container } = render(<QuestionBody question={{ body: '' }} />);
    expect(container.firstElementChild).toBeInTheDocument();
  });
});
