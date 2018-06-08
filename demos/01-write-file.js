module.exports = ({ stdout, interactive }) => {
  const msg = interactive ? "TODO get user input" : "TODO write file"

  // Get a promise for the one action we'll process
  let action = interactive ? getPayloadFromStdin() : Promise.resolve(getDemoData())

  // Process it
  action.then(action => {
    console.log("TODO process", action)
  })
}

function getDemoData() {
  return {
    type: "File.write",
    payload: {
      contents: "- Jake Weary",
      fileName: "./scratch/actors.yml"
    }
  }
}

// Returns a promise for a payload suitable for the File.write action
function getPayloadFromStdin() {
  const inquirer = require("inquirer")
  return inquirer
    .prompt([
      {
        name: 'name',
        message: "Your favorite actor/actress first initials?"
      }
    ])
    .then(({ name }) => {
      return {
        fileName: "./scratch/actors.yml",
        contents: "- " + name
      }
    })
}
