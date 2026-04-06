import { testConnection, getConnectionConfig, saveConnectionConfig } from '../connection.js';

interface ConfigOptions {
  test?: boolean;
  uri?: string;
  user?: string;
  password?: string;
}

export async function manageConfig(options: ConfigOptions): Promise<void> {
  if (options.test) {
    try {
      const message = await testConnection();
      console.log(message);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }

  if (options.uri || options.user || options.password) {
    const config = getConnectionConfig();
    if (options.uri) config.uri = options.uri;
    if (options.user) config.user = options.user;
    if (options.password) config.password = options.password;

    saveConnectionConfig(config);
    console.log('✓ Configuration saved to ~/.neo/config.json');
    return;
  }

  // Display current config
  const config = getConnectionConfig();
  console.log('Current Neo4j Configuration:');
  console.log(`  URI: ${config.uri}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(not set)'}`);
}
