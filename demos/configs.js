module.exports = {
  writeFileSync: [require("./01-write-file"), {mode: 'sync'}],
  writeFileAsync: [require("./01-write-file"), {mode: 'async'}]
}
