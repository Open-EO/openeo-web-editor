<template>
	<div class="tableViewer">
		<table v-if="content">
			<thead>
				<tr>
					<th v-for="(col, key) in header" :key="key">{{ col }}</th> 
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, keyr) in content" :key="keyr">
					<td v-for="(col, keyc) in row" :key="keyc">{{ col }}</td> 
				</tr>
			</tbody>
		</table>
		<em v-else>No data retrieved.</em>
	</div>
</template>

<script>
export default {
	name: 'DataViewer',
	props: {
		data: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			header: null,
			content: null
		};
	},
	async created() {
		let array = await this.data.getData();
		if (Array.isArray(array) && array.length > 0) {
			this.header = array.shift();
			this.content = array;
		}
	}
};
</script>

<style lang="scss" scoped>
.tableViewer {
	width: 100%;
	height: 100%;
	overflow: auto;

	> table {
		width: 100%;

		> thead {
			position: sticky;
			top: 0px;
			background: #eee;
			z-index: 1;

			th {
				border-top: 0;
			}
		}
	}
}
</style>
