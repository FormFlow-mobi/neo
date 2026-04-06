import neo4j, { type Driver, type Session } from 'neo4j-driver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

dotenv.config();

interface ConnectionConfig {
  uri?: string;
  user?: string;
  password?: string;
}

let driver: Driver | null = null;

function loadConfigFromFile(): ConnectionConfig {
  const configPath = path.join(os.homedir(), '.neo', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveConfigToFile(config: ConnectionConfig): void {
  const configDir = path.join(os.homedir(), '.neo');
  const configPath = path.join(configDir, 'config.json');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function getConnectionConfig(overrides?: Partial<ConnectionConfig>): ConnectionConfig {
  const fileConfig = loadConfigFromFile();

  const config: ConnectionConfig = {
    uri: overrides?.uri || process.env.NEO4J_URI || fileConfig.uri || 'neo4j://localhost:7687',
    user: overrides?.user || process.env.NEO4J_USER || fileConfig.user || 'neo4j',
    password: overrides?.password || process.env.NEO4J_PASSWORD || fileConfig.password || '',
  };

  return config;
}

export function saveConnectionConfig(config: ConnectionConfig): void {
  saveConfigToFile(config);
}

export function getDriver(overrides?: Partial<ConnectionConfig>): Driver {
  if (driver) {
    return driver;
  }

  const config = getConnectionConfig(overrides);

  if (!config.uri || !config.user || !config.password) {
    throw new Error(
      'Neo4j connection requires NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD.\n' +
      'Set them via environment variables, ~/.neo/config.json, or CLI flags.'
    );
  }

  driver = neo4j.driver(
    config.uri,
    neo4j.auth.basic(config.user, config.password)
  );

  return driver;
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function testConnection(overrides?: Partial<ConnectionConfig>): Promise<string> {
  const d = getDriver(overrides);
  const session = d.session();

  try {
    const result = await session.run('RETURN 1 as ping');
    return '✓ Connected to Neo4j!';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`✗ Connection failed: ${msg}`);
  } finally {
    await session.close();
  }
}

export function getSession(): Session {
  return getDriver().session();
}
