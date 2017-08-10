module.exports = {
  isPackaged() {
    return process.mainModule.filename.indexOf('app.asar') > 0
  }
}
