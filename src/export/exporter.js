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
		super(Utils.isObject(process) ? process : {}, registry);
		this.connection = connection;
		this.code = [];
		this.fnCounter = 1;
		this.allowEmpty();
		this.fillUndefinedParameters();
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

	isKeyword(keyword) {
		return this.getKeywords().includes(keyword.toLowerCase());
	}

	// Methods to be implemented by sub-class

	getKeywords() {
		return [];
	}

	comment(/*comment*/) {}

	generateImports() {}

	generateConnection() {}

	generateAuthentication() {}

	generateBuilder() {}

	generateMetadata(/*key, value*/) {}

	generateMissingParameter() {}

	async generateFunction(/*node*/) {}

	generateFunctionParams(parameters) {
		return parameters.map(p => {
			if (typeof p.default !== 'undefined') {
				return `${p.name} = ${this.e(p.default)}`;
			}
			else {
				return p.name;
			}
		});
	}

	async generateCallback(/*callback, parameters, variable*/) {}

	generateResult(/*resultNode, callback*/) {}

	makeNull() {
		return "null";
	}
	makeBoolean(val) {
		return val ? "true" : "false";
	}
	makeArray(arr) {
		return `[${arr.join(', ')}]`;
	}
	makeObject(obj) {
		let arr = Utils.mapObject(obj, (val, key) => `${this.makeString(key)}: ${val}`);
		return `{${arr.join(', ')}}`;
	}
	makeString(str) {
		return JSON.stringify(str);
	}
	makeNumber(num) {
		return num;
	}

	// Helpers

	e(value) {
		if (value === null) {
			return this.makeNull();
		}
		else if (typeof value === 'boolean') {
			return this.makeBoolean(value);
		}
		else if (typeof value === 'number') {
			return this.makeNumber(value);
		}
		else if (typeof value === 'string') {
			return this.makeString(value);
		}
		else if (Array.isArray(value)) {
			return this.makeArray(value.map(val => this.e(val)));
		}
		else if (Utils.isObject(value)) {
			return this.makeObject(Utils.mapObjectValues(value, val => this.e(val)));
		}
		else if (typeof value === 'function') {
			return value();
		}
		else {
			return this.makeNull();
		}
	}

	generateMetadata() {
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
			this.generateMetadataEntry(key, val);
		}
	}

	async resolveArguments(args, onExporter, filter) {
		let newArgs = Array.isArray(args) ? [] : {};
		for(let key in args) {
			let value = args[key];
			if (filter && filter(key, value)) {
				continue;
			}
			if (Utils.isObject(value)) {
				if (value.from_node) {
					newArgs[key] = () => this.var(value.from_node, this.varPrefix());
					continue; 
				}
				else if (value.from_parameter) {
					newArgs[key] = () => this.var(value.from_parameter);
					continue;
				}
				else if (value instanceof Exporter) {
					let fnName = await onExporter(key);
					newArgs[key] = () => fnName;
					continue;
				}
				else {
					newArgs[key] = await this.resolveArguments(value, onExporter, filter);
				}
			}
			else if (Array.isArray(value)) {
				newArgs[key] = await this.resolveArguments(value, onExporter, filter);
			}
			else {
				newArgs[key] = value;
			}
		}
		return newArgs;
	}

	async resolveCallback(node, key) {
		let callback;
		if (node.process_id === 'load_collection') {
			let properties = node.getArgument('properties');
			callback = properties[key];
		}
		else {
			callback = node.getArgument(key);
		}
		let parameters = callback.getCallbackParameters();
		await callback.execute(parameters);
		let fnName = this.var(`${key}${this.fnCounter++}`, 'fn_');
		let replacement = await this.generateCallback(callback, parameters, fnName);
		return replacement ? replacement : fnName;
	}

	async generateArguments(node, ordered = false, filter = null) {
		let args = await this.resolveArguments(node.arguments, async key => await this.resolveCallback(node, key), filter);
		if (ordered) {
			args = this.orderArguments(node, args);
		}
		return args;
	}

	orderArguments(node, args) {
		let process = node.getProcessGraph().getProcess(node);
		if (process && Array.isArray(process.parameters)) {
			let orderedArgs = process.parameters.map(param => {
				if (typeof args[param.name] !== 'undefined') {
					return args[param.name];
				}
				else if (!param.optional) {
					return null;
				}
				else {
					return undefined;
				}
			});
			let definedValueFound = false;
			for(let i = orderedArgs.length-1; i >= 0; i--) {
				if (typeof orderedArgs[i] === 'undefined') {
					if (definedValueFound) {
						orderedArgs[i] = null;
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

	varPrefix() {
		if (!this.getParent()) {
			return 'datacube';
		}
		else {
			return 'data';
		}
	}

	var(id, prefix = "var") {
		id = String(id);
		if (this.isKeyword(id)) {
			return `${id}_`;
		}
		if (!id.match(/^[a-z_]\w*$/)) {
			return prefix + id.replace(/[^\w]+/g, '_');
		}
		else {
			return id;
		}
	}

	getTab() {
		return `\t`;
	}

	addCode(code, prefix = '', level = 0) {
		if (typeof code !== 'string') {
			return;
		}
		let tabs = this.getTab().repeat(level);
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
		return this.connection.getUrl();
	}

	async toCode(callback = false) {
		this.code = [];
		if (!callback) {
			this.comment(`Import required packages`);
			this.generateImports();
			this.newLine();
			this.comment(`Connect to the back-end`);
			this.generateConnection();
			this.generateAuthentication();
			this.newLine();
			this.generateBuilder();
			this.generateMetadata();
			this.newLine();
		}
		let params = this.getProcessParameters();
		if (params.length > 0) {
			this.comment('ToDo: Here you need to set values for the parameters');
			for(let param of params) {
				this.generateMissingParameter(param);
			}
			this.newLine();
		}
		await this.execute();
		if (!callback) {
			this.newLine();
			this.comment(`The process can be executed synchronously (see below), as batch job or as web service now`);
		}
		this.generateResult(this.getResultNode(), callback);
		return this.code.join('').trim();
	}

	async execute() {
		await this.validate();
		this.reset();
		await this.executeNodes(this.getStartNodes());
		return this.getResultNode();
	}

	isMath() {
		if (typeof this._isMath === 'undefined') {
			// Determine whether the process is just math
			this._isMath = this.processRegistry.isMath(this);
		}
		return this._isMath;
	}

}