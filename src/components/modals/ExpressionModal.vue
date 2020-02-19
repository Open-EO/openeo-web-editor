<template>
	<Modal ref="modal" minWidth="70%">
		<template #main>
			<div class="content">
				<TextEditor id="input" class="editor" v-model="input" language="math" placeholder="e.g. x * 2.5 / (x - y)" />
				<div class="description"><i  class="fas fa-info-circle"></i> Above you can insert a mathematical formula and it will be converted to openEO code for you.
					<p><strong>Operators</strong>:<br />
						<kbd v-for="op in operators" :key="op.op" :title="op.title" @click="emit('showProcess', op.processId)" class="click">{{ op.op }}</kbd>
					</p>
					<p>Supported <strong>mathematical functions</strong>:
						<template v-if="functions.length">
							<br /><kbd v-for="func in functions" :key="func.id" :title="func.summary" @click="emit('showProcess', func.id)" class="click">{{ func.id }}</kbd>
						</template>
						<template v-else>None</template>
					</p>
					<p>Available <strong>output from processes</strong>:
						<template v-if="results.length">
							<br /><kbd v-for="id in results" :key="id">#{{ id }}</kbd> <!-- ToDo: Open non-editable parameter editor or process schema -->
						</template>
						<template v-else>None</template>
					</p>
					<p><strong>Parameters</strong>: If a variable if found in the formula which can't be resolved to a pre-defined parameter, a new parameter will be created for it. Available pre-defined parameters:
						<template v-if="pgParameters.length">
							<br /><kbd v-for="param in pgParameters" :key="param.id" @click="$emit('showSchema', param.schema)" class="click">{{ param.id }}</kbd>
						</template>
						<template v-else>None</template>
					</p>
					<p v-if="supportsArrayElementWithLabels">If the first pre-defined parameter is a <strong>labeled array</strong>, the value for a label can be accessed by typing the label with a <kbd>$</kbd> in front, for example <kbd>$B1</kbd>. This is especially useful in reducers.</p>
				</div>
			</div>
		</template>
		<template #footer>
			<div class="footer">
				<button type="button" @click="createResult">Insert</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import TapDigit from '../math/TapDigit.js'
import Utils from '../../utils.js';
import TextEditor from '../TextEditor.vue';
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import { ProcessSchema } from '../blocks/processSchema.js';

