<template>
	<div class="step choose-index">
		<p>Please select the spectral indice you want to compute.</p>
		<SearchableList v-if="indices.length > 0" heading="" :data="indices" :offerDetails="false" showKeywords>
			<template #summary="{ item }">
				<div :class="{element: true, selected: item.id == value.id}">
					<div class="summary" @click="update(item)">
						<div class="title">
							<strong :title="item.id">{{ item.summary }}</strong>
							<ul class="badges small inline">
								<li v-for="(keyword, i) in item.keywords" :key="keyword" :class="{badge: true, domain: i+1 == item.keywords.length, [keyword]: i+1 == item.keywords.length}">{{ keyword }}</li>
							</ul>
						</div>
						<code>{{ item.formula }}</code>
					</div>
					<button class="button" type="button" @click="showDetails(item)" title="Open website with additional details"><i class="fas fa-info"></i></button>
				</div>
			</template>
		</SearchableList>
	</div>
</template>

<script>
import SearchableList from '@openeo/vue-components/components/SearchableList.vue';
import EventBusMixin from '../../EventBusMixin';

const PARAMS = {
	g: 'Gain factor (e.g. Used for EVI)',
	L: 'Canopy background adjustment (e.g. Used for SAVI and EVI)',
	C1: 'Coefficient 1 for the aerosol resistance term (e.g. Used for EVI)',
	C2: 'Coefficient 2 for the aerosol resistance term (e.g. Used for EVI)',
	cexp: 'Exponent used for OCVI',
	nexp: 'Exponent used for GDVI',
	alpha: 'Weighting coefficient used for WDRVI, BWDRVI and NDPI',
	beta: 'Calibration parameter used for NDSIns',
	gamma: 'Weighting coefficient used for ARVI',
	omega: 'Weighting coefficient used for MBWI',
	sla: 'Soil line slope',
	slb: 'Soil line intercept',
	PAR: 'Photosynthetically Active Radiation',
	k: 'Slope parameter by soil used for NIRvH2',
	lambdaN: 'NIR wavelength used for NIRvH2 and NDGI',
	lambdaR: 'Red wavelength used for NIRvH2 and NDGI',
	lambdaG: 'Green wavelength used for NDGI'
};

export default {
	name: 'ChooseSpectralIndices',
	mixins: [
		EventBusMixin
	],
	components: {
		SearchableList
	},
	props: {
		value: {
			type: Object,
			default: () => ({})
		},
		availableBands: {
			type: Object,
			required: true
		}
	},
	data() {
		return {
			indices: []
		};
	},
	async created() {
		const {domains, indices} = await import('../../../assets/indices.json');
		const available = Object.keys(this.availableBands);
		const choice = Object.keys(PARAMS).join('|');
		const pattern = new RegExp(`(${choice})`, 'g');
		for(let index of indices) {
			const bands = index[3];
			const bandsIntersection = bands.filter(value => available.includes(value));
			if (bandsIntersection.length != bands.length) {
				continue;
			}

			const formula = index[4];
			const availableParams = Array.from(formula.matchAll(pattern));
			if (availableParams.length > 0) {
				// ToDo: Don't skip over the indices with parameters
				continue;
			}

			let uri = index[5];
			if (uri.length > 0 && !uri.includes('://')) {
				uri = 'https://doi.org/' + uri;
			}

			this.indices.push({
				id: index[0],
				summary: index[1],
				keywords: [ ...index[3], domains[index[2]] ],
				bands,
				formula,
				uri
			});
		}
	},
	methods: {
		showDetails(item) {
			window.open(item.uri);
		},
		async update(item) {
			this.$emit('input', item);
		}
	}
}
</script>

<style lang="scss">
.choose-index {
	.vue-component.searchable-list ul.list > li {
		margin-bottom: 0;

		> summary {
			margin: 0;

			&:before {
				content: '';
				margin-left: 0;
				float: none;
			}

			.summary {
				.title {
					display: flex;

					strong {
						flex-grow: 1;
					}
				}

				code {
					display: block;
				}
			}

		}
	}

	.domain {
		background-color: black;

		&.water {
			background-color: darkblue;
		}
		&.vegetation {
			background-color: darkgreen;
		}
		&.burn {
			background-color: darkgoldenrod;
		}
		&.soil {
			background-color: #5C4033;
		}
		&.urban {
			background-color: maroon;
		}
		&.radar {
			background-color: darkviolet;
		}
		&.snow {
			background-color: darkcyan;
		}
	}
}
</style>