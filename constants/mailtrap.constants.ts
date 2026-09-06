import { getRequiredEnvVar } from '../utils/env';

export const MAILTRAP_API_BASE_URL = 'https://mailtrap.io';
export const MAILTRAP_API_TOKEN = getRequiredEnvVar('MAILTRAP_API_TOKEN');

const accountId = getRequiredEnvVar('MAILTRAP_ACCOUNT_ID');
const inboxId = getRequiredEnvVar('MAILTRAP_INBOX_ID');

export const MailtrapEndpoints = {
  MESSAGES: `/api/accounts/${accountId}/inboxes/${inboxId}/messages`,
  messageBody: (messageId: number): string =>
    `/api/accounts/${accountId}/inboxes/${inboxId}/messages/${messageId}/body.html`,
} as const;
