import { DebatesApi } from '../api/debates.api';
import { DebatePost } from '../models/debate.model';

export async function deleteFilmDebatesIfAny(debatesApi: DebatesApi, filmId: number, token: string): Promise<void> {
  const debates: DebatePost[] = await (await debatesApi.getByFilmId(filmId)).json();
  for (const debate of debates) {
    await debatesApi.delete(debate.id, token);
  }
}

export async function deleteSeriesDebatesIfAny(debatesApi: DebatesApi, seriesId: number, token: string): Promise<void> {
  const debates: DebatePost[] = await (await debatesApi.getBySeriesId(seriesId)).json();
  for (const debate of debates) {
    await debatesApi.delete(debate.id, token);
  }
}
