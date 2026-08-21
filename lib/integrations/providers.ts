/**
 * PLATFORM SPORTS
 * Arquivo: lib/integrations/providers.ts
 * Criado em: 2026-08-21 16:23 ET
 * Última alteração: 2026-08-21 16:23 ET
 *
 * Função:
 * Registro central dos providers de atividades e saúde suportados
 * pela Platform Sports.
 *
 * Novas integrações devem ser cadastradas aqui para evitar
 * lógica espalhada pelas páginas da aplicação.
 *
 * Backup anterior:
 * N/A - arquivo criado nesta data.
 */

import type { IntegrationProvider } from "./types";

export const integrationProviders: IntegrationProvider[] = [
  {
    id: "health_connect",
    name: "Health Connect",
    connectionType: "native_health",
    category: "activity_and_health",
    platforms: ["android"],
    enabled: true,
  },
  {
    id: "apple_health",
    name: "Apple Health",
    connectionType: "native_health",
    category: "activity_and_health",
    platforms: ["ios"],
    enabled: false,
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    connectionType: "oauth",
    category: "activity_and_health",
    platforms: ["web", "ios", "android"],
    enabled: true,
  },
  {
    id: "strava",
    name: "Strava",
    connectionType: "oauth",
    category: "activity",
    platforms: ["web", "ios", "android"],
    enabled: true,
  },
  {
    id: "fitbit",
    name: "Fitbit",
    connectionType: "oauth",
    category: "activity_and_health",
    platforms: ["web", "ios", "android"],
    enabled: false,
  },
  {
    id: "whoop",
    name: "WHOOP",
    connectionType: "oauth",
    category: "activity_and_health",
    platforms: ["web", "ios", "android"],
    enabled: false,
  },
  {
    id: "oura",
    name: "Oura",
    connectionType: "oauth",
    category: "activity_and_health",
    platforms: ["web", "ios", "android"],
    enabled: false,
  },
];

export function getIntegrationProvider(
  id: IntegrationProvider["id"]
) {
  return integrationProviders.find(
    (provider) => provider.id === id
  );
}

export function getEnabledIntegrationProviders() {
  return integrationProviders.filter(
    (provider) => provider.enabled
  );
}
