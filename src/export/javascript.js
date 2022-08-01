import Utils from "../utils";
import Exporter from "./exporter";
import { Formula } from '@openeo/js-client';

const KEYWORDS = [
	"abstract",
	"arguments",
	"await",
	"boolean",
	"break",
	"byte",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"double",
	"else",
	"enum",
	"eval",
	"export",
	"extends",
	"false",
	"final",
	"finally",
	"float",
	"for",
	"function",
	"goto",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"int",
	"interface",
	"let",
	"long",
	"native",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"short",
	"static",
	"super",
	"switch",
	"synchronized",
	"this",
	"throw",
	"throws",
	"transient",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"volatile",
	"while",
	"with",
	"yield",
	// specific to this generator
	"builder",
	"connection",
	"formula",
	"openeo",
	"result"
];

export default class JavaScript extends Exporter {

	constructor(process, registry, connection, generateFormula = false) {
		super(process, registry, connection);
		this.generateFormula = generateFormula;
	}

	createProcessGraphInstance(process) {
		let pg = new JavaScript(process, this.processRegistry, this.getJsonSchemaValidator(), this.generateFormula);
		return this.copyProcessGraphInstanceProperties(pg);
	}

	parse() {
		if (this.parsed) {
			return;
		}
		super.parse();
	}

	getKeywords() {
		return KEYWORDS;
	}

	comment(comment) {
		this.addCode(comment, '// ');
	}

	generateImports() {
		this.addCode(`import { OpenEO, Formula } from '@openeo/js-client';`);
	}

	generateConnection() {
		this.addCode(`let connection = await OpenEO.connect('${this.getServerUrl()}');`);
	}

	generateAuthentication() {
		this.comment(`ToDo: Here you need to add your authentication steps`);
	}

	generateBuilder() {
		this.addCode(`let builder = await connection.buildProcess();`);
	}

	generateMetadataEntry(key, value) {
		this.addCode(`builder.${key} = ${this.e(value)};`);
	}

	async generateFunction(node) {
		let builderName = node.getParent() ? 'this' : 'builder';
		let variable = this.var(node.id, this.varPrefix());
		let args = await this.generateArguments(node, !node.namespace);

		this.comment(node.description);
		if (Utils.isObject(args)) {
			let processId = node.namespace ? `${node.process_id}@${node.namespace}` : node.process_id;
			this.addCode(`let ${variable} = ${builderName}.process("${processId}", ${this.e(args)});`);
		}
		else {
			this.addCode(`let ${variable} = ${builderName}.${node.process_id}(${args.map(arg => this.e(arg)).join(', ')});`);
		}
	}

	generateMissingParameter(parameter) {
		this.comment(parameter.description);
		let paramName = this.var(parameter.name, 'param');
		let value = typeof parameter.default !== 'undefined' ? parameter.default : null;
		this.addCode(`let ${paramName} = ${this.e(value)};`);
	}

	async generateCallback(callback, parameters, variable) {
		if (this.generateFormula && callback && callback.isMath()) {
			let formula = callback.toFormulaString();
			let escaped = JSON.stringify(formula);
			return `new Formula(${escaped})`;
		}
		else {
			let params = this.generateFunctionParams(parameters);
			this.newLine();
			this.addCode(`let ${variable} = function(${params.join(', ')}) {`);
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
			this.addCode(`return ${variable};`);
		}
		else {
			this.addCode(`let result = await connection.computeResult(${variable});`);
		}
	}

	toFormulaString() {
		if (this.isMath()) {
			return this.nodeToFormula(this.getResultNode());
		}
		else {
			return '';
		}
	}

	getArrayElementPlaceholder(node) {
		if (node.process_id === 'array_element') {
			if (node.getArgumentType('data') === 'parameter') {
				let parameter = node.getRawArgument('data').from_parameter;
				let index = this.getCallbackParameters().findIndex(param => param.name === parameter);
				if (index >= 0) {
					return '$'.repeat(index+1) + (node.getArgument('label') || node.getArgument('index'));
				}
			}
		}
		return null;
	}

	nodeToFormula(node, parentOperator = null) {
		if (node.process_id === 'array_element') {
			let arrayElement = this.getArrayElementPlaceholder(node);
			if (arrayElement) {
				return arrayElement;
			}
		}

		let operator = Formula.reverseOperatorMapping[node.process_id];
		let process = this.processRegistry.get(node.process_id);
		let isArrayData = (typeof Formula.arrayOperatorMapping[node.process_id] !== 'undefined');

		let convertValue = value => {
			if (Utils.isObject(value)) {
				if (value.from_node) {
					let refNode = node.getProcessGraph().getNode(value.from_node);
					if (refNode) {
						value = this.nodeToFormula(refNode, operator);
					}
					else {
						value = '#' + value.from_node;
					}
				}
				else if (value.from_parameter) {
					value = value.from_parameter;
				}
				else {
					throw new Error('Objects not allowed');
				}
			}
			return value;
		};

		// Create the list of arguments
		let argList = [];
		let params = Array.isArray(process.parameters) ? process.parameters : [];
		for(let parameter of params) {
			let value = convertValue(node.getRawArgument(parameter.name));

			if (isArrayData && Array.isArray(value) && parameter.name === 'data') {
				argList = value.map(v => convertValue(v));
				break;
			}
			else if(typeof value !== 'undefined') {
				argList.push(value);
			}
			else if(typeof parameter.default !== 'undefined') {
				argList.push(parameter.default);
			}
			else {
				throw new Error('Argument for parameter "' + parameter.name + '" missing');
			}
		}
		 
		 // Filter null values for array data to handle ignore_nodata
		if (isArrayData) {
			argList = argList.filter(v => v !== null);
		}

		if (operator) {
			let strongOps = ['/', '*']; // "Punktrechnung" vor
			let weakOps = ['-', '+']; // "Strichrechung"
			let formula = argList
				.map(v => v < 0 ? '(' + v + ')' : v) // Put negative values in brackets
				.join(operator); // Merge everything together
			
			// Check whether brackets are required
			if (
				// No brackets on top-level
				!parentOperator
				// If operators are both weak, no brackets required
				|| (weakOps.includes(parentOperator) && weakOps.includes(operator))
				// If operators are both strong, no brackets required -> not correct, x/(a*b) needs it, see https://github.com/Open-EO/openeo-web-editor/issues/235
//				|| (strongOps.includes(parentOperator) && strongOps.includes(operator))
				// No brackets required for power, it's the strongest operation
				|| operator === '^'
				// If the parent operation is a weak operation (+/-) and this is a strong operation, no brackets required
				|| (weakOps.includes(parentOperator) && strongOps.includes(operator))
			) {
				return formula;
			}
			else {
				return '(' + formula + ')';
			}
		}
		else {
			return node.process_id + '(' + argList.join(', ') + ')';
		}
	}

}