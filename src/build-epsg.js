const epsg = require('epsg-index/all.json');
const fs = require('fs');

var list = {};
for(var code in epsg) {
	list[code] = epsg[code].name;
}

fs.writeFileSync('src/assets/epsg.json', JSON.stringify(list));
console.log("EPSG export finished!");