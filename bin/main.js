import process from 'node:process'
import { searchFunctionsNotUsedInDirectory } from '../src/search-functions-not-used-in-directory.js'

async function main() {
  const args = process.argv.slice(2)

  if (args.length !== 4) {
    console.error('Il faut 4 arguments: le repository, le chemin vers le dossier des fonctions, le chemin vers le dossier de recherche, et le nom de la recherche')
    process.exit(1)
  }

  const repository = args[0]
  const functionsFolderPath = args[1]
  const searchFolderPath = args[2]
  const searchName = args[3]

  await searchFunctionsNotUsedInDirectory({ repository, searchFolderPath, functionsFolderPath, searchName })
}

main()
