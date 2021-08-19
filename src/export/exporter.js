import { BaseProcess, ProcessGraph } from '@openeo/js-processgraphs';
import Utils from "../utils";

class ProcessImpl extends BaseProcess {
	constructor(process, exporter) {
		super(process);
		this.exporter = exporter;
	}
	async execute(node) {
		await this.exporter.generateFunction(node);
	}
}

export default class Exporter extends ProcessGraph {

	constructor(process, registry, connection) {
		super(process, registry);
		this.connection = connection;
		this.indent = 0;
		this.code = [];
	}

	// inherited from ProcessGraph

	createProcessGraphInstance(process) {
		let pg = new Exporter(process, this.processRegistry, this.getJsonSchemaValidator());
		return this.copyProcessGraphInstanceProperties(pg);
	}

	copyProcessGraphInstanceProperties(pg) {
		pg = super.copyProcessGraphInstanceProperties(pg);
		pg.connection = this.connection;
		return pg;
	}

	createProcessInstance(process) {
		return new ProcessImpl(process, this);
	}

	// Methods to be implemented by sub-class

	isKeyword(/*keyword*/) {
		return false;
	}

	async generateFunction() {}

	// Helpers

	async generateArguments(node, ordered = false) {
		let args = {};
		for(let key in node.arguments) {
			let value = node.arguments[key];
			if (Utils.isObject(value)) {
				if (value.from_node) {
					args[key] = this.var(value.from_node);
					continue;
				}
				else if (value.from_parameter) {
					args[key] = this.var(value.from_parameter);
					continue;
				}
				else if (value instanceof Exporter) {
					let callback = node.getArgument(key);
					let parameters = callback.getCallbackParameters();
					await callback.execute(parameters);
					let fnName = this.var(`fn_${node.id}`);
					await this.generateCallback(callback, parameters, fnName);
					args[key] = fnName;
					continue;
				}
			}
			args[key] = this.e(value);
		}
		if (ordered) {
			return this.orderArguments(node, args);
		}
		else {
			return args;
		}
	}

	orderArguments(node, args) {
		let process = node.getProcessGraph().getProcess(node);
		if (process && Array.isArray(process.parameters)) {
			let orderedArgs = process.parameters.map(param => {
				if (typeof args[param.name] !== 'undefined') {
					return args[param.name];
				}
				else if (!param.optional) {
					return this.e(null);
				}
				else {
					return undefined;
				}
			});
			let definedValueFound = false;
			for(let i = orderedArgs.length-1; i >= 0; i--) {
				if (typeof orderedArgs[i] === 'undefined') {
					if (definedValueFound) {
						orderedArgs[i] = this.e(null);
					}
					else {
						orderedArgs.pop();
					}
				}
				else {
					definedValueFound = true;
				}
			}
			return orderedArgs;
		}
	}

	e(value) {
		return JSON.stringify(value);
	}

	var(id) {
		if (this.isKeyword(id)) {
			return `${id}_`;
		}
		if (!id.match(/^[a-z_]\w+$/)) {
			return `datacube${id}`;
		}
		else {
			return id;
		}
	}

	addCode(code, prefix = '') {
		if (typeof code !== 'string') {
			return;
		}
		let tabs = `\t`.repeat(this.indent);
		let lines = code.trim().split(/\r\n|\r|\n/g);
		for(let line of lines) {
			this.code.push(`${tabs}${prefix}${line}\n`);
		}
	}

	newLine(count = 1) {
		for(let i = 0; i < count; i++) {
			this.addCode('');
		}
	}

	getServerUrl() {
		return this.connection.getBaseUrl(); // ToDo: Get correct url from link version-history
	}

	async toCode(callback = false) {
		this.code = [];
		if (!callback) {
			this.comment(`Import required packages`);
			this.generateImports();
			this.newLine();
			this.comment(`Connect to the back-end`);
			this.generateConnection();
			this.newLine();
			this.comment(`Authenticate at the back-end`);
			this.generateAuthentication();
			this.newLine();
			this.generateBuilder();
			let hasComment = false;
			for(let key in this.process) {
				if (key === 'process_graph') {
					continue;
				}
				let val = this.process[key];
				if (Array.isArray(val) && val.length === 0) {
					continue;
				}
				else if (typeof val === 'string' && val.length === 0) {
					continue;
				}
				else if (typeof val === 'boolean' && !val) {
					continue;
				}
				if (!hasComment) {
					this.newLine();
					this.comment(`Set the metadata for the process`);
					hasComment = true;
				}
				this.generateMetadata(key, val);
			}
			this.newLine();
		}
		await this.execute();
		if (!callback) {
			this.newLine();
		}
		this.generateResult(this.getResultNode(), callback);
		return this.code.join('').trim();
	}

}