import { APIRequestContext, APIResponse } from '@playwright/test';
import { DebateEndpoints } from '../constants/api.constants';
import { DebatePostCreateRequest } from '../models/debate.model';

export class DebatesApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(payload: DebatePostCreateRequest, userId: number, token?: string): Promise<APIResponse> {
    return this.request.post(DebateEndpoints.CREATE, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params: { userId },
      data: payload,
    });
  }

  async getAll(params?: { sort?: string; filmId?: number; seriesId?: number; userId?: number }): Promise<APIResponse> {
    return this.request.get(DebateEndpoints.GET_ALL, { params });
  }

  async getById(id: number, userId?: number): Promise<APIResponse> {
    return this.request.get(DebateEndpoints.getById(id), {
      params: userId !== undefined ? { userId } : undefined,
    });
  }

  async getByFilmId(filmId: number, userId?: number): Promise<APIResponse> {
    return this.request.get(DebateEndpoints.getByFilmId(filmId), {
      params: userId !== undefined ? { userId } : undefined,
    });
  }

  async getBySeriesId(seriesId: number, userId?: number): Promise<APIResponse> {
    return this.request.get(DebateEndpoints.getBySeriesId(seriesId), {
      params: userId !== undefined ? { userId } : undefined,
    });
    
  }

  async delete(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(DebateEndpoints.deleteDebate(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async toggleLike(postId: number, userId: number, token: string): Promise<APIResponse> {
    return this.request.post(DebateEndpoints.like(postId), {
      headers: { Authorization: `Bearer ${token}` },
      params: { userId },
    });
  }

  async incrementView(id: number): Promise<APIResponse> {
    return this.request.put(DebateEndpoints.incrementView(id));
  }
}
