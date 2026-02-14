## Что представляет собой проект

`YandexMusicBetaMod` - это автоматический патчер, который берет актуальную стабильную сборку Яндекс Музыки, вносит изменения и собирает модифицированное приложение.

## Как работает патчер

Основные этапы работы патчера:

1. Загрузка последней стабильной версии Яндекс Музыки через их механизм обновлений.
2. Распаковка установщика и `app.asar`.
3. Патчинг `index.js` (main-process) и `preload.js`.
4. Сборка модов (`renderer`, `preload`, `main`).
5. Подключение `renderer.js` и `renderer.css` ко всем HTML-страницам приложения.
6. Сборка установщика через `electron-builder`.

---

## Как добавлять свои моды в YandexMusicBetaMod

#### 1) Установите IDE

- VS Code или любую другую среду разработки.

#### 2) Установите Bun

Проверка:

```bash
bun --version
```

Если Bun не установлен, скачайте его с https://bun.sh.

#### 3) Клонируйте репозиторий

```bash
git clone https://github.com/Stephanzion/YandexMusicBetaMod.git
cd YandexMusicBetaMod
```

#### 4) Установите зависимости

```bash
bun install
```

#### 5) Запустите патчер

```bash
bun start
```

---

## Что делает `bun start`

Точки входа:

- `src/patcher/index.ts`
- `src/patcher/patcher.ts`
- `src/patcher/api.ts`

Последовательность операций:

1. Загрузка установщика оригинальной Яндекс Музыки в `.versions/<версия>/temp/build.bin`.
2. Распаковка через `7zip-min`.
3. Извлечение `resources/app.asar` и иконок.
4. Распаковка `app.asar` в `.versions/<версия>/src`.
5. Копирование исходников из src в `.versions/<версия>/mod`.
6. Изменение `package.json`, `index.js`, `preload.js`.
7. Сборка UI модов на react (`bun ui:build`) из `src/mod/renderer.ts` в `src/mod/dist/renderer.js` и `renderer.css`.
8. Сборка `preload.ts` через `Bun.build` и встраивание в preload Яндекс Музыки.
9. Встраивание `src/mod/main.js` в `index.js`.
10. Инжект `renderer.js` и `renderer.css` (скомпилированный мод на react) в HTML (в `<head>`).
11. `bun install` (для установки зависимостей мода) внутри модифицированной сборки и запуск `bunx electron-builder`.

---

## Структура проекта

- `src/patcher/*` - логика патчера и сборки. Здесь скачивается и модифицируется оригинальное приложение.
- `src/mod/renderer.ts` - входная точка renderer-части мода (интерфейс).
- `src/mod/preload.ts` - API-мост между renderer и main (`contextBridge`).
- `src/mod/main.js` - main-process логика (IPC, файловая система, ffmpeg, системные операции).
- `src/mod/features/*` - сами моды.
- `src/mod/features/ui/*` - React UI бокового меню мода.
- `scripts/debug-copy-ui.js` - быстрый цикл обновления UI без полного `bun start`.
- `.versions/<версия>/...` - промежуточные и итоговые файлы сборки.

---

## Архитектура выполнения после патчинга

### Main-process (`index.js` + инжект `src/mod/main.js`)

Отвечает за:

- `ipcMain.handle` и `ipcMain.on`
- доступ к файловой системе и системным API
- операции загрузки/обработки треков

### Preload (`preload.js` + инжект `src/mod/preload.ts`)

Отвечает за:

- безопасную прокидку IPC-методов в renderer
- подписки на изменения настроек

### Renderer (`src/mod/renderer.ts`)

Отвечает за:

- запуск модов в браузерном контексте
- перехват API через `initFetchInterceptor()`
- запуск React-интерфейса мода

### UI (`src/mod/features/ui`)

Отвечает за:

- боковое меню
- переключатели и настройки модов
- запись состояния в `mod_settings.json` через `window.yandexMusicMod.*`

---

## Добавление собственного мода: практический сценарий

### Шаг 1. Создайте модуль фичи

Создайте папку: `src/mod/features/compact-player`

Файл `src/mod/features/compact-player/compact-player.ts`:

```ts
const STYLE_ID = "yandex-music-mod-compact-player-style";

async function syncCompactPlayerStyle() {
  const enabled = (await window.yandexMusicMod.getStorageValue("compact-player/enabled")) === true;

  document.getElementById(STYLE_ID)?.remove();
  if (!enabled) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    div[class*="PlayerBar_root_"] {
      min-height: 56px !important;
    }
  `;
  document.head.appendChild(style);
}

window.yandexMusicMod.onStorageChanged((key: string) => {
  if (key === "compact-player/enabled") syncCompactPlayerStyle();
});

