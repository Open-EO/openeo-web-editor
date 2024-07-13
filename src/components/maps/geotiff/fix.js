import { GeoTIFFImage } from 'geotiff';

// Integrate changes/fixes from https://github.com/geotiffjs/geotiff.js/pull/303 until released/integrated by geotiff.js
GeoTIFFImage.prototype.getSampleByteSize = function(i) {
  if (!this.fileDirectory.BitsPerSample || this.fileDirectory.BitsPerSample.length === 0) {
    return;
  }
  if (i >= this.fileDirectory.BitsPerSample.length) {
    i = 0;
  }
  return Math.ceil(this.fileDirectory.BitsPerSample[i] / 8);
};

GeoTIFFImage.prototype.getReaderForSample = function(sampleIndex) {
  const format = this.getSampleFormat(sampleIndex);
  const bitsPerSample = this.getBitsPerSample(sampleIndex);
  switch (format) {
    case 1: // unsigned integer data
      if (bitsPerSample <= 8) {
        return DataView.prototype.getUint8;
      } else if (bitsPerSample <= 16) {
        return DataView.prototype.getUint16;
      } else if (bitsPerSample <= 32) {
        return DataView.prototype.getUint32;
      }
      break;
    case 2: // twos complement signed integer data
      if (bitsPerSample <= 8) {
        return DataView.prototype.getInt8;
      } else if (bitsPerSample <= 16) {
        return DataView.prototype.getInt16;
      } else if (bitsPerSample <= 32) {
        return DataView.prototype.getInt32;
      }
      break;
    case 3:
      switch (bitsPerSample) {
        case 16:
          return function (offset, littleEndian) {
            return getFloat16(this, offset, littleEndian);
          };
        case 32:
          return DataView.prototype.getFloat32;
        case 64:
          return DataView.prototype.getFloat64;
        default:
          break;
      }
      break;
    default:
      break;
  }
  throw Error('Unsupported data format/bitsPerSample');
};

GeoTIFFImage.prototype.getSampleFormat = function(sampleIndex = 0) {
  if (!this.fileDirectory.SampleFormat || this.fileDirectory.SampleFormat.length === 0) {
    return 1;
  }
  return typeof this.fileDirectory.SampleFormat[sampleIndex] !== 'undefined'
    ? this.fileDirectory.SampleFormat[sampleIndex] : this.fileDirectory.SampleFormat[0];
};

GeoTIFFImage.prototype.getBitsPerSample = function(sampleIndex = 0) {
  if (!this.fileDirectory.BitsPerSample || this.fileDirectory.BitsPerSample.length === 0) {
    return;
  }
  return typeof this.fileDirectory.BitsPerSample[sampleIndex] !== 'undefined'
    ? this.fileDirectory.BitsPerSample[sampleIndex] : this.fileDirectory.BitsPerSample[0];
};
// End of geotiff.js fixes