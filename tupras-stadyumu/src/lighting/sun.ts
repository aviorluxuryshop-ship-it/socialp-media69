/**
 * Solar position (SunCalc / NOAA low-precision formulae, ±0.3°).
 *
 * Time policy (no permission required):
 *   · default — the visitor's local wall-clock time is shown at the stadium:
 *     11:00 on their clock = 11:00 in Istanbul, and the sun is computed for
 *     Istanbul at that moment;
 *   · opt-in geolocation — the sun is computed for the visitor's own
 *     coordinates at the real current instant.
 */

export const ISTANBUL = { lat: 41.0394, lon: 28.9944, utcOffsetMin: 180 };

const RAD = Math.PI / 180;
const E = RAD * 23.4397;

export interface SunState {
  /** degrees above the horizon */
  altitude: number;
  /** compass bearing, degrees clockwise from north */
  azimuth: number;
}

function toDays(ms: number): number {
  return ms / 86400000 + 2440587.5 - 2451545;
}

export function solarPosition(ms: number, lat: number, lon: number): SunState {
  const d = toDays(ms);
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(L) * Math.sin(E));
  const ra = Math.atan2(Math.sin(L) * Math.cos(E), Math.cos(L));
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const th = RAD * (280.16 + 360.9856235 * d) - lw;
  const H = th - ra;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  // SunCalc azimuth is measured from south towards west; convert to a compass bearing
  const azS = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  let az = (azS / RAD + 180) % 360;
  if (az < 0) az += 360;
  return { altitude: alt / RAD, azimuth: az };
}

/** The instant at which Istanbul's clocks show the same wall time as `local`. */
export function istanbulInstantForWallClock(local: Date): number {
  const wall = Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), local.getHours(), local.getMinutes(), local.getSeconds());
  return wall - ISTANBUL.utcOffsetMin * 60000;
}

export interface TimeSource {
  /** minutes since local midnight shown in the UI */
  wallMinutes: number;
  sun: SunState;
  label: string;
  live: boolean;
  usingGeolocation: boolean;
}

export class SunClock {
  private overrideMinutes: number | null = null;
  private geo: { lat: number; lon: number } | null = null;

  setOverride(minutes: number | null): void {
    this.overrideMinutes = minutes;
  }

  get isLive(): boolean {
    return this.overrideMinutes === null;
  }

  async useGeolocation(): Promise<boolean> {
    if (!('geolocation' in navigator)) return false;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          this.geo = { lat: p.coords.latitude, lon: p.coords.longitude };
          resolve(true);
        },
        () => resolve(false),
        { maximumAge: 3600000, timeout: 8000 },
      );
    });
  }

  clearGeolocation(): void {
    this.geo = null;
  }

  now(): TimeSource {
    const local = new Date();
    if (this.overrideMinutes !== null) {
      const d = new Date(local);
      d.setHours(Math.floor(this.overrideMinutes / 60), Math.round(this.overrideMinutes % 60), 0, 0);
      const ms = istanbulInstantForWallClock(d);
      return { wallMinutes: this.overrideMinutes, sun: solarPosition(ms, ISTANBUL.lat, ISTANBUL.lon), label: fmt(this.overrideMinutes), live: false, usingGeolocation: false };
    }
    const wallMinutes = local.getHours() * 60 + local.getMinutes() + local.getSeconds() / 60;
    if (this.geo) {
      return { wallMinutes, sun: solarPosition(local.getTime(), this.geo.lat, this.geo.lon), label: fmt(wallMinutes), live: true, usingGeolocation: true };
    }
    const ms = istanbulInstantForWallClock(local);
    return { wallMinutes, sun: solarPosition(ms, ISTANBUL.lat, ISTANBUL.lon), label: fmt(wallMinutes), live: true, usingGeolocation: false };
  }
}

function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
