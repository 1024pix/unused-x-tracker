import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;

function getAllExportedFunctionsInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  let exportedFunctions = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && path.extname(filePath) === '.js') {
      exportedFunctions.push(...getExportedFunctionsInFile(filePath));
    }
  }

  return exportedFunctions;
}

function getExportedFunctionsInFile(filePath) {
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

function isCalledInDirectory(dirPath, { functionName, fileName }) {
  const files = fs.readdirSync(dirPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory() || path.extname(filePath) !== '.js') {
      continue;
    }
    if (isCalledInFile(filePath, { functionName, fileName })) {
      return true;
    }
  }

  return false;
}

function isCalledInFile(filePath, { fileName, functionName }) {
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
  const exportedFunctions = getAllExportedFunctionsInDirectory(functionsFolderPath);
  const results = new Map();
  let n = 0;
  exportedFunctions.forEach(({ fileName, functionName }) => {
    const isCalled = isCalledInDirectory(searchFolderPath, { fileName, functionName });
    if (!isCalled) {
      n++;
      if (!results.has(fileName)) {
        results.set(fileName, [functionName]);
      } else {
        results.get(fileName).push(functionName);
      }
    }
  });
  console.log(`Il y a ${n} fonctions non utilisées dans le dossier ${searchFolderPath}:`)
  // console.table(results);
}

main();