import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import { SignInForm } from '@/components/auth/sign-in-form';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock clerk
vi.mock('@clerk/nextjs', () => ({
  useSignIn: vi.fn(() => ({
    signIn: {
      authenticateWithRedirect: vi.fn(),
      create: vi.fn(() => Promise.resolve({
        status: 'complete',
        createdSessionId: 'test-session-id',
      })),
    },
    isLoaded: true,
  })),
  useAuth: vi.fn(() => ({
    userId: null,
    isLoaded: true,
  })),
}));

describe('SignInForm', () => {
  describe('rendering', () => {
    it('should render email and password input fields', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should render sign in button', () => {
      render(<SignInForm />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should not render Google sign in button', () => {
      render(<SignInForm />);

      const buttons = screen.getAllByRole('button');
      const googleButton = buttons.find(btn => btn.textContent?.includes('Google'));
      expect(googleButton).toBeUndefined();
    });

    it('should not render "Or continue with" text', () => {
      render(<SignInForm />);

      expect(screen.queryByText(/or continue with/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should display validation error when email is empty', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when password is empty', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should not allow form submission with invalid email format due to HTML5 validation', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalidemail');
      await user.type(passwordInput, 'password123');

      // HTML5 validation prevents form submission with invalid email
      expect(emailInput.validity.valid).toBe(false);
    });

    it('should display validation error for password too short', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should not show validation errors with valid data', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');

      // Form should not have any validation errors when filled correctly
      expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password/i, { selector: '.text-destructive' })).not.toBeInTheDocument();
    });
  });

  describe('form state', () => {
    it('should have form fields populated by user input', async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput.value).toBe('user@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('button states', () => {
    it('should have sign in button enabled initially', () => {
      render(<SignInForm />);
      const submitButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });
  });

});
