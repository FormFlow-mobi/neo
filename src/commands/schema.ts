import { getSession, closeDriver } from '../connection.js';

interface SchemaOptions {
  labels?: boolean;
  rels?: boolean;
  indexes?: boolean;
}

export async function showSchema(options: SchemaOptions): Promise<void> {
  const session = getSession();
  const showAll = !options.labels && !options.rels && !options.indexes;

  try {
    if (showAll || options.labels) {
      console.log('\n=== Node Labels ===');
      const labelsResult = await session.run('CALL db.labels()');
      const labels = labelsResult.records.map((r) => r.get(0));
      console.log(labels.length > 0 ? labels.join(', ') : '(none)');
    }

    if (showAll || options.rels) {
      console.log('\n=== Relationship Types ===');
      const relsResult = await session.run('CALL db.relationshipTypes()');
      const rels = relsResult.records.map((r) => r.get(0));
      console.log(rels.length > 0 ? rels.join(', ') : '(none)');
    }

    if (showAll || options.indexes) {
      console.log('\n=== Indexes ===');
      try {
        const indexesResult = await session.run('SHOW INDEXES');
        const indexes = indexesResult.records.map(
          (r) => `${r.get('name')}: ${r.get('labelsOrTypes')} [${r.get('state')}]`
        );
        console.log(indexes.length > 0 ? indexes.join('\n') : '(none)');
      } catch {
        console.log('(could not query indexes)');
      }
    }
  } finally {
    await session.close();
    await closeDriver();
  }
}
