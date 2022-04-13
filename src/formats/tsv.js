import CSV from './csv';

class TSV extends CSV {

	constructor(asset) {
		super(asset, ["\t"]);
	}

}

export default TSV;