import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders pending_review badge with correct text', () => {
    render(<StatusBadge status="pending_review" />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('renders approved badge with correct text', () => {
    render(<StatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders rejected badge with correct text', () => {
    render(<StatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders draft badge with correct text', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders unknown badge for invalid status', () => {
    render(<StatusBadge status="invalid_status" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('applies correct variant to pending badge', () => {
    const { container } = render(<StatusBadge status="pending_review" />);
    const badge = container.querySelector('[class*="bg-yellow"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant to approved badge', () => {
    const { container } = render(<StatusBadge status="approved" />);
    const badge = container.querySelector('[class*="bg-green"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant to rejected badge', () => {
    const { container } = render(<StatusBadge status="rejected" />);
    const badge = container.querySelector('[class*="bg-red"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies consistent width class', () => {
    const { container } = render(<StatusBadge status="pending_review" />);
    const badge = container.querySelector('[class*="w-"]');
    expect(badge).toHaveClass('w-[130px]');
  });

  it('centers text', () => {
    const { container } = render(<StatusBadge status="approved" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass('text-center');
  });
});
