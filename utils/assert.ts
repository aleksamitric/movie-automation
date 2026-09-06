import { expect } from '@playwright/test';

export function getExpect(soft: boolean): typeof expect {
  return soft ? (expect.soft as typeof expect) : expect;
}
