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
    ExampleQueries: "Add example sentences that can trigger this voice command. In usage, the user's voice input is matched to the command with the most similar example queries. More examples will improve recognition accuracy.\n\n Assign parameters to words in a query by clicking the query in the list, and in the new popup, selecting a parameter from the dropdown under the word(s). To edit query text, click on the pencil icon.\n\nOnce you've finished adding your queries and configuring the parameters, click \"Train Model\" at the bottom to save the command (this may take a few seconds).",
    Multimodal: "Multimodal context allows a parameter's value to be provided by hovering over an element or dragging over multiple elements. Start by selecting a parameter in the dropdown to enable this functionality.\n\nYou can limit context inference to a specific element selector: click the crosshairs and hover over a webpage element to select it. Click the button again to stop selection. The element ID or tag / class will be used to disambiguate when possible.\n\nInstead of the actual element(s), you can also use a specfic attribute as the parameter value. Click the text for element selector and select the desired attribute(s)."
}

module.exports = { Colors, Paths, ContextType, GenoEvent, HelpText }
