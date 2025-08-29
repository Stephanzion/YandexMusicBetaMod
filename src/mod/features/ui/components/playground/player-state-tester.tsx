import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { CodeEditor } from "@ui/components/ui/code-editor";

import { isPlaying, getProgress, getTrackMeta } from "~/mod/features/utils/player";
import { cn } from "@ui/lib/utils";

function PlayerStateTester() {
  const isPlayingQuery = useQuery({
    queryKey: ["player-test-is-playing"],
    queryFn: async () => {
      const data = isPlaying();
      if (data.isErr()) throw data.error;
      return data.value;
    },
    enabled: true,
    retry: false,
    staleTime: 500,
    refetchInterval: 500,
  });

  const getProgressQuery = useQuery({
    queryKey: ["player-test-progress"],
    queryFn: async () => {
      const data = getProgress();
      if (data.isErr()) throw data.error;
      return data.value;
    },
    enabled: true,
    retry: false,
    staleTime: 500,
    refetchInterval: 500,
  });

  const getTrackMetaQuery = useQuery({
    queryKey: ["player-test-track-meta"],
    queryFn: async () => {
      const data = getTrackMeta();
      if (data.isErr()) throw data.error;
      return data.value;
    },
    enabled: true,
    retry: false,
    staleTime: 500,
    refetchInterval: 500,
  });

  return (
    <ExpandableCard title="[DEV] Main Player State Tester">
      <div className="flex w-full flex-col gap-2">
        <div className="flex gap-2">
          <span className="text-sm text-foreground">Status:</span>
          {isPlayingQuery.isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : isPlayingQuery.isError ? (
            <span className="text-sm text-destructive">Error: {isPlayingQuery.error.toString()}</span>
          ) : isPlayingQuery.isSuccess && isPlayingQuery.data != null ? (
            <span className="text-sm text-foreground">{isPlayingQuery.data ? "playing" : "paused"}</span>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>

        <div className="flex gap-2">
          <span className="text-sm text-foreground">Progress:</span>
          {getProgressQuery.isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : getProgressQuery.isError ? (
            <span className="text-sm text-destructive">Error: {getProgressQuery.error.toString()}</span>
          ) : getProgressQuery.isSuccess && getProgressQuery.data != null ? (
            <span className="text-sm text-foreground">
              {`${getProgressQuery.data.position.toFixed(2)} / ${getProgressQuery.data.duration.toFixed(2)} ${getProgressQuery.data.progress.toFixed(2)}%`}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">No data</span>
          )}
        </div>

        {getTrackMetaQuery.isLoading ? (
          <CodeEditor value="Loading..." language="json" />
        ) : getTrackMetaQuery.isError ? (
          <CodeEditor value={"Error: " + getTrackMetaQuery.error.toString()} language="text" />
        ) : getTrackMetaQuery.isSuccess && getTrackMetaQuery.data != null ? (
          <CodeEditor value={JSON.stringify(getTrackMetaQuery.data, null, 2)} language="json" />
        ) : (
          <CodeEditor value="No data available" language="json" />
        )}
      </div>
    </ExpandableCard>
  );
}

export default PlayerStateTester;
