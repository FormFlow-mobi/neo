import * as path from 'path';
import { getSession, closeDriver } from '../connection.js';
import { parseCodebase, deduplicateNodes } from '../lib/parser.js';
import { generateEmbeddings } from '../lib/embeddings.js';

interface IngestOptions {
  lang?: 'ts' | 'js';
  clear?: boolean;
}

export async function ingestCodebase(codePath: string, options: IngestOptions): Promise<void> {
  const session = getSession();

  try {
    // Resolve the path
    const fullPath = path.resolve(codePath);
    console.log(`Parsing codebase at ${fullPath}...`);

    // Clear database if requested
    if (options.clear) {
      console.log('Clearing database...');
      await session.run('MATCH (n) DETACH DELETE n');
    }

    // Parse the codebase
    const { nodes, relationships } = await parseCodebase(fullPath, options.lang || 'ts');
    const deduped = deduplicateNodes(nodes);

    console.log(`Found ${deduped.length} nodes and ${relationships.length} relationships.`);

    // Generate embeddings for nodes with summaries
    const nodesToEmbed = deduped.filter((n) => n.summary);
    if (nodesToEmbed.length > 0) {
      console.log(`Generating embeddings for ${nodesToEmbed.length} nodes...`);
      const summaries = nodesToEmbed.map((n) => n.summary!);
      const embeddings = await generateEmbeddings(summaries);

      for (let i = 0; i < nodesToEmbed.length; i++) {
        nodesToEmbed[i].properties.embedding = embeddings[i];
      }
    }

    // Batch insert nodes
    console.log('Inserting nodes...');
    const batchSize = 100;
    for (let i = 0; i < deduped.length; i += batchSize) {
      const batch = deduped.slice(i, i + batchSize);
      const query = `
        UNWIND $nodes as node
        MERGE (n {id: node.id})
        SET n += {label: node.label, name: node.name} + node.properties
      `;
      await session.run(query, { nodes: batch });
    }

    // Batch insert relationships
    console.log('Inserting relationships...');
    for (let i = 0; i < relationships.length; i += batchSize) {
      const batch = relationships.slice(i, i + batchSize);
      const query = `
        UNWIND $rels as rel
        MATCH (from {id: rel.from})
        MATCH (to {id: rel.to})
        MERGE (from)-[r:${relationships[0]?.type || 'RELATED'}]->(to)
        SET r += rel.properties
      `;
      // Note: This is a simplified approach; for production, consider dynamic relationship types
      for (const rel of batch) {
        await session.run(
          `
          MATCH (from {id: $fromId})
          MATCH (to {id: $toId})
          MERGE (from)-[r:${rel.type}]->(to)
          SET r += $props
        `,
          {
            fromId: rel.from,
            toId: rel.to,
            props: rel.properties || {},
          }
        );
      }
    }

    console.log('✓ Ingestion complete!');
  } finally {
    await session.close();
    await closeDriver();
  }
}
