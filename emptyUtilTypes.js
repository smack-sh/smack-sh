function isArrayBuffer(value) {
  return value instanceof ArrayBuffer;
}

function isUint8Array(value) {
  return value instanceof Uint8Array;
}

function isTypedArray(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function isDataView(value) {
  return value instanceof DataView;
}

module.exports = {
  isArrayBuffer,
  isUint8Array,
  isTypedArray,
  isDataView,
};
