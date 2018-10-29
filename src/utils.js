export default {
	error(vm, message, title = null) {
		vm.$snotify.error(message, title);
	},
	info(vm, message, title = null) {
		vm.$snotify.info(message, title);
	},
	ok(vm, message, title = null) {
		vm.$snotify.success(message, title);
	},

	downloadData: (function () {
		var a = document.createElement("a");
		document.body.appendChild(a);
		a.style = "display: none";
		return function (dataOrUrl, fileName, type, isUrl = false) {
			var url;
			if(isUrl) {
				url = dataOrUrl;
			} else {  // create ObjectURL from supplied data
				var blob;
				if (dataOrUrl instanceof Blob) {
					blob = dataOrUrl;
				}
				else {
					if (!type) {
						type = 'application/octet-stream';
					}
					blob = new Blob([dataOrUrl], {type: type});
				}
				if (!fileName) {
					fileName = 'unnamed-file';
				}
				url = window.URL.createObjectURL(blob);
			}
			
			// Tell the browser to download (same for both methods)
			a.href = url;
			a.download = fileName;
			a.click();

			if(!isUrl) {  // ObjectURL created earlier should be revoked
				window.URL.revokeObjectURL(url);
			}
		};
	}()),

	blobToText(blob, callback) {
		var reader = new FileReader();
		reader.onload = callback;
		reader.readAsText(blob);
	},

	isNumeric(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	},

	recolorImage(canvas, script) {
		if (!canvas.originalImage || !script.Visualization || !script.Visualization.function) {
			return;
		}
		
		try {
			const ctx = canvas.getContext('2d');
			const tgtData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			for (var i = 0; i < tgtData.data.length; i += 4) {
				const input = canvas.originalImage.data.slice(i, i + 4);
				const es = script.Visualization.function(input, script.Visualization.args);
				tgtData.data.set(es, i);
			}
			ctx.putImageData(tgtData, 0, 0);
		} catch(e) {
			console.log(e);
		}
	},

	isChildOfModal(that) {
		return that.$parent && that.$parent.$options.name == 'Modal';
	},

	getFileNameFromURL(url) {
		//this removes the anchor at the end, if there is one
		url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
		//this removes the query after the file name, if there is one
		url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));
		//this removes everything before the last slash in the path
		url = url.substring(url.lastIndexOf("/") + 1, url.length);
		return url;
	},

	formatDateTime(value) {
		if (!value) {
			return '';
		}
		let date = new Date(value);
		return date.toISOString().replace('T', ' ').replace('Z', '').substring(0,19);
	}

};