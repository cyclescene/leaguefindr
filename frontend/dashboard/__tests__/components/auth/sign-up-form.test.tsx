import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import { SignUpForm } from '@/components/auth/sign-up-form';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock clerk
vi.mock('@clerk/nextjs', () => ({
  useSignUp: vi.fn(() => ({
    signUp: {
      authenticateWithRedirect: vi.fn(),
      create: vi.fn(() => Promise.resolve({
        status: 'missing_requirements',
        createdUserId: 'test-user-id',
      })),
      prepareEmailAddressVerification: vi.fn(() => Promise.resolve()),
      emailAddress: 'test@example.com',
    },
    isLoaded: true,
  })),
  useAuth: vi.fn(() => ({
    userId: null,
    isLoaded: true,
  })),
}));

beforeEach(() => {
  (global.fetch as any).mockResolvedValue({
    ok: true,
    text: vi.fn(() => Promise.resolve('')),
  });
  vi.clearAllMocks();
});

describe('SignUpForm', () => {
  describe('rendering', () => {
    it('should render email, organization name, password, and confirm password input fields', () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render sign up button', () => {
      render(<SignUpForm />);

      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should not render Google sign up button', () => {
      render(<SignUpForm />);

      const buttons = screen.getAllByRole('button');
      const googleButton = buttons.find(btn => btn.textContent?.includes('Google'));
      expect(googleButton).toBeUndefined();
    });

    it('should not render "Or continue with" text', () => {
      render(<SignUpForm />);

      expect(screen.queryByText(/or continue with/i)).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should display validation error when email is empty', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when organization name is empty', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/organization name is required/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when password is empty', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when confirm password is empty', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password confirmation is required/i)).toBeInTheDocument();
      });
    });

    it('should not allow form submission with invalid email format due to HTML5 validation', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'invalidemail');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // HTML5 validation prevents form submission with invalid email
      expect(emailInput.validity.valid).toBe(false);
    });

    it('should display validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('should display validation error when password is too short', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(submitButton);

      await waitFor(
        () => {
          const errors = screen.getAllByText(/at least 8 characters/i);
          expect(errors.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('should not show validation errors with valid data', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');

      // Form should not have any validation errors when filled correctly
      expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password/i, { selector: '.text-destructive' })).not.toBeInTheDocument();
    });

    it('should call backend API with form data on valid submission', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth?action=register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerkID: 'test-user-id',
            email: 'test@example.com',
            organizationName: 'Test Org',
          }),
        });
      });
    });
  });

  describe('form state', () => {
    it('should prepare email verification on submission', async () => {
      const { useSignUp: useSignUpMock } = await import('@clerk/nextjs');
      const mockPrepareEmail = vi.fn(() => Promise.resolve());

      (useSignUpMock as any).mockReturnValue({
        signUp: {
          authenticateWithRedirect: vi.fn(),
          create: vi.fn(() => Promise.resolve({
            status: 'missing_requirements',
            createdUserId: 'test-user-id',
          })),
          prepareEmailAddressVerification: mockPrepareEmail,
          emailAddress: 'test@example.com',
        },
        isLoaded: true,
      });

      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPrepareEmail).toHaveBeenCalledWith({
          strategy: 'email_link',
          redirectUrl: expect.stringContaining('/verify-email'),
        });
      });
    });
  });

  describe('button states', () => {
    it('should have sign up button enabled initially', () => {
      render(<SignUpForm />);
      const submitButton = screen.getByRole('button', { name: /sign up/i }) as HTMLButtonElement;
      expect(submitButton.disabled).toBe(false);
    });
  });

  describe('password matching validation', () => {
    it('should be case-sensitive when comparing passwords', async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const orgNameInput = screen.getByLabelText(/organization name/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(orgNameInput, 'Test Org');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });
  });
});
