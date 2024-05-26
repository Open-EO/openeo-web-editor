<template>
	<div class="kernel-editor">
		<div class="size">
			Kernel Size (rows &times; columns):
			<input type="number" :value="rows" min="0" :disabled="!editable" @change="updateRows" />
			&times;
			<input type="number" :value="cols" min="0" :disabled="!editable || rows === 0" @change="updateCols" />
		</div>
		<p v-if="!rows || !cols" class="kernel">Empty kernel</p>
		<div v-else class="kernel">
			<table>
				<tr>
					<th></th>
					<th v-for="col in colsArray" :key="`header_${col}`">{{ col }}</th>
				</tr>
				<tr v-for="(row, y) in rowsArray" :key="row">
					<th>{{ row }}</th>
					<td v-for="(col, x) in colsArray" :key="col">
						<input v-if="editable" type="number" v-model.number="data[y][x]" />
						<span v-else class="number">{{ data[y][x] }}</span>
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script>
import Utils from '../../utils';

export default {
	name: 'Kernel',
	props: {
		value: {
			type: String,
			default: null
		},
		editable: {
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			data: []
		};
	},
	computed: {
		cols() {
			return this.data.reduce((max, val) => Math.max(val.length, max), 0);
		},
		colsArray() {
			return Utils.range(1, this.cols);
		},
		rows() {
			return this.data.length;
		},
		rowsArray() {
			return Utils.range(1, this.rows);
		}
	},
	watch: {
		value: {
			immediate: true,
			handler(newVal, oldVal) {
				if (newVal !== oldVal) {
					this.data = Array.isArray(newVal) ? newVal : [];
				}
			}
		},
		data: {
			deep: true,
			handler() {
				this.$emit('input', this.data);
			}
		}
	},
	methods: {
		updateCols(evt) {
			let count = -1;
			try {
				count = Number.parseInt(evt.target.value, 10);
			} catch (error) {}

			this.data = this.data.map(arr => Utils.fitArray(arr, count));
		},
		updateRows(evt) {
			let count = -1;
			try {
				count = Number.parseInt(evt.target.value, 10);
			} catch (error) {}

			this.data = Utils.fitArray(this.data, count, Utils.newArray(this.cols));
		}
	}


}
</script>

<style lang="scss" scoped>
.kernel-editor {
	width: 100%;

	.size {
		input {
			width: 5em;
		}
	}
	.kernel {
		margin: 1em 0;
	}
	p.kernel {
		font-style: italic;
	}
	div.kernel {
		width: 100%;
		max-height: 50vh;
		overflow: auto;
		padding: 0.5em;
		box-sizing: border-box;

		table {
			width: 100%;
			border-collapse: collapse;

			th, td {
				font-size: 0.9em;
				color: #555;
				font-weight: normal;
			}
			th {
				padding: 0.3em;
			}
			td {
				padding: 0;
				border: 1px solid #ccc;

				span.number {
					text-align: right;
					display: block;
					padding: 0.3em;
				}

				input {
					font-size: 1.2em;
					min-width: 5em;
					border: 0;
					padding: 0;
					width: 100%;
					text-align: right;
				}
			}
		}
	}
}
</style>