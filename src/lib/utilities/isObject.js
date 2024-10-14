/**
 * Check if a value is an object
 * @param {any} value - Value to check.
 * @returns {boolean}
 */
export default function isObject(value) {
	return typeof value === 'object' && !Array.isArray(value) && value !== null;
}
