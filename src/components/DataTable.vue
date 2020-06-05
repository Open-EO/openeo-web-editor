<template>
	<div class="dataTable" :id="id">
		<div class="dataTableMenu">
			<div class="dataTableToolbar">
				<slot name="toolbar"></slot>
			</div>
			<div class="dataTableFilter" v-if="data.length > 0">
				<i class="fas fa-search filter-icon"></i>
				<input type="text" placeholder="Search term" v-model="filterValue">
				<button type="button" @click="clearFilter" :disabled="!hasFilter"><i class="fas fa-times-circle"></i></button>
			</div>
		</div>
		<table v-if="data.length > 0">
			<tr>
				<th v-for="(col, id) in columns" v-show="!col.hide" :key="id" :class="id">{{ col.name }}</th>
			</tr>
			<tr v-for="(row, i) in view" :key="i">
				<td v-for="(col, id) in columns" v-show="!col.hide" :key="id" 
					:class="[id, {'edit': canEdit(col)}]"
					:title="canEdit(col) ? 'Double-click to change the value' : false"
					@dblclick="onDblClick($event, row, col, id)"
					:data-value="col.stylable ? value(row, col, id) : false">
					<slot :name="id" :row="row" :col="col" :id="id">
						<template v-if="showEditField(row, col, id)">
							<form @submit.prevent.stop="saveEditField($event, row, col, id)">
								<input type="text" ref="editField" :value="value(row, col, id)" @blur="saveEditField($event, row, col, id)" @keyup="resetEditFieldEsc($event, row, col, id)" />
							</form>
						</template>
						<template v-else>
							{{ formattedValue(row, col, id) }}
						</template>
					</slot>
				</td>
			</tr>
			<tr v-if="data.length > 0 && view.length == 0" class="noSearchResults">
				<td :colspan="columnCount">Sorry, no element matches your search criteria.</td>
			</tr>
		</table>
		<div class="noDataMessage" v-else>{{ noDataMessage }}</div>
	</div>
</template>

<script>
import Utils from '../utils.js';

