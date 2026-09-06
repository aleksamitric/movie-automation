import { Page } from '@playwright/test';
import { AvatarMenuComponent } from '../components/AvatarMenuComponent';
import { NavbarComponent } from '../components/NavbarComponent';
import { MediaTypeToggleComponent } from '../components/MediaTypeToggleComponent';
import { TrendingSectionComponent } from '../components/TrendingSectionComponent';

export class HomePage {
  readonly avatarMenu: AvatarMenuComponent;
  readonly navbar: NavbarComponent;
  readonly mediaTypeToggle: MediaTypeToggleComponent;
  readonly trendingSection: TrendingSectionComponent;

  constructor(private readonly page: Page) {
    this.avatarMenu = new AvatarMenuComponent(page);
    this.navbar = new NavbarComponent(page);
    this.mediaTypeToggle = new MediaTypeToggleComponent(page);
    this.trendingSection = new TrendingSectionComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/home');
  }
}
