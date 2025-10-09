interface ExternalProviderConfig {
  providerName: string;            // e.g. "APIBOSS" or "DIGIFLAZZ"
  apiUrl: string | null;           // endpoint URL or null if using default/httpAgentPost logic
  usernameEnvKey: string;          // env var key for username
  apiKeyEnvKey: string;             // env var key for api key
  successStatuses: (string | number)[];  // values meaning “success”
  pendingStatuses: (string | number)[];  // values meaning “pending”

}
