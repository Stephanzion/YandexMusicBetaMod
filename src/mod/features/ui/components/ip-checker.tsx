import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CircleAlert } from "lucide-react";
import { Button } from "./ui/button";

import allowedCountries from "@ui/lib/allowedCountries.json";

export function IPChecker() {
  const [language, setLanguage] = useState("ru");

  const countryQuery = useQuery({
    queryKey: ["country", language],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`http://ip-api.com/json?fields=country,countryCode&lang=${language || "en"}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      await new Promise((resolve) => setTimeout(resolve, 300));
      return data;
    },
    enabled: !!language,
    refetchInterval: 1000 * 30,
    staleTime: 1000 * 60 * 1,
  });

  return (
    <>
      {countryQuery.isSuccess && !allowedCountries.includes(countryQuery.data.countryCode.toUpperCase()) && (
        <div className="bg-destructive/30 border-destructive mx-4 mt-4 flex flex-col items-center justify-between gap-4 rounded-md border px-3 py-3">
          <div className="flex w-full flex-row items-start justify-center gap-2">
            <CircleAlert className="text-foreground h-8 w-8" />

            <p className="text-foreground w-[calc(100%-3rem)] text-sm">
              Ваше местоположение определено как <b>{countryQuery.data.country}</b>. Яндекс Музыка недоступна в этой
              стране, в приложении скорее всего будут ошибки. Вам придется отключить VPN или наоборот настроить его на
              одну из{" "}
              <a
                className="text-blue-300 underline hover:text-blue-400"
                href="https://yandex.ru/support/music/ru/access.html"
                target="_blank"
                rel="noreferrer"
              >
                разрешенных локаций
              </a>
              .
            </p>
          </div>

          <Button
            variant="outline"
            className="text-foreground px-6"
            disabled={
              countryQuery.isRefetching || countryQuery.isFetching || countryQuery.isPending || countryQuery.isLoading
            }
            onClick={() => countryQuery.refetch()}
          >
            Обновить
          </Button>
        </div>
      )}
    </>
  );
}
