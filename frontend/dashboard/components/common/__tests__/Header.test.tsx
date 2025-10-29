import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

// Mock Clerk's SignOutButton
vi.mock('@clerk/nextjs', () => ({
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button">{children}</div>
  ),
}));

describe('Header', () => {
  it('renders dashboard title', () => {
    render(<Header />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays organization name in welcome message', () => {
    render(<Header organizationName="Test Org" />);
    expect(screen.getByText('Welcome, Test Org')).toBeInTheDocument();
  });

  it('displays default welcome message when organization name is not provided', () => {
    render(<Header />);
    expect(screen.getByText('Welcome, User')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    render(<Header organizationName="My Organization" />);
    const signOutButton = screen.getByTestId('sign-out-button');
    expect(signOutButton).toBeInTheDocument();
  });

  it('renders sign out text in button', () => {
    render(<Header organizationName="My Organization" />);
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<Header organizationName="Test Org" />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-brand-dark');
    expect(header).toHaveClass('text-white');
    expect(header).toHaveClass('shadow-lg');
  });

  it('renders with large heading size', () => {
    const { container } = render(<Header organizationName="Test Org" />);
    const heading = container.querySelector('h1');
    expect(heading).toHaveClass('text-4xl');
    expect(heading).toHaveClass('font-bold');
  });

  it('displays custom organization name correctly', () => {
    render(<Header organizationName="Custom Org Name" />);
    expect(screen.getByText('Welcome, Custom Org Name')).toBeInTheDocument();
  });
});
