import { JsonSchemaValidator } from '@openeo/js-processgraphs';
import ajv from 'ajv';

var instance = null;

export default class JsonSchema extends JsonSchemaValidator {

	static create(store) {
		if (instance === null) {
			instance = new JsonSchema(store);
		}
		return instance;
	}

	constructor(store) {
		super();
		this.store = store;
		this.setFileFormats(this.store.state.fileFormats.data);
	}

	async validateBandName(data) {
		throw "Not supported";
	}

	async validateEpsgCode(data) {
		await this.store.dispatch('editor/loadEpsgCodes');
		if (this.store.state.editor.epsgCodes[data]) {
			return true;
		}
		throw new ajv.ValidationError([{
			message: "Invalid EPSG code '" + data + "' specified."
		}]);
	}

	async validateCollectionId(data) {
		if (this.store.state.collections.filter(c => c.id === data).length > 0) {
			return true;
		}
		throw new ajv.ValidationError([{
			message: "Collection with id '" + data + "' doesn't exist."
		}]);
	}

	async validateFilePath(data) {
		if (this.store.getters['files/getById'](data)) {
			return true;
		}
		throw new ajv.ValidationError([{
			message: "File at '" + data + "' doesn't exist."
		}]);
	}

	async validateInputFormatOptions(data) {
		throw "Not supported";
	}

	async validateOutputFormatOptions(data) {
		throw "Not supported";
	}

	async validateJobId(data) {
		if (this.store.getters['jobs/getById'](data)) {
			return true;
		}
		throw new ajv.ValidationError([{
			message: "Job with id '" + data + "' doesn't exist."
		}]);
	}

	async validateUdfCode(data) {
		throw "Not supported";
	}

	async validateUdfRuntime(data) {
		throw "Not supported";
	}

	async validateUdfRuntimeVersion(data) {
		throw "Not supported";
	}

}