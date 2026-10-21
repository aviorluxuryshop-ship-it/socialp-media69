import * as THREE from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Procedural, unbranded sedan with the glass built as separate, individually
 * movable parts. Units are metres. +X is the front of the car, +Y is up, and the
 * left side of the car (nearest the default camera) is +Z.
 */

export type GlassId =
  | "windshield"
  | "side-front-left"
  | "side-rear-left"
  | "side-front-right"
  | "side-rear-right"
  | "rear";

export type GlassGroup = "windshield" | "side" | "rear";

export type GlassPart = {
  id: GlassId;
  group: GlassGroup;
  /** Sits at the part's rest centroid; geometry is centred on it. */
  object: THREE.Group;
  rest: THREE.Vector3;
  /** Translation applied at full separation. */
  offset: THREE.Vector3;
  /** Rotation applied at full separation (tilts the pane as it floats away). */
  tilt: THREE.Euler;
};

export type Car = {
  root: THREE.Group;
  glass: GlassPart[];
  /** Object3D markers (children of the glass parts) used to place labels. */
  anchors: Record<GlassGroup, THREE.Object3D>;
};

export type CarMaterials = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const body = new THREE.MeshPhysicalMaterial({
    color: 0x173468,
    metalness: 0.7,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.8,
  });
  const hull = new THREE.MeshStandardMaterial({ color: 0x04060b, roughness: 0.65, metalness: 0.1 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x05070b, roughness: 0.45, metalness: 0.3 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xc9d3e3, roughness: 0.18, metalness: 1, envMapIntensity: 1.3 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.85, metalness: 0 });
  const rim = new THREE.MeshStandardMaterial({ color: 0x9aa6b8, roughness: 0.25, metalness: 1, envMapIntensity: 1.2 });
  const rimDark = new THREE.MeshStandardMaterial({ color: 0x14171d, roughness: 0.5, metalness: 0.8 });
  const headlight = new THREE.MeshStandardMaterial({
    color: 0xe8f3ff,
    emissive: 0xbfdcff,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  const taillight = new THREE.MeshStandardMaterial({
    color: 0x520808,
    emissive: 0xff2222,
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x16304f,
    metalness: 0,
    roughness: 0.04,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0,
  });
  const edge = new THREE.LineBasicMaterial({ color: 0x8ab6ff, transparent: true, opacity: 0.3 });
  const linerInside = new THREE.MeshBasicMaterial({ color: 0x010206, side: THREE.BackSide });
  const linerWall = new THREE.MeshBasicMaterial({ color: 0x010206, side: THREE.DoubleSide });
  return { body, hull, trim, chrome, tire, rim, rimDark, headlight, taillight, glass, edge, linerInside, linerWall };
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Lower body: one extruded side profile with wheel arches and a rounded bevel. */
function lowerBodyGeometry(): THREE.BufferGeometry {
  const AR = 0.54; // wheel-arch radius at the side face
  const WX = 1.42; // axle distance from centre
  const WY = 0.375; // wheel centre height
  const BOT = 0.27; // underside height
  const dy = BOT - WY;
  const dx = Math.sqrt(AR * AR - dy * dy);
  const a0 = Math.atan2(dy, dx);

  const s = new THREE.Shape();
  s.moveTo(-2.26, BOT);
  s.lineTo(-WX - dx, BOT);
  s.absarc(-WX, WY, AR, Math.PI - a0, a0, true);
  s.lineTo(WX - dx, BOT);
  s.absarc(WX, WY, AR, Math.PI - a0, a0, true);
  s.lineTo(2.22, BOT);
  s.bezierCurveTo(2.3, BOT, 2.36, 0.34, 2.37, 0.46); // front lower corner
  s.bezierCurveTo(2.38, 0.58, 2.36, 0.68, 2.3, 0.76); // nose
  s.bezierCurveTo(2.0, 0.84, 1.35, 0.97, 0.8, 1.0); // bonnet
  s.lineTo(-1.55, 1.0); // belt line
  s.bezierCurveTo(-1.98, 1.0, -2.2, 0.97, -2.3, 0.9); // boot lid
  s.bezierCurveTo(-2.37, 0.82, -2.39, 0.62, -2.37, 0.48); // tail
  s.bezierCurveTo(-2.36, 0.36, -2.32, BOT, -2.26, BOT);

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 1.68,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.09,
    bevelSegments: 6,
    curveSegments: 40,
    steps: 1,
  });
  geo.translate(0, 0, -0.84);

  // Tumblehome: pull the body in towards the top so the side faces lean and catch light
  // like a shaped car. The taper is linear in height, which keeps every flat face planar
  // (a non-linear taper would bend the large, coarsely triangulated side faces and show facets).
  const pos = geo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * bodyTaper(pos.getY(i)));
  pos.needsUpdate = true;
  return toCreasedNormals(geo, 0.7);
}

