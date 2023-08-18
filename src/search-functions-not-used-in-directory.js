import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import simpleGit from 'simple-git'
import { cloneRepository, getAllFilePathsInDirectory, saveResult } from './utils.js'

const traverse = _traverse.default

export async function searchFunctionsNotUsedInDirectory({ repository, searchFolderPath, ignoreFiles, functionsFolderPath, computeCallNames, searchName }) {
  const clonedRepositoryPath = await cloneRepository(repository, simpleGit(), process.env)
  const functionsFolderPathInClonedRepository = join(clonedRepositoryPath, functionsFolderPath)
  const searchFolderPathInClonedRepository = join(clonedRepositoryPath, searchFolderPath)

  let exportedFunctions = getAllExportedFunctionsInDirectory(functionsFolderPathInClonedRepository)
  exportedFunctions = exportedFunctions.map(({ filePath, functionName }) => {
    const callNames = computeCallNames({ filePath })
    return { filePath, functionName, callNames }
  })

  const searchFiles = getAllFilePathsInDirectory(searchFolderPathInClonedRepository, ignoreFiles)
  for (const searchFile of searchFiles)
    checkIfFunctionsAreCalledInFile({ searchFile, exportedFunctions })

  const result = exportedFunctions.filter(({ isCalled }) => !isCalled).reduce((result, notCalledFunction) => {
    const { callNames, functionName } = notCalledFunction
    const existingResult = result.find(r => JSON.stringify(r.callNames) === JSON.stringify(callNames))
    if (existingResult)
      existingResult.functions.push(functionName)
    else
      result.push({ callNames, functions: [functionName] })
    return result
  }, [])

  saveResult({ result, searchName })
}

function getAllExportedFunctionsInDirectory(dirPath) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.flatMap(filePath => getExportedFunctionsInFile(filePath))
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

export function checkIfFunctionsAreCalledInFile({ searchFile, exportedFunctions }) {
  const code = readFileSync(searchFile, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  traverse(ast, {
    CallExpression(nodePath) {
      const callee = nodePath.node.callee
      if (callee.type === 'MemberExpression') {
        let nodeCallName = callee.object.name
        const isNestedCall = Boolean(callee.object.object)
        if (isNestedCall)
          nodeCallName = `${callee.object.object.name}.${callee.object.property.name}`

        exportedFunctions
          .filter(({ callNames, functionName }) => functionName === callee.property.name && callNames.includes(nodeCallName))
          .forEach(functions => functions.isCalled = true)
      }
    },
  })
}
