import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, extname, join, sep } from 'node:path'
import process from 'node:process'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import simpleGit from 'simple-git'

const traverse = _traverse.default
const __dirname = new URL('.', import.meta.url).pathname

export async function searchFunctionsNotUsedInDirectory({ repository, searchFolderPath, functionsFolderPath }) {
  const clonedRepositoryPath = await cloneRepository(repository, simpleGit(), process.env)
  const functionsFolderPathInClonedRepository = join(clonedRepositoryPath, functionsFolderPath)
  const searchFolderPathInClonedRepository = join(clonedRepositoryPath, searchFolderPath)

  const exportedFunctions = getAllExportedFunctionsInDirectory(functionsFolderPathInClonedRepository)
  const result = []
  exportedFunctions.forEach(({ fileName, functionName }) => {
    const isCalled = isCalledInDirectory(searchFolderPathInClonedRepository, { fileName, functionName })
    if (!isCalled) {
      const currentFile = result.find(r => r.fileName === fileName)
      if (currentFile)
        currentFile.functions.push(functionName)
      else
        result.push({ fileName, functions: [functionName] })
    }
  })

  saveResult(result, searchFolderPath, functionsFolderPath)
}

export async function cloneRepository(repository, simpleGit, env) {
  const tempRepositoryPath = await mkdtemp(`${tmpdir()}${sep}`)
  await simpleGit.clone(replaceRepositoryVariablesWithEnvVariables(repository, env), tempRepositoryPath, { '--depth': 1 })
  return tempRepositoryPath
}

export function replaceRepositoryVariablesWithEnvVariables(repository, variables) {
  return Object.keys(variables).reduce((memo, key) => {
    return memo.replaceAll(`$${key}`, variables[key])
  }, repository)
}

function getAllExportedFunctionsInDirectory(dirPath) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.flatMap(filePath => getExportedFunctionsInFile(filePath))
}

function getAllFilePathsInDirectory(dirPath) {
  const files = readdirSync(dirPath, { recursive: true })
  return files
    .filter((file) => {
      const filePath = join(dirPath, file)
      return statSync(filePath).isFile() && extname(filePath) === '.js'
    })
    .map(file => join(dirPath, file))
}

function getExportedFunctionsInFile(filePath) {
  const code = readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
  })

  const fileName = basename(filePath, '.js')
  let fileNameToCamelCase = fileName.replace(/-([a-z])/g, g => g[1].toUpperCase())
  if (!fileNameToCamelCase.endsWith('Repository'))
    fileNameToCamelCase += 'Repository'

  const exportedFunctions = []
  traverse(ast, {
    ExportNamedDeclaration(nodePath) {
      if (nodePath.node.specifiers) {
        for (const specifier of nodePath.node.specifiers)
          exportedFunctions.push({ fileName: fileNameToCamelCase, functionName: specifier.exported.name })
      }
    },
  })

  return exportedFunctions
}

function isCalledInDirectory(dirPath, { functionName, fileName }) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.some(filePath => isCalledInFile(filePath, { functionName, fileName }))
}

function isCalledInFile(filePath, { fileName, functionName }) {
  const code = readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  let functionCalled = false
  traverse(ast, {
    CallExpression(nodePath) {
      const node = nodePath.node
      if (
        node.callee.type === 'MemberExpression'
        && node.callee.object.name === fileName
        && node.callee.property.name === functionName
      )
        functionCalled = true
    },
  })

  return functionCalled
}

function saveResult(result, searchFolderPath, functionsFolderPath) {
  const fileName = `last-run-${basename(searchFolderPath)}-for-${basename(functionsFolderPath)}.json`
  const filePath = join(__dirname, '../data', fileName)
  writeFileSync(filePath, JSON.stringify(result))

  const historyFileName = `history-${basename(searchFolderPath)}-for-${basename(functionsFolderPath)}.json`
  const historyFilePath = join(__dirname, '../data', historyFileName)
  const history = existsSync(historyFilePath) ? JSON.parse(readFileSync(historyFilePath, 'utf-8')) : []
  const notUsedFunctions = result.flatMap(r => r.functions).length
  writeFileSync(historyFilePath, JSON.stringify([...history, { date: new Date(), notUsedFunctions }]))
}
