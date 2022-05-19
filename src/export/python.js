import { createOrUpdateFromFlatCoordinates } from "ol/extent";
import Utils from "../utils";
import Exporter from "./exporter";

const KEYWORDS = [
	'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif',
	'else', 'except', 'exec', 'finally', 'for', 'from', 'global', 'if', 'import',
	'in', 'is', 'lambda', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try',
	'while', 'with', 'yield',
	// specific to this generator
	"openeo", "connection", "process", "builder"
];

export default class Python extends Exporter {

	createProcessGraphInstance(process) {
		let pg = new Python(process, this.processRegistry, this.getJsonSchemaValidator());
		return this.copyProcessGraphInstanceProperties(pg);
	}

	getKeywords() {
		return KEYWORDS;
	}

	comment(comment) {
		this.addCode(comment, '# ');
	}

	generateImports() {
		this.addCode(`import openeo`);
		this.addCode(`from openeo.processes import process`);
	}

	generateConnection() {
		this.addCode(`connection = openeo.connect("${this.getServerUrl()}")`);
	}

	generateAuthentication() {
		this.comment(`ToDo: Here you need to authenticate with authenticate_basic() or authenticate_OIDC()`);
	}

	generateBuilder() {}

	generateMetadataEntry(key, value) {
		this.comment(`${key}: ${this.e(value)}`);
	}

	makeNull() {
		return "None";
	}
	makeBoolean(val) {
		return val ? "True" : "False";
	}

	getTab() {
		return '    ';
	}

	hasCallbackParameter(node) {
		return Boolean(Object.values(node.arguments).find(arg => arg instanceof Python));
	}

	async generateFunction(node) {
		let variable = this.var(node.id, this.varPrefix());
		let builderName;
		let addProcessToArguments = true;
		let filterDcName = null;
		if (node.getParent()) {
			builderName = 'process';
		}
		else {
			let startNodes = node.getProcessGraph().getStartNodeIds();
			if (startNodes.includes(node.id)) {
				if (node.process_id === 'load_collection') {
					builderName = 'connection.load_collection';
					// Rename id to collection_id until solved: https://github.com/Open-EO/openeo-python-client/issues/223
					node.arguments = Object.assign({collection_id: node.arguments.id}, Utils.omitFromObject(node.arguments, ['id']));
					addProcessToArguments = false;
				}
				else {
					builderName = 'connection.datacube_from_process';
				}
			}
			else {
				let prevNodes = node.getPreviousNodes();
				let dcName = this.var(prevNodes[0].id, this.varPrefix());
				// If the process has a callback parameter, we need to call the "native" process
				// until https://github.com/Open-EO/openeo-python-client/issues/223 is solved
				if (this.hasCallbackParameter(node) || node.process_id === 'save_result') {
					builderName = `${dcName}.${node.process_id}`;
					addProcessToArguments = false;
					// If we call the process directly on a new data cube with dcName
					// we need to remove the argument that is passing this data
					filterDcName = (key, value) => Utils.isObject(value) && value.from_node && this.var(value.from_node, this.varPrefix()) === dcName;
				}
				else {
					builderName = `${dcName}.process`;
				}
			}
		}
		let args = await this.generateArguments(node, false, filterDcName);
		if (node.namespace) {
			args.namespace = this.makeString(node.namespace);
		}
		args = Utils.mapObject(args, (value, name) => `${name} = ${this.e(value)}`);
		if (addProcessToArguments) {
			args.unshift(this.makeString(node.process_id));
		}
		
		this.comment(node.description);
		this.addCode(`${variable} = ${builderName}(${args.join(', ')})`);
	}

	generateMissingParameter(parameter) {
		this.comment(parameter.description);
		let paramName = this.var(parameter.name, 'param');
		let value = typeof parameter.default !== 'undefined' ? parameter.default : null;
		this.addCode(`${paramName} = ${this.e(value)}`);
	}

	async generateCallback(callback, parameters, variable) {
		let params = this.generateFunctionParams(parameters);
		if (params.length === 0) {
			params.push('builder');
		}
		this.newLine();
		this.addCode(`def ${variable}(${params.join(', ')}):`);
		this.addCode(await callback.toCode(true), '', 1);
		this.newLine();
	}

	generateResult(resultNode, callback) {
		if (!resultNode) {
			return;
		}
		let variable = this.var(resultNode.id, this.varPrefix());
		if (callback) {
			this.addCode(`return ${variable}`);
		}
		else {
			this.addCode(`result = connection.execute(${variable})`);
		}
	}

}