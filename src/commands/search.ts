import { getSession, closeDriver } from '../connection.js';
import { generateEmbedding } from '../lib/embeddings.js';
import { formatAsTable } from '../lib/format.js';

interface SearchOptions {
  limit?: number;
  label?: string;
}

export async function searchGraph(query: string, options: SearchOptions): Promise<void> {
  const session = getSession();
  const limit = options.limit || 10;

  try {
    console.log(`Searching for: "${query}"\n`);

    // Try vector search first
    try {
      const embedding = await generateEmbedding(query);
      console.log('Using vector similarity search...\n');

      const cypher = `
        CALL db.index.vector.queryNodes('neo_embeddings', ${limit}, $embedding)
        YIELD node, score
        RETURN node.name as name, node.label as label, node.file as file, score
        ORDER BY score DESC
        LIMIT $limit
      `;

      const result = await session.run(cypher, {
        embedding,
        limit,
      });

      if (result.records.length === 0) {
        console.log('(no results)');
      } else {
        console.log(formatAsTable(result));
      }
    } catch (vectorError) {
      // Fall back to keyword search
      console.log('Vector search unavailable, using keyword search...\n');

      let cypher = `
        MATCH (n)
        WHERE n.name CONTAINS $query
        RETURN n.name as name, n.label as label, n.file as file, 1.0 as score
      `;

      if (options.label) {
        cypher += ` AND n.label = $label`;
      }

      cypher += ` LIMIT $limit`;

      const result = await session.run(cypher, {
        query,
        label: options.label,
        limit,
      });

      if (result.records.length === 0) {
        console.log('(no results)');
      } else {
        console.log(formatAsTable(result));
      }
    }
  } finally {
    await session.close();
    await closeDriver();
  }
}
