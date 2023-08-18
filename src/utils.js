import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const __dirname = new URL('.', import.meta.url).pathname

export function saveResult({ result, searchName }) {
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
