const Colors = {
    Background: "#21252B",
    LightBackground: "#282d34",
    LighterBackground: "#31363F",
    VeryLightBackground: "#2a3038",
    Theme: "#3190FF",
    Highlight: "white",
    Disabled: "gray",
    EditorBackground: "#151515"
}

const Paths = {
    Geno: '/geno',
    Commands: '/geno/commands.json',
    Preferences: '/geno/preferences.json'
}

const ContextType = {
    Element: "element",         // Return elements
    Attribute:  "attribute",    // Return an element attribute (requires contextInfo.returnAttribute)
    Text: "text"                // Return selected/highlighted text
}

const GenoEvent = {
    TrackContext: 'trackContext',
    StopTrackContext: 'stopTrackingContext',
    ShareContext: 'shareContext'
}

const HelpText = {
    ExampleQueries: "Example queries are used to trigger a voice command, by matching user's voice input to similar examples. 5 or more examples are recommended for accurate recognition. Select parameters in a query by clicking the query in the list, and using the dropdowns under each word. Click \"Train Model\" to save changes to queries.",
    Multimodal: "Multimodal context infers a parameter's value from hovering or dragging the mouse over elements. To limit context to certain selectors, click the crosshairs and hover over an element, before clicking the crosshairs again to finish. A specific attribute can be selected as a parameter value by hovering over the selector text."
}

module.exports = { Colors, Paths, ContextType, GenoEvent, HelpText }
