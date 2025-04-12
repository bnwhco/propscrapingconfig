import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure Cognito authentication resources
 */
export const auth = defineAuth({
  // Require users to login using their email address
  loginWith: {
    email: true,
    // External providers like Google or Facebook are optional
    // externalProviders: { /** ... */ },
  },
  // Require email verification after sign up
  userAttributes: {
    email: {
      required: true,
      mutable: false, // Email cannot be changed after sign up
    },
  },
  // Configure multi-factor authentication (MFA) - Optional but recommended
  // mfa: {
  //   mode: 'OPTIONAL', // or 'REQUIRED'
  //   totp: true, // Allow Time-based One-Time Passwords (TOTP) like Google Authenticator
  // },
  // Configure account recovery mechanisms
  // accountRecovery: 'EMAIL_ONLY', // Default is EMAIL_ONLY when email is enabled
});