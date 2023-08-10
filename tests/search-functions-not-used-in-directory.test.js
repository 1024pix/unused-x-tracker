import { expect } from 'chai'
import { describe, it } from 'mocha'
import sinon from 'sinon'
import {
  cloneRepository,
  commitChange,
  replaceRepositoryVariablesWithEnvVariables,
} from '../src/search-functions-not-used-in-directory.js'

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

  describe('#commitChange', () => {
    it('configure the git instance', async () => {
      const simpleGit = {
        addConfig: sinon.stub().resolves(null),
        add: sinon.stub().resolves(null),
        commit: sinon.stub().resolves(null),
      }
      await commitChange(simpleGit)
      expect(simpleGit.addConfig.calledTwice).to.be.true
      expect(simpleGit.add.calledWith('data')).to.be.true
      expect(simpleGit.commit.calledWith('Update data')).to.be.true
    })
  })
})