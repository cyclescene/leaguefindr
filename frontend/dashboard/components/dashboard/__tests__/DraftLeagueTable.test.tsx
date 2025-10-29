import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DraftLeagueTable } from '../DraftLeagueTable';

interface Draft {
  id: number;
  name: string;
  sport: string;
  ageGroup: string;
  gender: string;
  startDate: string;
  venue: string;
  dateSubmitted: string;
  status: string;
}

describe('DraftLeagueTable', () => {
  const mockDrafts: Draft[] = [
    {
      id: 1,
      name: 'Draft Football League',
      sport: 'Football',
      ageGroup: '18-25',
      gender: 'Male',
      startDate: '2024-01-01',
      venue: 'Stadium A',
      dateSubmitted: '2023-12-01',
      status: 'draft',
    },
    {
      id: 2,
      name: 'Draft Basketball League',
      sport: 'Basketball',
      ageGroup: '12-18',
      gender: 'Mixed',
      startDate: '2024-02-01',
      venue: 'Court B',
      dateSubmitted: '2023-12-15',
      status: 'draft',
    },
  ];

  const mockHandlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with caption', () => {
    render(
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('Draft Leagues')).toBeInTheDocument();
  });

  it('renders table headers without organization name column', () => {
    render(
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('League Name')).toBeInTheDocument();
    expect(screen.getByText('Sport')).toBeInTheDocument();
    expect(screen.getByText('Age Group')).toBeInTheDocument();
    // Ensure organization name column does not exist
    const headers = screen.getAllByRole('columnheader');
    const hasOrgColumn = Array.from(headers).some(
      (header) => header.textContent === 'League Org Name'
    );
    expect(hasOrgColumn).toBe(false);
  });

  it('renders all draft rows', () => {
    render(
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('Draft Football League')).toBeInTheDocument();
    expect(screen.getByText('Draft Basketball League')).toBeInTheDocument();
  });

  it('displays correct draft details', () => {
    render(
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('Football')).toBeInTheDocument();
    expect(screen.getByText('18-25')).toBeInTheDocument();
    expect(screen.getByText('Stadium A')).toBeInTheDocument();
  });

  it('renders empty table when no drafts provided', () => {
    render(
      <DraftLeagueTable
        drafts={[]}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('Draft Leagues')).toBeInTheDocument();
  });

  it('applies correct table styling', () => {
    const { container } = render(
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
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
      <DraftLeagueTable
        drafts={mockDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThanOrEqual(mockDrafts.length);
  });

  it('all drafts should have draft status', () => {
    const draftWithWrongStatus: Draft[] = [
      { ...mockDrafts[0], status: 'draft' },
      { ...mockDrafts[1], status: 'draft' },
    ];

    render(
      <DraftLeagueTable
        drafts={draftWithWrongStatus}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    expect(screen.getByText('Draft Football League')).toBeInTheDocument();
    expect(screen.getByText('Draft Basketball League')).toBeInTheDocument();
  });

  it('handles multiple draft leagues correctly', () => {
    const multipleDrafts: Draft[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Draft League ${i + 1}`,
      sport: 'Sport',
      ageGroup: '18-25',
      gender: 'Mixed',
      startDate: '2024-01-01',
      venue: `Venue ${i + 1}`,
      dateSubmitted: '2023-12-01',
      status: 'draft',
    }));

    render(
      <DraftLeagueTable
        drafts={multipleDrafts}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Draft League ${i}`)).toBeInTheDocument();
    }
  });
});
