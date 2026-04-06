import { getSession, closeDriver } from '../connection.js';
import { formatAsTable, formatAsJson } from '../lib/format.js';

export async function runQuery(cypher: string, options: { format?: 'json' | 'table' }): Promise<void> {
  const session = getSession();

  try {
    const result = await session.run(cypher);

    const output = options.format === 'json' ? formatAsJson(result) : formatAsTable(result);
    console.log(output);
  } finally {
    await session.close();
    await closeDriver();
  }
}
