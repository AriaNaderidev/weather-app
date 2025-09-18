"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { placeAtom, loadingCityAtom } from "../app/atom";
import axios from "axios";
import { format, parseISO, fromUnixTime } from "date-fns";
import { convertKelvinToCelsius } from "@/utils/convertKelvinToCelsius";
import { metersToKilometers } from "@/utils/metersToKilometers";
import { convertWindSpeed } from "@/utils/convertWindSpeed";

import Navbar from "@/components/Navbar";
import Container from "@/components/Container";
import WeatherIcon from "@/components/WeatherIcon";
import WeatherDetails from "@/components/WeatherDetails";
import ForecastWeatherDetail from "@/components/ForecastWeatherDetail";

// Types for API response
interface WeatherItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
  visibility: number;
}

interface WeatherResponse {
  list: WeatherItem[];
  city: { name: string; sunrise: number; sunset: number };
}

export default function Home() {
  const [place] = useAtom(placeAtom);
  const [loadingCity] = useAtom(loadingCityAtom);

  const { isLoading, data, refetch } = useQuery<WeatherResponse>({
    queryKey: ["weatherData", place],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}`
      );
      return data;
    },
    enabled: !!place, // fetch only if place exists
  });

  useEffect(() => {
    if (place) refetch();
  }, [place, refetch]);

  const firstData = data?.list[0] ?? null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="animate-bounce">Loading...</p>
      </div>
    );
  }

  // Unique dates for forecast
  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry) => new Date(entry.dt * 1000).toISOString().split("T")[0]
      ) ?? []
    ),
  ];

  // First entry for each date after 6am
  const firstDataForEachDate: WeatherItem[] = uniqueDates
    .map((date) => {
      const filtered = data?.list.filter(
        (entry) =>
          new Date(entry.dt * 1000).toISOString().split("T")[0] === date
      );
      return (
        filtered?.find((entry) => new Date(entry.dt * 1000).getHours() >= 6) ||
        filtered?.[0]
      );
    })
    .filter((item): item is WeatherItem => item !== undefined);

  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <Navbar location={data?.city?.name ?? "-"} />

      {loadingCity ? (
        <WeatherSkeleton />
      ) : (
        <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
          <section className="space-y-4">
            <div className="space-y-2">
              {/* Header date */}
              <h2 className="flex gap-1 text-2xl items-center">
                <p>
                  {firstData?.dt_txt
                    ? format(parseISO(firstData.dt_txt), "EEEE")
                    : "--"}
                </p>
                <p className="text-lg">
                  (
                  {firstData?.dt_txt
                    ? format(parseISO(firstData.dt_txt), "dd.MM.yy")
                    : "--"}
                  )
                </p>
              </h2>

              {/* Current weather */}
              <Container className="gap-10 px-6 items-center">
                <div className="flex flex-col px-4">
                  <span className="text-5xl">
                    {convertKelvinToCelsius(firstData?.main.temp ?? 0)}°
                  </span>
                  <p className="text-xs space-x-1 whitespace-nowrap">
                    <span>Feels like</span>
                    <span>
                      {convertKelvinToCelsius(firstData?.main.feels_like ?? 0)}°
                    </span>
                  </p>
                  <p className="text-xs space-x-2">
                    <span>
                      {convertKelvinToCelsius(firstData?.main.temp_min ?? 0)}°↓
                    </span>
                    <span>
                      {convertKelvinToCelsius(firstData?.main.temp_max ?? 0)}°↑
                    </span>
                  </p>
                </div>

                {/* Hourly forecast */}
                <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                  {data?.list.map((item) => (
                    <div
                      key={item.dt}
                      className="flex flex-col justify-between items-center gap-2 text-xs font-semibold"
                    >
                      <p className="whitespace-nowrap">
                        {item.dt_txt
                          ? format(parseISO(item.dt_txt), "h:mm a")
                          : "--:--"}
                      </p>
                      <WeatherIcon icon={item.weather[0]?.icon ?? "01d"} />
                      <p>{convertKelvinToCelsius(item.main.temp ?? 0)}°</p>
                    </div>
                  ))}
                </div>
              </Container>
            </div>

            {/* Additional weather details */}
            <div className="gap-4 flex">
              <Container className="w-fit flex-col items-center justify-center px-4">
                <p className="capitalize text-center">
                  {firstData?.weather[0]?.description ?? "-"}
                </p>
                <WeatherIcon icon={firstData?.weather[0]?.icon ?? "01d"} />
              </Container>

              <Container className="bg-yellow-300/80 px-6 gap-4 justify-between overflow-x-auto">
                <WeatherDetails
                  visibility={metersToKilometers(
                    firstData?.visibility ?? 10000
                  )}
                  airPressure={`${firstData?.main.pressure ?? 1025} hPa`}
                  windSpeed={convertWindSpeed(firstData?.wind?.speed ?? 0)}
                  humidity={`${firstData?.main.humidity ?? 0}%`}
                  sunrise={format(
                    fromUnixTime(data?.city?.sunrise ?? 0),
                    "H:mm"
                  )}
                  sunset={format(fromUnixTime(data?.city?.sunset ?? 0), "H:mm")}
                />
              </Container>
            </div>
          </section>

          {/* Forecast for 7 days */}
          <section className="flex w-full flex-col gap-4">
            <p className="text-2xl">Forecast (7 days)</p>
            {firstDataForEachDate.map((d, i) => (
              <ForecastWeatherDetail
                key={i}
                description={d?.weather[0]?.description ?? "-"}
                weatherIcon={d?.weather[0]?.icon ?? "01d"} // fixed typo
                date={d?.dt_txt ? format(parseISO(d.dt_txt), "dd.MM") : "--:--"}
                day={d?.dt_txt ? format(parseISO(d.dt_txt), "EEEE") : "--"}
                feels_like={d?.main?.feels_like ?? 0}
                temp={d?.main?.temp ?? 0}
                temp_max={d?.main?.temp_max ?? 0}
                temp_min={d?.main?.temp_min ?? 0}
                airPressure={`${d?.main?.pressure ?? 1025} hPa`}
                humidity={`${d?.main?.humidity ?? 0}%`}
                sunrise={format(fromUnixTime(data?.city?.sunrise ?? 0), "H:mm")}
                sunset={format(fromUnixTime(data?.city?.sunset ?? 0), "H:mm")}
                visability={`${metersToKilometers(d?.visibility ?? 10000)}`}
                windSpeed={`${convertWindSpeed(d?.wind?.speed ?? 0)}`}
              />
            ))}
          </section>
        </main>
      )}
    </div>
  );
}

// Skeleton for loading state
const WeatherSkeleton = () => (
  <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4 animate-pulse">
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="flex gap-2 text-2xl items-center">
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </h2>
        <div className="flex gap-10 px-6 items-center">
          <div className="flex flex-col px-4 gap-2">
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-28 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-6 overflow-x-auto w-full pr-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col justify-between items-center gap-2 text-xs font-semibold"
              >
                <div className="h-3 w-12 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="h-3 w-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </main>
);
