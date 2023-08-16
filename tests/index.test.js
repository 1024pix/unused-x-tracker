import { describe, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { commitChange } from '../src/index.js'

describe('index', () => {
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
