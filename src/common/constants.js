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
    Preferences: '/geno/preferences.json',
    Custom: '/geno/custom.js'
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
    ExampleQueries: "Add 2 or more example utterances for training intent recognition. Click on a query in the list to assign parameters using the dropdown under each word.",
    Multimodal: "Infer a parameter from a user hovering/dragging the mouse over elements. Limit context to a certain selector by clicking the crosshairs and hovering over an element in the preview, before clicking the crosshairs again to finish. Use attribute(s) as context by hovering over the selector text and selecting from checklist."
}

module.exports = { Colors, Paths, ContextType, GenoEvent, HelpText }
