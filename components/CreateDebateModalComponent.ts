import { Locator, Page } from '@playwright/test';

export class CreateDebateModalComponent {
  private readonly titleInput: Locator;
  private readonly descriptionInput: Locator;
  private readonly spoilerCheckbox: Locator;
  private readonly postDebateButton: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.getByPlaceholder("What's the debate about?");
    this.descriptionInput = page.getByPlaceholder('Share your thoughts, arguments, or questions…');
    this.spoilerCheckbox = page.locator('#spoiler-toggle');
    this.postDebateButton = page.getByRole('button', { name: 'Post Debate' });
  }

  async create(title: string, description: string, tags: string[] = [], spoiler = false): Promise<void> {
    await this.titleInput.fill(title);
    await this.descriptionInput.fill(description);

    for (const tag of tags) {
      await this.selectTag(tag);
    }

    if (spoiler) {
      await this.spoilerCheckbox.check();
    }

    await this.postDebateButton.click();
  }

  private async selectTag(tag: string): Promise<void> {
    await this.page.getByRole('button', { name: `#${tag}`, exact: true }).click();
  }
}
