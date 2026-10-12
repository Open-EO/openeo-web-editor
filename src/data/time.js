const UNIT_MS = {
	millisecond: 1, milliseconds: 1, msec: 1, ms: 1,
	second: 1000, seconds: 1000, sec: 1000, secs: 1000, s: 1000,
	minute: 60000, minutes: 60000, min: 60000, mins: 60000,
	hour: 3600000, hours: 3600000, hr: 3600000, hrs: 3600000, h: 3600000,
	day: 86400000, days: 86400000, d: 86400000,
	week: 604800000, weeks: 604800000
};

export function isCfTimeUnits(units) {
	return typeof units === 'string' && /^\s*\w+\s+since\s+/i.test(units);
}

function parseReference(ref) {
	let s = ref.trim().replace(/\s+UTC$/i, '').replace(/Z$/, '');
	// "1990-1-1 0:0:0" style references aren't parsed by Date
	const m = s.match(/^(-?\d{1,4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}(?:\.\d+)?))?)?\s*([+-]\d{1,2}(?::?\d{2})?)?$/);
	if (!m) {
		const d = new Date(ref);
		return isNaN(d) ? null : d.getTime();
	}
	const [, y, mo, d, h = 0, mi = 0, sec = 0, tz] = m;
	let ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), 0) + parseFloat(sec) * 1000;
	if (tz) {
		const tm = tz.match(/([+-])(\d{1,2}):?(\d{2})?/);
		const offset = (Number(tm[2]) * 60 + Number(tm[3] || 0)) * 60000;
		ms -= tm[1] === '+' ? offset : -offset;
	}
	return ms;
}

// Decodes CF "<unit> since <reference>" values to ISO strings. Only the standard/gregorian calendars are exact.
export function decodeCfTimes(values, units) {
	const m = units.match(/^\s*(\w+)\s+since\s+(.+)$/i);
	if (!m) {
		return null;
	}
	const factor = UNIT_MS[m[1].toLowerCase()];
	const ref = parseReference(m[2]);
	if (!factor || ref === null) {
		return null;
	}
	return Array.from(values, v => new Date(ref + Number(v) * factor).toISOString());
}

export function formatTime(iso) {
	if (typeof iso !== 'string') {
		return String(iso);
	}
	return iso.replace(/T00:00:00(\.000)?Z$/, '').replace(/\.000Z$/, 'Z');
}

export function looksLikeDate(value) {
	if (value instanceof Date) {
		return true;
	}
	return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(value.trim());
}
