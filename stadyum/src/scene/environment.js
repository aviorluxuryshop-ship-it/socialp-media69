import * as THREE from 'three';
import { buildWorld } from './world.js';

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
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
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

  // gerçek çevre (OpenStreetMap): zemin, Boğaz, binalar, yollar, parklar, köprü
  const world = buildWorld(quality);
  group.add(world.group);

  function apply(st, night) {
    skyMat.uniforms.uZenith.value.copy(st.zenith);
    skyMat.uniforms.uHorizon.value.copy(st.fog); // ufuk = sis rengi: uzak yapılar gökyüzüne kusursuz solar
    skyMat.uniforms.uSunColor.value.copy(st.sun);
    skyMat.uniforms.uSunVis.value = THREE.MathUtils.clamp(st.sunI / 1.2, 0, 1);
    starMat.opacity = Math.max(0, (night - 0.45) / 0.55);
    world.apply(st, night);
  }

  function setSunDirection(dir) { skyMat.uniforms.uSunDir.value.copy(dir); world.setSunDirection(dir); }

  function update(dt, camera) {
    sky.position.copy(camera.position); stars.position.copy(camera.position);
    if (group.children.includes(world.group) && world.group.visible) world.update(dt, camera);
  }

  return { group, apply, setSunDirection, update, world };
}
