import { httpClient } from '@/api/httpClient';
import type { HealthCheckResponse } from '@/types/api';

export const healthService = {
  async getStatus(): Promise<HealthCheckResponse> {
    const response = await httpClient.get<HealthCheckResponse>('/health');
    return response.data;
  },
};
