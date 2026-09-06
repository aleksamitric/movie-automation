import { APIRequestContext, expect } from '@playwright/test';
import { MailtrapEndpoints } from '../constants/mailtrap.constants';
import { MailtrapMessage } from '../models/mailtrap.model';

const VERIFICATION_CODE_PATTERN = /\b\d{6}\b/;

export class MailboxApi {
  constructor(private readonly request: APIRequestContext) {}

  async getVerificationCode(recipientEmail: string): Promise<string> {
    const message = await this.waitForMessage(recipientEmail);
    const body = await this.getMessageBody(message.id);
    return this.extractVerificationCode(body);
  }

  private async waitForMessage(recipientEmail: string): Promise<MailtrapMessage> {
    let found: MailtrapMessage | undefined;

    await expect(async () => {
      const response = await this.request.get(MailtrapEndpoints.MESSAGES, {
        params: { search: recipientEmail },
      });
      const messages: MailtrapMessage[] = await response.json();
      found = messages.find((message) => message.to_email === recipientEmail);
      expect(found).toBeDefined();
    }).toPass({ timeout: 15_000 });

    return found!;
  }

  private async getMessageBody(messageId: number): Promise<string> {
    const response = await this.request.get(MailtrapEndpoints.messageBody(messageId));
    return response.text();
  }

  private extractVerificationCode(body: string): string {
    const match = body.match(VERIFICATION_CODE_PATTERN);

    if (!match) {
      throw new Error('Verification code not found in email body.');
    }

    return match[0];
  }
}
