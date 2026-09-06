import { APIRequestContext, APIResponse } from '@playwright/test';
import { AuthEndpoints } from '../constants/api.constants';
import { LoginRequest } from '../models/auth.model';

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async login(payload: LoginRequest): Promise<APIResponse> {
    return this.request.post(AuthEndpoints.LOGIN, { data: payload });
  }
}
