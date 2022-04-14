import { SupportedFormat } from './format';

class NativeType extends SupportedFormat {

	constructor(asset) {
		super(asset, "DataViewer");
	}

}

export default NativeType;