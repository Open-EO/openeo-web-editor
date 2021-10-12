import { OpenEO } from '@openeo/js-client';
import { Utils } from '@openeo/js-commons';

export default function qgisExport(result, job, vm) {
	// Create doctype
	var doctype = document.implementation.createDocumentType('qgis', 'http://mrcc.com/qgis.dtd', 'SYSTEM');
	// Create XML document and root tag
	let xml = document.implementation.createDocument(null, 'qgis', doctype);

	let appendElement = (parent, name, text = null) => {
		let node = xml.createElement(name);
		if (text !== null) {
			let textNode = xml.createTextNode(text);
			node.appendChild(textNode);
		}
		parent.appendChild(node);
		return node;
	};
	let createExtentElement = (parent, name, result) => {
		let extentNode = appendElement(parent, name);
		appendElement(extentNode, 'xmin', result.bbox[0]);
		appendElement(extentNode, 'ymin', result.bbox[1]);
		appendElement(extentNode, 'xmax', result.bbox[2]);
		appendElement(extentNode, 'ymax', result.bbox[3]);
		return extentNode;
	}
	let getSource = asset => {
		return `/vsicurl/${asset.href}`;
	}

	let assets = [];
	for(let key in result.assets) {
		let asset = result.assets[key];
		if (typeof asset.type === 'string' && asset.type.startsWith('image/')) {
			assets.push(Object.assign({key}, asset));
		}
	}
	if (assets.length === 0) {
		return Utils.error(vm, 'None of the assets is supported by QGIS.');
	}

	const QGIS_VERSION = '3.20.3-Odense';
	const title = job.title || job.id;

	// Fill root tag
	let qgis = xml.documentElement;
	qgis.setAttribute('saveUser', vm.$config.serviceName);
	qgis.setAttribute('saveUserFull', `${vm.$config.serviceName} ${vm.$config.appName}`);
	qgis.setAttribute('version', QGIS_VERSION);
	qgis.setAttribute('projectname', title);
	qgis.setAttribute('saveDateTime', (new Date()).toISOString());

	// spatialrefsys (re-used later)
	let srsNode = xml.createElement('spatialrefsys');
	if (result.properties['proj:wkt2']) {
		appendElement(srsNode, 'wkt', result.properties['proj:wkt2']);
	}
	if (result.properties['proj:proj4']) {
		appendElement(srsNode, 'proj4', result.properties['proj:proj4']);
	}
	if (result.properties['proj:epsg'] > 0) {
		appendElement(srsNode, 'authid', `EPSG:${result.properties['proj:epsg']}`);
	}

	// Create first level nodes

	// title
	appendElement(qgis, 'title', title);

	// projectCrs
	let crsNode = appendElement(qgis, 'projectCrs');
	crsNode.appendChild(srsNode.cloneNode(true));

	// layer-tree-group
	let layerTreeNode = appendElement(qgis, 'layer-tree-group');
	for(let asset of assets) {
		let assetNode = appendElement(layerTreeNode, 'layer-tree-layer');
		assetNode.setAttribute('id', asset.key);
		assetNode.setAttribute('name', asset.title || asset.key);
		assetNode.setAttribute('source', getSource(asset));
		assetNode.setAttribute('providerKey', 'gdal');
		assetNode.setAttribute('expanded', 1);
	}

	// mapcanvas
	let canvasNode = appendElement(qgis, 'mapcanvas');
	canvasNode.setAttribute('name', 'theMapCanvas');
	canvasNode.setAttribute('annotationsVisible', 1);

// ToDo: Extent and unit must fit the SRS
	appendElement(canvasNode, 'units', 'degrees');
	appendElement(canvasNode, 'rotation', 0);

	createExtentElement(canvasNode, 'extent', result);

	let destSrsNode = appendElement(canvasNode, 'destinationsrs');
	destSrsNode.appendChild(srsNode.cloneNode(true));

	// projectlayers
	let layersNode = appendElement(qgis, 'projectlayers');
	for(let asset of assets) {
		let layerNode = appendElement(layersNode, 'maplayer');
		layerNode.setAttribute('type', 'raster');
		layerNode.setAttribute('styleCategories', 'AllStyleCategories');
		layerNode.setAttribute('hasScaleBasedVisibilityFlag', 0);

		createExtentElement(layerNode, 'wgs84extent', result);

		appendElement(layerNode, 'id', asset.key);
		appendElement(layerNode, 'datasource', getSource(asset));
		appendElement(layerNode, 'provider', 'gdal');
		appendElement(layerNode, 'layername', asset.title || asset.key);

		let layerSrsNode = appendElement(layerNode, 'srs');
		layerSrsNode.appendChild(srsNode.cloneNode(true));

		let nodataNode = appendElement(layerNode, 'noData');
		let nodataList = appendElement(nodataNode, 'noDataList');
		nodataList.setAttribute('useSrcNoData', 1);
// ToDo: Add this per band?!
//		nodataList.setAttribute('bandNo', 1);

		let styleManagerNode = appendElement(layerNode, 'map-layer-style-manager');
		styleManagerNode.setAttribute('current', 'default');
		let styleNode = appendElement(styleManagerNode, 'map-layer-style');
		styleNode.setAttribute('name', 'default');

		let flagsNode = appendElement(layerNode, 'flags');
		appendElement(flagsNode, 'Identifiable', 1);
		appendElement(flagsNode, 'Removable', 1);
		appendElement(flagsNode, 'Searchable', 1);
		appendElement(flagsNode, 'Private', 0);

		let pipeNode = appendElement(layerNode, 'pipe');
		let providerNode = appendElement(pipeNode, 'provider');
		let resamplingNode = appendElement(providerNode, 'resampling');
		resamplingNode.setAttribute('maxOversampling', 2);
		resamplingNode.setAttribute('zoomedInResamplingMethod', 'nearestNeighbour');
		resamplingNode.setAttribute('zoomedOutResamplingMethod', 'nearestNeighbour');
		resamplingNode.setAttribute('enabled', 'false');

		let rendererNode = appendElement(pipeNode, 'rasterrenderer');
		rendererNode.setAttribute('noDataColor', '');
// ToDo: Type of file needs to be adapted (e.g. it could be multiband)
		rendererNode.setAttribute('type', 'singlebandgray');
		rendererNode.setAttribute('grayBand', 1);
		rendererNode.setAttribute('opacity', 1);
		rendererNode.setAttribute('gradient', 'BlackToWhite');
		rendererNode.setAttribute('alphaBand', -1);

		let contrastNode = appendElement(rendererNode, 'contrastEnhancement');
// ToDo: Number must come from metadata
		appendElement(contrastNode, 'minValue', -638.75);
		appendElement(contrastNode, 'maxValue', -6.57);
		appendElement(contrastNode, 'algorithm', 'StretchToMinimumMaximum');

		let minMaxNode = appendElement(rendererNode, 'minMaxOrigin');
		appendElement(minMaxNode, 'limits', 'MinMax');
		appendElement(minMaxNode, 'extent', 'WholeRaster');
		appendElement(minMaxNode, 'statAccuracy', 'Estimated');
		appendElement(minMaxNode, 'cumulativeCutLower', 0.02);
		appendElement(minMaxNode, 'cumulativeCutUpper', 0.98);
		appendElement(minMaxNode, 'stdDevFactor', 2);
	}

	// Convert XML to string / xml file
	let xmlFile = new XMLSerializer().serializeToString(xml);
	// Offer XML file to download
	OpenEO.Environment.saveToFile(xmlFile, 'result.qgs');
};