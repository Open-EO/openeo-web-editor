<template>
	<div class="tableContainer">
		<table v-if="data !== null">
			<tr>
				<th v-for="(col, id) in columns" :key="id">{{ col.name }}</th>
			</tr>
			<tr v-for="(entry, i) in data" :key="i">
				<td v-for="(col, id) in columns" :key="id">{{ data[id] }}</td>
			</tr>
		</table>
		<div class="noDataMessage" v-if="data === null">{{ noDataMessage }}</div>
	</div>
</template>

<script>
import EventBus from '../eventbus.js';

export default {
	name: 'DataTable',
	props: ['columns', 'dataSource'],
	data() {
		return {
			data: null,
			noDataMessage: 'Loading data...'
		};
	},
	mounted() {
		this.retrieveData();
	},
	methods: {
		setNoData(error) {
			this.data = null;
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
			if (typeof this.dataSource === 'function') {
				this.dataSource()
					.then(data => {
						if (typeof data === 'array') {
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
			else if(typeof this.dataSource === 'array') {
				this.data = this.dataSource;
			}
			else {
				this.setNoData('Sorry, no data available.');
			}
		}
	}
}
</script>

<style>
.noDataMessage {
	text-align: center;
	margin: 1em;
	font-weight: bold;
}
</style>