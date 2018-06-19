// this file is to run npm run demos; npm run demos:test uses jest
const Demos = require("./configs")
const process = require("process")
const { stdout } = process
const log = s => stdout.write(s + "\n")
const interactive = ["--interactive", "-i"].includes(process.argv[2])

async function sequentiallyRun() {
  for (let key of Object.keys(Demos)) {
    const [demoFn, config] = Demos[key]

    log("\n" + `Demo ${key} (${JSON.stringify(config)})` + "\n--------")
    await demoFn({ config, stdout, log, interactive })
    // give some time to flush
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  console.log("\nBye!\n")
}

describe("All demos", () => {
  it("Should run them", async () => {
    await sequentiallyRun()
    //setTimeout(() => sequentiallyRun(), 0)
  })
})
