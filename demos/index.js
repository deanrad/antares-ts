// this file is to run npm run demos; npm run demos:test uses jest
const Demos = require('./configs')
const process = require('process')
const { stdout } = process
const { log } = console
const interactive = ["--interactive", "-i"].includes(process.argv[2])

async function sequentiallyRun() {
    for(let key of Object.keys(Demos)) {
        const [demoFn, config] = Demos[key]
        
        log("\n" + `Demo ${key} (${JSON.stringify(config)})` + "\n--------")
        await demoFn({config, stdout, log, interactive})
        
    }
    console.log("\nBye!\n")
}

sequentiallyRun()

