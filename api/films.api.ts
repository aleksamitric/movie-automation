import { APIRequestContext, APIResponse } from '@playwright/test';
import { FilmEndpoints } from '../constants/api.constants';
import { FilmCreateRequest, FilmUpdateRequest } from '../models/film.model';

export class FilmsApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(payload: FilmCreateRequest, token: string): Promise<APIResponse> {
    return this.postCreateFilm(payload, token);
  }

  async createWithPayload(payload: Partial<FilmCreateRequest>, token: string): Promise<APIResponse> {
    return this.postCreateFilm(payload, token);
  }

  async update(id: number, payload: FilmUpdateRequest, token: string): Promise<APIResponse> {
    return this.request.put(FilmEndpoints.updateFilm(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getAll(token: string): Promise<APIResponse> {
    return this.request.get(FilmEndpoints.GET_ALL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getGroupedByGenre(): Promise<APIResponse> {
    return this.request.get(FilmEndpoints.GROUPED_BY_GENRE);
  }

  async getById(id: number): Promise<APIResponse> {
    return this.request.get(FilmEndpoints.getById(id));
  }

  async getTrending(): Promise<APIResponse> {
    return this.request.get(FilmEndpoints.TRENDING);
  }

  async getOrderedByTimeAdded(count?: number): Promise<APIResponse> {
    return this.request.get(FilmEndpoints.ORDERED_BY_TIME_ADDED, {
      params: count !== undefined ? { count } : undefined,
    });
  }

  async delete(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(FilmEndpoints.deleteFilm(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  private postCreateFilm(payload: Partial<FilmCreateRequest>, token: string): Promise<APIResponse> {
    return this.request.post(FilmEndpoints.CREATE, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }
}
