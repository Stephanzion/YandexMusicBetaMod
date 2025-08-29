import axios, { AxiosInstance } from "axios";
import { Result, err, ok } from "neverthrow";
import { signRequestUrl } from "./utils";
import { Lyrics, Subtitle, Track } from "./models";

const MUSIXMATCH_API_URL = "https://apic.musixmatch.com/ws/1.1/";

const commonApiParams = {
  usertoken: "250721b994519ea801e6582aeb61c797d5cecb501ed93b6c22e42d",
  app_id: "android-player-v1.0",
  format: "json",
};

class MusixmatchApi {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: MUSIXMATCH_API_URL,
      headers: {
        "Accept-Encoding": "gzip",
        "User-Agent": "Dalvik/2.1.0 (Linux; U; Android 9; ASUS_I005DA Build/PI)",
        "x-mxm-endpoint": "default",
        "x-mxm-token-guid": "952653dfc8898b38",
      },
    });
  }

  async getSubtitle(trackName: string, artistName: string): Promise<Result<Subtitle, string>> {
    try {
      const params = new URLSearchParams({
        ...commonApiParams,
        q_track: trackName,
        q_artist: artistName,
      });

      const url = `matcher.subtitle.get?${params.toString()}`;
      const signedUrlResult = await signRequestUrl(url);

      if (signedUrlResult.isErr()) {
        return err(signedUrlResult.error.message);
      }

      const response = await this.client.get(signedUrlResult.value);

      if (response.data.message.header.status_code !== 200) {
        return err(response.data.message.body);
      }

      return ok(response.data.message.body.subtitle as Subtitle);
    } catch (error: any) {
      return err(error.message);
    }
  }

  async getLyrics(trackName: string, artistName: string): Promise<Result<Lyrics, string>> {
    try {
      const params = new URLSearchParams({
        ...commonApiParams,
        q_track: trackName,
        q_artist: artistName,
      });

      const url = `matcher.lyrics.get?${params.toString()}`;
      const signedUrlResult = await signRequestUrl(url);

      if (signedUrlResult.isErr()) {
        return err(signedUrlResult.error.message);
      }

      const response = await this.client.get(signedUrlResult.value);

      if (response.data.message.header.status_code !== 200) {
        return err(response.data.message.body);
      }

      return ok(response.data.message.body.lyrics as Lyrics);
    } catch (error: any) {
      return err(error.message);
    }
  }
}

export const musixmatchApi = new MusixmatchApi();
