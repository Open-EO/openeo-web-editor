<template>
	<section class="vue-component stac stac-fields metadata">
		<template v-for="group in fields">
			<component :is="headingTag" v-html="group.label || defaultGroupLabel" :key="group.extension" />
			<section class="group" :key="`section_${group.extension}`">
				<div v-for="(prop, field) in group.properties" :key="group.extension + field" :id="'field_' + field" class="tabular" :class="{wrap: Boolean(prop.custom || prop.items)}">
					<label :title="field" v-html="prop.label" />
					<div class="value">
						<slot :name="field" :prop="prop" :field="field">
							<table v-if="prop.items" class="table">
								<thead>
									<tr>
										<th v-if="!Array.isArray(prop.formatted)">&nbsp;</th>
										<th v-for="col in prop.itemOrder" :key="col" v-html="prop.items[col].label"></th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="(row, r) in prop.formatted" :key="r">
										<th v-if="!Array.isArray(prop.formatted)">{{ r }}</th>
										<td v-for="col in prop.itemOrder" :key="`${col}_${r}`">
											<table v-if="Array.isArray(row[col]) && prop.items[col].items && row._subItemOrders && row._subItemOrders[col]" class="table">
												<thead>
													<tr>
														<th v-for="subCol in row._subItemOrders[col]" :key="subCol" v-html="prop.items[col].items[subCol].label"></th>
													</tr>
												</thead>
												<tbody>
													<tr v-for="(subRow, sr) in row[col]" :key="sr">
														<td v-for="subCol in row._subItemOrders[col]" :key="`${subCol}_${sr}`">
															<div v-html="subRow[subCol]" />
														</td>
													</tr>
												</tbody>
											</table>
											<ol class="array" v-else-if="Array.isArray(row[col])">
												<li v-for="(v, k) in row[col]" :key="k">
													<ul class="object" v-if="v && typeof v === 'object'">
														<li v-for="(vv, kk) in v" :key="kk"><strong>{{ kk | key }}</strong>: <span v-html="vv" /></li>
													</ul>
													<span v-else v-html="v" />
												</li>
											</ol>
											<ul class="object" v-else-if="row[col] && typeof row[col] === 'object'">
												<li v-for="(v, k) in row[col]" :key="k"><strong>{{ k | key }}</strong>: <span v-html="v" /></li>
											</ul>
											<div v-else v-html="row[col]" />
										</td>
									</tr>
								</tbody>
							</table>
							<Process v-else-if="field === 'card4l:processing_chain'" class="inline" :process="prop.value" :provideDownload="false" :showGraph="true" />
							<div class="formatted" v-else-if="prop.formatted" v-html="prop.formatted" />
							<template v-else>{{ prop.value }}</template>
						</slot>
					</div>
				</div>
			</section>
		</template>
	</section>
</template>

<script>
import StacFields from '@radiantearth/stac-fields';
import Utils from '@openeo/vue-components/utils';
import ObjectTree from '@openeo/vue-components/components/ObjectTree.vue';

const CORE_COLLECTION_FIELDS = [
	// Catalog and Collection fields that are handled directly
	'stac_version',
	'stac_extensions',
	'id',
	'type',
	'title',
	'description',
	'keywords',
	'providers',
	'license',
	'extent',
	'summaries',
	'links',
	'assets',
	'item_assets',
	'conformsTo',
	'deprecated',
	'cube:dimensions'
];

StacFields.Registry.externalRenderer = true;
StacFields.Registry.addMetadataField('queued', {
	label: "Queued",
	format: "Timestamp"
});
StacFields.Registry.addMetadataField('started', {
	label: "Started",
	format: "Timestamp"
});

export default {
	name: 'StacFields',
	components: {
		Process: () => import('@openeo/vue-components/components/Process.vue'),
		ObjectTree
	},
	props: {
		metadata: {
			type: Object,
			default: () => ({})
		},
		headingTag: {
			type: String,
			default: 'h3'
		},
		ignore: {
			type: Array,
			default: () => ([])
		},
		type: {
			type: String,
			required: true
		},
		context: {
			type: Object,
			default: () => ({})
		},
		defaultGroupLabel: {
			type: String,
			default: 'General Metadata'
		}
	},
	filters: {
		key: Utils.prettifyString
	},
	computed: {
		ignoreFn() {
			if (this.ignore.length > 0) {
				return key => !this.ignore.includes(key);
			}
			return null;
		},
		fields() {
			let rawFields;
			if (this.type === 'Collection') {
				let data = Utils.deepClone(this.metadata);
				if (!Utils.isObject(data.summaries)) {
					data.summaries = {};
				}
				for(let key in data) {
					// Copy all custom top-level fields to summaries for easier visualization
					if (!CORE_COLLECTION_FIELDS.includes(key)) {
						if (Array.isArray(data[key])) {
							data.summaries[key] = data[key];
						}
						else {
							data.summaries[key] = [data[key]];
						}
					}
				}
				rawFields = StacFields.formatSummaries(data, this.ignoreFn);
			}
			else if (this.type === 'Item') {
				rawFields = StacFields.formatItemProperties(this.metadata, this.ignoreFn);
			}
			else if (this.type === 'Asset') {
				rawFields = StacFields.formatAsset(this.metadata, this.context, this.ignoreFn);
			}
			else {
				throw new Error('Not implemented yet');
			}
			// Pre-compute sub-item column orders for nested array-of-objects cells
			for (const group of rawFields) {
				for (const prop of Object.values(group.properties)) {
					if (prop.items && Array.isArray(prop.formatted)) {
						for (const row of prop.formatted) {
							for (const col of prop.itemOrder) {
								const cellValue = row[col];
								const colSpec = prop.items[col];
								if (Array.isArray(cellValue) && colSpec && colSpec.items) {
									row._subItemOrders = row._subItemOrders || {};
									row._subItemOrders[col] = colSpec.itemOrder
										? colSpec.itemOrder.filter(subCol => cellValue.some(r => r[subCol] !== undefined && r[subCol] !== null))
										: [];
								}
							}
						}
					}
				}
			}
			return rawFields;
		}
	},
	methods: {
		label(key, specs = {}) {
			return StacFields.label(key, specs);
		}
	}
}
</script>

<style lang="scss">
@use '@openeo/vue-components/components/base.scss';
.vue-component.stac-fields {
	> .group {
		margin-left: 1em;
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9em;

		th {
			text-align: left;
			background-color: rgba(0, 0, 0, 0.05);
		}
		td, th {
			border: 1px solid rgba(0, 0, 0, 0.2);
			padding: 3px;

			> .object {
				list-style-type: none;
				padding-left: 0;
			}
		}
		td {
			vertical-align: top;
		}
		tbody tr:hover,
		tbody tr:hover th {
			background-color: rgba(0, 0, 0, 0.1);
		}
	}
	.description {
		p {
			&:first-of-type {
				margin-top: 0;
			}
			&:last-of-type {
				margin-bottom: 0;
			}
		}
	}
}
</style>
