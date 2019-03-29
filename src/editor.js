const path = require('path');
const amdLoader = require('../node_modules/monaco-editor/min/vs/loader.js');
const amdRequire = amdLoader.require;
const amdDefine = amdLoader.require.define;

const tippy = require('tippy.js')

// Global access to code editor
let editor;

// Load monaco module
function uriFromPath(_path) {
    var pathName = path.resolve(_path).replace(/\\/g, '/');
    if (pathName.length > 0 && pathName.charAt(0) !== '/') {
        pathName = '/' + pathName;
    }
    return encodeURI('file://' + pathName);
}
amdRequire.config({
    baseUrl: uriFromPath(path.join(__dirname, '../node_modules/monaco-editor/min'))
});

// Work around monaco-css not understanding the environment
self.module = undefined;
amdRequire(['vs/editor/editor.main'], function () {

    // Editor creation and configuration
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: [
            '"use strict";',
            'function Person(age) {',
            '	if (age) {',
            '		this.age = age;',
            '	}',
            '}',
            'Person.prototype.getAge = function () {',
            '	return this.age;',
            '};'
        ].join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
        glyphMargin: true,
        automaticLayout: true
    });

    // Add/remove gutter decoration on mouse down
    editor.onMouseDown((e) => {
        // TODO: Import from MouseTargetType.GUTTER_GLYPH_MARGIN instead of hard coded "2"
        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditormouseevent.html
        if (e.target.type == 2) {
            if (e.event.leftButton) {
                // Check if decoration needs to be created and add it
                if (true) {
                    delta = editor.deltaDecorations([], [
                        {
                            range: e.target.range,
                            options: {
                                isWholeLine: false,
                                glyphMarginClassName: 'glyphMargin',
                            }
                        }
                    ]);
                }
                
                // Show popup
                tippy(e.event.target, {
                    content: "I'm a Tippy tooltip!", // TODO: Change content
                    // content: '<strong>Bolded <span style="color: aqua;">content</span></strong>'
                    arrow: true,
                    trigger: 'click',
                    placement: 'right',
                    theme: 'light-border',
                    animation: 'scale',
                    inertia: true,
                    interactive: true
                })
            } else if (e.event.rightButton) {
                // console.log(decorations)
                // delta = editor.deltaDecorations(decorations, [
                //     {
                //         range: e.target.range,
                //         options: {}
                //     }
                // ]);
            }
        }
    })
});