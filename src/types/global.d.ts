declare global {
  interface Window {
    yandexMusicMod: {
      getStorageValue: (key: string) => any;
      setStorageValue: (key: string, value: any) => void;
      onStorageChanged: (cb: Function) => void;
      downloadTrack: (downloadInfo: any, trackMeta: any, customDownloadPath?: string) => any;
      selectDownloadFolder: () => Promise<{ success: boolean; path: string | null }>;
      openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
    };
    VERSION: string;
    __getPlayerState: () => any;
  }
}
