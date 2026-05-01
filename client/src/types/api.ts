export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
}
