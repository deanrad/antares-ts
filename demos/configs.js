let configs = {
  writeFileSync: [require("./01-write-file"), { mode: "sync" }],
  writeFileAsync: [require("./01-write-file"), { mode: "async" }]
}

const failsInCI = {
  doubleSpeak: [require("./02-speak-up"), { count: 2, syncRender: true }],
  // udderSpeak: [require("./02-speak-up"), { count: 2, syncRender: false }] // no diff yet
}

if (!process.env.CI) {

  configs = Object.assign(configs, failsInCI)
}
module.exports = configs
