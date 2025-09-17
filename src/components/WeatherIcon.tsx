import React from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

export default function WeatherIcon(
  props: React.HTMLProps<HTMLDivElement> & { icon: string }
) {
  return (
    <div {...props} className={cn("relative h-20 w-20")}>
      <Image
        src={`https://openweathermap.org/img/wn/${props.icon}@4x.png`}
        alt="Weather Icon"
        width={100}
        height={100}
        className="absolute h-full w-ful"
      />
    </div>
  );
}
