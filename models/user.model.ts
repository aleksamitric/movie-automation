export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserAdminResponse {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  isAdmin: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface PrivacySettings {
  commentsVisibility: string;
  watchlistVisibility: string;
  ratingsVisibility: string;
  hideEmail: boolean;
  personalisedRecs: boolean;
}
