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
