<template>
	<MultiSelect v-model="selected" :key="type" ref="htmlElement" label="label" track-by="id" :multiple="multiple" :options="selectOptions" :allowEmpty="false" :preselectFirst="preselect" :disabled="!editable" :deselectLabel="deselectLabel"></MultiSelect>
</template>

<script>
import MultiSelect from 'vue-multiselect'
import Utils from '../../utils';
import { Utils as VueUtils } from '@openeo/vue-components';

export default {
	name: 'SelectBox',
	components: {
		MultiSelect
	},
	props: {
		value: {
			type: String | Number
		},
		type: {
			type: String
		},
		editable: {
			type: Boolean,
			default: true
		},
		options: {
			type: Array | Object
		},
		schema: {
			type: Object
		}
	},
	computed: {
		selectOptions() {
			let state = [];
			switch(this.type) {
				case 'collection-id':
					state = this.$store.state.collections;
					break;
				case 'job-id':
					state = this.$store.state.jobs.jobs;
					break;
				case 'file-path':
				case 'file-paths':
					state = this.$store.state.files.files;
					break;
				case 'epsg-code':
					state = this.$store.state.editor.epsgCodes;
					break;
				case 'input-format':
					state = this.$store.state.fileFormats.getInputTypes();
					break;
				case 'output-format':
					state = this.$store.state.fileFormats.getOutputTypes();
					break;
				case 'service-type':
					state = this.$store.state.serviceTypes;
					break;
				case 'billing-plan':
					state = this.$store.state.connection.capabilities().listPlans();
					break;
			}

			let data = [];
			switch(this.type) {
				case 'collection-id':
					return state.map(c => ({
						id: c.id,
						label: c.id
					})).sort(this.sortByLabel);
				case 'job-id':
					return state.map(j => ({
						id: j.id,
						label: Utils.getResourceTitle(j)
					})).sort(this.sortByLabel);
				case 'file-path':
				case 'file-paths':
					return state.map(f => ({
						id: f.path,
						label: f.path
					})).sort((a, b) => Utils.sortByPath(a.id, b.id));
				case 'epsg-code':
					for(let key in state) {
						data.push({
							id: key,
							label: key + ": " + state[key]
						});
					}
					return data;
				case 'input-format':
				case 'output-format':
				case 'service-type':
					for(let key in state) {
						data.push({
							id: key.toUpperCase(),
							label: (state[key].title || key.toUpperCase()) // show title if available, otherwise upper-cased key - uppercase mostly for services
						});
					}
					return data.sort(this.sortByLabel);
				case 'billing-plan':
					return state.map(p => ({
						id: p.name,
						label: p.name + (p.paid ? ' (paid)' : ' (free)')
					}));
				default:
					if (this.schemas.isEnum()) {
						return this.schema.getEnumChoices().map(val => ({
							id: val,
							label: val
						}));
					}
					else if (Array.is(this.options)) {
						return this.options.map(val => ({
							id: val,
							label: val
						}));
					}
					else {
						return this.options;
					}
			}
		},
		deselectLabel() {
			return this.multiple ? 'Press enter to remove' : '';
		},
		multiple() {
			return (this.type === 'file-paths');
		},
		preselect() {
			if (this.multiple) {
				return (!Array.isArray(this.selected) || this.selected.length === 0);
			}
			else {
				return (this.selected === null);
			}
		}
	},
	data() {
		return {
			selected: null
		};
	},
	created() {
		this.loadData();
	},
	watch: {
		type() {
			this.loadData();
		},
		selected(newValue) {
			let value;
			if (this.multiple) {
				if (!Array.isArray(newValue)) {
					newValue = [newValue];
				}
				value = newValue.map(v => v.id);
			}
			else {
				switch(this.type) {
					case 'epsg-code':
						var num = Number.parseInt(newValue.id);
						value = Number.isNaN(num) ? null : num;
						break;
					default:
						value = newValue.id;
				}
			}
			this.$emit('input', value);
		}
	},
	methods: {
		...Utils.mapActions('editor', ['loadEpsgCodes']),
		async loadData() {
			if (this.type === 'epsg-code') {
				await this.loadEpsgCodes();
				this.setSelected();
				if (this.preselect) {
					this.preselectFirst();
				}
			}
			else {
				this.setSelected();
			}
		},
		preselectFirst() {
			// Preselect first element if nothing else is set.
			this.$nextTick(() => {
				let elem = this.$refs.htmlElement;
				// Code inspired from mounted() method in vue-multiselect's multiselectMixin.js
				if (elem.preselectFirst && elem.filteredOptions.length) {
					elem.select(elem.filteredOptions[0]);
				}
			});
		},
		setSelected() {
			let value = this.value;
			if (this.multiple && Array.isArray(value)) {
				this.selected = this.selectOptions.filter(o => value.includes(o.id));
			}
			else if (typeof value === 'string') {
				switch(this.type) {
					case 'input-format':
					case 'output-format':
					case 'service-type':
						value = value.toUpperCase();
						break;
				}
				let selectedOptions = this.selectOptions.filter(o => o.id === value);
				if (selectedOptions.length > 0) {
					this.selected = selectedOptions[0];
				}
			}
		},
		sortByLabel(a,b) {
			return VueUtils.compareStringCaseInsensitive(a.label, b.label);
		}
	}
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>