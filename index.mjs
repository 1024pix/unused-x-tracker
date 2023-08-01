import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

function getAllExportedFunctions(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  let exportedFunctions = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && path.extname(filePath) === '.js') {
      exportedFunctions.push(...getExportedFunctions(filePath));
    }
  }

  return exportedFunctions;
}

function getExportedFunctions(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(code, {
    sourceType: 'module',
  });

  const fileName = path.basename(filePath, '.js');
  let fileNameToCamelCase = fileName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  if (!fileNameToCamelCase.endsWith('Repository')) {
    fileNameToCamelCase += 'Repository';
  }

  const exportedFunctions = [];
  traverse(ast, {
    ExportNamedDeclaration(nodePath) {
      if (nodePath.node.specifiers) {
        for (const specifier of nodePath.node.specifiers) {
          exportedFunctions.push({ fileName: fileNameToCamelCase, functionName: specifier.exported.name });
        }
      }
    },
  });

  return exportedFunctions;
}

  const files = fs.readdirSync(dirPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory() || path.extname(filePath) !== '.js') {
      continue;
    }
    const functionCalled = searchFileForFunctionCalls(filePath, { functionName, fileName });

    if (functionCalled) {
      return true;
    }
  }

  return false;
}

function searchFileForFunctionCalls(filePath, { fileName, functionName }) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  });

  let functionCalled = false;
  traverse(ast, {
    CallExpression(nodePath) {
      const node = nodePath.node;
      if (
        node.callee.type === 'MemberExpression' &&
        node.callee.object.name === fileName &&
        node.callee.property.name === functionName
      ) {
        functionCalled = true;
      }
    },
  });

  return functionCalled;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Il faut 2 arguments: le chemin vers le dossier des fonctions et le chemin vers le dossier de recherche.');
    process.exit(1);
  }

  const functionsFolderPath = path.resolve(args[0]);
  const searchFolderPath = path.resolve(args[1]);
  const exportedFunctions = getAllExportedFunctions(functionsFolderPath);
  let n = 0;
  exportedFunctions.forEach(({ fileName, functionName }) => {
    const result = searchFunctionCallInDirectory(searchFolderPath, { fileName, functionName });
    if (!result) {
      n++;
      console.log(`La fonction ${functionName} du fichier ${fileName} n'est pas utilisée.`);
    }
  });
  console.log(`${n} fonctions non utilisées.`);
}

main();