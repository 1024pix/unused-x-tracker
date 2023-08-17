import { basename } from 'node:path'
import simpleGit from 'simple-git'
import { searchFunctionsNotUsedInDirectory } from '../src/search-functions-not-used-in-directory.js'

function computeCallNameToCamelCase({ filePath, prefix, suffix }) {
  const fileName = basename(filePath, '.js')
  let fileNameToCamelCase = fileName.replace(/-([a-z])/g, g => g[1].toUpperCase())
  if (!fileNameToCamelCase.endsWith(suffix))
    fileNameToCamelCase += suffix

  if (prefix)
    fileNameToCamelCase = `${prefix}.${fileNameToCamelCase}`

  return fileNameToCamelCase
}

export async function main() {
  const repository = 'https://github.com/1024pix/pix'

  const searches = [
    {
      repository,
      searchFolderPath: './api/lib/',
      functionsFolderPath: './api/lib/infrastructure/repositories',
      searchName: 'unused-repositories-functions-in-lib',
      computeCallNames: ({ filePath }) => {
        return [computeCallNameToCamelCase({ filePath, suffix: 'Repository' })]
      },
    },
    {
      repository,
      searchFolderPath: './api/lib/application',
      functionsFolderPath: './api/lib/domain/usecases',
      searchName: 'unused-usecases',
      computeCallNames: () => {
        return ['usecases', 'dependencies.usecases']
      },
    },
    {
      repository,
      searchFolderPath: './api/lib/domain',
      functionsFolderPath: './api/lib/domain/services',
      searchName: 'unused-services',
      computeCallNames: ({ filePath }) => {
        return [computeCallNameToCamelCase({ filePath, suffix: 'Service' })]
      },
    },
    {
      repository,
      searchFolderPath: './api/lib/application',
      functionsFolderPath: './api/lib/infrastructure/serializers/jsonapi',
      searchName: 'unused-serializers',
      computeCallNames: ({ filePath }) => {
        return [
          computeCallNameToCamelCase({ filePath, suffix: 'Serializer' }),
          computeCallNameToCamelCase({ filePath, prefix: 'dependencies', suffix: 'Serializer' }),
        ]
      },
    },
  ]

  for (const search of searches)
    await searchFunctionsNotUsedInDirectory(search)

  await commitChange(simpleGit())
}

export async function commitChange(simpleGit) {
  await simpleGit.addConfig('user.name', 'Dependency drift tracker')
  await simpleGit.addConfig('user.email', 'dependency-drift-tracker@users.noreply.github.com')
  await simpleGit.add('data')
  await simpleGit.commit('Update data')
}
