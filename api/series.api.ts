import { APIRequestContext, APIResponse } from '@playwright/test';
import { SeriesEndpoints } from '../constants/api.constants';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../models/series.model';

export class SeriesApi {
  constructor(private readonly request: APIRequestContext) {}

  async create(payload: SeriesCreateRequest, token: string): Promise<APIResponse> {
    return this.request.post(SeriesEndpoints.CREATE, {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async update(id: number, payload: SeriesUpdateRequest, token: string): Promise<APIResponse> {
    return this.request.put(SeriesEndpoints.updateSeries(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getAll(token: string): Promise<APIResponse> {
    return this.request.get(SeriesEndpoints.GET_ALL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getGroupedByGenre(): Promise<APIResponse> {
    return this.request.get(SeriesEndpoints.GROUPED_BY_GENRE);
  }

  async getById(id: number): Promise<APIResponse> {
    return this.request.get(SeriesEndpoints.getById(id));
  }

  async getTrending(): Promise<APIResponse> {
    return this.request.get(SeriesEndpoints.TRENDING);
  }

  async getOrderedByTimeAdded(count?: number): Promise<APIResponse> {
    return this.request.get(SeriesEndpoints.ORDERED_BY_TIME_ADDED, {
      params: count !== undefined ? { count } : undefined,
    });
  }

  async delete(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(SeriesEndpoints.deleteSeries(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
