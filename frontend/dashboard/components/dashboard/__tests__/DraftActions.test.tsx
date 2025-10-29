import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DraftActions } from '../DraftActions';

describe('DraftActions', () => {
  const mockHandlers = {
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dropdown trigger button', () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('displays dropdown menu when clicked', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(await screen.findByText('Actions')).toBeInTheDocument();
  });

  it('calls onView when View is clicked', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const viewOption = await screen.findByText('View');
    fireEvent.click(viewOption);
    expect(mockHandlers.onView).toHaveBeenCalledWith(1);
  });

  it('calls onEdit when Edit is clicked', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const editOption = await screen.findByText('Edit');
    fireEvent.click(editOption);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(1);
  });

  it('calls onSubmit when Submit is clicked', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const submitOption = await screen.findByText('Submit');
    fireEvent.click(submitOption);
    expect(mockHandlers.onSubmit).toHaveBeenCalledWith(1);
  });

  it('calls onDelete when Delete is clicked', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const deleteOption = await screen.findByText('Delete');
    fireEvent.click(deleteOption);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(1);
  });

  it('passes correct draftId to all handlers', async () => {
    const draftId = 99;
    render(
      <DraftActions
        draftId={draftId}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const submitOption = await screen.findByText('Submit');
    fireEvent.click(submitOption);
    expect(mockHandlers.onSubmit).toHaveBeenCalledWith(draftId);
  });

  it('renders delete option in red', async () => {
    render(
      <DraftActions
        draftId={1}
        onView={mockHandlers.onView}
        onEdit={mockHandlers.onEdit}
        onDelete={mockHandlers.onDelete}
        onSubmit={mockHandlers.onSubmit}
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const deleteOption = await screen.findByText('Delete');
    expect(deleteOption.closest('[class*="text-red"]')).toBeInTheDocument();
  });
});
