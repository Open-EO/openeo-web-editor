const epsg = require('epsg-index/all.json');
const fs = require('fs');

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