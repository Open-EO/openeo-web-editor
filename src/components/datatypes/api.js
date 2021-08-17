import Utils from '../../utils';
export const API_TYPES = Utils.resolveJsonRefs(require('@openeo/js-processgraphs/assets/subtype-schemas.json')).definitions;
export const NATIVE_TYPES = [
	'string',
	'integer',
	'number',
	'boolean',
	'array',
	'object'
];