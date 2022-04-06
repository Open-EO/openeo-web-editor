<template>
	<Modal :show="show" width="80%" title="Formula Editor" @closed="$emit('closed')">
		<template #default>
			<div class="content">
				<TextEditor ref="editor" id="input" class="editor" v-model="input" language="math" placeholder="e.g. x * 2.5 / (x - y)" @drop="onDrop" @dragover="allowDrop" />
				<div class="description">
					<p><i  class="fas fa-info-circle"></i> Above you can insert a mathematical formula and it will be converted to openEO code for you.</p>
					<p><strong>Operators</strong>:<br />
						<kbd v-for="op in operators" :key="op.op" :title="op.title" @click="emit('showProcess', {id: op.processId})" class="click" draggable="true" @dragstart="onDrag($event, 'operators', op.op)">{{ op.op }}</kbd>
					</p>
					<p>Supported <strong>mathematical functions</strong>:
						<template v-if="mathProcesses.length">
							<br /><kbd v-for="func in mathProcesses" :key="func.id" :title="func.summary" @click="emit('showProcess', func)" class="click" draggable="true" @dragstart="onDrag($event, 'functions', func)">{{ func.id }}</kbd>
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
							<br /><kbd v-for="param in pgParameters" :key="param.id" @click="emit('showProcessParameter', param)" class="click" draggable="true" @dragstart="onDrag($event, 'pgParameters', param.name)">{{ param.name }}</kbd>
						</template>
						<template v-else>None</template>
					</p>
					<p v-if="supportsArrayElement">If the first pre-defined parameter is a (labeled) <strong>array</strong>, the value for a specific index or label can be accessed by typing the numeric index or textual label with a <kbd>$</kbd> in front, for example <kbd>$B1</kbd> for the label B1 or <kbd>$0</kbd> for the first element in the array. You can access subsequent parameters by adding additional $ characters at the beginning, e.g. <kbd>$$0</kbd> for the first element of an array in the second parameter, <kbd>$$$0</kbd> for the same behavior in the third parameter etc. Numeric labels are not supported.</p>
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
import Utils from '../../utils.js';
import TextEditor from '../TextEditor.vue';
import EventBusMixin from '../EventBusMixin.vue';
import Process from '../../process';
import { Formula } from '@openeo/js-client';

export default {
	name: 'ExpressionModal',
	mixins: [EventBusMixin],
	components: {
		Modal,
		TextEditor
	},
	props: {
		process: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			show: true,
			input: '',
			arrayElements: {},
			result: {},
			replace: false
		};
	},
	created() {
		try {
			this.importFormula();
		} catch (error) {
			console.info(error);
		}

		this.arrayElements = {};
		if(!this.replace) {
			// If not replacing: Add all array_element calls for labels to the list so that we don't get duplicate array_element calls
			for(let id in this.process.getNodes()) {
				let node = this.process.getNode(id);
				if (node.process_id === 'array_element') {
					let placeholder = this.process.getArrayElementPlaceholder(node);
					this.arrayElements[placeholder] = {from_node: node.id};
				}
			}
		}
	},
	computed: {
		...Utils.mapGetters(['processes']),
		mathProcesses() {
			return this.processes.getMathProcesses();
		},
		pgParameters() {
			return this.process.getCallbackParameters();
		},
		operators() {
			var ops = [];
			for(var op in Formula.operatorMapping) {
				let processId = Formula.operatorMapping[op];
				let title = this.processes.get(processId).summary;
				ops.push({op, processId, title});
			}
			return ops;
		},
		results() {
			let resultNodes = [];
			for(var id in this.process.getNodes()) {
				var node = this.process.getNode(id);
				var p = this.processes.get(node.process_id);
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
			return this.processes.has('array_element');
		}
	},
	methods: {
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
		importFormula() {
			let formula = this.process.toFormulaString();
			if (formula) {
				this.input = formula;
				this.replace = true;
			}
		},
		createResult() {
			if (this.input.length === 0) {
				this.show = false;
				return;
			}

			try {
				this.result = {};
				let formula = new Formula(this.input);
				let res = this.parseTree(formula.tree);
				if (!Utils.isObject(res) || !res.from_node) {
					throw new Error('Invalid formula specified.');
				}
				// Set result node
				this.result[res.from_node].result = true;
				// Send result
				this.$emit('save', this.result, this.replace);
				this.show = false;
			} catch(e) {
				Utils.exception(this, e);
			}
		},
		parseTree(tree) {
			let key = Object.keys(tree)[0]; // There's never more than one property so no loop required
			switch(key) {
				case 'Number':
					return Number.parseFloat(tree.Number);
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
			if (this.supportsArrayElement && typeof value === 'string') {
				let prefix = value.match(/^\$+/);
				let count = prefix ? prefix[0].length : 0;
				if (count > 0) {
					let ref = value.substring(count);
					if (!(value in this.arrayElements)) {
						// ToDo: Check whether label is really supported - see implementation for supportsArrayElement()
						let args = {
							data: {
								from_parameter: this.pgParameters[count-1].name
							}
						};
						if (ref.match(/^\d+$/)) {
							args.index = Number.parseInt(ref, 10);
						}
						else {
							args.label = ref;
						}
						this.arrayElements[value] = this.addProcess("array_element", args);
					}
					return this.arrayElements[value];
				}
			}

			// Everything else is a parameter
			if (this.pgParameters.filter(p => p.name === value).length === 0) {
				// ToDo: Add new parameter to process
			}
			return { from_parameter: value };
		},
		addOperatorProcess(operator, left, right) {
			if (typeof Formula.operatorMapping[operator] !== 'undefined') {
				let process = this.processes.get(Formula.operatorMapping[operator]);
				let args = {};
				if (!process || !Array.isArray(process.parameters) || process.parameters.length < 2) {
					throw new Error("Process for operator " + operator + " must have at least two parameters");
				}
				args[process.parameters[0].name || 'x'] = left;
				args[process.parameters[1].name || 'y'] = right;
				return this.addProcess(process, args);
			}
			else {
				throw new Error('Operator ' + operator + ' not supported.');
			}
		},
		addProcess(process, args) {
			if (typeof process === 'string') {
				process = this.processes.get(process);
			}

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
				process_id: process.id,
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
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}
.description p {
	margin: 0.5em 0;
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