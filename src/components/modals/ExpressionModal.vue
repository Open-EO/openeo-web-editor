<template>
	<Modal ref="modal" minWidth="70%">
		<template #main>
			<div class="content">
				<TextEditor ref="editor" id="input" class="editor" v-model="input" language="math" placeholder="e.g. x * 2.5 / (x - y)" @drop="onDrop($event)" @dragover="allowDrop($event)" />
				<div class="description"><i  class="fas fa-info-circle"></i> Above you can insert a mathematical formula and it will be converted to openEO code for you.
					<p><strong>Operators</strong>:<br />
						<kbd v-for="op in operators" :key="op.op" :title="op.title" @click="emit('showProcess', op.processId)" class="click" draggable="true" @dragstart="onDrag($event, 'operators', op.op)">{{ op.op }}</kbd>
					</p>
					<p>Supported <strong>mathematical functions</strong>:
						<template v-if="mathProcesses.length">
							<br /><kbd v-for="func in mathProcesses" :key="func.id" :title="func.summary" @click="emit('showProcess', func.id)" class="click" draggable="true" @dragstart="onDrag($event, 'functions', func)">{{ func.id }}</kbd>
						</template>
						<template v-else>None</template>
					</p>
					<p>Available <strong>output from processes</strong>:
						<template v-if="results.length">
							<br /><kbd v-for="id in results" :key="id" draggable="true" @dragstart="onDrag($event, 'results', id)">#{{ id }}</kbd> <!-- ToDo: Open non-editable parameter editor or process schema -->
						</template>
						<template v-else>None</template>
					</p>
					<p><strong>Parameters</strong>: If a variable is found in the formula which can't be resolved to a pre-defined parameter, a new parameter will be created for it. Available pre-defined parameters:
						<template v-if="pgParameters.length">
							<br /><kbd v-for="param in pgParameters" :key="param.id" @click="emit('showSchema', param.id, param.spec.schema)" class="click" draggable="true" @dragstart="onDrag($event, 'pgParameters', param.id)">{{ param.id }}</kbd>
						</template>
						<template v-else>None</template>
					</p>
					<p v-if="supportsArrayElement">If the first pre-defined parameter is a (labeled) <strong>array</strong>, the value for a specific index or label can be accessed by typing the numeric index or textual label with a <kbd>$</kbd> in front, for example <kbd>$B1</kbd> for the label B1 or <kbd>$0</kbd> for the first element in the array. Numeric labels are not supported.</p>
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
import { Process } from '../blocks/processSchema.js';
import { ProcessGraph } from '@openeo/js-processgraphs';

