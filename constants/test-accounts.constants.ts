import { getRequiredEnvVar } from '../utils/env';

export const ADMIN_TEST_USERNAME = getRequiredEnvVar('ADMIN_TEST_USERNAME');
export const ADMIN_TEST_PASSWORD = getRequiredEnvVar('ADMIN_TEST_PASSWORD');