import { CommentsApi } from '../api/comments.api';
import { Comment } from '../models/comment.model';

export async function deleteFilmCommentsIfAny(commentsApi: CommentsApi, filmId: number, token: string): Promise<void> {
  const comments: Comment[] = await (await commentsApi.getByFilmId(filmId)).json();
  for (const comment of comments) {
    await commentsApi.delete(comment.id, token);
  }
}

export async function deleteSeriesCommentsIfAny(commentsApi: CommentsApi, seriesId: number, token: string): Promise<void> {
  const comments: Comment[] = await (await commentsApi.getBySeriesId(seriesId)).json();
  for (const comment of comments) {
    await commentsApi.delete(comment.id, token);
  }
}
