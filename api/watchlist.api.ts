import { APIRequestContext, APIResponse } from '@playwright/test';
import { WatchlistEndpoints } from '../constants/api.constants';
import { WatchlistAddRequest, WatchlistMarkWatchedRequest } from '../models/watchlist.model';

export class WatchlistApi {
  constructor(private readonly request: APIRequestContext) {}

  async add(payload: WatchlistAddRequest, token?: string): Promise<APIResponse> {
    return this.request.post(WatchlistEndpoints.ADD, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: payload,
    });
  }

  async getByUserId(userId: number, token: string): Promise<APIResponse> {
    return this.request.get(WatchlistEndpoints.getByUserId(userId), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async remove(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(WatchlistEndpoints.remove(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async markWatched(id: number, payload: WatchlistMarkWatchedRequest, token: string): Promise<APIResponse> {
    return this.request.put(WatchlistEndpoints.markWatched(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }
}
