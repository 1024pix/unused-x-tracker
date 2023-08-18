import { readFileSync } from 'node:fs'
import process from 'node:process'
import { join } from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import simpleGit from 'simple-git'
import { cloneRepository, getAllFilePathsInDirectory, saveResult } from './utils.js'

const traverse = _traverse.default

export async function searchClassesNotUsedInDirectory({ repository, searchFolderPath, ignoreFiles, classesFolderPath, searchName }) {
  const clonedRepositoryPath = await cloneRepository(repository, simpleGit(), process.env)

  const classesFolderPathInClonedRepository = join(clonedRepositoryPath, classesFolderPath)
  const searchFolderPathInClonedRepository = join(clonedRepositoryPath, searchFolderPath)

  const exportedClasses = getAllExportedClassesInDirectory(classesFolderPathInClonedRepository)
  const searchFiles = getAllFilePathsInDirectory(searchFolderPathInClonedRepository, ignoreFiles)

  for (const searchFile of searchFiles)
    checkIfClassesAreCalledInFile({ searchFile, exportedClasses })

  const result = exportedClasses.filter(({ isCalled }) => !isCalled).reduce((result, notCalledClass) => {
    const { className } = notCalledClass
    const existingResult = result.find(r => r.class === className)
    if (existingResult)
      existingResult.push(className)
    else
      result.push({ class: className })
    return result
  }, [])

  saveResult({ result, searchName })
}

function getAllExportedClassesInDirectory(dirPath) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.flatMap(filePath => getExportedClassesInFile(filePath))
}

export function getExportedClassesInFile(filePath) {
  const code = readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  const exportedClasses = []
  traverse(ast, {
    ExportNamedDeclaration(nodePath) {
      const node = nodePath.node

      if (node.specifiers.length !== 0) {
        for (const specifier of node.specifiers) {
          if (isClass(ast, specifier.exported.name))
            exportedClasses.push({ filePath, className: specifier.exported.name })
        }
      }
      if (node.declaration && node.declaration.type === 'ClassDeclaration') {
        const className = node.declaration.id.name
        exportedClasses.push({ filePath, className })
      }
    },
  })

  return exportedClasses
}

function isClass(ast, identifierName) {
  let isClass = false
  traverse(ast, {
    ClassDeclaration(nodePath) {
      const node = nodePath.node
      if (node.id.name === identifierName)
        isClass = true
    },
  })
  return isClass
}

export function checkIfClassesAreCalledInFile({ searchFile, exportedClasses }) {
  const code = readFileSync(searchFile, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['importAssertions'],
  })

  traverse(ast, {
    NewExpression(nodePath) {
      const callee = nodePath.node.callee

      exportedClasses
        .filter(({ className }) => className === callee.name)
        .forEach(c => c.isCalled = true)
    },
  })
}
