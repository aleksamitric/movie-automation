import { APIRequestContext, APIResponse } from '@playwright/test';
import { UserEndpoints } from '../constants/api.constants';
import { ChangePasswordRequest, CreateUserRequest, PrivacySettings, UpdateEmailRequest } from '../models/user.model';

export class UsersApi {
  constructor(private readonly request: APIRequestContext) {}

  async createUser(payload: CreateUserRequest): Promise<APIResponse> {
    return this.postCreateUser(payload);
  }

  async createUserWithPayload(payload: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.postCreateUser(payload);
  }

  async createVerifiedUser(payload: CreateUserRequest): Promise<APIResponse> {
    return this.request.post(UserEndpoints.CREATE_TEST_USER, { data: payload });
  }

  async deleteUser(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(UserEndpoints.deleteUser(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async verifyEmail(token: string): Promise<APIResponse> {
    return this.request.get(UserEndpoints.VERIFY_EMAIL, { params: { token } });
  }

  async getById(id: number, token?: string): Promise<APIResponse> {
    return this.request.get(UserEndpoints.getById(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async getAll(token: string): Promise<APIResponse> {
    return this.request.get(UserEndpoints.GET_ALL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async softDelete(id: number, token: string): Promise<APIResponse> {
    return this.request.put(UserEndpoints.softDelete(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async changePassword(id: number, payload: ChangePasswordRequest, token: string): Promise<APIResponse> {
    return this.request.put(UserEndpoints.changePassword(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async updateEmail(id: number, payload: UpdateEmailRequest, token: string): Promise<APIResponse> {
    return this.request.put(UserEndpoints.updateEmail(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async getPrivacySettings(id: number, token: string): Promise<APIResponse> {
    return this.request.get(UserEndpoints.privacySettings(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePrivacySettings(id: number, payload: PrivacySettings, token: string): Promise<APIResponse> {
    return this.request.put(UserEndpoints.privacySettings(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  private postCreateUser(payload: Partial<CreateUserRequest>): Promise<APIResponse> {
    return this.request.post(UserEndpoints.CREATE_USER, { data: payload });
  }
}
