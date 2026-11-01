// QR version 5-L, byte mode, mask 0. Encoded locally; no link sent to a QR service.
export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  if (bytes.length > 106) throw new Error("Link is too long for this QR code.");
  const bits = [];
  const put = (n, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((n >>> i) & 1);
  };
  put(4, 4);
  put(bytes.length, 8);
  bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, 864 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8)
    data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
  while (data.length < 108)
    data.push(data.length % 2 === Math.ceil(bits.length / 8) % 2 ? 236 : 17);
  const mul = (a, b) => {
    let r = 0;
    for (let i = 7; i >= 0; i--) {
      r = (r << 1) ^ ((r >>> 7) * 285);
      r ^= ((b >>> i) & 1) * a;
    }
    return r;
  };
  let divisor = [1];
  for (let i = 0, root = 1; i < 26; i++, root = mul(root, 2)) {
    const next = Array(divisor.length + 1).fill(0);
    divisor.forEach((v, j) => {
      next[j] ^= v;
      next[j + 1] ^= mul(v, root);
    });
    divisor = next;
  }
  const rem = Array(26).fill(0);
  for (const b of data) {
    const factor = b ^ rem.shift();
    rem.push(0);
    for (let j = 0; j < 26; j++) rem[j] ^= mul(divisor[j + 1], factor);
  }
  const stream = [...data, ...rem].flatMap((b) =>
    Array.from({ length: 8 }, (_, i) => (b >>> (7 - i)) & 1),
  );
  const n = 37,
    m = Array.from({ length: n }, () => Array(n).fill(false)),
    fixed = Array.from({ length: n }, () => Array(n).fill(false));
  const set = (x, y, v) => {
    if (x >= 0 && x < n && y >= 0 && y < n) {
      m[y][x] = !!v;
      fixed[y][x] = true;
    }
  };
  for (const [cx, cy] of [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ])
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
  for (let i = 8; i < n - 8; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (let dy = -2; dy <= 2; dy++)
    for (let dx = -2; dx <= 2; dx++)
      set(30 + dx, 30 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  const format = 0x77c4;
  for (let i = 0; i <= 5; i++) set(8, i, (format >>> i) & 1);
  set(8, 7, (format >>> 6) & 1);
  set(8, 8, (format >>> 7) & 1);
  set(7, 8, (format >>> 8) & 1);
  for (let i = 9; i < 15; i++) set(14 - i, 8, (format >>> i) & 1);
  for (let i = 0; i < 8; i++) set(n - 1 - i, 8, (format >>> i) & 1);
  for (let i = 8; i < 15; i++) set(8, n - 15 + i, (format >>> i) & 1);
  set(8, n - 8, true);
  let k = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < n; v++) {
      const y = ((right + 1) & 2) === 0 ? n - 1 - v : v;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (!fixed[y][x]) {
          m[y][x] = !!((stream[k++] || 0) ^ ((x + y) % 2 === 0 ? 1 : 0));
        }
      }
    }
  }
  return m;
}
