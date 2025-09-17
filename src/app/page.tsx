"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { placeAtom } from "../app/atom";
import { loadingCityAtom } from "../app/atom";
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

export default function Home() {
  const [place, setPlace] = useAtom(placeAtom);
  const [loadingCity, _] = useAtom(loadingCityAtom);

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["repoData"],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}`
      );
      return data;
    },
  });

  useEffect(() => {
    refetch();
  }, [place, refetch]);

  const firstData = data?.list[0];

  console.log(firstData);

  if (isPending)
    return (
      <div className=" min-h-screen flex items-center justify-center">
        <p className="animate-bounce">Loading...</p>
      </div>
    );

  interface ForecastEntry {
    dt: number;
  }

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry: ForecastEntry) =>
          new Date(entry.dt * 1000).toISOString().split("T")[0]
      )
    ),
  ];

  const firstDataForEachDate = uniqueDates.map((date) => {
    return data?.list.find((entry: ForecastEntry) => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split("T")[0];
      const entryTime = new Date(entry.dt * 1000).getHours();
      return entryDate === date && entryTime >= 6;
    });
  });

  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <Navbar location={data?.city.name} />
      {loadingCity ? (
        <WeatherSkeleton />
      ) : (
        <>
          <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="flex gap-1 text-2xl items-center ">
                  <p>{format(parseISO(firstData?.dt_txt ?? ""), "EEEE")}</p>
                  <p className="text-lg">
                    ({format(parseISO(firstData?.dt_txt ?? ""), "dd.MM.yy")})
                  </p>
                </h2>
                <Container className="gap-10 px-6 items-center">
                  <div className="flex flex-col px-4">
                    <span className="text-5xl">
                      {convertKelvinToCelsius(firstData?.main.temp ?? 304.84)}°
                    </span>
                    <p className="text-xs space-x-1 whitespace-nowrap">
                      <span>Feels like</span>
                      <span>
                        {convertKelvinToCelsius(
                          firstData?.main.feels_like ?? 0
                        )}
                        °
                      </span>
                    </p>
                    <p className="text-xs space-x-2">
                      <span>
                        {convertKelvinToCelsius(firstData?.main.temp_min) ?? 0}
                        °↓{" "}
                      </span>
                      <span>
                        {convertKelvinToCelsius(firstData?.main.temp_max) ?? 0}
                        °↑{" "}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                    {data?.list.map((item, index) => (
                      <div
                        key={index}
                        className="  flex flex-col justify-between items-center gap-2 text-xs font-semibold"
                      >
                        <p className="whitespace-nowrap">
                          {format(parseISO(item.dt_txt), "h:mm a")}
                        </p>

                        <WeatherIcon icon={item.weather[0].icon} />
                        <p>{convertKelvinToCelsius(item?.main.temp) ?? 0}°</p>
                      </div>
                    ))}
                  </div>
                </Container>
              </div>
              <div className="gap-4 flex">
                <Container className="w-fit flex-col items-center justify-center px-4">
                  <p className="capitalize text-center">
                    {firstData?.weather[0].description}
                  </p>
                  <WeatherIcon icon={firstData?.weather[0].icon} />
                </Container>
                <Container className="bg-yellow-300/80 px-6 gap-4 justify-between overflow-x-auto">
                  <WeatherDetails
                    vsibility={metersToKilometers(
                      firstData?.visibility ?? 10000
                    )}
                    airPressure={`${firstData?.main.pressure} hPa`}
                    windSpeed={convertWindSpeed(firstData?.wind.speed ?? 1.64)}
                    humidity={`${firstData?.main.humidity}%`}
                    sunrise={format(fromUnixTime(data?.city.sunrise), "H:mm")}
                    sunset={format(fromUnixTime(data?.city.sunset), "H:mm")}
                  />
                </Container>
              </div>
            </section>

            <section className="flex w-full flex-col gap-4">
              <p className="text-2xl">Forecast (7 days)</p>
              {firstDataForEachDate.map((d, i) => (
                <ForecastWeatherDetail
                  key={i}
                  description={d?.weather[0].description ?? "-"}
                  weatehrIcon={d?.weather[0].icon ?? "01d"}
                  date={d ? format(parseISO(d.dt_txt), "dd.MM") : "--:--"}
                  day={d ? format(parseISO(d.dt_txt), "EEEE") : "Tuesday"}
                  feels_like={d?.main.feels_like ?? 286.28}
                  temp={d?.main.temp ?? 286.28}
                  temp_max={d?.main.temp_max ?? 0}
                  temp_min={d?.main.temp_min ?? 0}
                  airPressure={`${d?.main.pressure ?? 1025} hPa `}
                  humidity={`${d?.main.humidity ?? 77}% `}
                  sunrise={format(
                    fromUnixTime(data?.city.sunrise ?? 1702517657),
                    "H:mm"
                  )}
                  sunset={format(
                    fromUnixTime(data?.city.sunset ?? 1702517657),
                    "H:mm"
                  )}
                  visability={`${metersToKilometers(d?.visibility ?? 10000)} `}
                  windSpeed={`${convertWindSpeed(d?.wind.speed ?? 1.64)} `}
                />
              ))}
            </section>
          </main>
        </>
      )}
    </div>
  );
}

const WeatherSkeleton = () => {
  return (
    <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4 animate-pulse">
      <section className="space-y-4">
        <div className="space-y-2">
          {/* Header date */}
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

            {/* Hourly forecast */}
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

        <div className="gap-4 flex">
          <div className="w-fit flex-col items-center justify-center px-4 flex gap-2">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          </div>

          <div className="flex-1 bg-gray-100 px-6 gap-4 flex justify-between overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 items-center">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col gap-4">
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border border-gray-300 rounded bg-gray-50"
          >
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-12 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </section>
    </main>
  );
};
