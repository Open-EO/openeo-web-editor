<template>
	<div class="wizard-tab-content">
		<WizardTab :pos="0" :parent="parent" title="Data Source" :beforeChange="loadCollection">
			<ChooseCollection :value="collection" :filter="filterCollections" @input="submitCollection" />
		</WizardTab>
		<WizardTab :pos="1" :parent="parent" title="Spectral Index" :beforeChange="() => !!index.id">
			<ChooseSpectralIndices :value="index" @input="submitIndex" :availableBands="availableBands" />
		</WizardTab>
		<WizardTab :pos="2" :parent="parent" title="Location" :beforeChange="() => spatial_extent !== null">
			<ChooseBoundingBox v-model="spatial_extent" :max="max_spatial_extent" />
		</WizardTab>
		<WizardTab :pos="3" :parent="parent" title="Temporal Coverage" :beforeChange="() => temporal_extent !== null">
			<ChooseTime v-model="temporal_extent" />
		</WizardTab>
		<WizardTab :pos="4" :parent="parent" title="Temporal Composite">
			<ChooseReducer v-model="composite" allowEmpty text="If you want, you can create a temporal composite by selecting the aggregation method below:" />
		</WizardTab>
		<WizardTab :pos="5" :parent="parent" title="File Format" :beforeChange="() => format !== null">
			<ChooseFormat v-model="format" gisDataType="raster" :scale.sync="scale" />
		</WizardTab>
		<WizardTab :pos="6" :parent="parent" title="Finish">
			<ChooseProcessingMode v-model="mode" :title.sync="jobTitle" />
		</WizardTab>
	</div>
</template>

<script>
import ChooseBoundingBox from './tabs/ChooseBoundingBox.vue';
import ChooseCollection from './tabs/ChooseCollection.vue';
import ChooseFormat from './tabs/ChooseFormat.vue';
import ChooseProcessingMode from './tabs/ChooseProcessingMode.vue';
import ChooseReducer from './tabs/ChooseReducer.vue';
import ChooseSpectralIndices from './tabs/ChooseSpectralIndices.vue';
import ChooseTime from './tabs/ChooseTime.vue';
import WizardMixin from './WizardMixin';
import { Builder, Formula } from '@openeo/js-client';
import Utils from '../../utils';

const titleSuffix = 'created by Wizard';
const createTitle = (x = 'Spectral Indices') => `${x} ${titleSuffix}`;

// Awesome SI -> STAC common_names
const MAPPING = {
	A: 'coastal',
	B: 'blue',
	G: 'green',
	Y: 'yellow',
	R: 'red',
// ToDo: There's no 1:1 mapping
//	RE1: 'rededge',
//	RE2: 'rededge',
//	RE3: 'rededge',
	N: 'nir',
	N2: 'nir08',
	WV: 'nir09',
	S1: 'swir16',
	S2: 'swir22',
	T1: 'lwir11',
	T2: 'lwir12'
};

