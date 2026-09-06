import { test, expect } from '../../fixtures/api.fixtures';
import {
  buildValidUserPayload,
  buildUserPayloadMissingField,
  buildUserPayloadWithOverrides,
  missingFieldVariants,
  invalidPasswordVariants,
  INVALID_PASSWORD_FORMAT_ERROR_MESSAGE,
  CONFIRM_PASSWORD_MISMATCH_ERROR_MESSAGE,
  maxLengthFieldVariants,
} from '../../test-data/user.data';
import { LoginResponse } from '../../models/auth.model';

test('[QA-10][API] Kreiranje korisnika sa validnim podacima', { tag: ['@api', '@smoke'] }, async ({ usersApi }) => {
  const payload = buildValidUserPayload();

  const response = await usersApi.createUser(payload);

  expect(response.status()).toBe(200);
  expect(await response.text()).toBe('User successfully created.');
});

test('[QA-11][API] Registracija bez obaveznog polja', { tag: ['@api'] }, async ({ usersApi }) => {
  for (const variant of missingFieldVariants) {
    const payload = buildUserPayloadMissingField(variant.field);

    const response = await usersApi.createUserWithPayload(payload);
    const body = await response.json();

    expect.soft(response.status(), variant.label).toBe(400);
    expect.soft(body.errors, variant.label).toHaveProperty(variant.expectedErrorKey);
  }
});

test('[QA-12][API] Registracija sa nevalidnim formatom email adrese', { tag: ['@api'] }, async ({ usersApi }) => {
  const payload = buildUserPayloadWithOverrides({ email: 'invalid-email-format' });

  const response = await usersApi.createUserWithPayload(payload);
  const body = await response.json();

  expect(response.status()).toBe(400);
  expect(body.errors).toHaveProperty('Email');
});

test(
  '[QA-13][API] Registracija sa lozinkom koja ne zadovoljava očekivani format',
  { tag: ['@api'] },
  async ({ usersApi }) => {
    for (const variant of invalidPasswordVariants) {
      const payload = buildUserPayloadWithOverrides({
        password: variant.password,
        confirmPassword: variant.password,
      });

      const response = await usersApi.createUserWithPayload(payload);
      const body = await response.json();

      expect.soft(response.status(), variant.label).toBe(400);
      expect.soft(body.errors.Password, variant.label).toContain(INVALID_PASSWORD_FORMAT_ERROR_MESSAGE);
    }
  },
);

test(
  '[QA-14][API] Registracija kada se Password i ConfirmPassword ne poklapaju',
  { tag: ['@api'] },
  async ({ usersApi }) => {
    const payload = buildUserPayloadWithOverrides({ confirmPassword: 'DifferentPassword1!' });

    const response = await usersApi.createUserWithPayload(payload);
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errors.ConfirmPassword).toContain(CONFIRM_PASSWORD_MISMATCH_ERROR_MESSAGE);
  },
);

test(
  '[QA-15][API] Registracija sa poljem dužim od dozvoljenog (MaxLength)',
  { tag: ['@api'] },
  async ({ usersApi }) => {
    for (const variant of maxLengthFieldVariants) {
      const payload = buildUserPayloadWithOverrides({ [variant.field]: variant.value });

      const response = await usersApi.createUserWithPayload(payload);
      const body = await response.json();

      expect.soft(response.status(), variant.label).toBe(400);
      expect.soft(body.errors, variant.label).toHaveProperty(variant.expectedErrorKey);
    }
  },
);

test(
  '[QA-16][API] Registracija sa username-om koji već postoji',
  { tag: ['@api'] },
  async ({ usersApi, authApi }) => {
    const existingUser = buildValidUserPayload();
    const createResponse = await usersApi.createVerifiedUser(existingUser);
    const { id: existingUserId }: { id: number } = await createResponse.json();
    const loginResponse = await authApi.login({ username: existingUser.username, password: existingUser.password });
    const { token: existingUserToken }: LoginResponse = await loginResponse.json();

    try {
      const duplicateUsernamePayload = buildUserPayloadWithOverrides({ username: existingUser.username });
      const response = await usersApi.createUserWithPayload(duplicateUsernamePayload);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.errors).toHaveProperty('Username');
    } finally {
      await usersApi.deleteUser(existingUserId, existingUserToken);
    }
  },
);

test(
  '[QA-17][API] Registracija sa email adresom koja već postoji',
  { tag: ['@api'] },
  async ({ usersApi, authApi }) => {
    const existingUser = buildValidUserPayload();
    const createResponse = await usersApi.createVerifiedUser(existingUser);
    const { id: existingUserId }: { id: number } = await createResponse.json();
    const loginResponse = await authApi.login({ username: existingUser.username, password: existingUser.password });
    const { token: existingUserToken }: LoginResponse = await loginResponse.json();

    try {
      const duplicateEmailPayload = buildUserPayloadWithOverrides({ email: existingUser.email });
      const response = await usersApi.createUserWithPayload(duplicateEmailPayload);

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body.errors).toHaveProperty('Email');
    } finally {
      await usersApi.deleteUser(existingUserId, existingUserToken);
    }
  },
);
