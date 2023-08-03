import fs from 'node:fs'
import path from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'

const traverse = _traverse.default
const __dirname = new URL('.', import.meta.url).pathname

export function searchFunctionsNotUsedInDirectory(searchFolderPath, functionsFolderPath) {
  const exportedFunctions = getAllExportedFunctionsInDirectory(functionsFolderPath)
  const result = []
  exportedFunctions.forEach(({ fileName, functionName }) => {
    const isCalled = isCalledInDirectory(searchFolderPath, { fileName, functionName })
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

function getAllExportedFunctionsInDirectory(dirPath) {
  const filePaths = getAllFilePathsInDirectory(dirPath)
  return filePaths.flatMap(filePath => getExportedFunctionsInFile(filePath))
}

function getAllFilePathsInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true })
  return files
    .filter((file) => {
      const filePath = path.join(dirPath, file)
      return fs.statSync(filePath).isFile() && path.extname(filePath) === '.js'
    })
    .map(file => path.join(dirPath, file))
}

function getExportedFunctionsInFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8')
  const ast = parse(code, {
    sourceType: 'module',
  })

  const fileName = path.basename(filePath, '.js')
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
  const code = fs.readFileSync(filePath, 'utf-8')
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
  const fileName = `last-run-${path.basename(searchFolderPath)}-for-${path.basename(functionsFolderPath)}.json`
  const filePath = path.join(__dirname, '../data', fileName)
  fs.writeFileSync(filePath, JSON.stringify(result))

  const historyFileName = `history-${path.basename(searchFolderPath)}-for-${path.basename(functionsFolderPath)}.json`
  const historyFilePath = path.join(__dirname, '../data', historyFileName)
  const history = fs.existsSync(historyFilePath) ? JSON.parse(fs.readFileSync(historyFilePath, 'utf-8')) : []
  const notUsedFunctions = result.flatMap(r => r.functions).length
  fs.writeFileSync(historyFilePath, JSON.stringify([...history, { date: new Date(), notUsedFunctions }]))
}
