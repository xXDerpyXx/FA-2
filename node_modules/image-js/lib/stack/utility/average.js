'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = average;

var _Image = require('../../image/Image');

var _Image2 = _interopRequireDefault(_Image);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @memberof Stack
 * @instance
 * @return {Image}
 */
function average() {
  this.checkProcessable('average', {
    bitDepth: [8, 16]
  });

  let data = new Uint32Array(this[0].data.length);
  for (let i = 0; i < this.length; i++) {
    let current = this[i];
    for (let j = 0; j < this[0].data.length; j++) {
      data[j] += current.data[j];
    }
  }

  let image = _Image2.default.createFrom(this[0]);
  let newData = image.data;

  for (let i = 0; i < this[0].data.length; i++) {
    newData[i] = data[i] / this.length;
  }

  return image;
}