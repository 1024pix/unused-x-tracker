import { basename } from 'node:path'
import { searchFunctionsNotUsedInDirectory } from '../src/search-functions-not-used-in-directory.js'

async function main() {
  const repository = 'https://github.com/1024pix/pix'

  await searchFunctionsNotUsedInDirectory({
    repository,
    searchFolderPath: './api/lib/',
    functionsFolderPath: './api/lib/infrastructure/repositories',
    searchName: 'unused-repositories-functions-in-lib',
    computeCallName: ({ filePath }) => {
      const fileName = basename(filePath, '.js')
      let fileNameToCamelCase = fileName.replace(/-([a-z])/g, g => g[1].toUpperCase())
      if (!fileNameToCamelCase.endsWith('Repository'))
        fileNameToCamelCase += 'Repository'

      return fileNameToCamelCase
    },
  })
}

main()