export default {
	name: 'DataTable',
	props: {
		id: String,
		columns: Object,
		data: Array
	},
	data() {
		return {
			view: [],
			filterValue: null,
			primaryKey: null,
			noDataMessage: 'Sorry, no data available.',
			editField: null
		};
	},
	watch: {
		data(newVal, oldVal) {
			this.updateView();
		},
		filterValue(newVal, oldVal) {
			this.updateView();
		}
	},
	computed: {
		columnCount() {
			return Object.keys(this.columns).length;
		},
		hasFilter() {
			return (typeof this.filterValue === 'string' && this.filterValue.length > 0) ? true : false;
		}
	},
	created() {
		this.determinePrimaryKey();
	},
	methods: {
		canEdit(col) {
			return (typeof col.edit === 'function');
		},
		showEditField(row, col, id) {
			return this.canEdit(col) && this.editField != null && this.editField[0] == row && this.editField[1] == id;
		},
		onDblClick(event, row, col, id) {
			if (!this.canEdit(col)) {
				return;
			}

			var value = this.value(row, col, id);
			if (typeof value === 'boolean') {
				var action = this.columns[id].edit;
				action(row);
			}
			else {
				this.editField = [row, id];
				this.$nextTick(() => this.$refs.editField[0].focus());
			}
			event.preventDefault();
			event.stopPropagation();
		},
		saveEditField(event, row, col, id) {
			if (this.editField !== null && this.canEdit(col)) {
				var action = this.columns[id].edit;
				action(row, this.$refs.editField[0].value);

				this.editField = null;
				event.preventDefault();
				event.stopPropagation();
			}
		},
		resetEditFieldEsc(event, row, col, id) {
			if (event.key == "Escape") {
				this.editField = null;
			}
		},
		determinePrimaryKey() {
			for(var col in this.columns) {
				if (this.columns[col].primaryKey) {
					this.primaryKey = col;
					break;
				}
			}
		},
		setNoData(error) {
			if (typeof error == 'string') {
				this.noDataMessage = error;
				return;
			}
			else if (Utils.isObject(error)) {
				if (typeof error.data === 'object' && typeof error.config === 'object' && typeof error.headers === 'object') {
					// Axios response, handle the data only.
					error = error.data;
				}
				if (Utils.isObject(error) && typeof error.message === 'string') {
					this.noDataMessage = error.message;
					return;
				}
			}
			console.warn(error);
			this.noDataMessage = "Sorry, an unknown error has occured.";
		},
/*		removeData(id) {
			if (this.primaryKey === null) {
				throw new Error('No primary key specified.');
			}
			this.data = this.data.filter(row => row[this.primaryKey] != id);
			if(this.data.length == 0) {
				this.setNoData('');  // empty
			}
		},
		addData(newData) {
			if (!newData.hasOwnProperty(this.primaryKey)) {
				throw new Error('Object does not contain a value for the primary key.');
			}
			this.data.push(newData);
		},
		replaceData(newData) {
			if (this.primaryKey === null) {
				throw new Error('No primary key specified.');
			}
			if (!newData.hasOwnProperty(this.primaryKey)) {
				throw new Error('Object does not contain a value for the primary key.');
			}
			const index = this.data.findIndex(row => row[this.primaryKey] == newData[this.primaryKey]);
			if (index >= 0) {
				this.$set(this.data, index, newData);
			}
			else {
				this.data.push(newData);
			}
		}, */
		value(row, col, id) {
			var data;
			if (typeof row === 'object') {
				data = row[id];
			}
			else {
				data = row;
			}
			if (Utils.isObject(col) && typeof col.computedValue === 'function') {
				data = col.computedValue(row, data);
			}
			return data;
		},
		formattedValue(row, col, id) {
			return this.format(this.value(row, col, id), col);
		},
		sort() {
			// Sort this.view...
		},
		filter() {
			if (!this.hasFilter) {
				return;
			}
			var searchTerm = this.filterValue.toLowerCase();

			this.view = this.view.filter(row => {
				for(var key in row) {
					var col = this.columns[key];
					if (typeof col === 'undefined' || col.hasOwnProperty('filterable') && col.filterable === false) {
						continue;
					}
					var value = this.value(row, col, key);
					if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
						value = value.toString();
					}
					else {
						continue;
					}
					if (value.toLowerCase().indexOf(searchTerm) !== -1) {
						return true;
					}
				}
				return false;
			});
		},
		clearFilter() {
			this.filterValue = '';
			this.updateView();
		},
		updateView() {
			if (!Array.isArray(this.data)) {
				this.view = [];
				return;
			}
			this.view = this.data;
			if (this.data.length > 0) {
				this.filter();
				this.sort();
			}
		},
		format(value, col) {
			if (typeof col.format === 'string') {
				if (typeof this['format' + col.format] === 'function') {
					value = this['format' + col.format](value, col);
				}
				else {
					console.warn(col.format + ' is an invalid formatter.');
				}
			}
			else if (typeof col.format === 'function') {
				value = col.format.call(this, value, col);
			}
			return value;
		},
		formatFileSize(value, col) {
			if (typeof value !== 'number') {
				return '';
			}
			var i = value == 0 ? 0 : Math.floor( Math.log(value) / Math.log(1024) );
			return ( value / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
		},
		formatDateTime(value, col) {
			return Utils.formatDateTime(value);
		},
		formatUpperCase(value, col) {
			return typeof value === 'string' ? value.toUpperCase() : value;
		}
	}
}
</script>

<style>
.filter-icon {
	margin-right: 3px;
}
.noSearchResults td {
	text-align: center;
}
.dataTableFilter {
	flex-grow: 1;
	text-align: right;
}
.dataTableMenu {
	margin-bottom: 5px;
	display: flex;
}
.edit {
	cursor: pointer;
}
</style>