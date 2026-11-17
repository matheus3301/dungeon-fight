/** Canonical display trajectory, normalized to a 100×100 table.
 * The one/two preliminary table contacts stay outside the target (bottom edge74).
 * This is a parameterized arcade arc, not rigid-body cuboid physics.
 */
export function trajectory(x: number, y: number, loft: number) {
  const contacts = loft >= 0.65 ? [0, 0.11, 0.22, 1] : [0, 0.18, 1];
  return Array.from({ length: 61 }, (_, i) => {
    const t = i / 60;
    let segment = contacts.findIndex((end, index) => index > 0 && t <= end);
    if (segment < 1) segment = contacts.length - 1;
    const start = contacts[segment - 1],
      end = contacts[segment],
      u = (t - start) / (end - start);
    const height =
      segment === contacts.length - 1 ? 8 + loft * 14 : 4 + loft * 4;
    return {
      x: 50 + (x - 50) * t,
      y: 94 + (y - 94) * t,
      z: Math.max(0, Math.sin(u * Math.PI)) * height,
    };
  });
}
