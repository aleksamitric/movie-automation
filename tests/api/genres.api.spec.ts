import { test, expect } from '../../fixtures/api.fixtures';
import { Genre } from '../../models/genre.model';

function expectSortedByName(genres: Genre[]): void {
  const names = genres.map((genre) => genre.name);
  const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
  expect.soft(names).toEqual(sortedNames);
}

test(
  '[QA-62][API] Preuzimanje liste žanrova',
  { tag: ['@api', '@smoke'] },
  async ({ genresApi, verifiedTestUser }) => {
    await test.step('a) Sa validnim tokenom', async () => {
      const response = await genresApi.getAll(verifiedTestUser.token);

      expect.soft(response.status()).toBe(200);
      const genres: Genre[] = await response.json();
      expect.soft(genres.length).toBeGreaterThan(0);
      genres.forEach((genre) => {
        expect.soft(genre).toHaveProperty('id');
        expect.soft(genre).toHaveProperty('name');
      });
      expectSortedByName(genres);
    });

    await test.step('b) Bez tokena', async () => {
      const response = await genresApi.getAll();

      expect.soft(response.status()).toBe(401);
    });
  },
);
