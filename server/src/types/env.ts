export interface EnvConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
  superAdminEmail?: string;
  superAdminPassword?: string;
  superAdminName: string;
}
