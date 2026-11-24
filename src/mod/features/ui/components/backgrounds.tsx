import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { BACKGROUND_LIMITS, BACKGROUND_SETTINGS_KEYS, type BackgroundFit } from "~/mod/features/backgrounds/settings";
import { refreshBackground } from "~/mod/features/backgrounds/backgrounds";
import { deleteBackgroundImage, getBackgroundImage, saveBackgroundImage } from "~/mod/features/backgrounds/storage";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { Button } from "@ui/components/ui/button";
import { If } from "@ui/components/ui/if";
import { Alert } from "@ui/components/ui/alert";
import { Slider } from "@ui/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { toast } from "sonner";

import { Image as ImageIcon, Info, Trash2, Upload } from "lucide-react";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 2560;
const KEEP_ORIGINAL_BYTES = 4 * 1024 * 1024;

const FIT_OPTIONS: Array<{ value: BackgroundFit; label: string }> = [
  { value: "cover", label: "Заполнить экран" },
  { value: "contain", label: "Вписать целиком" },
  { value: "stretch", label: "Растянуть" },
  { value: "tile", label: "Плитка" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

async function prepareImage(file: File): Promise<string> {
  const original = await readFileAsDataUrl(file);

  // SVG и GIF лучше оставить как есть: вектор не теряет качество, а GIF — анимацию.
  if (file.type === "image/svg+xml" || file.type === "image/gif") return original;

  const shouldDownscale = file.size > KEEP_ORIGINAL_BYTES;
  if (!shouldDownscale) return original;

  try {
    const image = await loadImage(original);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    if (scale >= 1) return original;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) return original;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch (error) {
    console.warn("[Backgrounds] Failed to downscale image, using original:", error);
    return original;
  }
}

export function Backgrounds() {
  const [enabled, setEnabled] = useState(false);
  const [blur, setBlur] = useState(BACKGROUND_LIMITS.blur.fallback);
  const [dim, setDim] = useState(BACKGROUND_LIMITS.dim.fallback);
  const [fit, setFit] = useState<BackgroundFit>("cover");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [savedEnabled, savedBlur, savedDim, savedFit, image] = await Promise.all([
        window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.enabled),
        window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.blur),
        window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.dim),
        window.yandexMusicMod.getStorageValue(BACKGROUND_SETTINGS_KEYS.fit),
        getBackgroundImage(),
      ]);

      setEnabled(savedEnabled === true);
      if (typeof savedBlur === "number") setBlur(savedBlur);
      if (typeof savedDim === "number") setDim(savedDim);
      if (savedFit === "cover" || savedFit === "contain" || savedFit === "stretch" || savedFit === "tile") {
        setFit(savedFit);
      }

      setPreview(image?.dataUrl ?? null);
      setFileName(image?.name ?? null);
    })();
  }, []);

  const persist = (key: string, value: unknown) => {
    window.yandexMusicMod.setStorageValue(key, value);
  };

  const handleToggle = (value: boolean) => {
    if (value && !preview) {
      toast.error("Сначала выберите изображение для фона");
      fileInputRef.current?.click();
      return;
    }

    setEnabled(value);
    persist(BACKGROUND_SETTINGS_KEYS.enabled, value);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Выберите файл изображения");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error("Файл слишком большой", { description: "Максимальный размер — 25 МБ." });
      return;
    }

    setIsSaving(true);

    try {
      const dataUrl = await prepareImage(file);
      const saved = await saveBackgroundImage({ name: file.name, mimeType: file.type, dataUrl });

      if (!saved) throw new Error("Failed to save background");

      setPreview(dataUrl);
      setFileName(file.name);
      setEnabled(true);
      persist(BACKGROUND_SETTINGS_KEYS.enabled, true);
      await refreshBackground();

      toast.success("Фон установлен");
    } catch (error) {
      console.error("[Backgrounds] Failed to set background:", error);
      toast.error("Не удалось установить фон");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBackgroundImage();
      setPreview(null);
      setFileName(null);
      setEnabled(false);
      persist(BACKGROUND_SETTINGS_KEYS.enabled, false);
      await refreshBackground();

      toast.success("Фон удалён");
    } catch (error) {
      console.error("[Backgrounds] Failed to delete background:", error);
      toast.error("Не удалось удалить фон");
    }
  };

  return (
    <ExpandableCard title="Фоны интерфейса" icon={<ImageIcon className="h-4 w-4" />}>
      <div className="flex flex-col gap-5 pt-2 px-3">
        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Своё изображение на фоне приложения. Файл хранится локально на этом компьютере и никуда не отправляется.
          </div>
        </Alert>

        <div className="flex items-center gap-3">
          <Switch id="backgrounds-toggle" checked={enabled} onCheckedChange={handleToggle} />
          <Label htmlFor="backgrounds-toggle" className="cursor-pointer">
            Свой фон интерфейса
          </Label>
        </div>

        {preview && (
          <div className="flex flex-col gap-2">
            <div
              className="h-36 w-full rounded-md border bg-cover bg-center"
              style={{ backgroundImage: `url("${preview}")` }}
            />
            {fileName && <span className="text-muted-foreground truncate text-xs">{fileName}</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
          />

          <Button variant="default" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
            <Upload className="h-4 w-4" />
            {preview ? "Заменить изображение" : "Выбрать изображение"}
          </Button>

          {preview && (
            <Button variant="outline" size="sm" onClick={() => void handleDelete()} disabled={isSaving}>
              <Trash2 className="h-4 w-4" />
              Удалить фон
            </Button>
          )}
        </div>

        <If condition={enabled}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Размытие</Label>
              <span className="text-muted-foreground text-xs">{blur} px</span>
            </div>
            <Slider
              min={BACKGROUND_LIMITS.blur.min}
              max={BACKGROUND_LIMITS.blur.max}
              step={1}
              value={[blur]}
              onValueChange={(values) => setBlur(values[0] ?? 0)}
              onValueCommit={(values) => persist(BACKGROUND_SETTINGS_KEYS.blur, values[0] ?? 0)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Затемнение</Label>
              <span className="text-muted-foreground text-xs">{dim}%</span>
            </div>
            <Slider
              min={BACKGROUND_LIMITS.dim.min}
              max={BACKGROUND_LIMITS.dim.max}
              step={1}
              value={[dim]}
              onValueChange={(values) => setDim(values[0] ?? 0)}
              onValueCommit={(values) => persist(BACKGROUND_SETTINGS_KEYS.dim, values[0] ?? 0)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Как вписать изображение</Label>
            <Select
              value={fit}
              onValueChange={(value) => {
                setFit(value as BackgroundFit);
                persist(BACKGROUND_SETTINGS_KEYS.fit, value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </If>
      </div>
    </ExpandableCard>
  );
}
