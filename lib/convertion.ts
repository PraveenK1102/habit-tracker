/* =========================================================
   Unit Conversion Utility
   - Safe domain separation (volume vs time)
   - Rounded to 3 decimals on return
   - Supabase float8 compatible
   ========================================================= */

/* ---------- Unit Types ---------- */

export type VolumeUnit = 'ml' | 'l' | 'gallon';
export type TimeUnit = 'min' | 'hours';

export type Unit = VolumeUnit | TimeUnit;
type UnitDomain = 'volume' | 'time';

/* ---------- Base Unit Maps ---------- */
/**
 * Volume base unit: millilitre (ml)
 * Time base unit: minute
 */

const volumeToBase: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  gallon: 3785.411784, // US liquid gallon
};

const timeToBase: Record<TimeUnit, number> = {
  min: 1,
  hours: 60,
};

/* ---------- Domain Resolver ---------- */

function getDomain(unit: Unit): UnitDomain {
  if (unit in volumeToBase) return 'volume';
  if (unit in timeToBase) return 'time';
  throw new Error(`Unsupported unit: ${unit}`);
}

/* ---------- Rounding Helper ---------- */

function round3(value: number): number {
  // avoids most floating point visual artifacts
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

/* ---------- Core Conversion ---------- */

export function convertUnit(
  value: number,
  from: Unit,
  to: Unit
): number {
  if (!Number.isFinite(value)) {
    throw new Error('Value must be a finite number');
  }

  if (from === to) return round3(value);

  const fromDomain = getDomain(from);
  const toDomain = getDomain(to);

  if (fromDomain !== toDomain) {
    throw new Error(
      `Invalid conversion: ${fromDomain} → ${toDomain}`
    );
  }

  let result: number;

  // ---- Volume Conversion ----
  if (fromDomain === 'volume') {
    const baseValue = value * volumeToBase[from as VolumeUnit];
    result = baseValue / volumeToBase[to as VolumeUnit];
  } else {
    // ---- Time Conversion ----
    const baseValue = value * timeToBase[from as TimeUnit];
    result = baseValue / timeToBase[to as TimeUnit];
  }

  return round3(result);
}
