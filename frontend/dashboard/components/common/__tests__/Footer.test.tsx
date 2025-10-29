import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders footer element', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/leaguefindr.com ©/)).toBeInTheDocument();
  });

  it('displays current year in copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('bg-brand-dark');
    expect(footer).toHaveClass('text-white');
    expect(footer).toHaveClass('shadow-lg');
  });

  it('centers the text', () => {
    const { container } = render(<Footer />);
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('text-center');
  });

  it('has correct text size', () => {
    const { container } = render(<Footer />);
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('text-sm');
  });

  it('renders with proper padding', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toHaveClass('py-8');
    expect(footer).toHaveClass('px-6');
  });

  it('uses brand-light color for copyright text', () => {
    const { container } = render(<Footer />);
    const paragraph = container.querySelector('p');
    expect(paragraph).toHaveClass('text-brand-light');
  });
});
