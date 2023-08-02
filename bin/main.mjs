import { searchFunctionsNotUsedInDirectory } from '../src/search-functions-not-used-in-directory.mjs';
import path from 'node:path';

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error('Il faut 2 arguments: le chemin vers le dossier des fonctions et le chemin vers le dossier de recherche.');
    process.exit(1);
  }

  const functionsFolderPath = path.resolve(args[0]);
  const searchFolderPath = path.resolve(args[1]);

  searchFunctionsNotUsedInDirectory(searchFolderPath, functionsFolderPath);
}

main();