/** Half-width scale of the lower body at height y (1 at the sills, narrowing towards the beltline). */
export function bodyTaper(y: number): number {
  return 1 - 0.15 * (y - 0.27);
}

function extrudeProfile(points: [number, number][], depth: number, bevel: number): THREE.BufferGeometry {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** A beam between two points. `w` is the in-plane thickness, `d` the thickness along Z. */
function beam(a: THREE.Vector3, b: THREE.Vector3, w: number, d: number, material: THREE.Material): THREE.Mesh {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.normalize());
  return mesh;
}

function roofGeometry(): THREE.BufferGeometry {
  // Rounded plan shape in (x, z), extruded upward.
  const x0 = -1.05;
  const x1 = 0.17;
  const z = 0.67;
  const rf = 0.3; // front corner radius
  const rr = 0.2; // rear corner radius
  const s = new THREE.Shape();
  s.moveTo(x0 + rr, -z);
  s.lineTo(x1 - rf, -z);
  s.quadraticCurveTo(x1, -z, x1, -z + rf);
  s.lineTo(x1, z - rf);
  s.quadraticCurveTo(x1, z, x1 - rf, z);
  s.lineTo(x0 + rr, z);
  s.quadraticCurveTo(x0, z, x0, z - rr);
  s.lineTo(x0, -z + rr);
  s.quadraticCurveTo(x0, -z, x0 + rr, -z);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2); // shape (x, y) -> world (x, -z); extrusion -> +Y
  return geo;
}

type Pt = [number, number];

function roundedShape(points: Pt[], radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i + n - 1) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const toPrev = new THREE.Vector2(p0[0] - p1[0], p0[1] - p1[1]);
    const toNext = new THREE.Vector2(p2[0] - p1[0], p2[1] - p1[1]);
    const r = Math.min(radius, toPrev.length() / 2, toNext.length() / 2);
    const a = toPrev.clone().normalize().multiplyScalar(r).add(new THREE.Vector2(p1[0], p1[1]));
    const b = toNext.clone().normalize().multiplyScalar(r).add(new THREE.Vector2(p1[0], p1[1]));
    if (i === 0) shape.moveTo(a.x, a.y);
    else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p1[0], p1[1], b.x, b.y);
  }
  shape.closePath();
  return shape;
}

/** Slightly bowed quad grid for the windshield and rear glass. */
function bowedGlass(
  bl: THREE.Vector3,
  br: THREE.Vector3,
  tr: THREE.Vector3,
  tl: THREE.Vector3,
  normal: THREE.Vector3,
  bulge: number,
): THREE.BufferGeometry {
  const nu = 18;
  const nv = 10;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const v = j / nv;
      const bottom = bl.clone().lerp(br, u);
      const top = tl.clone().lerp(tr, u);
      const p = bottom.lerp(top, v);
      p.addScaledVector(normal, bulge * Math.sin(Math.PI * u) * Math.sqrt(Math.sin(Math.PI * v)));
      positions.push(p.x, p.y, p.z);
    }
  }
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + 1;
      const c = a + nu + 1;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Flat side-window pane at a given Z. */
function sideGlass(points: Pt[], z: number): THREE.BufferGeometry {
  const geo = new THREE.ShapeGeometry(roundedShape(points, 0.05), 6);
  geo.translate(0, 0, z);
  return geo;
}

