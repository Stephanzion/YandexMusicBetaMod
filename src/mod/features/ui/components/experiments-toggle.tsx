import { useMemo, useState, useEffect, useRef, use } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAccountExperiments } from "~/mod/features/utils/api";

import { ExpandableCard } from "@ui/components/ui/expandable-card";
import { Button } from "@ui/components/ui/button";
import { If } from "@ui/components/ui/if";
import { Progress } from "@ui/components/ui/progress";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@ui/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui/components/ui/select";
import { Input } from "@ui/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/components/ui/tooltip";
import { Label } from "@ui/components/ui/label";
import { Switch } from "@ui/components/ui/switch";
import { CodeEditor } from "@ui/components/ui/code-editor";
import { ScrollArea } from "@ui/components/ui/scroll-area";
import { Info, Search, TestTube, Circle, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

export function ExperimentsToggle() {
  const [search, setSearch] = useState("");
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>("");
  const [accountExperiments, setAccountExperiments] = useState<{ id: string; value: any }[]>([]);
  const [accountExperimentsOverride, setAccountExperimentsOverride] = useState<{ id: string; value: any }[]>([]);
  const [editedValue, setEditedValue] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const accountExperimentsQuery = useQuery({
    queryKey: ["accountExperiments"],
    queryFn: async () => {
      const data = await getAccountExperiments();
      if (data.isErr()) {
        throw new Error(data.error);
      }
      return data.value;
    },
    enabled: true,
    retry: true,
  });

  // Filter experiments based on search
  const filteredExperiments = useMemo(() => {
    return accountExperiments.filter(
      (experiment) =>
        search.trim().length === 0 ||
        experiment.id.toLowerCase().includes(search.replaceAll(" ", "").replaceAll("\t", "").toLowerCase()),
    );
  }, [accountExperiments, search]);

  // Get current experiment data
  const currentExperiment = useMemo(() => {
    return accountExperiments.find((exp) => exp.id === selectedExperimentId);
  }, [accountExperiments, selectedExperimentId]);

  // Handle saving experiment override
  const handleSave = async () => {
    if (!selectedExperimentId || !editedValue) return;

    setIsSaving(true);
    try {
      // Parse and validate JSON
      const parsedValue = JSON.parse(editedValue);

      // Update override array
      const newOverrides = [...accountExperimentsOverride];
      const existingIndex = newOverrides.findIndex((override) => override.id === selectedExperimentId);

      if (existingIndex >= 0) {
        newOverrides[existingIndex] = { id: selectedExperimentId, value: parsedValue };
      } else {
        newOverrides.push({ id: selectedExperimentId, value: parsedValue });
      }

      // Save to storage
      await (window as any).yandexMusicMod.setStorageValue("settings/accountExperimentsOverride", newOverrides);
      setAccountExperimentsOverride(newOverrides);
      setHasUnsavedChanges(false);

      toast.success(`Эксперимент "${selectedExperimentId}" сохранен`);
    } catch (error) {
      toast.error("Ошибка: Некорректный JSON формат");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle ON button click
  const handleOnClick = async () => {
    if (!selectedExperimentId) {
      toast.error("Выберите эксперимент");
      return;
    }

    setIsSaving(true);
    try {
      const onValue = {
        group: "on",
        value: {
          title: "on",
          enabled: true,
        },
      };

      // Update override array
      const newOverrides = [...accountExperimentsOverride];
      const existingIndex = newOverrides.findIndex((override) => override.id === selectedExperimentId);

      if (existingIndex >= 0) {
        newOverrides[existingIndex] = { id: selectedExperimentId, value: onValue };
      } else {
        newOverrides.push({ id: selectedExperimentId, value: onValue });
      }

      // Save to storage
      await (window as any).yandexMusicMod.setStorageValue("settings/accountExperimentsOverride", newOverrides);
      setAccountExperimentsOverride(newOverrides);
      setHasUnsavedChanges(false);

      toast.success(`Эксперимент "${selectedExperimentId}" включен`);
    } catch (error) {
      toast.error("Ошибка при включении эксперимента");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (accountExperimentsQuery.data) {
      const experiments = Object.entries(accountExperimentsQuery.data).map((object: any) => {
        return { id: object[0], value: object[1] };
      });

      setAccountExperiments(experiments);

      // Auto-select first experiment if none selected
      if (!selectedExperimentId && experiments.length > 0) {
        setSelectedExperimentId(experiments[0]!.id);
      }
    }
  }, [accountExperimentsQuery.data, selectedExperimentId]);

  // Update edited value when selected experiment changes
  useEffect(() => {
    if (currentExperiment) {
      // Check if there's an override for this experiment
      const override = accountExperimentsOverride.find((override) => override.id === selectedExperimentId);
      const valueToShow = override ? override.value : currentExperiment.value;

      setEditedValue(JSON.stringify(valueToShow, null, 2));
      setHasUnsavedChanges(false);
    } else {
      setEditedValue("");
      setHasUnsavedChanges(false);
    }
  }, [currentExperiment, selectedExperimentId, accountExperimentsOverride]);

  // Handle edited value changes
  useEffect(() => {
    if (currentExperiment) {
      const override = accountExperimentsOverride.find((override) => override.id === selectedExperimentId);
      const originalValue = override ? override.value : currentExperiment.value;
      const currentEditedValue = editedValue.trim();

      if (currentEditedValue && currentEditedValue !== JSON.stringify(originalValue, null, 2)) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
    }
  }, [editedValue, currentExperiment, selectedExperimentId, accountExperimentsOverride]);

  useEffect(() => {
    (async () => {
      setAccountExperimentsOverride(
        (await (window as any).yandexMusicMod.getStorageValue("settings/accountExperimentsOverride")) || [],
      );
    })();
  }, []);

  return (
    <ExpandableCard title="Экспериментальные функции" icon={<TestTube className="h-4 w-4" />} opened={false}>
      <div className="flex flex-col gap-5 pt-2">
        <Alert variant="default" className="cursor-default">
          <Info />
          <div className="text-sm text-muted-foreground">
            Некоторые экспериментальные функции Яндекс Музыки могут сломать интерфейс приложения, используйте только
            если вы знаете, что делаете
          </div>
        </Alert>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Поиск экспериментов..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {accountExperimentsOverride.find((override) => override.id === selectedExperimentId) && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={async () => {
                    const newOverrides = accountExperimentsOverride.filter(
                      (override) => override.id !== selectedExperimentId,
                    );
                    await (window as any).yandexMusicMod.setStorageValue(
                      "settings/accountExperimentsOverride",
                      newOverrides,
                    );
                    setAccountExperimentsOverride(newOverrides);
                    toast.success(`Переопределение "${selectedExperimentId}" удалено`);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="default"
                onClick={handleOnClick}
                disabled={!selectedExperimentId || isSaving}
                className="px-4"
              >
                {isSaving ? "..." : "ON"}
              </Button>
            </div>

            <ScrollArea className="h-[200px] w-full border rounded-md overflow-hidden">
              <div className="p-2 w-full overflow-hidden">
                {filteredExperiments.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {filteredExperiments.map((experiment) => {
                      const hasOverride = accountExperimentsOverride.some((override) => override.id === experiment.id);
                      const isSelected = selectedExperimentId === experiment.id;

                      return (
                        <Button
                          key={experiment.id}
                          variant="ghost"
                          className="w-full max-w-full justify-start h-auto py-2 px-3 overflow-hidden whitespace-normal break-all"
                          style={isSelected ? { outline: "1px solid var(--border)" } : {}}
                          onClick={() => setSelectedExperimentId(experiment.id)}
                        >
                          <div className="flex items-center gap-2 w-full max-w-full min-w-0 overflow-hidden">
                            {hasOverride && (
                              <Circle className="h-[6px]! w-[6px]! fill-border text-border flex-shrink-0" />
                            )}
                            <span className="text-left text-sm min-w-0 flex-1 break-all overflow-hidden">
                              {experiment.id}
                            </span>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">Эксперименты не найдены</div>
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedExperimentId && currentExperiment && (
            <div className="flex flex-col gap-3">
              <CodeEditor
                id="experiment-editor"
                value={editedValue}
                onChange={(value: string | undefined) => setEditedValue(value || "")}
                language="json"
                className="h-[200px]"
              />

              <div className="flex gap-2">
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving || !editedValue.trim()}
                  className="flex-1"
                >
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </Button>

                {hasUnsavedChanges && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset to original value
                      const override = accountExperimentsOverride.find(
                        (override) => override.id === selectedExperimentId,
                      );
                      const originalValue = override ? override.value : currentExperiment.value;
                      setEditedValue(JSON.stringify(originalValue, null, 2));
                      setHasUnsavedChanges(false);
                    }}
                  >
                    Отмена
                  </Button>
                )}
              </div>

              {hasUnsavedChanges && (
                <Alert variant="default">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    У вас есть несохраненные изменения. Нажмите "Сохранить" чтобы применить их.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>
    </ExpandableCard>
  );
}
