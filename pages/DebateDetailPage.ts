import { Locator, Page } from '@playwright/test';
import { getExpect } from '../utils/assert';

export class DebateDetailPage {
  private readonly replyTextarea: Locator;
  private readonly postReplyButton: Locator;
  private readonly likeButton: Locator;
  private readonly spoilerRevealPrompt: Locator;
  private readonly spoilerBlurredWrapper: Locator;

  constructor(private readonly page: Page) {
    this.replyTextarea = page.getByPlaceholder('Share your thoughts on this debate…');
    this.postReplyButton = page.getByRole('button', { name: 'Post Reply' });
    this.likeButton = page.getByRole('button', { name: 'Like', exact: true });
    this.spoilerRevealPrompt = page.getByText('⚠️ Spoiler — click to reveal', { exact: true });
    this.spoilerBlurredWrapper = page.getByTitle('Click to reveal spoiler');
  }

  async goto(debateId: number): Promise<void> {
    await this.page.goto(`/debates/${debateId}`);
  }

  async postReply(text: string): Promise<void> {
    await this.replyTextarea.fill(text);
    await this.postReplyButton.click();
  }

  async toggleLike(): Promise<void> {
    await this.likeButton.click();
  }

  async expectReplyVisible(text: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(text, { exact: true })).toBeVisible();
  }

  async expectReplyTextareaEmpty(soft = false): Promise<void> {
    await getExpect(soft)(this.replyTextarea).toHaveValue('');
  }

  async expectLiked(likesCount: number, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByRole('button', { name: `♥ Liked (${likesCount})`, exact: true })).toBeVisible();
  }

  async expectNotLiked(likesCount: number, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByRole('button', { name: `♡ Like (${likesCount})`, exact: true })).toBeVisible();
  }

  async expectViewCount(count: number, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(`${count} views`, { exact: true })).toBeVisible();
  }

  async revealSpoiler(): Promise<void> {
    await this.spoilerBlurredWrapper.click();
  }

  async expectSpoilerPromptVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.spoilerRevealPrompt).toBeVisible();
  }

  async expectSpoilerPromptNotVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.spoilerRevealPrompt).not.toBeVisible();
  }

  async expectContentVisible(content: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(content, { exact: true })).toBeVisible();
  }
}