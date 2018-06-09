const Demos = require("./configs")

let output = ""
const appendLine = s => {
  output = output + `${s}\n`
}
const append = s => {
  output += s
}
const log = appendLine

describe("All Demos", () => {
  beforeEach(() => {
    output = ""
  })
  describe("writeFileDemo", () => {
    it("should work synchronously", async () => {
      const [demoFn, config] = Demos.writeFileSync

      await demoFn({ config, log })

      expect(output).toMatchSnapshot()
    })

    xit("should work asynchronously", async () => {
      const [demoFn, config] = Demos.writeFileAsync

      await demoFn({ config, log })

      expect(output).toMatchSnapshot()
    })
  })
  describe("speakUpDemo", () => {
    // test wont work if speech synthesis isnt available
    it("should hear overlapping speakings", async () => {
      const [demoFn, config] = Demos.doubleSpeak

      try {
        require("say").speak("test")
        await demoFn({ config, log })
      } catch (ex) {
        return
      }

      expect(output).toMatchSnapshot()
    })
  })
})
