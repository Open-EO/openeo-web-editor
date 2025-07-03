const { ca, en } = require('@musement/iso-duration');
const { e } = require('@radiantearth/stac-fields/helper');

const fs = require('fs').promises;

// Generate optimized EPSG code lists
async function build_epsg() {
	const epsg = require('epsg-index/all.json');
	const names = {};
	const proj = {};
	for(const code in epsg) {
		names[code] = epsg[code].name;

		const entry = [epsg[code].proj4];
		const bbox = epsg[code].bbox;
		if (Array.isArray(bbox) && bbox[0] != 90 && bbox[1] != -180 && bbox[2] != -90 && bbox[3] != 180) {
			entry.push([bbox[1], bbox[2], bbox[3], bbox[0]]);
		}
		proj[code] = entry;
	}

	await fs.writeFile('src/assets/epsg-names.json', JSON.stringify(names));
	await fs.writeFile('src/assets/epsg-proj.json', JSON.stringify(proj));
	console.log("EPSG export finished!");
}

// Generate optimized listSpectral Indices
async function build_indices() {
	const axios = require('axios');
	const response = await axios.get('https://raw.githubusercontent.com/awesome-spectral-indices/awesome-spectral-indices/main/output/spectral-indices-dict.json');
	const list = {
		domains: [],
		indices: []
	};
	for (const key in response.data.SpectralIndices) {
		const val = response.data.SpectralIndices[key];
		const domain = val.application_domain;
		if (['radar', 'kernel'].includes(domain)) {
			continue; // todo: Not supported right now
		}
		let dix = list.domains.indexOf(domain);
		if (dix === -1) {
			dix = list.domains.length;
			list.domains.push(domain);
		}
		list.indices.push([
			val.short_name,
			val.long_name,
			dix,
			val.bands,
			val.formula.replaceAll('**', '^'), // ** (in ASI) = power = ^ (in the Formula parser)
			val.reference.replace("https://doi.org/", "")
		]);
	}
	await fs.writeFile('src/assets/indices.json', JSON.stringify(list));
	console.log("Spectral Indices export finished!");
}

async function ensureDir(path) {
	try {
		await fs.access(path);
	}	catch (error) {
		await fs.mkdir(path, { recursive: true });
	}
}

async function copy_fonts() {
	// Copy Font Awesome
	const fontDest = 'public/fontawesome/';
	await ensureDir(fontDest);
	const faFolder = 'node_modules/@fortawesome/fontawesome-free/';
	const faSubfolders = ['webfonts', 'css'];
	for (const subfolder of faSubfolders) {
		const subfolderPath = faFolder + subfolder + '/';
		await ensureDir(fontDest + subfolder + '/');
		await fs.cp(subfolderPath, fontDest + subfolder + '/', { recursive: true });
	}
	console.log(`Fonts copied to ${fontDest}`);
}

try {
	Promise.all([
		build_epsg(),
		build_indices(),
		copy_fonts()
	]);
} catch (error) {
	console.error(error);
	process.exit(1);
}