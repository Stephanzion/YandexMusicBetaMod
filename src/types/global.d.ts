declare global {
  interface Window {
    yandexMusicMod: {
      getStorageValue: (key: string) => any;
      setStorageValue: (key: string, value: any) => void;
      onStorageChanged: (cb: Function) => void;
      downloadTrack: (downloadInfo: any, trackMeta: any, customDownloadPath?: string) => any;
      selectDownloadFolder: () => Promise<{ success: boolean; path: string | null }>;
      openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
      axios: (config: string) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
        status?: number;
        statusText?: string;
        headers?: any;
      }>;
    };
    VERSION: string;
    __getPlayerState: () => any;
  }
}

export {};
