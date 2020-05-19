<template>
	<div class="sourceHeader">
		<h3 v-if="isMainEditor && scriptTitle">{{ scriptTitle }}</h3>
		<div class="sourceToolbar">
			<span class="sepr" v-if="editable">
				<button type="button" @click="newScript" title="New script / Clear current script"><i class="fas fa-file"></i></button>
				<button type="button" v-show="isMainEditor && scriptTitle" @click="saveScript" :title="'Save to ' + scriptTitle"><i class="fas fa-save"></i></button>
			</span>
			<slot></slot>
		</div>
	</div>
</template>

<script>
import EventBusMixin from '@openeo/vue-components/components/EventBusMixin.vue';
import Utils from '../utils.js';

export default {
	name: 'EditorToolbar',
	mixins: [EventBusMixin],
	props: {
		editable: {
			type: Boolean,
			default: true
		},
		onClear: {
			type: Function,
			required: true
		},
		isMainEditor: {
			type: Boolean,
			default: false
		}
	},
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapState('editor', ['activeScript']),
		...Utils.mapGetters('editor', ['scriptTitle']),
		...Utils.mapGetters(['supports', 'isAuthenticated'])
	},
	methods: {
		...Utils.mapMutations('editor', ['setScript']),

		newScript() {
			var confirmed = confirm("Do you really want to clear the existing script to create a new one?");
			if (confirmed) {
				this.onClear();
				this.setScript(null);
			}
		},

		saveScript() {
			this.emit('getCustomProcess', newScript => this.emit('replaceProcess', this.activeScript, newScript));
		}
	}
}
</script>


<style>
.sourceHeader {
	padding: 5px;
	border-bottom: 1px solid #ddd;
	display: flex;
	justify-content: flex-end;
	background-color: #fff;
}
.sourceHeader h3 {
	margin: auto 0;
	flex-grow: 1;
}
.sourceToolbar {
	text-align: right;
}
</style>
