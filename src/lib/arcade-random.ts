export function randomStep(value: number) {
  let next = value || 0x9e3779b9;
  next ^= next << 13; next ^= next >>> 17; next ^= next << 5;
  return next >>> 0;
}