function centreGeometry(geo: THREE.BufferGeometry): THREE.Vector3 {
  geo.computeBoundingBox();
  const c = geo.boundingBox!.getCenter(new THREE.Vector3());
  geo.translate(-c.x, -c.y, -c.z);
  return c;
}

function makeWheel(m: CarMaterials): THREE.Group {
  const wheel = new THREE.Group();
  const profile = [
    [0.2, -0.12],
    [0.3, -0.12],
    [0.335, -0.1],
    [0.347, -0.06],
    [0.347, 0.06],
    [0.335, 0.1],
    [0.3, 0.12],
    [0.2, 0.12],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const tire = new THREE.Mesh(new THREE.LatheGeometry(profile, 56), m.tire);
  tire.rotation.x = Math.PI / 2;
  wheel.add(tire);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.22, 48), m.rim);
  barrel.rotation.x = Math.PI / 2;
  wheel.add(barrel);

  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), m.rimDark);
  face.position.z = 0.108;
  wheel.add(face);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.19, 0.03), m.rim);
    spoke.geometry.translate(0, 0.1, 0);
    spoke.position.z = 0.118;
    spoke.rotation.z = (i / 5) * Math.PI * 2;
    wheel.add(spoke);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), m.chrome);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.125;
  wheel.add(cap);
  return wheel;
}

