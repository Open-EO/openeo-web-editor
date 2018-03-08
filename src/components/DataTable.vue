<template>
	<div class="dataTable" :id="id">
		<div class="dataTableMenu">
			<div class="dataTableToolbar">
				<slot name="toolbar"></slot>
			</div>
			<div class="dataTableFilter" v-if="data.length > 0">
				<i class="fas fa-search filter-icon"></i>
				<input type="text" value="" ref="filterInput" placeholder="Search term" @keyup="updateView">
				<button @click="clearFilter"><i class="fas fa-times-circle"></i></button>
			</div>
		</div>
		<table v-if="data.length > 0">
			<tr>
				<th v-for="(col, id) in columns" :key="id" :class="id">{{ col.name }}</th>
			</tr>
			<tr v-for="(row, i) in view" :key="i">
				<td v-for="(col, id) in columns" :key="id" :class="id" :data-value="col.stylable ? value(row, col, id) : false">
					<slot :name="id" :row="row" :col="col" :id="id">
						{{ formattedValue(row, col, id) }}
					</slot>
				</td>
			</tr>
			<tr v-if="data.length > 0 && view.length == 0" class="noSearchResults">
				<td :colspan="columnCount">Sorry, no element matches your search criteria.</td>
			</tr>
		</table>
		<div class="noDataMessage" v-if="data.length == 0">{{ noDataMessage }}</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'DataTable',
	props: ['id', 'columns', 'dataSource'],
	data() {
		return {
			data: [],
			view: [],
			primaryKey: null,
			noDataMessage: 'Loading data...'
		};
	},
	watch: {
		data(newVal, oldVal) {
			this.updateView();
		}
	},
	computed: {
		columnCount() {
			return Object.keys(this.columns).length;
		}
	},
	created() {
		this.determinePrimaryKey();
	},
	methods: {
		determinePrimaryKey() {
			for(var col in this.columns) {
				if (this.columns[col].primaryKey) {
					this.primaryKey = col;
					break;
				}
			}
		},
		setNoData(error) {
			this.data = [];
			if (typeof error === 'number') {
				switch(error) {
					case 401:
						this.noDataMessage = 'Please authenticate to use this feature.';
						break;
					case 403:
					case 404:
						this.noDataMessage = 'Sorry, authentication failed. Please try again.';
						break;
					case 501:
						this.noDataMessage = 'Sorry, this feature is not supported by the server.';
						break;
					default:
						this.noDataMessage = 'Sorry, an error occured. Please try again later.';
						break;
				}
			}
			else {
				this.noDataMessage = error;
			}
		},
		retrieveData() {
			this.data = [];
			if (typeof this.dataSource === 'function') {
				this.dataSource()
					.then(data => {
						if (Array.isArray(data) && data.length > 0) {
							this.data = data;
						}
						else {
							this.setNoData('Sorry, no data found.');
						}
					})
					.catch(errorCode => {
						this.setNoData(errorCode);
					});
			}
			else if(Array.isArray(this.dataSource) && this.dataSource.length > 0) {
				this.data = this.dataSource;
			}
			else {
				this.setNoData('Sorry, no data available.');
			}
		},
		removeData(id) {
			if (this.primaryKey === null) {
				throw new Error('No primary key specified.');
			}
			this.data = this.data.filter(row => row[this.primaryKey] != id);
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
			else if (!newData.hasOwnProperty(this.primaryKey)) {
				throw new Error('Object does not contain a value for the primary key.');
			}
			const index = this.data.findIndex(row => { row[this.primaryKey] == newData[this.primaryKey] });
			if (index >= 0) {
				this.data[index] = newData;
			}
			else {
				this.data.push(newData);
			}
		},
		value(row, col, id) {
			if (typeof row === 'object') {
				return row[id];
			}
			else {
				if (id === '$') {
					return row;
				}
				else {
					return null;
				}
			}
		},
		formattedValue(row, col, id) {
			return this.format(this.value(row, col, id), col);
		},
		sort() {
			// Sort this.view...
		},
		filter() {
			if (typeof this.$refs.filterInput === 'undefined') {
				return;
			}
			var searchTerm = this.$refs.filterInput.value.toLowerCase();
			if (searchTerm.length < 1) {
				return;
			}

			this.view = this.view.filter(row => {
				for(var key in row) {
					var col = this.columns[key];
					if (typeof col !== 'undefined' && col.hasOwnProperty('filterable') && col.filterable === false) {
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
			this.$refs.filterInput.value = '';
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
					console.log(col.format + ' is an invalid formatter.');
				}
			}
			else if (typeof col.format === 'function') {
				value = col.format.call(this, value, col);
			}
			return value;
		},
		formatFileSize(value, col) {
			if (!value) {
				return '';
			}
			var i = value == 0 ? 0 : Math.floor( Math.log(value) / Math.log(1024) );
			return ( value / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
		},
		formatDateTime(value, col) {
			if (!value) {
				return '';
			}
			let date = new Date(value);
			return date.toISOString().replace('T', ' ').replace('Z', '').substring(0,19);
		}
	}
}
</script>

<style>
.filter-icon {
	margin-right: 3px;
}
.noDataMessage {
	text-align: center;
	margin: 1em;
	font-weight: bold;
}
.noSearchResults td {
	text-align: center;
}
.dataTableToolbar {
	float: left;
	width: 60%;
}
.dataTableFilter {
	width: 40%;
	float: right;
	text-align: right;
}
.dataTableMenu {
	margin-bottom: 5px;
}
.dataTableMenu:after {
    content: ".";
    clear: both;
    display: block;
    visibility: hidden;
    height: 0px;
}
</style>