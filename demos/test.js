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

    it("should work asynchronously", async () => {
      const [demoFn, config] = Demos.writeFileAsync

      await demoFn({ config, log })

      expect(output).toMatchSnapshot()
    })
  })
  describe("speakUpDemo", () => {
    // wait for others' output to flush
    beforeAll(async () => {
      return await new Promise(resolve => setTimeout(resolve, 200))
    })

    // test wont work if speech synthesis isnt available
    it("should hear overlapping speakings", async () => {
      if (!process.env.CI) {
        const [demoFn, config] = Demos.doubleSpeak || [() => true]

        try {
          require("say").speak("test")
        } catch (ex) {
          // silence it so it won't ruin CI
          console.error("An error occurred using the speech interface.")
        }

        try {
          require("say").speak("test")
          await demoFn({ config, log })
        } catch (ex) {
          return
        }

        // snapshots wont work for tests that sometimes aren't run - Jest says 'obsolete'!
        expect(output).toEqual(expectedSpeak)
      }
    })
  })
})

const expectedSpeak = `> About to process/say: Starbucks
< processing done
> About to process/say: International House of Pancakes
< processing done
•
•
•
Done rendering
•
•
`
