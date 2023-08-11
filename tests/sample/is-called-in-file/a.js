// eslint-disable-next-line unused-imports/no-unused-vars
function a({ myFile, dependencies }) {
  functionB()
  myFile.functionB()
  dependencies.myService.functionB()
  return myFile.functionA()
}

function functionB() {
  return 'b'
}
