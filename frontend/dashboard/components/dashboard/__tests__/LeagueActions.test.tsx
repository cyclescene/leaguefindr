import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeagueActions } from '../LeagueActions';

describe('LeagueActions', () => {
  const mockHandlers = {
    onView: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropdown trigger button', () => {
    render(
      <LeagueActions
        leagueId={1}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays dropdown menu when clicked', async () => {
    render(
      <LeagueActions
        leagueId={1}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(await screen.findByText('Actions')).toBeInTheDocument();
  });

  it('calls onView when View is clicked', async () => {
    render(
      <LeagueActions
        leagueId={1}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const viewOption = await screen.findByText('View');
    fireEvent.click(viewOption);
    expect(mockHandlers.onView).toHaveBeenCalledWith(1);
  });

  it('calls onApprove when Approve is clicked', async () => {
    render(
      <LeagueActions
        leagueId={1}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const approveOption = await screen.findByText('Approve');
    fireEvent.click(approveOption);
    expect(mockHandlers.onApprove).toHaveBeenCalledWith(1);
  });

  it('calls onReject when Reject is clicked', async () => {
    render(
      <LeagueActions
        leagueId={1}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const rejectOption = await screen.findByText('Reject');
    fireEvent.click(rejectOption);
    expect(mockHandlers.onReject).toHaveBeenCalledWith(1);
  });

  it('passes correct leagueId to handlers', async () => {
    const leagueId = 42;
    render(
      <LeagueActions
        leagueId={leagueId}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const viewOption = await screen.findByText('View');
    fireEvent.click(viewOption);
    expect(mockHandlers.onView).toHaveBeenCalledWith(leagueId);
  });
});
