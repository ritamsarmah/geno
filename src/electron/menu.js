const { app, dialog, Menu } = require('electron');
const fs = require('fs');

const { Paths } = require('../constants');

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New File',
                accelerator: 'CmdOrCtrl+N',
                click() {}
            },
            { type: 'separator' },
            {
                label: 'Open Project...',
                accelerator: 'CmdOrCtrl+O',
                click: () => {
                    dialog.showOpenDialog({ properties: ['openDirectory'] }, configureProject);
                }
            },
            { type: 'separator' },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: () => { console.log("Save File") } // TODO: Save changes
            },
            {
                label: 'Save As...',
                accelerator: 'CmdOrCtrl+Shift+S',
                click: () => { dialog.showSaveDialog() }
            }
        ]
    },
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { type: 'separator' },
            {
                label: 'Find',
                accelerator: 'CmdOrCtrl+F',
                click: () => { } 
            },
            {
                label: 'Replace',
                accelerator: 'Alt+CmdOrCtrl+F'
            },
            { type: 'separator' },
            { role: 'selectall' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { role: 'resetzoom' },
            { role: 'zoomin' },
            { role: 'zoomout' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
        ]
    },
    {
        role: 'window',
        submenu: [
            { role: 'minimize' },
            { role: 'close' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click() { require('electron').shell.openExternal('https://electronjs.org') }
            }
        ]
    }
]

if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideothers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    })

    // Edit menu
    template[2].submenu.push(
        { type: 'separator' },
        {
            label: 'Speech',
            submenu: [
                { role: 'startspeaking' },
                { role: 'stopspeaking' }
            ]
        }
    )

    // Window menu
    template[4].submenu = [
        { role: 'close' },
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
    ]
}

/**
 * Creates .geno directory and necessary supporting files if it does not exist
 * Also loads project into file tree 
 **/
function configureProject(path) {
    const genoPath = path + Paths.Geno;
    const commandsPath = path + Paths.Commands;
    console.log(genoPath);
    console.log(commandsPath);

    if (!fs.existsSync(genoPath)) {
        fs.mkdirSync(genoPath);
        fs.writeFileSync(commandsPath);
    } else {
        // TODO: Read commands.json into memory
        // 
    }
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)