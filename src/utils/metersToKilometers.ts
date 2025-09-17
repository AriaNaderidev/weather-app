export const metersToKilometers = (meters: number): string => {
  const inKilometers = meters / 1000;
  return `${inKilometers.toFixed(0)}km`;
};
