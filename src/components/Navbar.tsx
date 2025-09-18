/** @format */
"use client";

import React from "react";
import { MdMyLocation, MdOutlineLocationOn, MdSunny } from "react-icons/md";
import SearchBox from "./SearchBox";
import { useState } from "react";
import axios from "axios";
import { useAtom } from "jotai";
import { placeAtom } from "../app/atom";
import { loadingCityAtom } from "../app/atom";

type Props = { location?: string };

const API_KEY = process.env.NEXT_PUBLIC_WEATHER_KEY;

export default function Navbar({ location }: Props) {
  const [city, setCity] = useState("");
  const [error, setError] = useState("");

  const [place, setPlace] = useAtom(placeAtom);
  const [_, setLoadingCity] = useAtom(loadingCityAtom);

  const [suggestion, setSuggestion] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  type CitySuggestion = {
    name: string;
  };

  const handleInputChange = async (value: string) => {
    setCity(value);
    if (value.length >= 3) {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/find?q=${value}&appid=${API_KEY}`
        );

        const suggestions = res.data.list.map(
          (item: CitySuggestion) => item.name
        );

        setSuggestion(suggestions);
        setShowSuggestions(true);
        setError("");
      } catch (error) {
        const e = error as Error;
        setError(e.message);
        setSuggestion([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestion([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (value: string) => {
    setCity(value);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLoadingCity(true);
    e.preventDefault();
    if (suggestion.length === 0) {
      setError("Location not found");
      setLoadingCity(false);
    } else {
      setError("");

      setTimeout(() => {
        setLoadingCity(false);
        setPlace(city);
        setShowSuggestions(false);
      }, 500);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setLoadingCity(true);
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`
          );
          setTimeout(() => {
            setLoadingCity(false);
            setPlace(res.data.name);
          }, 500);
        } catch (error) {
          setLoadingCity(false);
        }
      });
    }
  };

  return (
    <>
      <nav className="shadow-sm sticky top-0 left-0 z-50 bg-white">
        <div className=" flex h-[80px] w-full justify-between items-center max-w-7xl px-3 mx-auto">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-gray-500 text-3xl">Weather</h2>
            <MdSunny className="text-yellow-300 text-3xl mt-1" />
          </div>
          <section className="flex gap-2 items-center">
            <MdMyLocation
              onClick={handleCurrentLocation}
              title="Your Current Location"
              className="text-2xl text-gray-400 hover:opacity-80 cursor-pointer"
            />
            <MdOutlineLocationOn className="text-3xl cursor-pointer" />
            <p className="text-slate-900/80 text-sm">{location}</p>
            <div className="relative hidden md:flex">
              <SearchBox
                value={city}
                onSubmit={handleSubmit}
                onChange={(e) => handleInputChange(e.target.value)}
              />
              <SuggestionsBox
                {...{
                  showSuggestions,
                  suggestion,
                  handleSuggestionClick,
                  error,
                }}
              />
            </div>
          </section>
        </div>
      </nav>
      <section className="flex max-w-7xl px-3 md:hidden">
        <div className="relative ">
          <SearchBox
            value={city}
            onSubmit={handleSubmit}
            onChange={(e) => handleInputChange(e.target.value)}
          />
          <SuggestionsBox
            {...{
              showSuggestions,
              suggestion,
              handleSuggestionClick,
              error,
            }}
          />
        </div>
      </section>
    </>
  );
}

const SuggestionsBox = ({
  showSuggestions,
  suggestion,
  handleSuggestionClick,
  error,
}: {
  showSuggestions: boolean;
  suggestion: string[];
  handleSuggestionClick: (value: string) => void;
  error: string;
}) => {
  return (
    <>
      {((showSuggestions && suggestion.length > 1) || error) && (
        <ul className="mb-4 bg-white absolute border top-[44px] left-0 border-gray-300 rounded-md min-w-[200px] flex flex-col gap-1 py-2 px-2">
          {error && suggestion.length < 1 && (
            <li className="text-red-500  p-1">{error}</li>
          )}
          {suggestion.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(item)}
              className="cursor-pointer p-1 rounded hover:bg-gray-200"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
