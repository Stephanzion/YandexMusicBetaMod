import { searchProperty } from "./react-fiber-search.js";
import { z } from "zod";
import { ok, err, Result } from "neverthrow";
import posthog from "posthog-js";

const PLAYER_SELECTOR = 'section[data-test-id="PLAYERBAR_DESKTOP"]';
const PLAY_BUTTON_SELECTOR = 'button[data-test-id="PLAY_BUTTON"]';
const PAUSE_BUTTON_SELECTOR = 'button[data-test-id="PAUSE_BUTTON"]';

let hasAdsInPlayer = false;

export function isPlaying(): Result<boolean, string> {
  const player = document.querySelector(PLAYER_SELECTOR);
  if (!player) {
    return err("Player element not found in DOM");
  }

  const playButton = player.querySelector(PLAY_BUTTON_SELECTOR);
  const pauseButton = player.querySelector(PAUSE_BUTTON_SELECTOR);

  if (!pauseButton && !playButton) {
    return err("Neither pause nor play button found in player");
  }

  // If pause button exists, the player is currently playing
  return ok(!!pauseButton);
}

export function getProgress(): Result<{ duration: number; progress: number; position: number }, string> {
  const player = document.querySelector(PLAYER_SELECTOR);
  if (!player) {
    return err("Player element not found in DOM");
  }

  const fiber = searchProperty(player, "timecodeClassName") || searchProperty(player, "currentTimecodeClassName");
  if (!fiber) {
    return err("Fiber not found");
  }

  const validatedFiber = z
    .object({
      duration: z.float64(),
      position: z.float64(),
      progress: z.float64(),
    })
    .safeParse(fiber);

  if (validatedFiber.error) {
    return err(`Validation error: ${validatedFiber.error.message}`);
  }

  return ok({
    duration: validatedFiber.data.duration,
    position: validatedFiber.data.position,
    progress: validatedFiber.data.progress,
  });
}

export function getTrackMeta(): Result<any, string> {
  const player = document.querySelector(PLAYER_SELECTOR);
  if (!player) {
    return err("Player element not found in DOM");
  }

  const fiber = searchProperty(player, "entityMeta");
  if (!fiber) {
    return err("Fiber not found");
  }

  const meta = fiber.entityMeta;
  if (!meta) {
    return err("entityMeta not found");
  }

  if (meta.title === "Промокод Upgrade") {
    if (!hasAdsInPlayer) {
      console.warn("[getTrackMeta] Обнаружена реклама в плеере");
      posthog.capture("upgrade_promocode", {
        track: meta,
      });
    }
    hasAdsInPlayer = true;
    return err("upgrade_promocode");
  }

  const entitySchema = z.object({
    id: z.string(),
    title: z.string(),
    durationMs: z.number(),
    albumId: z.number(),
    type: z.string(),
    genre: z.string(),
    isAvailable: z.boolean(),
    artists: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    ),
    albums: z
      .array(
        z.object({
          id: z.number(),
          title: z.string(),
          year: z.number().optional(),
          isAvailable: z.boolean(),
          genre: z.string().optional(),
          trackCount: z.number(),
        }),
      )
      .optional(),
  });

  const validatedFiber = entitySchema.safeParse(meta);

  if (validatedFiber.error) {
    return err(`Validation error: ${validatedFiber.error.message} for ${JSON.stringify(meta, null, 2)}`);
  }

  // convert proxy object meta to default object
  return ok(JSON.parse(JSON.stringify({ ...meta })));
}
