"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("database", {
  init: (userId) => electron.ipcRenderer.invoke("db:init", userId),
  close: () => electron.ipcRenderer.invoke("db:close"),
  message: {
    create: (message) => electron.ipcRenderer.invoke("db:message:create", message),
    getByChatId: (chatId) => electron.ipcRenderer.invoke("db:message:getByChatId", chatId)
  },
  chat: {
    create: (chat) => electron.ipcRenderer.invoke("db:chat:create", chat),
    getById: (chatId) => electron.ipcRenderer.invoke("db:chat:getById", chatId),
    getByUserId: (userId) => electron.ipcRenderer.invoke("db:chat:getByUserId", userId),
    updateUnreadCount: (chatId, count) => electron.ipcRenderer.invoke("db:chat:updateUnreadCount", chatId, count)
  }
});
