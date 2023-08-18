import { join } from 'node:path'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { checkIfClassesAreCalledInFile, getExportedClassesInFile } from '../src/search-classes-not-used-in-directory.js'

const __dirname = new URL('.', import.meta.url).pathname

describe('search-classes-not-used-in-directory', () => {
  describe('#getExpordedClassesInFile', () => {
    it('should return the exported classes in a given filePath', () => {
      const filePath = join(__dirname, './sample/get-exported-classes-in-file/exported-classes.js')

      const result = getExportedClassesInFile(filePath)

      expect(result).to.deep.equal([
        { filePath, className: 'Foo' },
        { filePath, className: 'Bar' },
      ])
    })

    it('should return an empty array if no class is exported', () => {
      const filePath = join(__dirname, './sample/get-exported-classes-in-file/no-exported-classes.js')

      const result = getExportedClassesInFile(filePath)

      expect(result).to.deep.equal([])
    })
  })

  describe('#checkIfClassesAreCalledInFile', () => {
    describe('when the class is called in the file', () => {
      it('should mark has called class', () => {
        const filePath = join(__dirname, './sample/check-if-classes-are-called-in-file/a.js')
        const classes = [{ className: 'A' }]

        checkIfClassesAreCalledInFile({ searchFile: filePath, exportedClasses: classes })

        expect(classes[0].isCalled).to.be.true
      })
    })

    describe('when the class is not called in the file', () => {
      it('should not mark has called', () => {
        const filePath = join(__dirname, './sample/check-if-classes-are-called-in-file/a.js')
        const classes = [{ className: 'C' }]

        checkIfClassesAreCalledInFile({ searchFile: filePath, exportedClasses: classes })

        expect(classes[0].isCalled).to.be.undefined
      })
    })
  })
})
