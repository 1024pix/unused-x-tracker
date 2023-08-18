import { join } from 'node:path'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import {
  checkIfFunctionsAreCalledInFile,
  getExportedFunctionsInFile,
} from '../src/search-functions-not-used-in-directory.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('search-functions-not-used-in-directory', () => {
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

  describe('#checkIfFunctionsAreCalledInFile', () => {
    describe('when the function is called in the file', () => {
      it('should mark has called function', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')
        const functions = [{ callNames: ['myFile'], functionName: 'functionA' }]

        checkIfFunctionsAreCalledInFile({ searchFile: filePath, exportedFunctions: functions })

        expect(functions[0].isCalled).to.be.true
      })
    })

    describe('when the function is not called in the file', () => {
      it('should not mark has called', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')
        const functions = [{ callNames: ['myFile'], functionName: 'functionC' }]

        checkIfFunctionsAreCalledInFile({ searchFile: filePath, exportedFunctions: functions })

        expect(functions[0].isCalled).to.be.undefined
      })
    })

    describe('when the function is called in the file with a different callName', () => {
      it('should not mark has called', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')
        const functions = [{ callNames: ['myOtherFile'], functionName: 'functionA' }]

        checkIfFunctionsAreCalledInFile({ searchFile: filePath, exportedFunctions: functions })

        expect(functions[0].isCalled).to.be.undefined
      })
    })

    describe('when callNames has prefix', () => {
      it('should mark has called', () => {
        const filePath = join(__dirname, './sample/is-called-in-file/a.js')
        const functions = [{ callNames: ['dependencies.myService'], functionName: 'functionB' }]

        checkIfFunctionsAreCalledInFile({ searchFile: filePath, exportedFunctions: functions })

        expect(functions[0].isCalled).to.be.true
      })
    })
  })
})
