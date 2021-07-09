<template>
	<div class="visualEditor" ref="visualEditor">
		<div class="sourceHeader">
			<h3 v-if="title">{{ title }}</h3>
			<div class="sourceToolbar">
				<span class="sepr" v-if="editable">
					<button type="button" @click="confirmClear" title="New script / Clear current script"><i class="fas fa-file"></i></button>
					<slot name="file-toolbar"></slot>
				</span>
				<span class="sepr" v-if="editable">
					<button type="button" @click="$refs.blocks.undo()" :disabled="!canUndo" title="Revert last change"><i class="fas fa-undo-alt"></i></button>
					<button type="button" @click="$refs.blocks.redo()" :disabled="!canRedo" title="Redo last reverted change"><i class="fas fa-redo-alt"></i></button>
					<button type="button" @click="$refs.blocks.deleteSelected()" :disabled="!hasSelection" title="Delete selected elements"><i class="fas fa-trash"></i></button>
				</span>
				<span class="sepr" v-if="editable">
					<button type="button" @click="addParameter" title="Add Parameter"><i class="fas fa-parking"></i></button>
					<button type="button" v-if="supportsMath" :class="{highlightFormula: isMath}" @click="showExpressionModal" title="Insert/Edit formula"><i class="fas fa-square-root-alt"></i></button>
				</span>
				<button type="button" @click="$refs.blocks.toggleCompact()" :class="{compactMode: compactMode}" title="Compact Mode"><i class="fas fa-compress-arrows-alt"></i></button>
				<button type="button" @click="$refs.blocks.perfectScale()" title="Scale to perfect size"><i class="fas fa-arrows-alt"></i></button>
				<FullscreenButton :element="() => this.$refs.visualEditor" @changed="enabled => {this.$refs.blocks.perfectScale(); isFullScreen = enabled}" />
				<slot name="toolbar"></slot>
			</div>
		</div>
		<div class="editorSplitter">
			<DiscoveryToolbar v-if="(showDiscoveryToolbar || isFullScreen) && editable" class="discoveryToolbar" :onAddProcess="insertProcess" />
			<div class="graphBuilder" @drop="onDrop($event)" @dragover="allowDrop($event)">
				<ModelBuilder
					ref="blocks"
					:editable="editable"
					:id="id"
					:processes="processRegistry"
					:collections="collections"
					:parent="parent"
					:parentSchema="parentSchema"
					:value="value"
					@input="commit"
					@error="errorHandler"
					@showProcess="id => emit('showProcess', id)"
					@showCollection="id => emit('showCollection', id)"
					@showSchema="showSchemaModal"
					@editParameters="openParameterEditor"
					@compactMode="compact => this.compactMode = compact"
					@selectionChanged="selectionChanged"
					@historyChanged="historyChanged"
					/>
			</div>
		</div>
		<ParameterModal ref="parameterModal" />
		<ExpressionModal v-if="editable && supportsMath" ref="expressionModal" @save="insertNodes" />
	</div>
</template>

<script>
import ModelBuilder from '@openeo/vue-components/components/ModelBuilder.vue';
import Utils from '../utils.js';
import DiscoveryToolbar from './DiscoveryToolbar.vue';
import ParameterModal from './modals/ParameterModal.vue'; // Add a paremeter modal to each visual editor, otherwise we can't open a parameter modal over a parameter modal (e.g. edit the parameters of a callback)
import EventBusMixin from './EventBusMixin.vue';
import FullscreenButton from './FullscreenButton.vue';

