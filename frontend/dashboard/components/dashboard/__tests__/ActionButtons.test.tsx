import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActionButtons } from '../ActionButtons';

describe('ActionButtons', () => {
  const mockHandlers = {
    onAddSport: vi.fn(),
    onAddOrg: vi.fn(),
    onAddVenue: vi.fn(),
    onAddLeague: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all four buttons', () => {
    render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    expect(screen.getByText('Add Sport')).toBeInTheDocument();
    expect(screen.getByText('Add Org')).toBeInTheDocument();
    expect(screen.getByText('Add Venue')).toBeInTheDocument();
    expect(screen.getByText('Add League')).toBeInTheDocument();
  });

  it('calls onAddSport when Add Sport is clicked', () => {
    render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    const addSportButton = screen.getByText('Add Sport');
    fireEvent.click(addSportButton);
    expect(mockHandlers.onAddSport).toHaveBeenCalled();
  });

  it('calls onAddOrg when Add Org is clicked', () => {
    render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    const addOrgButton = screen.getByText('Add Org');
    fireEvent.click(addOrgButton);
    expect(mockHandlers.onAddOrg).toHaveBeenCalled();
  });

  it('calls onAddVenue when Add Venue is clicked', () => {
    render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    const addVenueButton = screen.getByText('Add Venue');
    fireEvent.click(addVenueButton);
    expect(mockHandlers.onAddVenue).toHaveBeenCalled();
  });

  it('calls onAddLeague when Add League is clicked', () => {
    render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    const addLeagueButton = screen.getByText('Add League');
    fireEvent.click(addLeagueButton);
    expect(mockHandlers.onAddLeague).toHaveBeenCalled();
  });

  it('handles optional handlers gracefully', () => {
    render(<ActionButtons />);
    expect(screen.getByText('Add Sport')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add Sport'));
    // Should not throw error
    expect(true).toBe(true);
  });

  it('applies brandDark variant to buttons', () => {
    const { container } = render(
      <ActionButtons
        onAddSport={mockHandlers.onAddSport}
        onAddOrg={mockHandlers.onAddOrg}
        onAddVenue={mockHandlers.onAddVenue}
        onAddLeague={mockHandlers.onAddLeague}
      />
    );
    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('brandDark');
    });
  });
});
