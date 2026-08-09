// Tiny dependency-free PNG encoder/decoder used by the build-time asset scripts.
import { deflateSync, inflateSync } from "node:zlib";

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** @param {{width:number,height:number,data:Buffer}} img RGBA8 */
export function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function decodePng(buf) {
  let p = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6) throw new Error("expected 8-bit RGBA");
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += len + 12;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const out = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const q = a + b - c;
    const pa = Math.abs(q - a);
    const pb = Math.abs(q - b);
    const pc = Math.abs(q - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? out[y * stride + i - 4] : 0;
      const b = y > 0 ? out[(y - 1) * stride + i] : 0;
      const c = i >= 4 && y > 0 ? out[(y - 1) * stride + i - 4] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) v += paeth(a, b, c);
      out[y * stride + i] = v & 0xff;
    }
  }
  return { width, height, data: out };
}

/** Simple RGBA canvas with 4x supersampled shape filling. */
export class Canvas {
  constructor(width, height, background = [0, 0, 0, 0]) {
    this.width = width;
    this.height = height;
    this.data = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      this.data[i * 4] = background[0];
      this.data[i * 4 + 1] = background[1];
      this.data[i * 4 + 2] = background[2];
      this.data[i * 4 + 3] = background[3];
    }
  }

  blend(x, y, colour, alpha) {
    if (alpha <= 0 || x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const o = (y * this.width + x) * 4;
    const a = Math.min(1, alpha);
    const da = this.data[o + 3] / 255;
    const oa = a + da * (1 - a);
    if (oa === 0) return;
    for (let k = 0; k < 3; k++) {
      this.data[o + k] = Math.round((colour[k] * a + this.data[o + k] * da * (1 - a)) / oa);
    }
    this.data[o + 3] = Math.round(oa * 255);
  }

  /** Fill where `test(x, y)` is true, antialiased by 4x4 supersampling. */
  fill(test, colour, bounds) {
    const x0 = Math.max(0, Math.floor(bounds?.x0 ?? 0));
    const x1 = Math.min(this.width - 1, Math.ceil(bounds?.x1 ?? this.width - 1));
    const y0 = Math.max(0, Math.floor(bounds?.y0 ?? 0));
    const y1 = Math.min(this.height - 1, Math.ceil(bounds?.y1 ?? this.height - 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        let hits = 0;
        for (let sy = 0; sy < 4; sy++)
          for (let sx = 0; sx < 4; sx++)
            if (test(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) hits++;
        if (hits) this.blend(x, y, colour, hits / 16);
      }
    }
  }

  toPng() {
    return encodePng(this);
  }
}

export const hex = (s) => [
  parseInt(s.slice(1, 3), 16),
  parseInt(s.slice(3, 5), 16),
  parseInt(s.slice(5, 7), 16),
];