export default {
	name: "SpectralIndices",
	mixins: [
		WizardMixin
	],
	components: {
		ChooseBoundingBox,
		ChooseCollection,
		ChooseFormat,
		ChooseProcessingMode,
		ChooseReducer,
		ChooseSpectralIndices,
		ChooseTime
	},
	data() {
		return {
			availableBands: {},
			collection: null,
			composite: "",
			dimBands: 'bands',
			dimT: 't',
			format: null,
			index: {},
			jobTitle: createTitle(),
			mode: "",
			scale: null,
			spatial_extent: null,
			max_spatial_extent: null,
			temporal_extent: null
		};
	},
	beforeMount() {
		this.scale = this.processes.has('apply') && this.processes.has('linear_scale_range') ? false : null;
	},
	computed: {
		...Utils.mapGetters(['processes', 'collectionDefaults'])
	},
	methods: {
		...Utils.mapActions(['describeCollection']),
		filterCollections(c) {
			if (!Utils.isObject(c['cube:dimensions'])) {
				// Probably not fully loaded, keep in list for now
				return true;
			}

			let dims = Object.values(c['cube:dimensions']);
			if (dims.length < 3) {
				// Less than 3 dimensions don't work (we need at least x,y,b)
				return false;
			}

			let bandDimension = dims.find(d => d.type === 'bands');
			if (!bandDimension || (Array.isArray(bandDimension.values) && bandDimension.values.length < 2)) {
				// Collections with less than 2 bands can't be used to compute an index
				return false;
			}

			let timeDimensions = dims.filter(d => d.type === 'temporal');
			if (timeDimensions.length > 1) {
				// Collections with more than a single time dimension don't work
				return false;
			}

			let spatialDimensions = dims.filter(d => d.type === 'spatial' && ['x', 'y'].includes(d.axis));
			if (spatialDimensions.length !== 2) {
				// Collections with more or less than two spatial dimensions don't work
				return false;
			}

			if (c.summaries && !c.summaries["bands"]) {
				// Has summaries (so is likely fully loaded), but has no bands that we can work with
				return false;
			}

			let bands = this.getAvailableBands(c);
			if (Utils.size(bands) < 2) {
				// Collections with less than 2 bands with common names can't be used to compute an index
				return false;
			}

			return true;
		},
		submitCollection(id) {
			if (this.collection !== id || this.temporal_extent == null) {
				let defaults = this.collectionDefaults(id);
				if (this.collection !== id) {
					this.max_spatial_extent = defaults.spatial_extent;
				}
				if (this.collection !== id || this.temporal_extent == null) {
					this.temporal_extent = defaults.temporal_extent;
				}
			}
			this.collection = id;
			this.parent.nextTab();
		},
		submitIndex(index) {
			this.index = index;
			if (index.id && this.jobTitle.endsWith(titleSuffix)) {
				this.jobTitle = createTitle(index.id);
			}
			this.parent.nextTab();
		},
		createProcess() {
			// Prepare bands and formula
			let formula = this.index.formula;
			let bands = [];
			let bandDescription = [];
			for(let i in this.index.bands) {
				let asiBand = this.index.bands[i];
				let dcBand = this.availableBands[asiBand].name;
				bands.push(dcBand);
				formula = formula.replaceAll(asiBand, '$'+i);
				bandDescription.push(`- ${asiBand} = ${dcBand}`);
			}

			// Construct process
			const b = new Builder(this.processes);
			let datacube = b.load_collection(this.collection, this.spatial_extent, this.temporal_extent, bands)
				.description("Load the data, including the bands:\r\n" + bandDescription.join("\r\n"));
			if (this.composite) {
				let reducer = (data, _, b2) => b2[this.composite](data);
				datacube = b.reduce_dimension(datacube, reducer, this.dimT)
					.description(`Compute the ${this.composite} over the temporal dimension`);
			}
			datacube = b.reduce_dimension(datacube, new Formula(formula), this.dimBands)
				.description(`Compute the ${this.index.id} (${this.index.summary}) for the bands dimension\r\nFormula: ${this.index.formula}`);
			if (this.scale) {
				let scaling = (x, _, b2) => b2.linear_scale_range(x, -1, 1, 0, 255);
				datacube = b.apply(datacube, scaling)
					.description(`Scales the values from [-1, 1] to [0, 255]`);
			}
			datacube = b.save_result(datacube, this.format)
				.description(`Store as ${this.format}`);
			datacube.result = true;
			return b.toJSON();
		},
		getAvailableBands(collection) {
			let bands = collection?.summaries && collection?.summaries["bands"];
			if (Array.isArray(bands)) {
				let availableBands = {};
				const stacNames = Object.values(MAPPING);
				const asiNames = Object.keys(MAPPING);
				for(let key in bands) {
					let band = bands[key];
					if (!band.name) {
						continue; // Ignore bands without a name
					}
					let i = stacNames.indexOf(band['eo:common_name']);
					if (i !== -1) {
						availableBands[asiNames[i]] = band;
					}
				}
				return availableBands;
			}
			else {
				return false;
			}
		},
		async loadCollection() {
			if (this.collection === null) {
				throw new Error("Please select a collection");
			}

			this.availableBands = {};
			let collectionMeta;
			try {
				collectionMeta = await this.describeCollection(this.collection);
			} catch(error) {
				console.error(error);
				throw new Error("Can't load collection metadata, please try another collection.");
			}

			let bands = this.getAvailableBands(collectionMeta);
			if (Utils.size(bands) === 0) {
				throw new Error("This collection doesn't support spectral indices as there are no compatible bands available.");
			}
			else {
				this.availableBands = bands;
			}

			// Store relevant dimension names
			if (Utils.isObject(collectionMeta['cube:dimensions'])) {
				let dims = Object.values(collectionMeta['cube:dimensions']);
				let bandDimension = dims.find(d => d.type === 'bands');
				if (bandDimension && bandDimension.name) {
					this.dimBands = bandDimension.name;
				}
				let tDimension = dims.find(d => d.type === 'temporal');
				if (tDimension && tDimension.name) {
					this.dimT = tDimension.name;
				}
			}

			return true;
		},
		async finish() {
			this.$emit('input', {
				process: this.createProcess(),
				mode: this.mode,
				modeOptions: {
					title: this.jobTitle
				}
			});
		}
	}
}
</script>
