import * as THREE from 'three';
import { windowsTexture, waterTexture } from './geometry.js';

const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
  }
`;
const SKY_FRAG = /* glsl */`
  uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunVis;
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    float t = pow(clamp(h, 0.0, 1.0), 0.55);
    vec3 col = mix(uHorizon, uZenith, t);
    col = mix(col, uHorizon * 0.8, smoothstep(0.0, -0.25, h)); // ufkun altı
    float sd = max(dot(d, normalize(uSunDir)), 0.0);
    col += uSunColor * (pow(sd, 6.0) * 0.28 + pow(sd, 48.0) * 0.5) * uSunVis;
    col += uSunColor * smoothstep(0.9993, 0.9998, sd) * 2.0 * uSunVis;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function buildEnvironment(quality) {
  const group = new THREE.Group(); group.name = 'environment';

  // gökyüzü kubbesi (kameraya göre sabit)
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    uniforms: {
      uZenith: { value: new THREE.Color(0x2f7fe0) }, uHorizon: { value: new THREE.Color(0xcfe6fa) },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color(0xffffff) }, uSunVis: { value: 1 },
    },
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), skyMat);
  sky.name = 'sky'; sky.renderOrder = -10; sky.frustumCulled = false;
  group.add(sky);

  // yıldızlar
  const sp = new Float32Array(quality.stars * 3);
  for (let i = 0; i < quality.stars; i++) {
    const u = Math.random(), v = Math.random() * 0.95 + 0.03;
    const th = u * Math.PI * 2, y = v, rxz = Math.sqrt(1 - y * y);
    sp[i * 3] = Math.cos(th) * rxz * 2800; sp[i * 3 + 1] = y * 2800; sp[i * 3 + 2] = Math.sin(th) * rxz * 2800;
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const stars = new THREE.Points(sg, starMat); stars.name = 'stars'; stars.frustumCulled = false; stars.renderOrder = -9;
  group.add(stars);

  // zemin + meydan
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x6d7462 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(3000, 48), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.name = 'ground'; ground.receiveShadow = true;
  const plazaMat = new THREE.MeshLambertMaterial({ color: 0xb3afa4 });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(150, 64), plazaMat);
  plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.12; plaza.name = 'plaza'; plaza.receiveShadow = true;
  group.add(ground, plaza);

  // su (Boğaz ipucu) – Batı tarafı
  const waterTex = waterTexture(); waterTex.repeat.set(30, 120);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x2c5a85, map: waterTex, roughness: 0.28, metalness: 0.15,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(330, 2400), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(-355, 0.3, 0); water.name = 'water';
  // rıhtım
  const quay = new THREE.Mesh(new THREE.BoxGeometry(6, 1.2, 2400), new THREE.MeshLambertMaterial({ color: 0x8d8a82 }));
  quay.position.set(-192, 0.3, 0);
  group.add(water, quay);

  // ağaçlar (instanced koniler)
  const treeGeo = new THREE.ConeGeometry(2.2, 7, 6); treeGeo.translate(0, 3.5, 0);
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x3d5a3a });
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, quality.treeCount);
  const m = new THREE.Matrix4();
  for (let i = 0; i < quality.treeCount; i++) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 118 + Math.random() * 30;
    const x = Math.cos(ang) * rad * 0.95, z = Math.sin(ang) * rad * 1.05;
    const s = 0.8 + Math.random() * 0.8;
    m.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    trees.setMatrixAt(i, m);
  }
  trees.name = 'trees'; group.add(trees);

  // uzak şehir blokları (instanced)
  const winTex = windowsTexture();
  const cityMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0 });
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), cityMat, quality.cityCount);
  const col = new THREE.Color();
  let placed = 0, guard = 0;
  while (placed < quality.cityCount && guard++ < 5000) {
    const ang = Math.random() * Math.PI * 2;
    const rad = 480 + Math.pow(Math.random(), 0.8) * 1100;
    const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
    if (x < -180 && x > -520) continue; // su şeridi
    const w = 14 + Math.random() * 26, d = 14 + Math.random() * 26;
    const far = rad / 1500;
    const h = 12 + Math.random() * (30 + 60 * far * Math.random());
    m.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d));
    city.setMatrixAt(placed, m);
    const g = 0.55 + Math.random() * 0.35;
    city.setColorAt(placed, col.setRGB(g, g * 0.97, g * 0.92));
    placed++;
  }
  city.count = placed; city.name = 'city'; group.add(city);

  function apply(st, night) {
    skyMat.uniforms.uZenith.value.copy(st.zenith);
    skyMat.uniforms.uHorizon.value.copy(st.horizon);
    skyMat.uniforms.uSunColor.value.copy(st.sun);
    skyMat.uniforms.uSunVis.value = THREE.MathUtils.clamp(st.sunI / 1.2, 0, 1);
    starMat.opacity = Math.max(0, (night - 0.45) / 0.55);
    waterMat.color.copy(st.horizon).lerp(new THREE.Color(0x0d2740), 0.55);
    cityMat.emissiveIntensity = night * 1.1;
    groundMat.color.setHex(0x6d7462).multiplyScalar(1);
  }

  function setSunDirection(dir) { skyMat.uniforms.uSunDir.value.copy(dir); }

  function update(dt, camera) {
    sky.position.copy(camera.position); stars.position.copy(camera.position);
    waterTex.offset.y += dt * 0.0006;
    waterTex.offset.x += dt * 0.0003;
  }

  return { group, apply, setSunDirection, update, materials: { water: waterMat, ground: groundMat } };
}
