import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { Input } from "@ui/components/ui/input";
import { Label } from "@ui/components/ui/label";
import { CodeEditor } from "@ui/components/ui/code-editor";

import GeniusApiTester from "./genius-api-tester";
import MusixmatchApiTester from "./musixmatch-api-tester";
import PlayerStateTester from "./player-state-tester";

export function Playground() {
  return (
    <>
      <PlayerStateTester />
      <GeniusApiTester />
      <MusixmatchApiTester />
    </>
  );
}
