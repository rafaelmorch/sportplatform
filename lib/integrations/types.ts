/**
 * PLATFORM SPORTS
 * Arquivo: lib/integrations/types.ts
 * Criado em: 2026-08-21 16:22 ET
 * Última alteração: 2026-08-21 16:22 ET
 *
 * Função:
 * Definir tipos genéricos para integrações de atividades e saúde.
 * Permite adicionar novos providers sem reestruturar a aplicação.
 *
 * Backup anterior:
 * N/A - arquivo criado nesta data.
 */

export type IntegrationProviderId =
  | "strava"
  | "garmin"
  | "health_connect"
  | "apple_health"
  | "fitbit"
  | "whoop"
  | "oura";

export type IntegrationConnectionType =
  | "oauth"
  | "native_health";

export type IntegrationCategory =
  | "activity"
  | "health"
  | "activity_and_health";

export type IntegrationPlatform =
  | "web"
  | "ios"
  | "android";

export type IntegrationProvider = {
  id: IntegrationProviderId;
  name: string;
  connectionType: IntegrationConnectionType;
  category: IntegrationCategory;
  platforms: IntegrationPlatform[];
  enabled: boolean;
};

export type ActivityDataSource = {
  provider: IntegrationProviderId;
  sourceId?: string | null;
  sourceName?: string | null;
  deviceName?: string | null;
};
