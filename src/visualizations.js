var Visualizations = {
	
	/**
	 * Color gradient/ramp.
	 * 
	 * Parameters: band, valMin, valMax, clrMin, clrMax. Examples:	
	 * band: 0,
	 * valMin: 0,
	 * valMax: 255,
	 * clrMin: [240, 220, 150, 255],
	 * clrMax: [ 10,  70, 230, 255]
	 * 
	 * @param {type} input
	 * @param {type} o
	 * @returns {unresolved}
	 */
	
	rampColors: {
		name: "Color ramp",
		callback: function(input, o) {
			if (typeof o.clrMin === 'string') {
				o.clrMin = o.clrMin.split(',');
			}
			if (typeof o.clrMax === 'string') {
				o.clrMax = o.clrMax.split(',');
			}
			const m = (input[o.band] - o.valMin) / (o.valMax - o.valMin);
			return o.clrMin.map((elMin, i) => m * o.clrMax[i] + (1 - m) * elMin);
		},
		arguments: {
			band: {
				description: 'The band to use',
				defaultValue: 0
			},
			valMin: {
				description: 'Minimum value of the band',
				defaultValue: 0
			},
			valMax: {
				description: 'Maximum value of the band',
				defaultValue: 255
			},
			clrMin: {
				description: 'Color for the minimum value',
				defaultValue: [240, 220, 150, 255]
			},
			clrMax: {
				description: 'Color for the maximum value',
				defaultValue: [ 10,  70, 230, 255]
			}
		}
	}

};

export default Visualizations;