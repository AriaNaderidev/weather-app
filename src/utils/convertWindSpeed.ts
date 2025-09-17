export const convertWindSpeed = (speedInMetersInSecond: number): string => {
  const speedInKilometersInHour = speedInMetersInSecond * 3.6;
  return `${speedInKilometersInHour.toFixed(0)} km/h`;
};
