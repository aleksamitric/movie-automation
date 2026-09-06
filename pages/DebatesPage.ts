import { Locator, Page } from '@playwright/test';
import { CreateDebateModalComponent } from '../components/CreateDebateModalComponent';
import { getExpect } from '../utils/assert';

export class DebatesPage {
  readonly createDebateModal: CreateDebateModalComponent;
  private readonly createDebateButton: Locator;

  constructor(private readonly page: Page) {
    this.createDebateModal = new CreateDebateModalComponent(page);
    this.createDebateButton = page.getByRole('button', { name: '+ Create Debate', exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/debates');
  }

  async openCreateDebateModal(): Promise<void> {
    await this.createDebateButton.click();
  }

  async expectDebateTitleVisible(title: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(title, { exact: true })).toBeVisible();
  }

  async expectDebateTitleNotVisible(title: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(title, { exact: true })).not.toBeVisible();
  }

  async expectSpoilerContentBlurred(content: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(content, { exact: true })).not.toHaveCSS('filter', 'none');
  }

  async expectDebateLinkedToMedia(debateTitle: string, mediaTitle: string, soft = false): Promise<void> {
    const card = this.page.getByText(debateTitle, { exact: true }).locator('xpath=ancestor::div[2]');
    await getExpect(soft)(card.getByText(mediaTitle, { exact: true })).toBeVisible();
  }
}