export function buildCar(m: CarMaterials): Car {
  const root = new THREE.Group();

  // --- body --------------------------------------------------------------
  root.add(new THREE.Mesh(lowerBodyGeometry(), m.body));

  // Dark cabin hull (what you see through the glass openings).
  const hull = new THREE.Mesh(
    extrudeProfile(
      [
        [0.85, 1.0],
        [0.85, 1.085],
        [0.115, 1.495],
        [-0.97, 1.495],
        [-1.57, 1.085],
        [-1.57, 1.0],
      ],
      1.1,
      0.03,
    ),
    m.hull,
  );
  root.add(hull);

  const roof = new THREE.Mesh(toCreasedNormals(roofGeometry(), 0.7), m.body);
  roof.position.y = 1.495;
  root.add(roof);

  // --- pillars and rails (both sides) -------------------------------------
  for (const side of [1, -1]) {
    const z = 0.655 * side;
    root.add(beam(v3(0.87, 1.1, z), v3(0.12, 1.51, z), 0.09, 0.07, m.body)); // A pillar
    root.add(beam(v3(-0.4, 1.1, z), v3(-0.42, 1.5, z), 0.1, 0.07, m.body)); // B pillar
    root.add(beam(v3(-1.6, 1.1, z), v3(-0.96, 1.51, z), 0.24, 0.07, m.body)); // C pillar
    root.add(beam(v3(0.16, 1.495, z), v3(-1.02, 1.495, z), 0.05, 0.07, m.body)); // roof rail
  }

  // --- glass -------------------------------------------------------------
  const glass: GlassPart[] = [];
  const anchors = {} as Record<GlassGroup, THREE.Object3D>;

  const addGlass = (
    id: GlassId,
    group: GlassGroup,
    geo: THREE.BufferGeometry,
    offset: THREE.Vector3,
    tilt: THREE.Euler,
    anchorLocal?: THREE.Vector3,
  ) => {
    const centre = centreGeometry(geo);
    const object = new THREE.Group();
    object.position.copy(centre);
    object.add(new THREE.Mesh(geo, m.glass));
    object.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), m.edge));
    if (anchorLocal) {
      const a = new THREE.Object3D();
      a.position.copy(anchorLocal);
      object.add(a);
      anchors[group] = a;
    }
    root.add(object);
    glass.push({ id, group, object, rest: centre.clone(), offset, tilt });
  };

  // Windshield: raked, slightly bowed outward.
  const nW = v3(0.48, 0.877, 0);
  addGlass(
    "windshield",
    "windshield",
    bowedGlass(v3(0.88, 1.105, -0.66), v3(0.88, 1.105, 0.66), v3(0.13, 1.515, 0.59), v3(0.13, 1.515, -0.59), nW, 0.03),
    nW.clone().multiplyScalar(1.15).add(v3(0.55, 0, 0)),
    new THREE.Euler(0, 0, -0.14),
    v3(0, 0.1, 0.45),
  );

  // Rear glass.
  const nR = v3(-0.552, 0.834, 0);
  addGlass(
    "rear",
    "rear",
    bowedGlass(v3(-1.6, 1.105, -0.64), v3(-1.6, 1.105, 0.64), v3(-0.96, 1.515, 0.57), v3(-0.96, 1.515, -0.57), nR, 0.03),
    nR.clone().multiplyScalar(1.15).add(v3(-0.6, 0, 0)),
    new THREE.Euler(0, 0, 0.16),
    v3(0, 0.1, 0.45),
  );

  // Side windows: front and rear door glass, left (+Z) and right (-Z).
  const frontDoor: Pt[] = [
    [0.8, 1.115],
    [0.23, 1.47],
    [-0.36, 1.47],
    [-0.36, 1.115],
  ];
  const rearDoor: Pt[] = [
    [-0.46, 1.115],
    [-0.46, 1.47],
    [-0.9, 1.47],
    [-1.4, 1.115],
  ];
  const zs = 0.615;
  addGlass("side-front-left", "side", sideGlass(frontDoor, zs), v3(0.3, 0.25, 1.15), new THREE.Euler(-0.14, 0, 0), v3(0, 0, 0));
  addGlass("side-rear-left", "side", sideGlass(rearDoor, zs), v3(-0.4, 0.3, 1.85), new THREE.Euler(-0.14, 0, 0));
  addGlass("side-front-right", "side", sideGlass(frontDoor, -zs), v3(0.3, 0.25, -1.15), new THREE.Euler(0.14, 0, 0));
  addGlass("side-rear-right", "side", sideGlass(rearDoor, -zs), v3(-0.4, 0.3, -1.85), new THREE.Euler(0.14, 0, 0));

  // --- details -----------------------------------------------------------
  for (const side of [1, -1]) {
    // Door handles sit on the (tapered) side face.
    for (const x of [-0.05, -0.95]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.014), m.chrome);
      handle.position.set(x, 0.88, (0.93 * bodyTaper(0.88) + 0.004) * side);
      root.add(handle);
    }
    // Wing mirror.
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.09, 28, 18), m.body);
    mirror.scale.set(0.95, 0.62, 1.25);
    mirror.position.set(0.6, 1.1, (0.93 * bodyTaper(1.1) + 0.1) * side);
    root.add(mirror);
    // Headlight strip and tail light blade.
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.44), m.headlight);
    head.position.set(2.4, 0.74, 0.5 * side);
    head.rotation.set(0, 0.2 * -side, 0);
    root.add(head);
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.92), m.trim);
  grille.position.set(2.43, 0.5, 0);
  root.add(grille);
  const lowerIntake = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 1.3), m.trim);
  lowerIntake.position.set(2.4, 0.36, 0);
  root.add(lowerIntake);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.055, 1.5), m.taillight);
  tail.position.set(-2.435, 0.84, 0);
  root.add(tail);

  // --- wheels ------------------------------------------------------------
  for (const x of [1.42, -1.42]) {
    for (const side of [1, -1]) {
      const wheel = makeWheel(m);
      wheel.scale.setScalar(1.085);
      wheel.position.set(x, 0.375, 0.74 * side);
      if (side < 0) wheel.rotation.y = Math.PI;
      root.add(wheel);
    }
    // Dark arch liner so the wheel is seen against black, not body paint.
    const liner = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1.5, 40, 1, true), m.linerInside);
    liner.rotation.x = Math.PI / 2;
    liner.position.set(x, 0.375, 0);
    root.add(liner);
    const wall = new THREE.Mesh(new THREE.CircleGeometry(0.45, 40), m.linerWall);
    wall.position.set(x, 0.375, 0);
    root.add(wall);
  }

  return { root, glass, anchors };
}

/** Dispose every geometry and material owned by a car (materials are shared, so pass a set). */
export function disposeObject(root: THREE.Object3D, seen = new Set<THREE.Material>()): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (mat) for (const x of Array.isArray(mat) ? mat : [mat]) if (!seen.has(x)) {
        seen.add(x);
        x.dispose();
      }
  });
}
