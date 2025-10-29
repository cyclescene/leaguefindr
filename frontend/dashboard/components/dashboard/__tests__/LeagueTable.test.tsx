import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeagueTable } from '../LeagueTable';

interface League {
  id: number;
  name: string;
  organizationName: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

describe('LeagueTable', () => {
  const mockLeagues: League[] = [
    {
      id: 1,
      name: 'Football League',
      organizationName: 'Sports Org',
      sport: 'Football',
      ageGroup: '18-25',
      gender: 'Male',
      startDate: '2024-01-01',
      venue: 'Stadium A',
      dateSubmitted: '2023-12-01',
      status: 'pending_review',
    },
    {
      id: 2,
      name: 'Basketball League',
      organizationName: 'City Sports',
      sport: 'Basketball',
      ageGroup: '12-18',
      gender: 'Mixed',
      startDate: '2024-02-01',
      venue: 'Court B',
      dateSubmitted: '2023-12-15',
      status: 'approved',
    },
  ];

  const mockHandlers = {
    onView: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with caption', () => {
    render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('Submitted Leagues')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('League Name')).toBeInTheDocument();
    expect(screen.getByText('League Org Name')).toBeInTheDocument();
    expect(screen.getByText('Sport')).toBeInTheDocument();
    expect(screen.getByText('Age Group')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText('Date Submitted')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all league rows', () => {
    render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('Football League')).toBeInTheDocument();
    expect(screen.getByText('Basketball League')).toBeInTheDocument();
  });

  it('displays correct league details', () => {
    render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('Sports Org')).toBeInTheDocument();
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('18-25')).toBeInTheDocument();
    expect(screen.getByText('Stadium A')).toBeInTheDocument();
  });

  it('renders empty table when no leagues provided', () => {
    render(
      <LeagueTable
        leagues={[]}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('Submitted Leagues')).toBeInTheDocument();
  });

  it('applies correct table styling', () => {
    const { container } = render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const table = container.querySelector('table');
    expect(table).toHaveClass('w-full');
    expect(table).toHaveClass('bg-white');
    expect(table).toHaveClass('rounded-lg');
    expect(table).toHaveClass('shadow-md');
  });

  it('renders action buttons for each row', () => {
    const { container } = render(
      <LeagueTable
        leagues={mockLeagues}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(mockLeagues.length);
  });

  it('handles leagues with different statuses', () => {
    const leaguesWithStatuses: League[] = [
      { ...mockLeagues[0], status: 'pending_review' },
      { ...mockLeagues[1], status: 'approved' },
      { ...mockLeagues[0], id: 3, name: 'Rejected League', status: 'rejected' },
    ];

    render(
      <LeagueTable
        leagues={leaguesWithStatuses}
        onView={mockHandlers.onView}
        onApprove={mockHandlers.onApprove}
        onReject={mockHandlers.onReject}
      />
    );
    expect(screen.getByText('Rejected League')).toBeInTheDocument();
  });
});
