import { Project, SyntaxKind, Node as MorphNode } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  file?: string;
  line?: number;
  summary?: string;
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, unknown>;
}

export interface ParsedGraph {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export async function parseCodebase(rootPath: string, language: 'ts' | 'js' = 'ts'): Promise<ParsedGraph> {
  const nodes: GraphNode[] = [];
  const relationships: GraphRelationship[] = [];

  const extensions = language === 'ts' ? ['ts', 'tsx', 'js', 'jsx'] : ['js', 'jsx'];
  const pattern = `${rootPath}/**/*.{${extensions.join(',')}}`;
  const files = await glob(pattern, { ignore: '**/node_modules/**' });

  const project = new Project();

  for (const filePath of files) {
    const sourceFile = project.addSourceFileAtPath(filePath);
    const relativeFile = path.relative(rootPath, filePath);

    const fileNodeId = `file_${relativeFile.replace(/[^a-z0-9]/gi, '_')}`;
    nodes.push({
      id: fileNodeId,
      label: 'File',
      name: relativeFile,
      file: relativeFile,
      summary: `Source file: ${relativeFile}`,
      properties: {
        path: relativeFile,
        language,
      },
    });

    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.ClassDeclaration) {
        const classDecl = node.asKind(SyntaxKind.ClassDeclaration)!;
        const className = classDecl.getName() || 'AnonymousClass';
        const classNodeId = `class_${relativeFile}_${className}`;

        nodes.push({
          id: classNodeId,
          label: 'Class',
          name: className,
          file: relativeFile,
          line: classDecl.getStartLineNumber(),
          summary: `Class ${className} in ${relativeFile}`,
          properties: {
            path: relativeFile,
          },
        });

        relationships.push({
          from: fileNodeId,
          to: classNodeId,
          type: 'CONTAINS',
        });

        // Parse methods
        classDecl.getMethods().forEach((method) => {
          const methodName = method.getName() || 'anonymous';
          const methodNodeId = `method_${relativeFile}_${className}_${methodName}`;

          nodes.push({
            id: methodNodeId,
            label: 'Function',
            name: methodName,
            file: relativeFile,
            line: method.getStartLineNumber(),
            summary: `Method ${methodName} in class ${className}`,
            properties: {
              path: relativeFile,
              isMethod: true,
              class: className,
            },
          });

          relationships.push({
            from: classNodeId,
            to: methodNodeId,
            type: 'CONTAINS',
          });
        });
      }

      if (node.getKind() === SyntaxKind.FunctionDeclaration) {
        const funcDecl = node.asKind(SyntaxKind.FunctionDeclaration)!;
        const funcName = funcDecl.getName() || 'anonymous';
        const funcNodeId = `func_${relativeFile}_${funcName}`;

        nodes.push({
          id: funcNodeId,
          label: 'Function',
          name: funcName,
          file: relativeFile,
          line: funcDecl.getStartLineNumber(),
          summary: `Function ${funcName} in ${relativeFile}`,
          properties: {
            path: relativeFile,
            isMethod: false,
          },
        });

        relationships.push({
          from: fileNodeId,
          to: funcNodeId,
          type: 'CONTAINS',
        });
      }
    });

    // Parse imports
    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const importPath = importDecl.getModuleSpecifierValue();
      const importedNames = importDecl
        .getNamedImports()
        .map((ni) => ni.getName())
        .join(', ') || importDecl.getDefaultImport()?.getText() || 'default';

      const importNodeId = `import_${relativeFile}_${importPath}`;

      relationships.push({
        from: fileNodeId,
        to: importNodeId,
        type: 'IMPORTS',
        properties: {
          module: importPath,
          names: importedNames,
        },
      });
    });
  }

  return { nodes, relationships };
}

export function deduplicateNodes(nodes: GraphNode[]): GraphNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) {
      return false;
    }
    seen.add(node.id);
    return true;
  });
}
