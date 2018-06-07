const Demos = {
    writeFileDemo: require('./01-write-file')
}

let output = ''
const appendLine = (s) => {output = output + `${s}\n`}
const append = (s) => { output += s }

describe("writeFileDemo", () => {
    it("should write a file")
    it("should write to stdout", async () => {
        const subject = Demos.writeFileDemo
        const stdout = {write: jest.fn(appendLine)}
        await subject({ stdout })
        
        expect(output).toMatchSnapshot()
    })
})
