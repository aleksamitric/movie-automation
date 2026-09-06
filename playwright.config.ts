import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { FE_BASE_URL } from './constants/app.constants';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: FE_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: [
    {
      command: 'npm run dev',
      cwd: '../movie-service-fe',
      url: FE_BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'dotnet run --project movie-service-backend.csproj --launch-profile https',
      cwd: '../movie-service-backend/movie-service-backend/movie-service-backend',
      url: 'http://localhost:5108/swagger/index.html',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
/*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
*/
  ],
});
