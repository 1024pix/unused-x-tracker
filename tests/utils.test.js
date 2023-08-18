import { describe, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { cloneRepository, getAllFilePathsInDirectory, replaceRepositoryVariablesWithEnvVariables } from '../src/utils.js'

describe('utils', () => {
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

  describe('#getAllFilePathsInDirectory', () => {
    it('get all js file paths in directory with file in subdirectory', () => {
      const result = getAllFilePathsInDirectory('./tests/sample/get-all-file-paths-in-directory')

      expect(result).to.deep.equal([
        'tests/sample/get-all-file-paths-in-directory/a.js',
        'tests/sample/get-all-file-paths-in-directory/b.js',
        'tests/sample/get-all-file-paths-in-directory/c/c.js',
      ])
    })

    it('should not get files matched by ignoreFiles', () => {
      const result = getAllFilePathsInDirectory('./tests/sample/get-all-file-paths-in-directory', [/a\.js/, /\/c\//])

      expect(result).to.deep.equal([
        'tests/sample/get-all-file-paths-in-directory/b.js',
      ])
    })
  })
})
