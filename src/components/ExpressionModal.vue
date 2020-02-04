<template>
	<Modal ref="modal">
		<template #main>
			<div id="ExpressionModal">
				<input type="text" id="ExpressionInput" v-model="ExpressionInput" placeholder="e.g. a * 2.5 / (a - b)"/>
			</div>
		</template>
		<template #footer>
			<div class="footer">
				<button type="button" @click="insertExpression">Insert</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Modal from './Modal.vue';
import {TapDigit} from './../TapDigit.js'
import Utils from '../utils.js';
export default {
	name: 'ExpressionModal',
	components: {
		Modal
	},
	data() {
		return {
			parser: null,
			ExpressionInput: null
		};
	},
	methods: {
		show() {
			this.$refs.modal.show("Insert Expression");
			if (!this.parser)
				this.parser = new TapDigit.Parser();
			this.pgNew = new Object();
			this.processIndex = 20; //TODO: Better Index that can't be already in use
			this.opsDict = {
				"-": "subtract",
				"+": "add",
				"/": "divide",
				"*": "multiply",
				"^": "power"
			}
			this.functionsDict = {
				"sqrt": {name: "sqrt", argNames: ["x"]},
				"linear_scale_range": {name: "linear_scale_range", argNames: ["x", "inputMin", "inputMax", "outputMin" , "outputMax"]},
				"clip": {name: "clip", argNames: ["min", "max"]},
				"int": {name: "int", argNames: ["x"]},
				"mod": {name: "mod", argNames: ["x", "y"]},
				"sgn": {name: "sgn", argNames: ["x"]},
				"min": {name:"min", argNames: ["data"]} //TODO support arrays directly
			}

		},
		insertExpression() {
			let Expression = this.ExpressionInput;
			let syntaxTree = this.parser.parse(Expression);
			this.convertSyntaxTreeToProcessGraph(syntaxTree);
			console.log(this.pgNew);
		},
		convertSyntaxTreeToProcessGraph(syntaxTree) {
			this.buildPg(syntaxTree);
		},
		addProcessToPg(processIndex, operator, left, right) {
			this.pgNew[processIndex] = {};
			let obj = {};
			obj.process_id = this.opsDict[operator];
			obj.arguments = {};
			obj.arguments.x = this.getDataEntry(left);
			obj.arguments.y = this.getDataEntry(right)
			this.pgNew[processIndex] = obj;
		},
		addProcessFromFunctionCallToPg(processIndex, name, args) {
			let dictEntry = this.functionsDict[name];
			if(!dictEntry)
				throw "Uknown function name: " + name;
			if(args.length > dictEntry.argNames.length)
				throw "Number of given arguments exceeds number of function arguments";
			this.pgNew[processIndex] = {};
			let obj = {};
			obj.process_id = dictEntry.name;
			obj.arguments = {};
			for (let argIndex in args){
				let arg = args[argIndex];
				let propName = dictEntry.argNames[argIndex];
				let propValue = arg[Object.keys(arg)[0]];
				if(Object.keys(arg)[0] === "Identifier"){
					obj.arguments[propName] = {};
					obj.arguments[propName].from_argument = propValue; //TODO: differentiate between from_argument and from_node
				}
				else{
					obj.arguments[propName] = propValue;
				}
			}
			this.pgNew[processIndex] = obj;
		},
		getDataEntry(tree){
			let obj = {};
			if(tree.Expression){
				if(tree.Expression.Binary){
					obj.from_node = tree.Expression.Binary.processIndex;
					return obj;
				}
				if(tree.Expression.FunctionCall){
					obj.from_node = tree.Expression.FunctionCall.processIndex;
					return obj;
				}
			}
			else if(tree.Binary){
				obj.from_node = tree.Binary.processIndex;
				return obj;
			}
			else if(tree.FunctionCall){
				obj.from_node = tree.FunctionCall.processIndex;
				return obj;
			}
			else if(tree.Unary){
				let node = tree.Unary;
				let expr = node.expression;
				let value = expr[Object.keys(expr)[0]];
				switch (node.operator) {
					case '+':
						return value;
					case '-':
						return -value;
				}
			}
			else if(tree.Number)
				return tree.Number;
			else if(tree.Identifier){
				obj.from_node = tree.Identifier; //TODO: differentiate from Node & from Argument
				return obj;
			}
		},
		buildPg(tree) {
			if(tree.Expression){
				this.buildPg(tree.Expression);
				return;
			}
			else if(tree.Binary){
				this.buildPg(tree.Binary);
				return;
			}
			else if(tree.FunctionCall){
				tree.FunctionCall.processIndex = this.processIndex++;
				this.addProcessFromFunctionCallToPg(tree.FunctionCall.processIndex, tree.FunctionCall.name, tree.FunctionCall.args);
			}
			if(tree.left){
				if(tree.left.Binary || tree.left.Expression || tree.left.FunctionCall){
					this.buildPg(tree.left);
				}
			}
			if(tree.right){
				if(tree.right.Binary || tree.right.Expression || tree.right.FunctionCall){
					this.buildPg(tree.right);
				}
			}
			if(!tree.Binary && !tree.Expression && !tree.FunctionCall) {
				tree.processIndex = this.processIndex++;
				this.addProcessToPg(tree.processIndex, tree.operator, tree.left, tree.right);
			}

		}
	}
}

</script>
<style scoped>
.footer {
	text-align: right;
}
</style>
<style>
#ExpressionModal #ExpressionInput {
	display: flex;
	flex-grow: 1;
}
#ExpressionModal {
	display: flex;
}
</style>