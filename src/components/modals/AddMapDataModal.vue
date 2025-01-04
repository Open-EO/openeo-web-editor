<template>
	<Modal :show="show" title="Add data from external source" @closed="$emit('closed')" :submitFunction="submit">
		<template #default>
			<div class="content">
				<p>You can add a layer with data from an external data source.</p>
				<strong>Internet Adress:</strong>
				<input type="url" name="url" class="url" v-model="url" placeholder="https://" />
				<br /><br />
				<strong>Format:</strong>
				<ul class="formats">
					<li>
						<input type="radio" name="format" value="geojson" id="f_geojson" v-model="format" />
						<label for="f_geojson">GeoJSON</label>
					</li>
					<li>
						<input type="radio" name="format" value="geotiff" id="f_geotiff" v-model="format" />
						<label for="f_geotiff">Cloud-Optimized GeoTIFF</label>
					</li>
					<li>
						<input type="radio" name="format" value="stac" id="f_stac" v-model="format" />
						<label for="f_stac">STAC Item / Collection - shows displayable assets</label>
					</li>
				</ul>
			</div>
		</template>
		<template #footer>
			<div class="footer">
				<button type="submit" :disabled="!hasUrl || !format">
					<i v-show="loading" class="fas fa-spinner fa-spin"></i>
					Add layer
				</button>
			</div>
		</template>
	</Modal>
</template>

<script>
import Utils from '../../utils';
import Modal from './Modal.vue';

export default {
	name: 'AddMapDataModal',
	components: {
		Modal
	},
	data() {
		return {
			loading: false,
			show: true,
			url: null,
			format: null
		};
	},
	computed: {
		...Utils.mapState('editor', ['formatRegistry']),
		hasUrl() {
			return Utils.isUrl(this.url);
		},
		mediaType() {
			switch (this.format) {
				case 'geojson':
					return 'application/geo+json';
				case 'geotiff':
					return 'image/tiff; application=geotiff; cloud-optimized=true';
				case 'stac':
					return 'application/json';
				default:
					return null;
			}
		}
	},
	watch: {
		url() {
			if (!Utils.hasText(this.url)) {
				return;
			}
			try {
				const url = new URL(this.url);
				if (url.pathname.endsWith('.tiff') || url.pathname.endsWith('.tif')) {
					this.format = 'geotiff';
				}
				else if (url.pathname.endsWith('.geojson')) {
					this.format = 'geojson';
				}
				// if .json it can be either STAC or GeoJSON :-(
			} catch (error) {}
		}
	},
	methods: {
		async submit() {
			if (!this.hasUrl) {
				return;
			}

			this.loading = true;
			try {
				let files = [];
				if (this.format === 'stac') {
					const response = await Utils.axios().get(this.url);
					files = this.formatRegistry.createFilesFromSTAC(response.data);
					if (files.length === 0) {
						Utils.error(this, 'No displayable data available in the provided STAC.');
						return;
					}
				}
				else {
					const asset = {
						href: this.url,
						type: this.mediaType
					};
					files.push(this.formatRegistry.createFileFromAsset(asset));
				}
				this.$emit('save', files);
				this.show = false;
			} catch (error) {
				Utils.error(this, error, 'URL provided does not return a supported file format.');
			} finally {
				this.loading = false;
			}
		},
	}
}
</script>

<style lang="scss" scoped>
input.url {
	width: 100%;
	box-sizing: border-box;
}
.formats {
	list-style-type: none;
	padding: 0;
	margin: 0;
}
</style>