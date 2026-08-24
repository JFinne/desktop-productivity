/**
 * Where the sun is, computed locally.
 *
 * This is the low-precision solar position algorithm (the one in the
 * Astronomical Almanac): good to roughly half a degree, which is far finer than
 * anything a colour ramp needs, and it runs offline from nothing but the clock
 * and a pair of coordinates.
 */

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Standard refraction-corrected altitude of the sun's upper limb at sunrise. */
export const HORIZON = -0.833;

export interface SunPosition {
	/** Degrees above the horizon; negative at night. */
	elevation: number;
	/** True between solar midnight and solar noon. */
	rising: boolean;
}

function elevationAt(time: number, latitude: number, longitude: number): number {
	// Days since J2000.0.
	const julian = time / 86_400_000 + 2440587.5;
	const n = julian - 2451545.0;

	const meanLongitude = (280.46 + 0.9856474 * n) * RAD;
	const meanAnomaly = (357.528 + 0.9856003 * n) * RAD;

	// Ecliptic longitude, with the two largest periodic corrections.
	const eclipticLongitude =
		meanLongitude + (1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * RAD;

	const obliquity = (23.439 - 0.0000004 * n) * RAD;

	const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
	const rightAscension = Math.atan2(
		Math.cos(obliquity) * Math.sin(eclipticLongitude),
		Math.cos(eclipticLongitude)
	);

	// Greenwich mean sidereal time, in hours, then localised by longitude.
	const gmst = 18.697374558 + 24.06570982441908 * n;
	const localSidereal = (((gmst % 24) * 15 + longitude) % 360) * RAD;

	const hourAngle = localSidereal - rightAscension;
	const lat = latitude * RAD;

	return (
		Math.asin(
			Math.sin(lat) * Math.sin(declination) +
				Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle)
		) * DEG
	);
}

export function sunPosition(date: Date, latitude: number, longitude: number): SunPosition {
	const now = date.getTime();
	const elevation = elevationAt(now, latitude, longitude);
	// Ten minutes on tells us which way the sun is going, which is what
	// separates a dawn palette from a dusk one at the same altitude.
	const soon = elevationAt(now + 600_000, latitude, longitude);
	return { elevation, rising: soon > elevation };
}

export interface SunTimes {
	/** Null on days when the sun never crosses the horizon. */
	sunrise: Date | null;
	sunset: Date | null;
	/** True when the sun is up for the whole local day. */
	polarDay: boolean;
	polarNight: boolean;
}

/**
 * Sunrise and sunset for the local day containing `date`, found by sampling the
 * elevation curve and bisecting the crossings. Sampling rather than inverting
 * the equation keeps this correct at high latitudes, where the usual closed
 * form falls apart.
 */
export function sunTimes(date: Date, latitude: number, longitude: number): SunTimes {
	const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	const step = 5 * 60_000;
	const samples = Math.ceil(86_400_000 / step);

	let previousTime = start;
	let previousElevation = elevationAt(start, latitude, longitude);
	let sunrise: Date | null = null;
	let sunset: Date | null = null;
	let everUp = previousElevation > HORIZON;
	let everDown = previousElevation <= HORIZON;

	const refine = (lowTime: number, highTime: number): Date => {
		let low = lowTime;
		let high = highTime;
		for (let i = 0; i < 20; i++) {
			const mid = (low + high) / 2;
			const crossedBelow = elevationAt(low, latitude, longitude) <= HORIZON;
			if (elevationAt(mid, latitude, longitude) <= HORIZON === crossedBelow) low = mid;
			else high = mid;
		}
		return new Date((low + high) / 2);
	};

	for (let i = 1; i <= samples; i++) {
		const time = start + i * step;
		const elevation = elevationAt(time, latitude, longitude);

		if (elevation > HORIZON) everUp = true;
		else everDown = true;

		if (previousElevation <= HORIZON && elevation > HORIZON && !sunrise) {
			sunrise = refine(previousTime, time);
		} else if (previousElevation > HORIZON && elevation <= HORIZON && !sunset) {
			sunset = refine(previousTime, time);
		}

		previousTime = time;
		previousElevation = elevation;
	}

	return { sunrise, sunset, polarDay: everUp && !everDown, polarNight: everDown && !everUp };
}

/** A rough longitude from the machine's UTC offset, used as a first guess. */
export function longitudeFromTimezone(): number {
	return Math.round((-new Date().getTimezoneOffset() / 60) * 15);
}
