import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, sep } from 'node:path'
import process from 'node:process'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import simpleGit from 'simple-git'

const traverse = _traverse.default
const __dirname = new URL('.', import.meta.url).pathname

export async function searchFunctionsNotUsedInDirectory({ repository, searchFolderPath, functionsFolderPath, computeCallNames, searchName }) {
  const clonedRepositoryPath = await cloneRepository(repository, simpleGit(), process.env)
  const functionsFolderPathInClonedRepository = join(clonedRepositoryPath, functionsFolderPath)
  const searchFolderPathInClonedRepository = join(clonedRepositoryPath, searchFolderPath)

  const exportedFunctions = getAllExportedFunctionsInDirectory(functionsFolderPathInClonedRepository)
  const result = []
  exportedFunctions.forEach(({ filePath, functionName }) => {
    const callNames = computeCallNames({ filePath })
    const isCalled = isCalledInDirectory(searchFolderPathInClonedRepository, { callNames, functionName })
    if (!isCalled) {
      const currentFile = result.find(r => JSON.stringify(r.callNames) === JSON.stringify(callNames))
      if (currentFile)
        currentFile.functions.push(functionName)
      else
        result.push({ callNames, functions: [functionName] })
    }
  })

  saveResult({ result, searchName })
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

export function getExportedFunctionsInFile(filePath) {
  const code = readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  const exportedFunctions = []
  traverse(ast, {
    ExportNamedDeclaration(nodePath) {
      const node = nodePath.node
      if (node.specifiers.length !== 0) {
        for (const specifier of node.specifiers) {
          if (isFunction(ast, specifier.exported.name))
            exportedFunctions.push({ filePath, functionName: specifier.exported.name })
        }
      }
      if (node.declaration && node.declaration.type === 'FunctionDeclaration') {
        const functionName = node.declaration.id.name
        exportedFunctions.push({ filePath, functionName })
      }
    },
  })

  return exportedFunctions
}

function isFunction(ast, identifierName) {
  let isFunction = false
  traverse(ast, {
    FunctionDeclaration(nodePath) {
      const node = nodePath.node
      if (node.id.name === identifierName)
        isFunction = true
    },
  })
  traverse(ast, {
    VariableDeclarator(nodePath) {
      const node = nodePath.node
      if (node.id.name === identifierName
        && (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression'))
        isFunction = true
    },
  })
  return isFunction
}

function isCalledInDirectory(dirPath, { callNames, functionName }) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.some(filePath => isCalledInFile(filePath, { callNames, functionName }))
}

export function isCalledInFile(filePath, { callNames, functionName }) {
  const code = readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  let functionCalled = false
  traverse(ast, {
    CallExpression(nodePath) {
      const callee = nodePath.node.callee

      if (callee.type === 'MemberExpression' && callee.property.name === functionName) {
        let nodeCallName = callee.object.name
        const isNestedCall = Boolean(callee.object.object)
        if (isNestedCall)
          nodeCallName = `${callee.object.object.name}.${callee.object.property.name}`

        if (callNames.includes(nodeCallName))
          functionCalled = true
      }
    },
  })

  return functionCalled
}

function saveResult({ result, searchName }) {
  const searchFolderPath = join(__dirname, '../data', searchName)

  if (!existsSync(searchFolderPath))
    mkdirSync(searchFolderPath)

  const fileName = 'last-run.json'
  const filePath = join(searchFolderPath, fileName)
  writeFileSync(filePath, JSON.stringify(result))

  const historyFileName = 'history.json'
  const historyFilePath = join(searchFolderPath, historyFileName)
  const history = existsSync(historyFilePath) ? JSON.parse(readFileSync(historyFilePath, 'utf-8')) : []
  const notUsedFunctions = result.flatMap(r => r.functions).length
  writeFileSync(historyFilePath, JSON.stringify([...history, { date: new Date(), notUsedFunctions }]))
}
