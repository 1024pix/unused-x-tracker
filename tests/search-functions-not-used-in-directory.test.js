import { join } from 'node:path'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import sinon from 'sinon'
import {
  cloneRepository,
  getExportedFunctionsInFile,
  isCalledInFile,
  replaceRepositoryVariablesWithEnvVariables,
} from '../src/search-functions-not-used-in-directory.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('search-functions-not-used-in-directory', () => {
  describe('#cloneRepository', () => {
    it('create a temporary directory and clone the repository there', async () => {
      const simpleGit = {
        clone: sinon.stub().resolves(null),
      }
      const repositoryPath = await cloneRepository('https://github.com/1024pix/pix.git', simpleGit, {})
      expect(simpleGit.clone.calledWith('https://github.com/1024pix/pix.git')).to.be.true
      expect(repositoryPath).to.be.a('string')
    })

    it('create a temporary directory and clone the repository there with variable substition', async () => {
      const simpleGit = {
        clone: sinon.stub().resolves(null),
      }
      const repositoryPath = await cloneRepository('https://$FOO@github.com/1024pix/pix.git', simpleGit, { FOO: 'BAR' })
      expect(simpleGit.clone.calledWith('https://BAR@github.com/1024pix/pix.git')).to.be.true
      expect(repositoryPath).to.be.a('string')
    })
  })

  describe('#replaceRepositoryVariablesWithEnvVariables', () => {
    [
      {
        repository: 'https://$FOO@github.com/1024pix/pix.git',
        variables: {},
        expected: 'https://$FOO@github.com/1024pix/pix.git',
      },
      {
        repository: 'https://$FOO@github.com/1024pix/pix.git',
        variables: { FOO: 'BAR' },
        expected: 'https://BAR@github.com/1024pix/pix.git',
      },
      {
        repository: 'https://$FOO:$FOO@github.com/1024pix/pix.git',
        variables: { FOO: 'BAR' },
        expected: 'https://BAR:BAR@github.com/1024pix/pix.git',
      },
      {
        repository: 'https://$FOO:$BAR@github.com/1024pix/pix.git',
        variables: { FOO: 'BAR', BAR: 'FOO' },
        expected: 'https://BAR:FOO@github.com/1024pix/pix.git',
      },
    ].forEach(({ repository, variables, expected }) => {
      it(`replace var in the ${repository} string by env var`, () => {
        const result = replaceRepositoryVariablesWithEnvVariables(repository, variables)
        expect(result).to.equal(expected)
      })
    })
  })

  describe('#getExpordedFunctionsInFile', () => {
    it('should return the exported functions in a given filePath', () => {
      const filePath = join(__dirname, './sample/get-exported-functions-in-file/exported-functions.js')

      const result = getExportedFunctionsInFile(filePath)

      expect(result).to.deep.equal([
        { filePath, functionName: 'a' },
        { filePath, functionName: 'b' },
        { filePath, functionName: 'c' },
        { filePath, functionName: 'd' },
        { filePath, functionName: 'e' },
      ])
    })

    it('should return an empty array if no function is exported', () => {
      const filePath = join(__dirname, './sample/get-exported-functions-in-file/no-exported-functions.js')

      const result = getExportedFunctionsInFile(filePath)

      expect(result).to.deep.equal([])
    })

    it('should return an empty array if only variable is exported', () => {
      const filePath = join(__dirname, './sample/get-exported-functions-in-file/exported-variables.js')

      const result = getExportedFunctionsInFile(filePath)

      expect(result).to.deep.equal([])
    })
  })

  describe('#isCalledInFile', () => {
    describe('when the function is called in the file', () => {
      it('should return true', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')

        const result = isCalledInFile(filePath, { callNames: ['myFile'], functionName: 'functionA' })

        expect(result).to.be.true
      })
    })

    describe('when the function is not called in the file', () => {
      it('should return false', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')

        const result = isCalledInFile(filePath, { callNames: ['myFile'], functionName: 'functionC' })

        expect(result).to.be.false
      })
    })

    describe('when the function is called in the file with a different callName', () => {
      it('should return false', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')

        const result = isCalledInFile(filePath, { callNames: ['myOtherFile'], functionName: 'functionA' })

        expect(result).to.be.false
      })
    })

    describe('when callNames has prefix', () => {
      it('should return true', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')

        const result = isCalledInFile(filePath, { callNames: ['dependencies.myService'], functionName: 'functionB' })

        expect(result).to.be.true
      })
    })
  })
})
