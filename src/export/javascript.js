import Utils from "../utils";
import Exporter from "./exporter";

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
	"class*",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"double",
	"else",
	"enum*",
	"eval",
	"export",
	"extends*",
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

	createProcessGraphInstance(process) {
		let pg = new JavaScript(process, this.processRegistry, this.getJsonSchemaValidator());
		return this.copyProcessGraphInstanceProperties(pg);
	}

	isKeyword(keyword) {
		return KEYWORDS.includes(keyword.toLowerCase());
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
		this.comment(`ToDo: Authentication with authenticateBasic() or authhenticateOidc()`);
	}

	generateBuilder() {
		this.addCode(`let builder = await connection.buildProcess();`);
	}

	generateMetadata(key, value) {
		this.addCode(`builder.${key} = ${this.e(value)};`);f
	}

	async generateFunction(node) {
		let variable = this.var(node.id);
		let builderName = node.getParent() ? 'this' : 'builder';
		let args = await this.generateArguments(node, true);
		let useGenericFunction = node.namespace || Utils.isObject(args);

		this.comment(node.description);
		if (useGenericFunction) {
			let processId = node.namespace ? `${node.process_id}@${node.namespace}` : node.process_id;
			this.addCode(`let ${variable} = ${builderName}.process(${processId}, ${this.e(args)});`);
		}
		else {
			this.addCode(`let ${variable} = ${builderName}.${node.process_id}(${args.join(', ')});`);
		}
//		if (node.description) {
//			this.addCode(`${variable}.description(${this.e(node.description)})`);
//		}

	}

	async generateCallback(callback, parameters, variable) {
		let isMathFormula = false;
		if (isMathFormula) {
			// ToDo: Use Formula class, use ExpressionModal code
		}
		else {
			let params = parameters.map(p => p.name).join(', ');
			this.addCode(`let ${variable} = function(${params}) {`);
			this.indent++;
			this.addCode(await callback.toCode(true));
			this.indent--;
			this.addCode(`}`);
		}
	}

	generateResult(resultNode, callback) {
		if (!resultNode) {
			return;
		}
		let variable = this.var(resultNode.id);
		if (callback) {
			this.addCode(`return ${variable};`);
		}
		else {
			this.addCode(`let result = await connection.computeResult(${variable});`);
		}
	}

}