export interface EnvConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  superAdminEmail?: string;
  superAdminPassword?: string;
  superAdminName: string;
}
