import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { CodeEditor } from "@ui/components/ui/code-editor";

import { musixmatchApi } from "@ui/external-apis/musixmatch";
import { type Lyrics, type Subtitle } from "@ui/external-apis/musixmatch/models";
import { Mic } from "lucide-react";

type LyricsType = "lyrics" | "subtitle";

function MusixmatchApiManager() {
  const [artist, setArtist] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [lyricsType, setLyricsType] = useState<LyricsType | null>(null);

  const { data, error, isFetching, isError } = useMusixmatchLyrics(artist, trackTitle, lyricsType);

  const code = useMemo(() => {
    if (isFetching) return "Loading...";
    if (isError) return `Error: ${error.message}`;
    if (data) {
      if ("lyrics_body" in data) {
        return data.lyrics_body;
      }
      if ("subtitle_body" in data) {
        return data.subtitle_body;
      }
    }
    return "";
  }, [data, error, isFetching, isError]);

  const handleSearch = (type: LyricsType) => {
    setLyricsType(type);
  };

  return (
    <ExpandableCard title="[DEV] Musixmatch API Tester" icon={<Mic className="h-4 w-4" />}>
      <div className="flex w-full max-w-sm flex-row items-center gap-3">
        <div className="grid gap-2">
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            value={artist}
            onChange={(e) => {
              setArtist(e.target.value);
              setLyricsType(null);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="track">Track title</Label>
          <Input
            id="track"
            value={trackTitle}
            onChange={(e) => {
              setTrackTitle(e.target.value);
              setLyricsType(null);
            }}
          />
        </div>
      </div>
      <div className="flex w-full justify-center gap-2">
        <Button onClick={() => handleSearch("lyrics")} disabled={isFetching || !artist || !trackTitle}>
          {isFetching && lyricsType === "lyrics" ? "Searching..." : "Get Lyrics"}
        </Button>
        <Button onClick={() => handleSearch("subtitle")} disabled={isFetching || !artist || !trackTitle}>
          {isFetching && lyricsType === "subtitle" ? "Searching..." : "Get Subtitles"}
        </Button>
      </div>

      <CodeEditor value={code} language={lyricsType === "subtitle" ? "lrc" : "text"} />
    </ExpandableCard>
  );
}

const useMusixmatchLyrics = (artist: string, trackTitle: string, lyricsType: LyricsType | null) => {
  return useQuery<Lyrics | Subtitle, Error>({
    queryKey: ["musixmatch", artist, trackTitle, lyricsType],
    queryFn: async () => {
      if (!lyricsType) {
        return Promise.reject(new Error("No lyrics type selected"));
      }

      // Get the axios configuration for the request
      const configResult =
        lyricsType === "lyrics"
          ? await musixmatchApi.getLyricsRequest(trackTitle, artist)
          : await musixmatchApi.getSubtitleRequest(trackTitle, artist);

      if (configResult.isErr()) {
        throw new Error(`Failed to get ${lyricsType} config: ${configResult.error}`);
      }

      // Use yandexMusicMod.axios to make the request
      const response = await (window as any).yandexMusicMod.axios(configResult.value);

      if (!response.success) {
        throw new Error(`Failed to get ${lyricsType}: ${response.error}`);
      }

      // Check Musixmatch API response status
      if (response.data.message.header.status_code !== 200) {
        throw new Error(`Musixmatch API error: ${response.data.message.body}`);
      }

      // Extract the data based on the type
      const data =
        lyricsType === "lyrics"
          ? (response.data.message.body.lyrics as Lyrics)
          : (response.data.message.body.subtitle as Subtitle);

      return data;
    },
    enabled: !!lyricsType && !!artist && !!trackTitle,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export default MusixmatchApiManager;
