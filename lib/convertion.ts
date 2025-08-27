type VolumeUnit = 'ml' | 'l' | 'gallon';
type TimeUnit = 'hours' | 'minutes';
type SupportedUnit = VolumeUnit | TimeUnit;

export function convertUnit(
  value: number,
  from: SupportedUnit,
  to: SupportedUnit
): number {
  if (from === to) return value;

  // Volume conversions
  const volumeConversions: Record<VolumeUnit, Record<VolumeUnit, number>> = {
    ml: {
      l: 1 / 1000,
      gallon: 1 / 3785.41,
    },
    l: {
      ml: 1000,
      gallon: 1 / 3.78541,
    },
    gallon: {
      ml: 3785.41,
      l: 3.78541,
    },
  };

  // Time conversions
  const timeConversions: Record<TimeUnit, Record<TimeUnit, number>> = {
    hours: {
      minutes: 60,
    },
    minutes: {
      hours: 1 / 60,
    },
  };

  const fromVolume = from as VolumeUnit;
  const toVolume = to as VolumeUnit;

  const fromTime = from as TimeUnit;
  const toTime = to as TimeUnit;

  let factor: number | undefined;

  if (volumeConversions[fromVolume]?.[toVolume] !== undefined) {
    factor = volumeConversions[fromVolume][toVolume];
  } else if (timeConversions[fromTime]?.[toTime] !== undefined) {
    factor = timeConversions[fromTime][toTime];
  }
  let result = 0;
  let rounded = 0;
  if (factor === undefined) {
    rounded = 0;
  } else {
    result = value * factor;
    rounded = Number(result.toFixed(2));
  }
  return Number.isInteger(rounded) ? Math.trunc(rounded) : rounded;
}
