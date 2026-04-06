#!/usr/bin/env node

import { Command } from 'commander';
import { runQuery } from './commands/query.js';
import { showSchema } from './commands/schema.js';
import { ingestCodebase } from './commands/ingest.js';
import { searchGraph } from './commands/search.js';
import { manageConfig } from './commands/config.js';

const program = new Command();

program
  .name('neo')
  .description('Neo4j Knowledge Graph CLI for Claude Code')
  .version('0.1.0');

// query command
program
  .command('query <cypher>')
  .description('Run a Cypher query against Neo4j')
  .option('--format <format>', 'Output format (json|table)', 'table')
  .action(async (cypher: string, options) => {
    try {
      await runQuery(cypher, { format: options.format });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// schema command
program
  .command('schema')
  .description('Show database schema (labels, relationships, indexes)')
  .option('--labels', 'Show only labels')
  .option('--rels', 'Show only relationship types')
  .option('--indexes', 'Show only indexes')
  .action(async (options) => {
    try {
      await showSchema(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// ingest command
program
  .command('ingest <path>')
  .description('Ingest a codebase as a knowledge graph')
  .option('--lang <lang>', 'Programming language (ts|js)', 'ts')
  .option('--clear', 'Clear database before ingestion')
  .action(async (path: string, options) => {
    try {
      await ingestCodebase(path, {
        lang: options.lang,
        clear: options.clear,
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// search command
program
  .command('search <query>')
  .description('Search the knowledge graph')
  .option('--limit <n>', 'Maximum results', '10')
  .option('--label <label>', 'Filter by node label')
  .action(async (query: string, options) => {
    try {
      await searchGraph(query, {
        limit: parseInt(options.limit),
        label: options.label,
      });
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// config command
program
  .command('config')
  .description('Manage Neo4j connection configuration')
  .option('--test', 'Test the connection')
  .option('--uri <uri>', 'Set Neo4j URI')
  .option('--user <user>', 'Set Neo4j user')
  .option('--password <password>', 'Set Neo4j password')
  .action(async (options) => {
    try {
      await manageConfig(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
