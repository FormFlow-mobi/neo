import Table from 'cli-table3';
import type { QueryResult } from 'neo4j-driver';

export function formatAsTable(result: QueryResult): string {
  if (result.records.length === 0) {
    return '(no results)';
  }

  const keys = result.records[0].keys;
  const table = new Table({
    head: keys.map((k) => (typeof k === 'string' ? k : String(k))),
    style: { head: [], border: ['grey'] },
  });

  for (const record of result.records) {
    const row: string[] = [];
    for (const key of keys) {
      const value = record.get(key);
      row.push(formatValue(value));
    }
    table.push(row);
  }

  return table.toString();
}

export function formatAsJson(result: QueryResult): string {
  const data = result.records.map((record) => {
    const obj: Record<string, unknown> = {};
    for (const key of record.keys) {
      const keyStr = typeof key === 'string' ? key : String(key);
      obj[keyStr] = record.get(key);
    }
    return obj;
  });

  return JSON.stringify(data, null, 2);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }

  if (typeof value === 'object') {
    const obj = value as Record<PropertyKey, unknown>;
    // Handle Neo4j types like Node, Relationship
    if ('labels' in obj && 'properties' in obj) {
      const labels = obj['labels'];
      return `Node(${Array.isArray(labels) ? labels.join(':') : ''})`;
    }
    if ('type' in obj && 'properties' in obj) {
      const type = obj['type'];
      return `Relationship(${typeof type === 'string' ? type : ''})`;
    }
    return JSON.stringify(value);
  }

  return String(value);
}
