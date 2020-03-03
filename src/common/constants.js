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

module.exports = { Colors, Paths, ContextType, GenoEvent }