export default {
	name: 'ExpressionModal',
	mixins: [EventBusMixin],
	components: {
		Modal,
		TextEditor
	},
	props: {
		operatorMapping: Object
	},
	data() {
		return {
			parser: new TapDigit.Parser(),
			input: '',
			pgParameters: [],
			arrayElements: {},
			processGraph: {},
			result: {}
		};
	},
	computed: {
		...Utils.mapGetters(['processRegistry']),
		operators() {
			var ops = [];
			for(var op in this.operatorMapping) {
				let processId = this.operatorMapping[op];
				let title = this.processRegistry.get(processId).summary;
				ops.push({op, processId, title});
			}
			return ops;
		},
		functions() {
			return this.processRegistry.all().filter(this.isMathProcess).map(p => ({id: p.id, summary: p.summary}));
		},
		results() {
			let resultNodes = [];
			for(var id in this.processGraph) {
				var node = this.processGraph[id];
				var process = this.processRegistry.get(node.process_id);
				if (this.isMathProcess(process, false)) {
					resultNodes.push(id);
				}
			}
			return resultNodes;
		},
		supportsArrayElementWithLabels() {
			// A pg parameter needs to be available
			if (this.pgParameters.length === 0) {
				return false;
			}

			// array_element must be supported
			let process = this.processRegistry.get('array_element');
			if (!process) {
				return false;
			}

			// array_element must have a parameter called label
			return process.parameters.filter(p => p.name === 'label').length > 0;
		}
	},
	methods: {
		show(process = {}, pgParameters = []) {
			this.$refs.modal.show("Insert Formula");
			this.pgParameters = pgParameters;
			this.processGraph = process.process_graph || {};
			this.result = {};

			// Add all array_element calls for labels to the list so that we don't get duplicate array_element calls
			this.arrayElements = {};
			for(let id in this.processGraph) {
				let node = this.processGraph[id];
				if (node.process_id === 'array_element' && Utils.isObject(node.arguments) && node.arguments.label) {
					this.arrayElements[node.arguments.label] = node;
				}
			}
		},
		isMathProcess(p, excludeOperators = true) {
			// Skip processes handled by operators
			if (excludeOperators) {
				let operatorProcesses = Object.values(this.operatorMapping);
				if (operatorProcesses.includes(p.id)) {
					return false;
				}
			}

			// Process must return a numerical value
			if (!Utils.isObject(p.returns) || !p.returns.schema) {
				return false;
			}

			let allowedTypes = ['number', 'integer', 'any'];
			let returns = new ProcessSchema(p.returns.schema);
			if (!allowedTypes.includes(returns.nativeDataType())) {
				return false;
			}

			// Required Process parameters must accept numerical values
			if (Array.isArray(p.parameters)) {
				for(var i in p.parameters) {
					let param = p.parameters[i];
					if (param.optional) {
						continue; // Skip optional parameters
					}
					if (!param.schema) {
						return false;
					}
					let schema = new ProcessSchema(param.schema);
					if (!allowedTypes.includes(schema.nativeDataType())) {
						return false;
					}
				}
			}
			
			// ToDo: Parameters with a dash (and other operators) in them are a problem

			return true;
		},
		createResult() {
			if (this.input.length === 0) {
				this.$refs.modal.close();
				return;
			}

			try {
				this.result = {};
				let res = this.parseTree(this.parser.parse(this.input));
				if (!Utils.isObject(res) || !res.from_node) {
					throw new Error('Invalid formula specified.');
				}
				// Set result node
				this.result[res.from_node].result = true;
				// Send result
				this.$emit('save', this.result);
				this.$refs.modal.close();
			} catch(e) {
				Utils.exception(this, e);
			}
		},
		parseTree(tree) {
			let key = Object.keys(tree)[0]; // There's never more than one property so no loop required
			switch(key) {
				case 'Assignment':
					throw new Error('Assignments are not supported.');
				case 'Number':
					return parseFloat(tree.Number);
				case 'Identifier':
					return this.getRef(tree.Identifier);
				case 'Expression':
					return this.parseTree(tree.Expression);
				case 'FunctionCall':
					let args = [];
					for(let i in tree.FunctionCall.args) {
						args.push(this.parseTree(tree.FunctionCall.args[i]));
					}
					return this.addProcess(tree.FunctionCall.name, args);
				case 'Binary':
					return this.addOperatorProcess(
						tree.Binary.operator,
						this.parseTree(tree.Binary.left),
						this.parseTree(tree.Binary.right)
					);
				case 'Unary':
					let val = this.parseTree(tree.Unary.expression);
					if (tree.Unary.operator === '-') {
						if (typeof val === 'number') {
							return -val;
						}
						else {
							return this.addOperatorProcess('*', -1, val);
						}
					}
					else {
						return val;
					}
				default:
					throw new Error('Operation ' + key + ' not supported.');
			}
		},
		getRef(value) {
			// Output of a process
			if (typeof value === 'string' && value.startsWith('#')) {
				let nodeId = value.substring(1);
				if (this.results.includes(nodeId)) {
					return { from_node: nodeId };
				}
			}
			// Array labels
			if (this.supportsArrayElementWithLabels && typeof value === 'string' && value.startsWith('$')) {
				let label = value.substring(1);
				// ToDo 1.0: Populate label parameter
				// ToDo: Only create if it doesn't exist in process graph yet
				if (label in this.arrayElements) {
					return this.arrayElements[label];
				}
				else {
					let arrayElement = this.addProcess("array_element", {
						data: {
							from_argument: this.pgParameters[0].id
						},
						label: label
					});
					this.arrayElements[label] = arrayElement;
					return arrayElement;
				}
			}

			// Everything else is a parameter
			if (this.pgParameters.filter(p => p.id === value).length === 0) {
				// ToDo: Add new parameter to process
			}
			return { from_parameter: value };
		},
		addOperatorProcess(operator, left, right) {
			if (typeof this.operatorMapping[operator] !== 'undefined') {
				return this.addProcess(this.operatorMapping[operator], {x: left, y: right});
			}
			else {
				throw new Error('Operator ' + operator + ' not supported.');
			}
		},
		addProcess(name, args) {
			// Get process
			let process = this.processRegistry.get(name);
			if (!process) {
				throw new Error("Process not available: " + name);
			}
			else if (args.length > Utils.size(process.parameters)) {
				throw new Error("Number of given arguments exceeds number of process parameters for process '" + name + "'.");
			}

			// Convert arguments array to object
			if (Array.isArray(args)) {
				let namedArgs = {};
				for (let i in args) {
					let parameter = process.parameters[i];
					namedArgs[parameter.name] = args[i];
				}
				args = namedArgs;
			}
			// ToDo: Check all arguments against their schemas / check all required fields are given

			// Add node to result with unique id
			let nodeId = Utils.getUniqueId();
			let node = {
				process_id: name,
				arguments: args
			};
			this.result[nodeId] = node;
			return { from_node: nodeId };
		}
	}
}
</script>

<style scoped>
.footer {
	text-align: right;
}
.content {
	display: flex;
	flex-direction: column;
}
.content .textEditor {
	flex-grow: 1;
}
.description {
	margin-top: 1rem;
}
.editor {
	width: 100%;
	height: 10em;
}
kbd {
	font-family: Consolas, "Lucida Console", monospace;
	display: inline-block;
	border-radius: 3px;
	padding: 1px 5px;
	box-shadow: 1px 1px 1px #777;
	margin: 2px;
	font-size: small;
	vertical-align: text-bottom;
	background: #eee;
	font-weight: 600;
	color: #555;
	letter-spacing: 0.25px;
}
kbd.click {
	cursor: pointer;
}
</style>