export default {
	name: 'ExpressionModal',
	mixins: [EventBusMixin],
	components: {
		Modal,
		TextEditor
	},
	data() {
		return {
			parser: new TapDigit.Parser(),
			input: '',
			pgParameters: [],
			arrayElements: {},
			processGraph: {},
			result: {},
			replace: false
		};
	},
	computed: {
		...Utils.mapState('userProcesses', ['operatorMapping', 'arrayOperatorMapping']),
		...Utils.mapGetters(['processRegistry']),
		...Utils.mapGetters('userProcesses', ['mathProcesses', 'isMathProcess', 'reverseOperatorMapping']),
		operators() {
			var ops = [];
			for(var op in this.operatorMapping) {
				let processId = this.operatorMapping[op];
				let title = this.processRegistry.get(processId).summary;
				ops.push({op, processId, title});
			}
			return ops;
		},
		results() {
			let resultNodes = [];
			for(var id in this.processGraph) {
				var node = this.processGraph[id];
				var p = this.processRegistry.get(node.process_id);
				if (Process.isMathProcess(p)) {
					resultNodes.push(id);
				}
			}
			return resultNodes;
		},
		supportsArrayElement() {
			// A pg parameter needs to be available
			if (this.pgParameters.length === 0) {
				return false;
			}

			// array_element must be supported
			let process = this.processRegistry.get('array_element');
			if (!process) {
				return false;
			}

			return true;
			// ToDo: Check that labels are supported?!
			// return process.parameters.filter(p => p.name === 'label').length > 0;
		}
	},
	methods: {
		show(process = {}, pgParameters = []) {
			this.$refs.modal.show("Insert Formula");
			this.result = {};
			this.input = '';
			this.replace = false;
			this.pgParameters = pgParameters;
			this.processGraph = Utils.isObject(process) && Utils.isObject(process.process_graph) ? process.process_graph : {};
			try {
				this.importFormula(process);
			} catch (error) {
				console.info(error);
			}

			if(!this.replace) {
				// If not replacing: Add all array_element calls for labels to the list so that we don't get duplicate array_element calls
				this.arrayElements = {};
				for(let id in this.processGraph) {
					let node = this.processGraph[id];
					if (node.process_id === 'array_element' && Utils.isObject(node.arguments) && node.arguments.label) {
						this.arrayElements[node.arguments.label] = {from_node: node.id};
					}
				}
			}
		},
		onDrag(event, type, data) {
			switch(type) {
				case 'functions':
					let params = (data.parameters || []).map(p => p.name);
					data = data.id + '(' + params.join(', ') + ')';
					break;
				case 'results':
					data = '#' + data;
					break;
			}
			event.dataTransfer.setData("text/plain", data);
		},
		allowDrop(event) {
			event.preventDefault();
		},
		onDrop(event) {
			var text = event.dataTransfer.getData("text/plain");
			if (text) {
				event.preventDefault();
				this.$refs.editor.insert(text, false);
			}
		},
		importFormula(process) {
			if (!this.isMathProcess(process)) {
				return;
			}

			var pg = new ProcessGraph(process, this.processRegistry);
			pg.parse();
			let formula = this.nodeToFormula(pg.getResultNode());
			if (formula) {
				this.input = formula;
				this.replace = true;
			}
		},
		nodeToFormula(node, parentOperator = null) {
			if (node.process_id === 'array_element') {
				return '$' + (node.getArgument('label') || node.getArgument('index'));
			}

			let operator = this.reverseOperatorMapping[node.process_id];
			let process = this.processRegistry.get(node.process_id);
			let isArrayData = (typeof this.arrayOperatorMapping[node.process_id] !== 'undefined');
			let parameterNames = (process.parameters || []).map(p => p.name);

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
			for(let name of parameterNames) {
				let value = convertValue(node.getRawArgument(name));

				if (isArrayData && Array.isArray(value) && name === 'data') {
					argList = value.map(v => convertValue(v));
					break;
				}
				else if(typeof value !== 'undefined') {
					argList.push(value);
				}
				else {
					throw new Error('Argument missing');
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
					!parentOperator // No brackets on top-level
					|| (weakOps.includes(parentOperator) && weakOps.includes(operator)) // If operators are both weak, no brackets required
					|| (strongOps.includes(parentOperator) && strongOps.includes(operator)) // If operators are both strong, no brackets required
					|| operator === '^' // No brackets required for power, it's the strongest operation
					|| (weakOps.includes(parentOperator) && strongOps.includes(operator)) // If the parent operation is a weak operation (+/-) and this is a strong operation, no brackets required
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
				this.$emit('save', this.result, this.replace);
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
			// Convert native data types
			if (value === 'true') {
				return true;
			}
			else if (value === 'false') {
				return false;
			}
			else if (value === 'null') {
				return null;
			}

			// Output of a process
			if (typeof value === 'string' && value.startsWith('#')) {
				let nodeId = value.substring(1);
				if (this.results.includes(nodeId)) {
					return { from_node: nodeId };
				}
			}
			// Array labels / indices
			if (this.supportsArrayElement && typeof value === 'string' && value.startsWith('$')) {
				let ref = value.substring(1);
				if (!(ref in this.arrayElements)) {
					// ToDo: Check whether label is really supported - see implementation for supportsArrayElement()
					let args = {
						data: {
							from_parameter: this.pgParameters[0].id
						}
					};
					if (ref.match(/^\d+$/)) {
						args.index = parseInt(ref, 10);
					}
					else {
						args.label = ref;
					}
					this.arrayElements[ref] = this.addProcess("array_element", args);
				}
				return this.arrayElements[ref];
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
	min-height: 4em;
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