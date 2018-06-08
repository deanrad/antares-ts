// this file is to run npm run demos; npm run demos:test uses jest
const Demos = {
    writeFileDemo: require('./01-write-file')
}

const process = require('process')
const { stdout } = process
const { log } = console
const interactive = ["--interactive", "-i"].includes(process.argv[2])

for(let demo of Object.values(Demos)) {
    demo({stdout, log, interactive})

}
