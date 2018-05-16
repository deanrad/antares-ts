const AntaresProtocol = require('antares-protocol');
const antares = new AntaresProtocol();

// Antares processes actions. Make one.
const action = {
    type: 'Persist.toDB'
};

// Renderers listen for actions and cause irrevocable changes
antares.subscribeRenderer(({ action }) => {
    console.log(`Yay, could render ${action.type}`)
})

// Process(action) returns a promise for its completion, passing through
// any number of renderers
antares.process(action)
    .then(s => console.log(`Yay done processing ${a.type} ${s}` + '\n'))
