module.exports = {
  writeFileSync: [require("./01-write-file"), { mode: "sync" }],
  writeFileAsync: [require("./01-write-file"), { mode: "async" }],
  doubleSpeak: [require("./02-speak-up"), { count: 2, syncRender: true }]
  // udderSpeak: [require("./02-speak-up"), { count: 2, syncRender: false }] // no diff yet
}
