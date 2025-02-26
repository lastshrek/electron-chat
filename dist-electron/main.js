"use strict";
const electron = require("electron");
const path = require("path");
const productName = "Electron VueVite - Quick Start";
const version = "1.0.0";
const description = "Your awesome app description";
process.env.BUILD_APP = path.join(__dirname, "../app");
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? path.join(__dirname, "../../public") : process.env.BUILD_APP;
let mainWindow = null;
const meetingWindows = /* @__PURE__ */ new Map();
const createWindow = async () => {
  electron.screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new electron.BrowserWindow({
    icon: path.join(__dirname, "../../src/assets/icons/icon.png"),
    title: `${productName} | ${description} - v${version}`,
    minWidth: 1200,
    minHeight: 800,
    width: 1200,
    height: 800,
    x: 50,
    y: 50,
    resizable: true,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
      webviewTag: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(process.env.BUILD_APP, "index.html"));
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("/meeting/")) {
      const meetingId = url.split("/").pop() || "";
      if (meetingWindows.has(meetingId)) {
        const existingWindow = meetingWindows.get(meetingId);
        if (existingWindow == null ? void 0 : existingWindow.isMinimized()) {
          existingWindow.restore();
        }
        existingWindow == null ? void 0 : existingWindow.focus();
        return { action: "deny" };
      }
      const meetingWindow = new electron.BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: true,
          webSecurity: false,
          sandbox: false,
          preload: path.join(__dirname, "preload.js")
        }
      });
      meetingWindow.webContents.session.setPermissionRequestHandler(
        (webContents, permission, callback) => {
          const allowedPermissions = ["media", "mediaKeySystem"];
          if (allowedPermissions.includes(permission)) {
            callback(true);
          } else {
            callback(false);
          }
        }
      );
      meetingWindow.webContents.session.setPermissionCheckHandler(
        (webContents, permission) => {
          const allowedPermissions = ["media", "mediaKeySystem"];
          return allowedPermissions.includes(permission);
        }
      );
      meetingWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ws: wss:;connect-src 'self' ws: wss: http: https:;img-src 'self' data: https: http:;script-src 'self' 'unsafe-inline' 'unsafe-eval';style-src 'self' 'unsafe-inline';media-src 'self' blob:;child-src 'self' blob:;"
            ]
          }
        });
      });
      if (electron.app.isPackaged) {
        meetingWindow.loadURL(`${url}`);
      } else {
        meetingWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/#/meeting/${meetingId}`);
        meetingWindow.webContents.openDevTools();
      }
      return { action: "deny" };
    }
    return { action: "allow" };
  });
  electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: http: https: ws: wss:;connect-src 'self' ws: wss: http: https:;img-src 'self' data: https: http:;script-src 'self' 'unsafe-inline' 'unsafe-eval';style-src 'self' 'unsafe-inline';media-src 'self' blob:;child-src 'self' blob:;"
        ]
      }
    });
  });
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
        "fullscreen",
        "pointerLock"
      ];
      if (allowedPermissions.includes(permission)) {
        console.log(`允许权限: ${permission}`);
        callback(true);
      } else {
        console.log(`拒绝权限: ${permission}`);
        callback(false);
      }
    }
  );
  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
        "fullscreen",
        "pointerLock"
      ];
      return allowedPermissions.includes(permission);
    }
  );
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
};
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    const allWindows = electron.BrowserWindow.getAllWindows();
    allWindows.length === 0 ? createWindow() : allWindows[0].focus();
  });
});
electron.app.on("window-all-closed", () => {
  mainWindow = null;
  if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("render-process-gone", (event, webContents, details) => {
  console.error("Renderer process gone:", details);
});
electron.app.on("child-process-gone", (event, details) => {
  console.error("Child process gone:", details);
});
electron.app.on("before-quit", () => {
  meetingWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.close();
    }
  });
  meetingWindows.clear();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vZWxlY3Ryb24vbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2FwcCwgQnJvd3NlcldpbmRvdywgc2hlbGwsIHNjcmVlbiwgc2Vzc2lvbiwgaXBjTWFpbn0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQge2pvaW59IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQge3Byb2R1Y3ROYW1lLCBkZXNjcmlwdGlvbiwgdmVyc2lvbn0gZnJvbSBcIi4uL3BhY2thZ2UuanNvblwiO1xuXG5pbXBvcnQgaW5zdGFsbEV4dGVuc2lvbiwge1ZVRUpTX0RFVlRPT0xTfSBmcm9tIFwiZWxlY3Ryb24tZGV2dG9vbHMtaW5zdGFsbGVyXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG4vKipcbiAqICoqIFRoZSBidWlsdCBkaXJlY3Rvcnkgc3RydWN0dXJlXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqIOKUnOKUgOKUrCBidWlsZC9lbGVjdHJvblxuICog4pSCIOKUlOKUgOKUgCBtYWluLmpzICAgICAgICA+IEVsZWN0cm9uLU1haW5cbiAqIOKUgiDilJTilIDilIAgcHJlbG9hZC5qcyAgICAgPiBQcmVsb2FkLVNjcmlwdHNcbiAqIOKUnOKUgOKUrCBidWlsZC9hcHBcbiAqICAg4pSU4pSA4pSAIGluZGV4Lmh0bWwgICAgID4gRWxlY3Ryb24tUmVuZGVyZXJcbiAqL1xuXG5wcm9jZXNzLmVudi5CVUlMRF9BUFAgPSBqb2luKF9fZGlybmFtZSwgXCIuLi9hcHBcIik7XG5wcm9jZXNzLmVudi5QVUJMSUMgPSBwcm9jZXNzLmVudi5WSVRFX0RFVl9TRVJWRVJfVVJMXG5cdD8gam9pbihfX2Rpcm5hbWUsIFwiLi4vLi4vcHVibGljXCIpXG5cdDogcHJvY2Vzcy5lbnYuQlVJTERfQVBQO1xuXG5sZXQgbWFpbldpbmRvdzogQnJvd3NlcldpbmRvdyB8IG51bGwgPSBudWxsO1xuXG4vLyDmt7vliqDnqpflj6PnrqHnkIZcbmNvbnN0IG1lZXRpbmdXaW5kb3dzID0gbmV3IE1hcDxzdHJpbmcsIEJyb3dzZXJXaW5kb3c+KCk7XG5cbi8vIOiuvue9riBJUEMg5aSE55CG5ZmoXG5jb25zdCBzZXR1cElQQ0hhbmRsZXJzID0gKCkgPT4ge1xuXHQvLyDkv53nlZnpnZ7mlbDmja7lupPnm7jlhbPnmoQgSVBDIOWkhOeQhuWZqFxuXHQvLyDnp7vpmaTmiYDmnInmlbDmja7lupPnm7jlhbPnmoTlpITnkIblmahcbn07XG5cbi8vIOS/ruaUuSBjcmVhdGVXaW5kb3cg5Ye95pWw77yM5re75Yqg5paw56qX5Y+j5aSE55CGXG5jb25zdCBjcmVhdGVXaW5kb3cgPSBhc3luYyAoKSA9PiB7XG5cdGNvbnN0IHNjcmVlblNpemUgPSBzY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS53b3JrQXJlYVNpemU7XG5cblx0bWFpbldpbmRvdyA9IG5ldyBCcm93c2VyV2luZG93KHtcblx0XHRpY29uOiBqb2luKF9fZGlybmFtZSwgXCIuLi8uLi9zcmMvYXNzZXRzL2ljb25zL2ljb24ucG5nXCIpLFxuXHRcdHRpdGxlOiBgJHtwcm9kdWN0TmFtZX0gfCAke2Rlc2NyaXB0aW9ufSAtIHYke3ZlcnNpb259YCxcblx0XHRtaW5XaWR0aDogMTIwMCxcblx0XHRtaW5IZWlnaHQ6IDgwMCxcblx0XHR3aWR0aDogMTIwMCxcblx0XHRoZWlnaHQ6IDgwMCxcblx0XHR4OiA1MCxcblx0XHR5OiA1MCxcblx0XHRyZXNpemFibGU6IHRydWUsXG5cdFx0bWF4aW1pemFibGU6IGZhbHNlLFxuXHRcdHdlYlByZWZlcmVuY2VzOiB7XG5cdFx0XHRub2RlSW50ZWdyYXRpb246IHRydWUsXG5cdFx0XHRjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuXHRcdFx0d2ViU2VjdXJpdHk6IGZhbHNlLFxuXHRcdFx0c2FuZGJveDogZmFsc2UsXG5cdFx0XHRwcmVsb2FkOiBqb2luKF9fZGlybmFtZSwgXCJwcmVsb2FkLmpzXCIpLFxuXHRcdFx0d2Vidmlld1RhZzogdHJ1ZSxcblx0XHR9LFxuXHR9KTtcblxuXHRpZiAocHJvY2Vzcy5lbnYuVklURV9ERVZfU0VSVkVSX1VSTCkge1xuXHRcdG1haW5XaW5kb3cubG9hZFVSTChwcm9jZXNzLmVudi5WSVRFX0RFVl9TRVJWRVJfVVJMKTtcblx0XHRtYWluV2luZG93LndlYkNvbnRlbnRzLm9wZW5EZXZUb29scygpO1xuXHR9IGVsc2Uge1xuXHRcdG1haW5XaW5kb3cubG9hZEZpbGUoam9pbihwcm9jZXNzLmVudi5CVUlMRF9BUFAsIFwiaW5kZXguaHRtbFwiKSk7XG5cdH1cblxuXHQvLyDlpITnkIbmlrDnqpflj6PmiZPlvIBcblx0bWFpbldpbmRvdy53ZWJDb250ZW50cy5zZXRXaW5kb3dPcGVuSGFuZGxlcigoe3VybH0pID0+IHtcblx0XHQvLyDmo4Dmn6XmmK/lkKbmmK/kvJrorq5VUkxcblx0XHRpZiAodXJsLmluY2x1ZGVzKFwiL21lZXRpbmcvXCIpKSB7XG5cdFx0XHRjb25zdCBtZWV0aW5nSWQgPSB1cmwuc3BsaXQoXCIvXCIpLnBvcCgpIHx8IFwiXCI7XG5cblx0XHRcdC8vIOajgOafpeS8muiurueql+WPo+aYr+WQpuW3suWtmOWcqFxuXHRcdFx0aWYgKG1lZXRpbmdXaW5kb3dzLmhhcyhtZWV0aW5nSWQpKSB7XG5cdFx0XHRcdGNvbnN0IGV4aXN0aW5nV2luZG93ID0gbWVldGluZ1dpbmRvd3MuZ2V0KG1lZXRpbmdJZCk7XG5cdFx0XHRcdGlmIChleGlzdGluZ1dpbmRvdz8uaXNNaW5pbWl6ZWQoKSkge1xuXHRcdFx0XHRcdGV4aXN0aW5nV2luZG93LnJlc3RvcmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRleGlzdGluZ1dpbmRvdz8uZm9jdXMoKTtcblx0XHRcdFx0cmV0dXJuIHthY3Rpb246IFwiZGVueVwifTtcblx0XHRcdH1cblxuXHRcdFx0Ly8g5Yib5bu65paw55qE5Lya6K6u56qX5Y+jXG5cdFx0XHRjb25zdCBtZWV0aW5nV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3coe1xuXHRcdFx0XHR3aWR0aDogMTI4MCxcblx0XHRcdFx0aGVpZ2h0OiA3MjAsXG5cdFx0XHRcdHdlYlByZWZlcmVuY2VzOiB7XG5cdFx0XHRcdFx0bm9kZUludGVncmF0aW9uOiB0cnVlLFxuXHRcdFx0XHRcdGNvbnRleHRJc29sYXRpb246IHRydWUsXG5cdFx0XHRcdFx0d2ViU2VjdXJpdHk6IGZhbHNlLFxuXHRcdFx0XHRcdHNhbmRib3g6IGZhbHNlLFxuXHRcdFx0XHRcdHByZWxvYWQ6IGpvaW4oX19kaXJuYW1lLCBcInByZWxvYWQuanNcIiksXG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8g5Li65Lya6K6u56qX5Y+j6K6+572u5aqS5L2T5p2D6ZmQXG5cdFx0XHRtZWV0aW5nV2luZG93LndlYkNvbnRlbnRzLnNlc3Npb24uc2V0UGVybWlzc2lvblJlcXVlc3RIYW5kbGVyKFxuXHRcdFx0XHQod2ViQ29udGVudHMsIHBlcm1pc3Npb24sIGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgYWxsb3dlZFBlcm1pc3Npb25zID0gW1wibWVkaWFcIiwgXCJtZWRpYUtleVN5c3RlbVwiXTtcblx0XHRcdFx0XHRpZiAoYWxsb3dlZFBlcm1pc3Npb25zLmluY2x1ZGVzKHBlcm1pc3Npb24pKSB7XG5cdFx0XHRcdFx0XHRjYWxsYmFjayh0cnVlKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0KTtcblxuXHRcdFx0Ly8g6K6+572u5aqS5L2T6K6/6Zeu5qOA5p+lXG5cdFx0XHRtZWV0aW5nV2luZG93LndlYkNvbnRlbnRzLnNlc3Npb24uc2V0UGVybWlzc2lvbkNoZWNrSGFuZGxlcihcblx0XHRcdFx0KHdlYkNvbnRlbnRzLCBwZXJtaXNzaW9uKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgYWxsb3dlZFBlcm1pc3Npb25zID0gW1wibWVkaWFcIiwgXCJtZWRpYUtleVN5c3RlbVwiXTtcblx0XHRcdFx0XHRyZXR1cm4gYWxsb3dlZFBlcm1pc3Npb25zLmluY2x1ZGVzKHBlcm1pc3Npb24pO1xuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0XHQvLyDkv67mlLkgQ1NQIOmFjee9ruS7peWFgeiuuOWqkuS9k+iuv+mXrlxuXHRcdFx0bWVldGluZ1dpbmRvdy53ZWJDb250ZW50cy5zZXNzaW9uLndlYlJlcXVlc3Qub25IZWFkZXJzUmVjZWl2ZWQoKGRldGFpbHMsIGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRcdGNhbGxiYWNrKHtcblx0XHRcdFx0XHRyZXNwb25zZUhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdC4uLmRldGFpbHMucmVzcG9uc2VIZWFkZXJzLFxuXHRcdFx0XHRcdFx0XCJDb250ZW50LVNlY3VyaXR5LVBvbGljeVwiOiBbXG5cdFx0XHRcdFx0XHRcdFwiZGVmYXVsdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIGRhdGE6IGh0dHA6IGh0dHBzOiB3czogd3NzOjtcIiArXG5cdFx0XHRcdFx0XHRcdFx0XCJjb25uZWN0LXNyYyAnc2VsZicgd3M6IHdzczogaHR0cDogaHR0cHM6O1wiICtcblx0XHRcdFx0XHRcdFx0XHRcImltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOiBodHRwOjtcIiArXG5cdFx0XHRcdFx0XHRcdFx0XCJzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJztcIiArXG5cdFx0XHRcdFx0XHRcdFx0XCJzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJztcIiArXG5cdFx0XHRcdFx0XHRcdFx0XCJtZWRpYS1zcmMgJ3NlbGYnIGJsb2I6O1wiICtcblx0XHRcdFx0XHRcdFx0XHRcImNoaWxkLXNyYyAnc2VsZicgYmxvYjo7XCIsXG5cdFx0XHRcdFx0XHRdLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIOWKoOi9veS8muiurlVSTFxuXHRcdFx0aWYgKGFwcC5pc1BhY2thZ2VkKSB7XG5cdFx0XHRcdG1lZXRpbmdXaW5kb3cubG9hZFVSTChgJHt1cmx9YCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRtZWV0aW5nV2luZG93LmxvYWRVUkwoYCR7cHJvY2Vzcy5lbnYuVklURV9ERVZfU0VSVkVSX1VSTH0vIy9tZWV0aW5nLyR7bWVldGluZ0lkfWApO1xuXHRcdFx0XHQvLyDlnKjlvIDlj5Hnjq/looPkuK3oh6rliqjmiZPlvIDlvIDlj5HogIXlt6Xlhbdcblx0XHRcdFx0bWVldGluZ1dpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8g6Zi75q2i6buY6K6k6KGM5Li677yM5L2/55So5oiR5Lus6Ieq5bex55qE56qX5Y+jXG5cdFx0XHRyZXR1cm4ge2FjdGlvbjogXCJkZW55XCJ9O1xuXHRcdH1cblxuXHRcdC8vIOWFtuS7llVSTOS9v+eUqOm7mOiupOihjOS4ulxuXHRcdHJldHVybiB7YWN0aW9uOiBcImFsbG93XCJ9O1xuXHR9KTtcblxuXHQvLyDkv67mlLkgQ1NQIOmFjee9rlxuXHRzZXNzaW9uLmRlZmF1bHRTZXNzaW9uLndlYlJlcXVlc3Qub25IZWFkZXJzUmVjZWl2ZWQoKGRldGFpbHMsIGNhbGxiYWNrKSA9PiB7XG5cdFx0Y2FsbGJhY2soe1xuXHRcdFx0cmVzcG9uc2VIZWFkZXJzOiB7XG5cdFx0XHRcdC4uLmRldGFpbHMucmVzcG9uc2VIZWFkZXJzLFxuXHRcdFx0XHRcIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5XCI6IFtcblx0XHRcdFx0XHRcImRlZmF1bHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBkYXRhOiBodHRwOiBodHRwczogd3M6IHdzczo7XCIgK1xuXHRcdFx0XHRcdFx0XCJjb25uZWN0LXNyYyAnc2VsZicgd3M6IHdzczogaHR0cDogaHR0cHM6O1wiICtcblx0XHRcdFx0XHRcdFwiaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6IGh0dHA6O1wiICtcblx0XHRcdFx0XHRcdFwic2NyaXB0LXNyYyAnc2VsZicgJ3Vuc2FmZS1pbmxpbmUnICd1bnNhZmUtZXZhbCc7XCIgK1xuXHRcdFx0XHRcdFx0XCJzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJztcIiArXG5cdFx0XHRcdFx0XHRcIm1lZGlhLXNyYyAnc2VsZicgYmxvYjo7XCIgK1xuXHRcdFx0XHRcdFx0XCJjaGlsZC1zcmMgJ3NlbGYnIGJsb2I6O1wiLFxuXHRcdFx0XHRdLFxuXHRcdFx0fSxcblx0XHR9KTtcblx0fSk7XG5cblx0Ly8g5aSE55CG5aqS5L2T5p2D6ZmQ6K+35rGCXG5cdG1haW5XaW5kb3cud2ViQ29udGVudHMuc2Vzc2lvbi5zZXRQZXJtaXNzaW9uUmVxdWVzdEhhbmRsZXIoXG5cdFx0KHdlYkNvbnRlbnRzLCBwZXJtaXNzaW9uLCBjYWxsYmFjaykgPT4ge1xuXHRcdFx0Y29uc3QgYWxsb3dlZFBlcm1pc3Npb25zID0gW1xuXHRcdFx0XHRcIm1lZGlhXCIsXG5cdFx0XHRcdFwibWVkaWFLZXlTeXN0ZW1cIixcblx0XHRcdFx0XCJnZW9sb2NhdGlvblwiLFxuXHRcdFx0XHRcIm5vdGlmaWNhdGlvbnNcIixcblx0XHRcdFx0XCJmdWxsc2NyZWVuXCIsXG5cdFx0XHRcdFwicG9pbnRlckxvY2tcIixcblx0XHRcdF07XG5cblx0XHRcdGlmIChhbGxvd2VkUGVybWlzc2lvbnMuaW5jbHVkZXMocGVybWlzc2lvbikpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYOWFgeiuuOadg+mZkDogJHtwZXJtaXNzaW9ufWApO1xuXHRcdFx0XHRjYWxsYmFjayh0cnVlKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGDmi5Lnu53mnYPpmZA6ICR7cGVybWlzc2lvbn1gKTtcblx0XHRcdFx0Y2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0fVxuXHRcdH1cblx0KTtcblxuXHQvLyDlpITnkIblqpLkvZPorr/pl67or7fmsYJcblx0bWFpbldpbmRvdy53ZWJDb250ZW50cy5zZXNzaW9uLnNldFBlcm1pc3Npb25DaGVja0hhbmRsZXIoXG5cdFx0KHdlYkNvbnRlbnRzLCBwZXJtaXNzaW9uLCByZXF1ZXN0aW5nT3JpZ2luKSA9PiB7XG5cdFx0XHRjb25zdCBhbGxvd2VkUGVybWlzc2lvbnMgPSBbXG5cdFx0XHRcdFwibWVkaWFcIixcblx0XHRcdFx0XCJtZWRpYUtleVN5c3RlbVwiLFxuXHRcdFx0XHRcImdlb2xvY2F0aW9uXCIsXG5cdFx0XHRcdFwibm90aWZpY2F0aW9uc1wiLFxuXHRcdFx0XHRcImZ1bGxzY3JlZW5cIixcblx0XHRcdFx0XCJwb2ludGVyTG9ja1wiLFxuXHRcdFx0XTtcblxuXHRcdFx0cmV0dXJuIGFsbG93ZWRQZXJtaXNzaW9ucy5pbmNsdWRlcyhwZXJtaXNzaW9uKTtcblx0XHR9XG5cdCk7XG5cblx0bWFpbldpbmRvdy5vbihcInJlYWR5LXRvLXNob3dcIiwgKCkgPT4ge1xuXHRcdG1haW5XaW5kb3cuc2hvdygpO1xuXHR9KTtcbn07XG5cbi8vIFRoaXMgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIHdoZW4gRWxlY3Ryb24gaGFzIGZpbmlzaGVkXG4vLyBpbml0aWFsaXphdGlvbiBhbmQgaXMgcmVhZHkgdG8gY3JlYXRlIGJyb3dzZXIgd2luZG93cy5cbi8vIFNvbWUgQVBJcyBjYW4gb25seSBiZSB1c2VkIGFmdGVyIHRoaXMgZXZlbnQgb2NjdXJzLlxuYXBwLndoZW5SZWFkeSgpLnRoZW4oKCkgPT4ge1xuXHQvLyDliJvlu7rkuLvnqpflj6Ncblx0Y3JlYXRlV2luZG93KCk7XG5cblx0YXBwLm9uKFwiYWN0aXZhdGVcIiwgKCkgPT4ge1xuXHRcdC8vIE9uIG1hY09TIGl0J3MgY29tbW9uIHRvIHJlLWNyZWF0ZSBhIHdpbmRvdyBpbiB0aGUgYXBwIHdoZW4gdGhlXG5cdFx0Ly8gZG9jayBpY29uIGlzIGNsaWNrZWQgYW5kIHRoZXJlIGFyZSBubyBvdGhlciB3aW5kb3dzIG9wZW4uXG5cdFx0Y29uc3QgYWxsV2luZG93cyA9IEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpO1xuXHRcdGFsbFdpbmRvd3MubGVuZ3RoID09PSAwID8gY3JlYXRlV2luZG93KCkgOiBhbGxXaW5kb3dzWzBdLmZvY3VzKCk7XG5cdH0pO1xufSk7XG5cbi8vIFF1aXQgd2hlbiBhbGwgd2luZG93cyBhcmUgY2xvc2VkLCBleGNlcHQgb24gbWFjT1MuIFRoZXJlLCBpdCdzIGNvbW1vblxuLy8gZm9yIGFwcGxpY2F0aW9ucyBhbmQgdGhlaXIgbWVudSBiYXIgdG8gc3RheSBhY3RpdmUgdW50aWwgdGhlIHVzZXIgcXVpdHNcbi8vIGV4cGxpY2l0bHkgd2l0aCBDbWQgKyBRLlxuYXBwLm9uKFwid2luZG93LWFsbC1jbG9zZWRcIiwgKCkgPT4ge1xuXHRtYWluV2luZG93ID0gbnVsbDtcblx0aWYgKHByb2Nlc3MucGxhdGZvcm0gIT09IFwiZGFyd2luXCIpIGFwcC5xdWl0KCk7XG59KTtcblxuLy8gSW4gdGhpcyBmaWxlIHlvdSBjYW4gaW5jbHVkZSB0aGUgcmVzdCBvZiB5b3VyIGFwcCdzIHNwZWNpZmljIG1haW4gcHJvY2Vzc1xuLy8gY29kZS4gWW91IGNhbiBhbHNvIHB1dCB0aGVtIGluIHNlcGFyYXRlIGZpbGVzIGFuZCByZXF1aXJlIHRoZW0gaGVyZS5cblxuLy8g5re75Yqg6ZSZ6K+v5aSE55CGXG5hcHAub24oXCJyZW5kZXItcHJvY2Vzcy1nb25lXCIsIChldmVudCwgd2ViQ29udGVudHMsIGRldGFpbHMpID0+IHtcblx0Y29uc29sZS5lcnJvcihcIlJlbmRlcmVyIHByb2Nlc3MgZ29uZTpcIiwgZGV0YWlscyk7XG59KTtcblxuYXBwLm9uKFwiY2hpbGQtcHJvY2Vzcy1nb25lXCIsIChldmVudCwgZGV0YWlscykgPT4ge1xuXHRjb25zb2xlLmVycm9yKFwiQ2hpbGQgcHJvY2VzcyBnb25lOlwiLCBkZXRhaWxzKTtcbn0pO1xuXG4vLyDlnKjlupTnlKjpgIDlh7rml7bmuIXnkIbmiYDmnInkvJrorq7nqpflj6NcbmFwcC5vbihcImJlZm9yZS1xdWl0XCIsICgpID0+IHtcblx0bWVldGluZ1dpbmRvd3MuZm9yRWFjaCgod2luZG93KSA9PiB7XG5cdFx0aWYgKCF3aW5kb3cuaXNEZXN0cm95ZWQoKSkge1xuXHRcdFx0d2luZG93LmNsb3NlKCk7XG5cdFx0fVxuXHR9KTtcblx0bWVldGluZ1dpbmRvd3MuY2xlYXIoKTtcbn0pO1xuIl0sIm5hbWVzIjpbImpvaW4iLCJzY3JlZW4iLCJCcm93c2VyV2luZG93IiwiYXBwIiwic2Vzc2lvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBaUJBLFFBQVksSUFBQSxZQUFZQSxVQUFLLFdBQVcsUUFBUTtBQUNoRCxRQUFBLElBQVksU0FBUyxRQUFZLElBQUEsc0JBQzlCQSxVQUFLLFdBQVcsY0FBYyxJQUM5QixRQUFZLElBQUE7QUFFZixJQUFJLGFBQW1DO0FBR3ZDLE1BQU0scUNBQXFCLElBQTJCO0FBU3RELE1BQU0sZUFBZSxZQUFZO0FBQ2JDLFdBQU8sT0FBQSxrQkFBQSxFQUFvQjtBQUU5QyxlQUFhLElBQUlDLFNBQUFBLGNBQWM7QUFBQSxJQUM5QixNQUFNRixLQUFBQSxLQUFLLFdBQVcsaUNBQWlDO0FBQUEsSUFDdkQsT0FBTyxHQUFHLFdBQVcsTUFBTSxXQUFXLE9BQU8sT0FBTztBQUFBLElBQ3BELFVBQVU7QUFBQSxJQUNWLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLEdBQUc7QUFBQSxJQUNILEdBQUc7QUFBQSxJQUNILFdBQVc7QUFBQSxJQUNYLGFBQWE7QUFBQSxJQUNiLGdCQUFnQjtBQUFBLE1BQ2YsaUJBQWlCO0FBQUEsTUFDakIsa0JBQWtCO0FBQUEsTUFDbEIsYUFBYTtBQUFBLE1BQ2IsU0FBUztBQUFBLE1BQ1QsU0FBU0EsS0FBQUEsS0FBSyxXQUFXLFlBQVk7QUFBQSxNQUNyQyxZQUFZO0FBQUEsSUFBQTtBQUFBLEVBQ2IsQ0FDQTtBQUVHLE1BQUEsWUFBWSxxQkFBcUI7QUFDekIsZUFBQSxRQUFRLFlBQVksbUJBQW1CO0FBQ2xELGVBQVcsWUFBWSxhQUFhO0FBQUEsRUFBQSxPQUM5QjtBQUNOLGVBQVcsU0FBU0EsVUFBSyxRQUFZLElBQUEsV0FBVyxZQUFZLENBQUM7QUFBQSxFQUFBO0FBSTlELGFBQVcsWUFBWSxxQkFBcUIsQ0FBQyxFQUFDLFVBQVM7QUFFbEQsUUFBQSxJQUFJLFNBQVMsV0FBVyxHQUFHO0FBQzlCLFlBQU0sWUFBWSxJQUFJLE1BQU0sR0FBRyxFQUFFLFNBQVM7QUFHdEMsVUFBQSxlQUFlLElBQUksU0FBUyxHQUFHO0FBQzVCLGNBQUEsaUJBQWlCLGVBQWUsSUFBSSxTQUFTO0FBQy9DLFlBQUEsaURBQWdCLGVBQWU7QUFDbEMseUJBQWUsUUFBUTtBQUFBLFFBQUE7QUFFeEIseURBQWdCO0FBQ1QsZUFBQSxFQUFDLFFBQVEsT0FBTTtBQUFBLE1BQUE7QUFJakIsWUFBQSxnQkFBZ0IsSUFBSUUsdUJBQWM7QUFBQSxRQUN2QyxPQUFPO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixnQkFBZ0I7QUFBQSxVQUNmLGlCQUFpQjtBQUFBLFVBQ2pCLGtCQUFrQjtBQUFBLFVBQ2xCLGFBQWE7QUFBQSxVQUNiLFNBQVM7QUFBQSxVQUNULFNBQVNGLEtBQUFBLEtBQUssV0FBVyxZQUFZO0FBQUEsUUFBQTtBQUFBLE1BQ3RDLENBQ0E7QUFHRCxvQkFBYyxZQUFZLFFBQVE7QUFBQSxRQUNqQyxDQUFDLGFBQWEsWUFBWSxhQUFhO0FBQ2hDLGdCQUFBLHFCQUFxQixDQUFDLFNBQVMsZ0JBQWdCO0FBQ2pELGNBQUEsbUJBQW1CLFNBQVMsVUFBVSxHQUFHO0FBQzVDLHFCQUFTLElBQUk7QUFBQSxVQUFBLE9BQ1A7QUFDTixxQkFBUyxLQUFLO0FBQUEsVUFBQTtBQUFBLFFBQ2Y7QUFBQSxNQUVGO0FBR0Esb0JBQWMsWUFBWSxRQUFRO0FBQUEsUUFDakMsQ0FBQyxhQUFhLGVBQWU7QUFDdEIsZ0JBQUEscUJBQXFCLENBQUMsU0FBUyxnQkFBZ0I7QUFDOUMsaUJBQUEsbUJBQW1CLFNBQVMsVUFBVTtBQUFBLFFBQUE7QUFBQSxNQUUvQztBQUdBLG9CQUFjLFlBQVksUUFBUSxXQUFXLGtCQUFrQixDQUFDLFNBQVMsYUFBYTtBQUM1RSxpQkFBQTtBQUFBLFVBQ1IsaUJBQWlCO0FBQUEsWUFDaEIsR0FBRyxRQUFRO0FBQUEsWUFDWCwyQkFBMkI7QUFBQSxjQUMxQjtBQUFBLFlBQUE7QUFBQSxVQU9EO0FBQUEsUUFDRCxDQUNBO0FBQUEsTUFBQSxDQUNEO0FBR0QsVUFBSUcsU0FBQUEsSUFBSSxZQUFZO0FBQ0wsc0JBQUEsUUFBUSxHQUFHLEdBQUcsRUFBRTtBQUFBLE1BQUEsT0FDeEI7QUFDTixzQkFBYyxRQUFRLEdBQUcsUUFBQSxJQUFZLG1CQUFtQixjQUFjLFNBQVMsRUFBRTtBQUVqRixzQkFBYyxZQUFZLGFBQWE7QUFBQSxNQUFBO0FBSWpDLGFBQUEsRUFBQyxRQUFRLE9BQU07QUFBQSxJQUFBO0FBSWhCLFdBQUEsRUFBQyxRQUFRLFFBQU87QUFBQSxFQUFBLENBQ3ZCO0FBR0RDLFdBQUEsUUFBUSxlQUFlLFdBQVcsa0JBQWtCLENBQUMsU0FBUyxhQUFhO0FBQ2pFLGFBQUE7QUFBQSxNQUNSLGlCQUFpQjtBQUFBLFFBQ2hCLEdBQUcsUUFBUTtBQUFBLFFBQ1gsMkJBQTJCO0FBQUEsVUFDMUI7QUFBQSxRQUFBO0FBQUEsTUFPRDtBQUFBLElBQ0QsQ0FDQTtBQUFBLEVBQUEsQ0FDRDtBQUdELGFBQVcsWUFBWSxRQUFRO0FBQUEsSUFDOUIsQ0FBQyxhQUFhLFlBQVksYUFBYTtBQUN0QyxZQUFNLHFCQUFxQjtBQUFBLFFBQzFCO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNEO0FBRUksVUFBQSxtQkFBbUIsU0FBUyxVQUFVLEdBQUc7QUFDcEMsZ0JBQUEsSUFBSSxTQUFTLFVBQVUsRUFBRTtBQUNqQyxpQkFBUyxJQUFJO0FBQUEsTUFBQSxPQUNQO0FBQ0UsZ0JBQUEsSUFBSSxTQUFTLFVBQVUsRUFBRTtBQUNqQyxpQkFBUyxLQUFLO0FBQUEsTUFBQTtBQUFBLElBQ2Y7QUFBQSxFQUVGO0FBR0EsYUFBVyxZQUFZLFFBQVE7QUFBQSxJQUM5QixDQUFDLGFBQWEsWUFBWSxxQkFBcUI7QUFDOUMsWUFBTSxxQkFBcUI7QUFBQSxRQUMxQjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUVPLGFBQUEsbUJBQW1CLFNBQVMsVUFBVTtBQUFBLElBQUE7QUFBQSxFQUUvQztBQUVXLGFBQUEsR0FBRyxpQkFBaUIsTUFBTTtBQUNwQyxlQUFXLEtBQUs7QUFBQSxFQUFBLENBQ2hCO0FBQ0Y7QUFLQUQsU0FBQUEsSUFBSSxVQUFBLEVBQVksS0FBSyxNQUFNO0FBRWIsZUFBQTtBQUVUQSxlQUFBLEdBQUcsWUFBWSxNQUFNO0FBR2xCLFVBQUEsYUFBYUQsdUJBQWMsY0FBYztBQUMvQyxlQUFXLFdBQVcsSUFBSSxpQkFBaUIsV0FBVyxDQUFDLEVBQUUsTUFBTTtBQUFBLEVBQUEsQ0FDL0Q7QUFDRixDQUFDO0FBS0RDLFNBQUFBLElBQUksR0FBRyxxQkFBcUIsTUFBTTtBQUNwQixlQUFBO0FBQ2IsTUFBSSxRQUFRLGFBQWEsU0FBVUEsVUFBQUEsSUFBSSxLQUFLO0FBQzdDLENBQUM7QUFNREEsU0FBQSxJQUFJLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxhQUFhLFlBQVk7QUFDdEQsVUFBQSxNQUFNLDBCQUEwQixPQUFPO0FBQ2hELENBQUM7QUFFREEsU0FBQSxJQUFJLEdBQUcsc0JBQXNCLENBQUMsT0FBTyxZQUFZO0FBQ3hDLFVBQUEsTUFBTSx1QkFBdUIsT0FBTztBQUM3QyxDQUFDO0FBR0RBLFNBQUFBLElBQUksR0FBRyxlQUFlLE1BQU07QUFDWixpQkFBQSxRQUFRLENBQUMsV0FBVztBQUM5QixRQUFBLENBQUMsT0FBTyxlQUFlO0FBQzFCLGFBQU8sTUFBTTtBQUFBLElBQUE7QUFBQSxFQUNkLENBQ0E7QUFDRCxpQkFBZSxNQUFNO0FBQ3RCLENBQUM7In0=