export default {
	name: 'VisualEditor',
	mixins: [EventBusMixin],
	components: {
		ModelBuilder,
		DiscoveryToolbar,
		ParameterModal,
		FullscreenButton,
		// Async loading for smaller starting bundle
		ExpressionModal: () => import('./modals/ExpressionModal.vue')
	},
	props: {
		id: String,
		editable: {
			type: Boolean,
			default: true
		},
		value: {
			type: Object,
			default: () => null
		},
		parent: {
			type: Object,
			default: null
		},
		parentSchema: {
			type: Object,
			default: null
		},
		showDiscoveryToolbar: {
			type: Boolean,
			default: false
		},
		title: {
			type: String
		},
		defaultValue: {}
	},
	computed: {
		...Utils.mapState(['collections']),
		...Utils.mapGetters(['processRegistry']),
		...Utils.mapGetters('userProcesses', ['supportsMath', 'isMathProcess'])
	},
	data() {
		return {
			canUndo: false,
			canRedo: false,
			compactMode: false,
			hasSelection: false,
			isMath: false,
			isFullScreen: false
		};
	},
	watch: {
		value(value) {
			this.isMath = this.isMathProcess(value);
		}
	},
	methods: {
		...Utils.mapActions('userProcesses', {readUserProcess: 'read'}),

		commit(value) {
			// Fix #115: Return the default value/null if no nodes are given
			if (typeof this.defaultValue !== 'undefined' && Utils.isObject(value) && Utils.size(value.process_graph) === 0) {
				value = this.defaultValue;
			}
			this.$emit('input', value);
		},

		errorHandler(message, title = null) {
			Utils.exception(this, message, title)
		},

		selectionChanged(blocks, edges) {
			this.hasSelection = Boolean(blocks.filter(block => block.$el.allowsDelete).length || edges.length);
		},

		historyChanged(history, index) {
			this.canUndo = !!history[index-1];
			this.canRedo = !!history[index+1];
		},

		allowDrop(ev) {
			ev.preventDefault();
		},

		onDrop(event) {
			var json = event.dataTransfer.getData("application/vnd.openeo-node");
			if (json) {
				event.preventDefault();
				let node = JSON.parse(json);
				this.insertProcess(node, event.pageX, event.pageY);
			}
		},

		addParameter() {
			var fields = [
				{
					name: 'name',
					label: 'Parameter name',
					schema: {type: 'string'},
					default: null
				}
			];
			this.emit('showDataForm', "Add Parameter", fields, data => {
				if (typeof data.name === 'string' && data.name.length > 0) {
					this.$refs.blocks.addPgParameter(data);
				}
			});
		},

		showSchemaModal(name, schema) {
			this.emit('showSchema', name, schema);
		},
		showExpressionModal() {
			this.$refs.expressionModal.show(this.value, this.$refs.blocks.getPgParameters());
		},
		openParameterEditor(parameters, values, title = "Edit", isEditable = true, selectParameterName = null, saveCallback = null, parent = null) {
			this.$refs.parameterModal.show(title, parameters, values, isEditable, saveCallback, null, selectParameterName, parent);
		},

		confirmClear() {
			var confirmed = confirm("Do you really want to clear the existing model?");
			if (confirmed) {
				this.clear();
			}
		},
		clear() {
			if (this.$refs.blocks) {
				this.$refs.blocks.clear();
			}
			this.commit(null);
		},

		insertProcess(node, x = null, y = null) {
			try {
				var pos = this.$refs.blocks.getPositionForPageXY(x, y);
				this.$refs.blocks.addProcess(node.process_id, node.arguments, pos);
			} catch(error) {
				Utils.exception(this, error);
			}
		},

		async insertNodes(nodes, replace = false) {
			return await this.$refs.blocks.import({
				process_graph: nodes
			}, {
				clear: replace
			});
		}

	}
}
</script>

<style>
.visualEditor {
	background-color: white;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.visualEditor .editorSplitter {
	display: flex;
	flex-direction: row-reverse;
	flex-grow: 1;
	height: 100%;
	overflow: hidden;
}

.visualEditor .discoveryToolbar {
	width: 25%;
	min-width: 150px;
	border-left: 1px solid #ddd;
}
.visualEditor.fullscreen .discoveryToolbar {
	width: 15%;
	min-width: 250px;
}

.graphBuilder {
	height: 100%;
	flex-grow: 1;
}

.visualEditor.fullscreen {
	display: flex;
	flex-direction: column;
}

.visualEditor.fullscreen .editorSplitter {
	height: 100%;
}

.compactMode {
	color: green;
}

@keyframes glowing {
  0% {
    box-shadow: 0 0 3px green;
  }
  50% {
    box-shadow: 0 0 10px green;
  }
  100% {
    box-shadow: 0 0 3px green;
  }
}

.highlightFormula {
    animation: glowing 1500ms infinite;
}
</style>
