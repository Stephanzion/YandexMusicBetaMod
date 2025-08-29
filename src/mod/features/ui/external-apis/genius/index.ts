import axios from "axios";
import { ResultAsync } from "neverthrow";

import { Section, Song } from "./models";

const GENIUS_LOGGED_OUT_TOKEN = "ZTejoT_ojOEasIkT9WrMBhBQOz6eYKK5QULCMECmOhvwqjRZ6WbpamFe3geHnvp3";

interface GeniusSearchResponse {
	sections: Section[];
}

export interface GeniusSongResponse {
	song: Song;
}

class GeniusApi {
	private static readonly BASE_URL = "https://api.genius.com";

	private static readonly COMMON_HEADERS = {
		"Accept-Encoding": "gzip",
		Authorization: `Bearer ${GENIUS_LOGGED_OUT_TOKEN}`,
		Connection: "Keep-Alive",
		Host: "api.genius.com",
		"User-Agent": "okhttp/4.10.0, Genius/7.8.1.4575 (Android; Android 9; Asus ASUS_I005DA)",
		"X-Genius-Android-Version": "7.8.1.4575",
		"x-genius-app-background-request": "0",
		"X-Genius-Logged-Out": "true",
	};

	private request<T>(endpoint: string): ResultAsync<T, Error> {
		const url = `${GeniusApi.BASE_URL}/${endpoint}`;

		return ResultAsync.fromPromise(
			axios
				.get(url, {
					headers: GeniusApi.COMMON_HEADERS,
				})
				.then((response) => response.data.response as T),
			(error) => new Error(`Genius API request failed: ${error}`),
		);
	}

	/**
	 * Searches for songs on Genius.
	 * @param query The search query.
	 * @returns A promise that resolves to the search results.
	 */
	public search(query: string): ResultAsync<GeniusSearchResponse, Error> {
		const endpoint = `search/multi?q=${encodeURIComponent(query)}`;
		return this.request<GeniusSearchResponse>(endpoint);
	}

	/**
	 * Gets a song by its ID from Genius.
	 * @param songId The ID of the song.
	 * @returns A promise that resolves to the song data.
	 */
	public getSong(songId: number): ResultAsync<GeniusSongResponse, Error> {
		const endpoint = `songs/${songId}`;
		return this.request<GeniusSongResponse>(endpoint);
	}
}

export const geniusApi = new GeniusApi();
