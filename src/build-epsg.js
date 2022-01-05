const epsg = require('epsg-index/all.json');
const fs = require('fs');

var names = {};
var proj = {};
for(var code in epsg) {
	names[code] = epsg[code].name;
	proj[code] = epsg[code].wkt;
}

fs.writeFileSync('src/assets/epsg-names.json', JSON.stringify(names));
fs.writeFileSync('src/assets/epsg-proj.json', JSON.stringify(proj));
console.log("EPSG export finished!");