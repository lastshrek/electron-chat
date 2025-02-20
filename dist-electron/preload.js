"use strict";
const electron = require("electron");
const api = {
  platform: process.platform,
  send: (channel, data) => {
    electron.ipcRenderer.send(channel, data);
  },
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (_, data) => callback(data));
  }
};
try {
  electron.contextBridge.exposeInMainWorld("electron", api);
} catch (error) {
  console.error("Failed to expose API:", error);
}
window.addEventListener("DOMContentLoaded", () => {
  console.log("Preload script loaded");
});
