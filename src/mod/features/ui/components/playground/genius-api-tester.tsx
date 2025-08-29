import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { CodeEditor } from "@ui/components/ui/code-editor";

import { geniusApi } from "@ui/external-apis/genius";
import { FluffyChild, PurpleChild, LyricsDOM } from "@ui/external-apis/genius/models";

function GeniusApiTester() {
  const [artist, setArtist] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);

  const { data, error, isFetching, isError } = useGeniusLyrics(artist, trackTitle, searchEnabled);

  const code = useMemo(() => {
    if (isFetching) return "Loading...";
    if (isError) return `Error: ${error.message}`;
    if (data) return data;
    return "";
  }, [data, error, isFetching, isError]);

  const handleSearch = () => {
    setSearchEnabled(true);
  };

  return (
    <ExpandableCard title="[DEV] Genius API Tester">
      <div className="flex w-full max-w-sm flex-row items-center gap-3">
        <div className="grid gap-2">
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            value={artist}
            onChange={(e) => {
              setArtist(e.target.value);
              setSearchEnabled(false);
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
              setSearchEnabled(false);
            }}
          />
        </div>
      </div>

      <Button onClick={handleSearch} disabled={isFetching || !artist || !trackTitle}>
        {isFetching ? "Searching..." : "Search"}
      </Button>

      <CodeEditor value={code} language="text" />
    </ExpandableCard>
  );
}

function parseLyrics(lyricsDom: LyricsDOM): string {
  let text = "";

  function processNode(node: string | PurpleChild | FluffyChild) {
    if (typeof node === "string") {
      text += node;
    } else if (node.tag === "br") {
      text += "\n";
    } else if (node.children) {
      for (const child of node.children) {
        processNode(child as FluffyChild);
      }
    }
  }

  for (const node of lyricsDom.children) {
    processNode(node);
  }

  return text;
}

const useGeniusLyrics = (artist: string, trackTitle: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["genius", artist, trackTitle],
    queryFn: async () => {
      const searchQuery = `${artist} ${trackTitle}`;
      const searchResult = await geniusApi.search(searchQuery);

      if (searchResult.isErr()) {
        throw new Error("Failed to search on Genius.", {
          cause: searchResult.error,
        });
      }

      const songHit = searchResult.value.sections.find((s) => s.type === "song")?.hits[0];

      if (!songHit) {
        throw new Error("Track not found.");
      }

      const songResult = await geniusApi.getSong(songHit.result.id);

      if (songResult.isErr()) {
        throw new Error("Failed to get song from Genius.", {
          cause: songResult.error,
        });
      }

      const lyricsText = parseLyrics(songResult.value.song.lyrics.dom);

      return `${lyricsText}\n\n${songResult.value.song.share_url}\n\n`;
    },
    enabled: enabled && !!artist && !!trackTitle,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export default GeniusApiTester;
