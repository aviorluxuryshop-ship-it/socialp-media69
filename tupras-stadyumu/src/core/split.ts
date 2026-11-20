/**
 * Split a mesh into angular sectors around a centre so that frustum culling
 * can drop the parts behind the camera. Every attribute (including the
 * blockId used by the mask pass) is carried over; the material is shared.
 */
import { BufferAttribute, BufferGeometry, Color, InstancedMesh, Matrix4, Mesh, Object3D, Vector3 } from 'three';

export function splitGeometryBySector(g: BufferGeometry, sectors: number, cx = 0, cz = 0): BufferGeometry[] {
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const triCount = (index ? index.count : pos.count) / 3;
  const vtx = (t: number, k: number) => (index ? index.getX(t * 3 + k) : t * 3 + k);
  const buckets: number[][] = Array.from({ length: sectors }, () => []);
  for (let t = 0; t < triCount; t++) {
    let x = 0;
    let z = 0;
    for (let k = 0; k < 3; k++) {
      const v = vtx(t, k);
      x += pos.getX(v);
      z += pos.getZ(v);
    }
    let a = Math.atan2(z / 3 - cz, x / 3 - cx);
    if (a < 0) a += Math.PI * 2;
    buckets[Math.min(sectors - 1, Math.floor((a / (Math.PI * 2)) * sectors))].push(t);
  }
  const names = Object.keys(g.attributes);
  return buckets
    .filter((b) => b.length > 0)
    .map((tris) => {
      const remap = new Map<number, number>();
      const idx: number[] = [];
      for (const t of tris) {
        for (let k = 0; k < 3; k++) {
          const v = vtx(t, k);
          let n = remap.get(v);
          if (n === undefined) {
            n = remap.size;
            remap.set(v, n);
          }
          idx.push(n);
        }
      }
      const out = new BufferGeometry();
      for (const name of names) {
        const src = g.getAttribute(name) as BufferAttribute;
        const size = src.itemSize;
        const Arr = (src.array as Float32Array).constructor as Float32ArrayConstructor;
        const arr = new Arr(remap.size * size);
        for (const [o, n] of remap) for (let c = 0; c < size; c++) arr[n * size + c] = src.array[o * size + c];
        out.setAttribute(name, new BufferAttribute(arr, size, src.normalized));
      }
      out.setIndex(remap.size > 65535 ? new BufferAttribute(new Uint32Array(idx), 1) : new BufferAttribute(new Uint16Array(idx), 1));
      out.computeBoundingSphere();
      out.computeBoundingBox();
      return out;
    });
}

/**
 * Replace `meshes` (children of their parents) by sector pieces. Meshes that
 * share one geometry (e.g. the membrane's top and underside) are split once.
 */
export function splitMeshesBySector(meshes: Mesh[], sectors: number): Mesh[] {
  const cache = new Map<BufferGeometry, BufferGeometry[]>();
  const out: Mesh[] = [];
  for (const m of meshes) {
    const parent = m.parent;
    if (!parent) continue;
    let parts = cache.get(m.geometry);
    if (!parts) {
      parts = splitGeometryBySector(m.geometry, sectors);
      cache.set(m.geometry, parts);
    }
    parts.forEach((pg, i) => {
      const p = new Mesh(pg, m.material);
      p.name = `${m.name}#${i}`;
      p.castShadow = m.castShadow;
      p.receiveShadow = m.receiveShadow;
      p.renderOrder = m.renderOrder;
      p.position.copy(m.position);
      p.quaternion.copy(m.quaternion);
      p.scale.copy(m.scale);
      Object.assign(p.userData, m.userData);
      parent.add(p);
      out.push(p);
    });
    parent.remove(m);
    m.geometry.dispose();
  }
  return out;
}

/** Split an InstancedMesh into one InstancedMesh per angular sector of its instances. */
export function splitInstancedBySector(mesh: InstancedMesh, sectors: number): InstancedMesh[] {
  const parent = mesh.parent as Object3D;
  const m = new Matrix4();
  const p = new Vector3();
  const col = new Color();
  const buckets: number[][] = Array.from({ length: sectors }, () => []);
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    p.setFromMatrixPosition(m);
    let a = Math.atan2(p.z, p.x);
    if (a < 0) a += Math.PI * 2;
    buckets[Math.min(sectors - 1, Math.floor((a / (Math.PI * 2)) * sectors))].push(i);
  }
  const out: InstancedMesh[] = [];
  buckets.forEach((ids, k) => {
    if (!ids.length) return;
    const im = new InstancedMesh(mesh.geometry, mesh.material, ids.length);
    ids.forEach((src, j) => {
      mesh.getMatrixAt(src, m);
      im.setMatrixAt(j, m);
      if (mesh.instanceColor) im.setColorAt(j, mesh.getColorAt(src, col));
    });
    im.computeBoundingSphere();
    im.name = `${mesh.name}#${k}`;
    im.castShadow = mesh.castShadow;
    im.receiveShadow = mesh.receiveShadow;
    parent.add(im);
    out.push(im);
  });
  parent.remove(mesh);
  return out;
}
