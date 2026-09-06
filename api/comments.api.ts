import { APIRequestContext, APIResponse } from '@playwright/test';
import { CommentEndpoints } from '../constants/api.constants';
import { CommentCreateFilmRequest, CommentCreateSeriesRequest, CommentUpdateRequest } from '../models/comment.model';

export class CommentsApi {
  constructor(private readonly request: APIRequestContext) {}

  async createForFilm(payload: CommentCreateFilmRequest, token?: string): Promise<APIResponse> {
    return this.request.post(CommentEndpoints.CREATE_FOR_FILM, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: payload,
    });
  }

  async createForSeries(payload: CommentCreateSeriesRequest, token?: string): Promise<APIResponse> {
    return this.request.post(CommentEndpoints.CREATE_FOR_SERIES, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: payload,
    });
  }

  async getAll(token: string): Promise<APIResponse> {
    return this.request.get(CommentEndpoints.GET_ALL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getById(id: number): Promise<APIResponse> {
    return this.request.get(CommentEndpoints.getById(id));
  }

  async update(id: number, payload: CommentUpdateRequest, token: string): Promise<APIResponse> {
    return this.request.put(CommentEndpoints.updateComment(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getByFilmId(filmId: number): Promise<APIResponse> {
    return this.request.get(CommentEndpoints.getByFilmId(filmId));
  }

  async getBySeriesId(seriesId: number): Promise<APIResponse> {
    return this.request.get(CommentEndpoints.getBySeriesId(seriesId));
  }

  async getByUserId(userId: number): Promise<APIResponse> {
    return this.request.get(CommentEndpoints.getByUserId(userId));
  }

  async delete(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(CommentEndpoints.deleteComment(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
