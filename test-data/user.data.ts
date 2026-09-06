import { CreateUserRequest } from '../models/user.model';

export function buildValidUserPayload(): CreateUserRequest {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const password = 'Password1!';

  return {
    username: `testuser_${uniqueSuffix}`,
    firstName: 'Test',
    lastName: 'User',
    email: `testuser_${uniqueSuffix}@example.com`,
    password,
    confirmPassword: password,
  };
}

export function buildUserPayloadMissingField(field: keyof CreateUserRequest): Partial<CreateUserRequest> {
  const payload: Partial<CreateUserRequest> = { ...buildValidUserPayload() };
  delete payload[field];
  return payload;
}

export function buildUserPayloadWithOverrides(overrides: Partial<CreateUserRequest>): CreateUserRequest {
  return { ...buildValidUserPayload(), ...overrides };
}

export interface MissingFieldVariant {
  label: string;
  field: keyof CreateUserRequest;
  expectedErrorKey: string;
}

export const missingFieldVariants: MissingFieldVariant[] = [
  { label: 'a) Izostavljen username', field: 'username', expectedErrorKey: 'Username' },
  { label: 'b) Izostavljeno ime - firstName', field: 'firstName', expectedErrorKey: 'FirstName' },
  { label: 'c) Izostavljeno prezime - lastName', field: 'lastName', expectedErrorKey: 'LastName' },
  { label: 'd) Izostavljena email adresa - email', field: 'email', expectedErrorKey: 'Email' },
  { label: 'e) Izostavljena lozinka - password', field: 'password', expectedErrorKey: 'Password' },
];

export const INVALID_PASSWORD_FORMAT_ERROR_MESSAGE =
  'Lozinka mora imati najmanje 6 karaktera, jedno veliko slovo, jedan broj i jedan specijalni karakter.';

export interface InvalidPasswordVariant {
  label: string;
  password: string;
}

export const invalidPasswordVariants: InvalidPasswordVariant[] = [
  { label: 'a) Lozinka kraća od 6 karaktera', password: 'Ab1!' },
  { label: 'b) Lozinka bez velikog slova', password: 'ab1!ab' },
  { label: 'c) Lozinka bez broja', password: 'Abcd!e' },
  { label: 'd) Lozinka bez specijalnog karaktera', password: 'Abcde1' },
];

export const CONFIRM_PASSWORD_MISMATCH_ERROR_MESSAGE = 'Lozinke se ne poklapaju.';

const MAX_FIELD_LENGTH = 50;
const oversizedFieldValue = 'a'.repeat(MAX_FIELD_LENGTH + 1);

export interface MaxLengthFieldVariant {
  label: string;
  field: keyof CreateUserRequest;
  value: string;
  expectedErrorKey: string;
}

export const maxLengthFieldVariants: MaxLengthFieldVariant[] = [
  { label: 'a) Username duži od 50 karaktera', field: 'username', value: oversizedFieldValue, expectedErrorKey: 'Username' },
  { label: 'b) Ime (firstName) duže od 50 karaktera', field: 'firstName', value: oversizedFieldValue, expectedErrorKey: 'FirstName' },
  { label: 'c) Prezime (lastName) duže od 50 karaktera', field: 'lastName', value: oversizedFieldValue, expectedErrorKey: 'LastName' },
];
