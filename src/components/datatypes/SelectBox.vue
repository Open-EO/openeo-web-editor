<template>
	<div class="select-container">
		<template v-if="loaded">
			<MultiSelect v-model="selected" :key="type" ref="htmlElement" label="label" track-by="id" :multiple="multiple" :options="selectOptions" :allowEmpty="false" :preselectFirst="preselect" :disabled="!editable" :deselectLabel="deselectLabel" :taggable="taggable" :tagPlaceholder="tagPlaceholder" :openDirection="openDirection" @tag="addValue"></MultiSelect>
			<button v-if="showDetails" type="button" title="Details" @click="$emit('onDetails')"><i class="fas fa-info"></i></button>
		</template>
		<div class="loading" v-else><i class="fas fa-spinner fa-spin"></i> Loading options...</div>
	</div>
</template>

<script>
import MultiSelect from 'vue-multiselect'
import Utils from '../../utils';

export default {
	name: 'SelectBox',
	components: {
		MultiSelect
	},
	props: {
		value: {},
		type: {
			type: String,
			default: ""
		},
		editable: {
			type: Boolean,
			default: true
		},
		options: {
			type: [Array, Object]
		},
		schema: {
			type: Object
		},
		context: {},
		optionFilter: {
			type: Function,
			default: null
		},
		openDirection: {
			type: String,
			default: 'auto'
		}
	},
	computed: {
		selectOptions() {
			let state = [];
			switch(this.type) {
				case 'band-name':
					let collection = this.$store.state.collections.find(c => c.id == this.context);
					if (Utils.isObject(collection)) {
						try {
							state = collection.summaries['bands'].map(band => band.name);
						} catch (error) {}
						if (state.length === 0 && Utils.isObject(collection['cube:dimensions'])) {
							try {
								let bandDimension = Object.values(collection['cube:dimensions']).find(d => d.type === 'bands');
								if (bandDimension && Array.isArray(bandDimension.values)) {
									state = bandDimension.values;
								}
							} catch (error) {}
						}
					}
					break;
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
				case 'openeo-datatype':
					let t = require('./api');
					let types = {};
					for(let native of t.NATIVE_TYPES) {
						types[native] = {type: native}
					}
					state = Object.assign(types, t.API_TYPES);
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
				case 'udf-runtime':
					state = Object.keys(this.$store.state.udfRuntimes);
					break;
				case 'udf-runtime-version':
					state = this.context in this.$store.state.udfRuntimes ? Object.keys(this.$store.state.udfRuntimes[this.context].versions) : [];
					break;
			}

			if (typeof this.optionFilter === 'function' && state && typeof state === 'object') {
				if (Utils.isObject(state)) {
					state = Object.fromEntries(Object.entries(state).filter(([key, value]) => this.optionFilter(value, key)));
				}
				else {
					state = state.filter((value, key) => this.optionFilter(value, key));
				}
			}

			let data = [];
			switch(this.type) {
				case 'collection-id':
					return state.map(c => this.e(c.id)).sort(this.sortByLabel);
				case 'job-id':
					return state.map(j => ({
						id: j.id,
						label: Utils.getResourceTitle(j)
					})).sort(this.sortByLabel);
				case 'openeo-datatype':
					for(let type in state) {
						let schema = state[type];
						data.push({
							id: type,
							label: schema.title || Utils.prettifyString(type),
							value: schema
						});
					}
					return data;
				case 'file-path':
				case 'file-paths':
					return state.map(f => this.e(f.path)).sort((a, b) => Utils.sortByPath(a.id, b.id));
				case 'epsg-code':
					for(let key in state) {
						data.push({
							id: Number.parseInt(key, 10),
							label: key + ": " + state[key]
						});
					}
					return data;
				case 'input-format':
				case 'output-format':
				case 'service-type':
					for(let key in state) {
						let id = key.toUpperCase(); // uppercase mostly for services
						// show title if available...
						let label = state[key].title;
						// otherwise upper-cased key...
						if (!label) {
							label = id;
						}
						// and if title is different from key, also show key
						else if (id !== label.toUpperCase()) {
							label = `${label} - ${id}`;
						}
						data.push({id, label});
					}
					return data.sort(this.sortByLabel);
				case 'billing-plan':
					return state.map(p => ({
						id: p.name,
						label: p.name + (p.paid ? ' (paid)' : ' (free)')
					}));
				case 'year':
					let thisYear = new Date().getFullYear();
					let years = Array.from({length: 100}, (x,i) => this.e(String(thisYear - i)));
					// Add custom years to select box
					if (typeof this.value === 'string' && this.value.length > 0 && years.findIndex(y => y.id === this.value) === -1) {
						var customYear = this.e(this.value);
						if (this.value > thisYear) {
							years.unshift(customYear);
						}
						else {
							years.push(this.e(this.value));
						}
					}
					return years;
				case 'band-name':
				case 'udf-runtime':
				case 'udf-runtime-version':
					return state.map(val => this.e(val));
				default:
					if (Utils.isObject(this.schema) && this.schema.isEnum()) {
						return this.schema.getEnumChoices().map(val => this.e(val));
					}
					else if (Array.isArray(this.options)) {
						return this.options.map(val => {
							if (Utils.isObject(val)) {
								return val;
							}
							else {
								return this.e(val)
							}
						});
					}
					else {
						return [];
					}
			}
		},
		showDetails() {
			return (this.type === 'collection-id');
		},
		deselectLabel() {
			return this.multiple ? 'Press enter to remove' : '';
		},
		tagPlaceholder() {
			return this.type === 'year' ? 'Press enter to select' : 'Press enter to create a tag';
		},
		multiple() {
			return (this.type === 'file-paths');
		},
		taggable() {
			let freeInputIfEmpty = ['band-name', 'collection-id', 'job-id', 'input-format', 'output-format'];
			return (this.type === 'year' || (this.selectOptions.length === 0 && freeInputIfEmpty.includes(this.type)));
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
			selected: null,
			loaded: false
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
			if (newValue === null) {
				value = null;
			}
			else if (this.multiple) {
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
					case 'openeo-datatype':
						value = newValue.value;
						break;
					case 'year':
						value = String(newValue.id);
						break;
					default:
						value = newValue.id;
				}
			}
			this.$emit('input', value);
		},
		context() {
			switch(this.type) {
				case 'udf-runtime':
				case 'udf-runtime-version':
					this.selected = null;
					this.preselectFirst();
					break;
				case 'band-name':
					this.selected = null;
					this.loadData();
					break;
			}
		}
	},
	methods: {
		...Utils.mapActions(['describeCollection']),
		...Utils.mapActions('editor', ['loadEpsgCodes']),
		// Convert a value to a option object for MultiSelect
		e(val) {
			return {
				id: val,
				label: val
			};
		},
		async loadData() {
			this.loaded = false;
			if (this.type === 'epsg-code') {
				await this.loadEpsgCodes();
			}
			else if (this.type === 'band-name') {
				await this.describeCollection(this.context);
			}
			this.initSelection();
			this.loaded = true;
		},
		async preselectFirst() {
			await this.$nextTick();
			// Preselect first element if nothing else is set.
			let elem = this.$refs.htmlElement;
			// Code inspired from mounted() method in vue-multiselect's multiselectMixin.js
			if (elem.preselectFirst && Array.isArray(elem.filteredOptions) && elem.filteredOptions.length) {
				elem.select(elem.filteredOptions[0]);
			}
		},
		initSelection() {
			let value = typeof this.value === 'undefined' ? this.schema.default() : this.value;
			if (this.multiple && Array.isArray(value)) {
				this.selected = this.selectOptions.filter(o => value.includes(o.id));
			}
			else {
				switch(this.type) {
					case 'input-format':
					case 'output-format':
					case 'service-type':
						if (typeof value === 'string') {
							value = value.toUpperCase();
						}
						break;
				}
				let selectedOption = this.selectOptions.find(o => o.id === value);
				if (selectedOption !== undefined) {
					this.selected = selectedOption;
				}
			}
		},
		sortByLabel(a,b) {
			return Utils.compareStringCaseInsensitive(a.label, b.label);
		},
		addValue(value) {
			this.selected = this.e(value);
		}
	}
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style lang="scss">
@import '../../../theme.scss';

.select-container {
	display: flex;
	flex-grow: 1;

	> div {
		flex-grow: 1;
	}

	> button {
		margin-left: 10px;
	}

	.multiselect__option--selected.multiselect__option--highlight {
		background: $mainColor;
	}
	.multiselect__option--highlight, .multiselect__option--highlight:after {
		background: $mainColor;
	}
}
</style>