const LEADING_TIMESTAMPS = /^\s*((?:\[\d{1,3}:\d{1,2}(?::\d{1,2})?(?:[.:]\d{1,3})?\])+)/;
const TIMESTAMP = /\[(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?(?:[.:](\d{1,3}))?\]/;
const WORD_TIMESTAMP = /<\d{1,3}:\d{1,2}(?::\d{1,2})?(?:[.:]\d{1,3})?>/g;
const INLINE_TIMESTAMP = /\[\d{1,3}:\d{1,2}(?::\d{1,2})?(?:[.:]\d{1,3})?\]/g;
const LEADING_TAGS =
  /^\s*(?:(?:\[\d{1,3}:\d{1,2}(?::\d{1,2})?(?:[.:]\d{1,3})?\])|\[(?:ar|al|ti|by|offset|length|re|ve|au):[^\]]*\])+\s*/;

interface ParsedTimestamp {
  minutes: number;
  seconds: number;
  centiseconds: string;
}

function parseTimestamp(timestamp: string): ParsedTimestamp | null {
  const match = TIMESTAMP.exec(timestamp);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const third = match[3] === undefined ? null : Number(match[3]);
  const fraction = match[4] ?? "";

  if (third !== null) {
    return {
      minutes: first * 60 + second,
      seconds: third,
      centiseconds: (fraction + "00").slice(0, 2),
    };
  }

  return {
    minutes: first,
    seconds: second,
    centiseconds: (fraction + "00").slice(0, 2),
  };
}

function formatTimestamp({ minutes, seconds, centiseconds }: ParsedTimestamp): string {
  return `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${centiseconds}]`;
}

function formatSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  return formatTimestamp({
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60,
    centiseconds: "00",
  });
}

// Приводит LRC к формату, который понимает плеер Яндекс Музыки: [mm:ss.xx]текст.
// Заодно убирает word-sync теги <mm:ss.xx> и часы в таймкодах.
export function sanitizeLrc(rawLrc: string): string {
  if (!rawLrc) return "";

  const result: string[] = [];

  for (const rawLine of rawLrc.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.replace(WORD_TIMESTAMP, "");
    const leading = LEADING_TIMESTAMPS.exec(line);
    if (!leading) continue;

    const text = line.slice(leading[0].length).replace(INLINE_TIMESTAMP, "").trim();
    if (!text) continue;

    const timestamp = parseTimestamp(leading[1] ?? "");
    if (!timestamp) continue;

    result.push(`${formatTimestamp(timestamp)}${text}`);
  }

  return result.join("\n");
}

// Убирает таймкоды из LRC, чтобы показать синхронизированный текст в обычном режиме.
export function lrcToPlainText(rawLrc: string): string {
  if (!rawLrc) return "";

  return rawLrc
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(LEADING_TAGS, "").replace(WORD_TIMESTAMP, "").trimEnd())
    .join("\n")
    .trim();
}

// Делает из обычного текста псевдо-LRC: строки распределяются равномерно по длительности трека.
// Нужно для полноэкранного режима "текстомузыка", если синхронизированного текста нет.
export function plainToLrc(plainText: string, durationMs?: number): string {
  if (!plainText) return "";

  const lines = plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return "";

  const totalSeconds = durationMs && durationMs > 10_000 ? durationMs / 1000 : lines.length * 4;
  const step = Math.max(1, Math.floor(totalSeconds / (lines.length + 1)));

  return lines.map((line, index) => `${formatSeconds(index * step)}${line}`).join("\n");
}

export function isLrcLike(text: string): boolean {
  return LEADING_TIMESTAMPS.test(text);
}