syncCompactPlayerStyle();
```

Файл `src/mod/features/compact-player/index.ts`:

```ts
import "./compact-player";
```

### Шаг 2. Подключите мод в renderer entrypoint

В `src/mod/renderer.ts` добавьте импорт:

```ts
import "./features/compact-player";
```

Важно: `initFetchInterceptor()` должен запускаться раньше фич, которые модифицируют API-ответы.

### Шаг 3. Добавьте карточку в UI меню

Создайте `src/mod/features/ui/components/compact-player.tsx`:

```tsx
import { useEffect, useState } from "react";
import { PanelsTopLeft } from "lucide-react";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";

export function CompactPlayer() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      setEnabled((await window.yandexMusicMod.getStorageValue("compact-player/enabled")) === true);
    })();
  }, []);

  return (
    <ExpandableCard title="Компактный плеер" icon={<PanelsTopLeft className="h-4 w-4" />}>
      <div className="flex items-center gap-3 px-3 pt-2">
        <Switch
          id="compact-player-toggle"
          checked={enabled}
          onCheckedChange={(value) => {
            setEnabled(value);
            window.yandexMusicMod.setStorageValue("compact-player/enabled", value);
          }}
        />
        <Label htmlFor="compact-player-toggle" className="cursor-pointer">
          Уменьшить нижний плеер
        </Label>
      </div>
    </ExpandableCard>
  );
}
```

### Шаг 4. Подключите компонент в `App.tsx`

```tsx
import { CompactPlayer } from "@ui/components/compact-player";

// ...
<CompactPlayer />;
```

### Шаг 5. Соберите и проверьте

Полная сборка:

```bash
bun start
```

Быстрая перекомпиляция UI без пересборки патчера:

```bash
bun ui:dev
```

После `bun ui:dev` откройте DevTools в Яндекс Музыке (ctrl+shift+i) и обновите renderer (`F5`).

---

## Как быстро перекомпилировать интерфейс без полного патчинга

1. Выполните `bun run ui:build`
2. Скрипт сам скомпилирует и скопирует renderer из `src/mod/dist/*` в `.versions/<версия>/mod/app/yandexMusicMod/`

### Важно

В `scripts/debug-copy-ui.js` версия прописана вручную:

```js
const modPath = ".versions/5.86.0/mod/app/yandexMusicMod/";
```

Перед `bun ui:dev` убедитесь, что `modPath` указывает на ту версию, с которой идет текущая отладка.

---

## Когда нужны `main.js` и `preload.ts` (а не только renderer)

Используйте main/preload, если мод должен:

- работать с файлами
- открывать системные директории
- использовать нативные библиотеки
- выполнять операции, недоступные в браузерном контексте

### Пример: получить платформу ОС

`src/mod/main.js`:

```js
electron.ipcMain.handle("yandexMusicMod.system.getPlatform", () => process.platform);
```

`src/mod/preload.ts` (добавить в `exposeInMainWorld`):

```ts
getPlatform: () => electron.ipcRenderer.invoke("yandexMusicMod.system.getPlatform"),
```

`src/types/global.d.ts`:

```ts
getPlatform: () => Promise<string>;
```

Использование в renderer:

```ts
const platform = await window.yandexMusicMod.getPlatform();
console.log("[my-mod] platform:", platform);
```

---

## Хранение настроек

Настройки сохраняются в `mod_settings.json` в директории `electron.app.getPath("userData")`.

Рекомендуемый формат ключей:

- `compact-player/enabled`
- `compact-player/size`
- `my-mod/someFlag`

Использование префикса (`namespace`) защищает от конфликтов между модами.

---

## Типовые проблемы и решения

### Изменения в `main.js` не видны после `bun ui:dev`

Это нормальное поведение. `bun ui:dev` обновляет только renderer-часть.

Для изменений в `main.js` и `preload.ts` можно сначала изменить распакованные файлы приложения (например в `.versions\5.86.0\mod\preload.js`) и перезапустить electron приложение без сборки командой `bunx electron .versions\5.86.0\mod\index.js`. После тестирования, можно добавить новый код в файлы патчера - `src\mod\preload.ts`, чтобы патчер сам скопировал этот код в код Яндекс Музыки.

### Новая зависимость не работает в `main.js`

`main.js` встраивается как обычный JS-текст.

Рекомендации:

- использовать `require(...)`, а не `import`
- убедиться, что зависимость добавлена в корневой `package.json`

---

## Полезные приемы для разработки

- DevTools: `Ctrl+Shift+I`
- автооткрытие DevTools при запуске: поменять в файле `.env` значение `AUTO_OPEN_DEVTOOLS=true`
- запуск без сборки инсталлера:
  - закомментировать `bunx electron-builder` в `src/patcher/patcher.ts`
  - раскомментировать `bunx electron .`
