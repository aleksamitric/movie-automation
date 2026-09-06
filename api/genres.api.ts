import { APIRequestContext, APIResponse } from '@playwright/test';
import { GenreEndpoints } from '../constants/api.constants';

export class GenresApi {
  constructor(private readonly request: APIRequestContext) {}

  async getAll(token?: string): Promise<APIResponse> {
    return this.request.get(GenreEndpoints.GET_ALL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
