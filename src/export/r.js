import Utils from "../utils";
import Exporter from "./exporter";

const KEYWORDS = [
	"if", "else", "repeat", "while", "function", "for", "in", "next", "break",
	"true", "false", "null", "inf", "nan", "na", "na_integer_", "na_real_", "na_complex_", "na_character_",
	// specific to this generator
	"openeo", "connect", "connection", "datacube", "p", "compute_result"
];

export default class R extends Exporter {

	createProcessGraphInstance(process) {
		let pg = new R(process, this.processRegistry, this.getJsonSchemaValidator());
		return this.copyProcessGraphInstanceProperties(pg);
	}

	getKeywords() {
		return KEYWORDS;
	}

	makeNull() {
		return "NULL";
	}
	makeBoolean(val) {
		return val ? "TRUE" : "FALSE";
	}
	makeArray(arr) {
		return `list(${arr.join(', ')})`;
	}
	makeObject(obj) {
		let arr = Utils.mapObject(obj, (val, key) => `${this.makeString(key)} = ${val}`);
		return `list(${arr.join(', ')})`;
	}

	comment(comment) {
		this.addCode(comment, '# ');
	}

	generateImports() {
		this.addCode(`library(openeo)`);
	}

	generateConnection() {
		this.addCode(`connection = connect(host = "${this.getServerUrl()}")`);
	}

	generateAuthentication() {
		this.comment(`ToDo: Authentication with login()`);
	}

	generateBuilder() {
		this.addCode(`p = processes()`);
	}

	generateMetadataEntry(key, value) {
		this.comment(`${key}: ${this.e(value)}`);
	}

	async generateFunction(node) {
		let variable = this.var(node.id, this.varPrefix());
		let args = await this.generateArguments(node);
		// ToDo: This doesn't seem to be supported in R yet
		if (node.namespace) {
			args.namespace = this.e(args.namespace);
		}
		args = Utils.mapObject(args, (value, name) => `${name} = ${this.e(value)}`);

		this.comment(node.description);
		this.addCode(`${variable} = p$${node.process_id}(${args.join(', ')})`);
	}

	generateMissingParameter(parameter) {
		this.comment(parameter.description);
		let paramName = this.var(parameter.name, 'param');
		let value = typeof parameter.default !== 'undefined' ? parameter.default : null;
		this.addCode(`${paramName} = ${this.e(value)}`);
	}

	async generateCallback(callback, parameters, variable) {
		let isMathFormula = false;
		if (isMathFormula) {
			// ToDo: Use Formula class, use ExpressionModal code
		}
		else {
			let params = this.generateFunctionParams(parameters);
			this.newLine();
			this.addCode(`${variable} = function(${params.join(', ')}) {`);
			this.addCode(await callback.toCode(true), '', 1);
			this.addCode(`}`);
		}
	}

	generateResult(resultNode, callback) {
		if (!resultNode) {
			return;
		}
		let variable = this.var(resultNode.id, this.varPrefix());
		if (callback) {
			this.addCode(`return(${variable})`);
		}
		else {
			this.addCode(`result = compute_result(graph = ${variable})`);
		}
	}

}