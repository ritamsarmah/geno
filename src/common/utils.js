const electron = window.require("electron");
const isDev = window.require("electron-is-dev");
const path = window.require("path");

/* Return a color based on hashed string */
export function stringToColor(str) {
  if (str == null) {
    return "#D3D3D3";
  }

  var hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  var color = "#";
  for (let i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}

export function createCountMessage(length, units) {
  var message = length;
  if (length === 1) {
    message += " " + units;
  } else {
    message += " " + units + "s";
  }
  return message;
}

export function getResourcePath(resource) {
  return path.join(
    isDev
      ? electron.remote.app.getAppPath()
      : electron.remote.process.resourcesPath,
    "exported",
    resource
  );
}

export default { stringToColor, createCountMessage, getResourcePath };
