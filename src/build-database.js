const fs = require('fs');

// Generate optimized EPSG code lists
async function build_epsg() {
	const epsg = require('epsg-index/all.json');
	var names = {};
	var proj = {};
	for(var code in epsg) {
		names[code] = epsg[code].name;

		let entry = [epsg[code].proj4];
		let bbox = epsg[code].bbox;
		if (Array.isArray(bbox) && bbox[0] != 90 && bbox[1] != -180 && bbox[2] != -90 && bbox[3] != 180) {
			entry.push([bbox[1], bbox[2], bbox[3], bbox[0]]);
		}
		proj[code] = entry;
	}

	fs.writeFileSync('src/assets/epsg-names.json', JSON.stringify(names));
	fs.writeFileSync('src/assets/epsg-proj.json', JSON.stringify(proj));
	console.log("EPSG export finished!");
}

// Generate optimized listSpectral Indices
async function build_indices() {
	const axios = require('axios');
	const response = await axios.get('https://raw.githubusercontent.com/awesome-spectral-indices/awesome-spectral-indices/main/output/spectral-indices-dict.json');
	let list = {
		domains: [],
		indices: []
	};
	for (let key in response.data.SpectralIndices) {
		let val = response.data.SpectralIndices[key];
		let domain = val.application_domain;
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
	fs.writeFileSync('src/assets/indices.json', JSON.stringify(list));
	console.log("Spectral Indices export finished!");
}

try {
	Promise.all([
		build_epsg(),
		build_indices()
	]);
} catch (error) {
	console.error(error);
	process.exit(1);
}