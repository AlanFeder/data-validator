export function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }

  // Copy the exact byte range. Node Buffers may be views into a larger pool.
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}
