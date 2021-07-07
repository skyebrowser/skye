import { AppWindow } from './windows/app';
import { extensions } from 'electron-extensions';
import { app, BrowserWindow, ipcMain } from 'electron';
import { SessionsService } from './sessions-service';
import { ElectronChromeExtensions } from 'electron-chrome-extensions';

export class WindowsService {
  public list: AppWindow[] = [];

  public current: AppWindow;

  public lastFocused: AppWindow;

  constructor(sessions: SessionsService) {
    if (process.env.ENABLE_EXTENSIONS) {
      sessions.chromeExtensions = new ElectronChromeExtensions({
        modulePath: `${app.getAppPath()}/node_modules/electron-chrome-extensions`,
        session: sessions.view,
        createTab: async (details) => {
          const win =
            this.list.find((x) => x.id === details.windowId) ||
            this.lastFocused;

          if (!win) throw new Error('Window not found');

          const view = win.viewManager.create(details);
          return [view.webContents, win.win];
        },
        selectTab: (tab, window) => {
          const win = this.list.find((x) => x.id === window.id);
          win.viewManager.select(tab.id, true);
        },
        removeTab: (tab, window) => {
          const win = this.list.find((x) => x.id === window.id);
          win.viewManager.destroy(tab.id);
        },
        createWindow: async (details) => {
          return this.open(details.incognito).win;
        },
        removeWindow: (window) => {
          const win = this.list.find((x) => x.id === window.id);
          this.list = this.list.filter((w) => w !== win);
          win.win.destroy();
        },
      });
    }

    ipcMain.handle('get-tab-zoom', (e, tabId) => {
      return this.findByBrowserView(tabId).viewManager.views.get(tabId)
        .webContents.zoomFactor;
    });
  }

  public open(incognito = false) {
    const window = new AppWindow(incognito);
    this.list.push(window);

    if (process.env.ENABLE_EXTENSIONS) {
      extensions.windows.observe(window.win);
    }

    window.win.on('focus', () => {
      this.lastFocused = window;
    });

    return window;
  }

  public findByBrowserView(webContentsId: number) {
    return this.list.find((x) => !!x.viewManager.views.get(webContentsId));
  }

  public fromBrowserWindow(browserWindow: BrowserWindow) {
    return this.list.find((x) => x.id === browserWindow.id);
  }

  public broadcast(channel: string, ...args: unknown[]) {
    this.list.forEach((appWindow) =>
      appWindow.win.webContents.send(channel, ...args),
    );
  }
}
