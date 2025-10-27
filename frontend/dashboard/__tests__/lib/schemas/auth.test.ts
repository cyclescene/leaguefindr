import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema } from '@/lib/schemas/auth';

describe('signInSchema', () => {
  describe('valid inputs', () => {
    it('should validate correct email and password', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = signInSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with various valid email formats', () => {
      const emails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first+last@example.com',
        'user123@test-domain.com',
      ];

      emails.forEach((email) => {
        const result = signInSchema.safeParse({
          email,
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate with long passwords', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: 'this_is_a_very_long_secure_password_123!@#',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty email', () => {
      const result = signInSchema.safeParse({
        email: '',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['notanemail', 'user@', '@example.com', 'user name@example.com'];

      invalidEmails.forEach((email) => {
        const result = signInSchema.safeParse({
          email,
          password: 'password123',
        });

        expect(result.success).toBe(false);
      });
    });

    it('should reject empty password', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Password is required');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject password with exactly 7 characters', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
        password: '1234567',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing email field', () => {
      const result = signInSchema.safeParse({
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing password field', () => {
      const result = signInSchema.safeParse({
        email: 'user@example.com',
      });

      expect(result.success).toBe(false);
    });
  });
});

describe('signUpSchema', () => {
  describe('valid inputs', () => {
    it('should validate correct email, organization name, password, and matching confirmation', () => {
      const validData = {
        email: 'user@example.com',
        organizationName: 'Acme Corp',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate with various valid email formats', () => {
      const emails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first+last@example.com',
        'user123@test-domain.com',
      ];

      emails.forEach((email) => {
        const result = signUpSchema.safeParse({
          email,
          organizationName: 'Test Org',
          password: 'password123',
          confirmPassword: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should validate with long passwords', () => {
      const password = 'this_is_a_very_long_secure_password_123!@#';
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Organization',
        password,
        confirmPassword: password,
      });

      expect(result.success).toBe(true);
    });

    it('should validate with organization names of various lengths', () => {
      const orgNames = [
        'AB', // minimum 2 chars
        'Medium Org Name',
        'This is a very long organization name with many words in it',
        'A'.repeat(100), // exactly 100 chars
      ];

      orgNames.forEach((orgName) => {
        const result = signUpSchema.safeParse({
          email: 'user@example.com',
          organizationName: orgName,
          password: 'password123',
          confirmPassword: 'password123',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('invalid inputs - email validation', () => {
    it('should reject empty email', () => {
      const result = signUpSchema.safeParse({
        email: '',
        organizationName: 'Test Org',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['notanemail', 'user@', '@example.com', 'user name@example.com'];

      invalidEmails.forEach((email) => {
        const result = signUpSchema.safeParse({
          email,
          organizationName: 'Test Org',
          password: 'password123',
          confirmPassword: 'password123',
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('invalid inputs - organization name validation', () => {
    it('should reject empty organization name', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: '',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Organization name is required');
      }
    });

    it('should reject organization name with only 1 character', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'A',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject organization name exceeding 100 characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'A'.repeat(101),
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at most 100 characters');
      }
    });
  });

  describe('invalid inputs - password validation', () => {
    it('should reject empty password', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: '',
        confirmPassword: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject empty confirmPassword', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'password123',
        confirmPassword: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject confirmPassword shorter than 8 characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'password123',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('password matching validation', () => {
    it('should reject when passwords do not match', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'password123',
        confirmPassword: 'password456',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Passwords don't match");
      }
    });

    it('should reject when passwords match but one is too short', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
    });

    it('should accept when both passwords match and are valid', () => {
      const password = 'validPassword123';
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password,
        confirmPassword: password,
      });

      expect(result.success).toBe(true);
    });

    it('should be case-sensitive for password matching', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'Password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Passwords don't match");
      }
    });
  });

  describe('missing fields', () => {
    it('should reject missing email', () => {
      const result = signUpSchema.safeParse({
        organizationName: 'Test Org',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing organizationName', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        // Zod gives a type error when the field is missing entirely
        expect(result.error.issues[0].message).toContain('Invalid input');
      }
    });

    it('should reject missing password', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        confirmPassword: 'password123',
      });

      expect(result.success).toBe(false);
    });

    it('should reject missing confirmPassword', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        organizationName: 'Test Org',
        password: 'password123',
      });

      expect(result.success).toBe(false);
    });
  });
});
