'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Dict } from '@/content/tr';

gsap.registerPlugin(ScrollTrigger);

/**
 * Pinned, scroll-scrubbed product hero.
 *
 * The section pins for 3200px of scroll while a GSAP timeline drives the real
 * Three.js rig — rotation, dolly and framing all read straight off scroll
 * progress, so the model turns as you scroll and reverses when you scroll back.
 *
 * The camera is the existing optimised Canon GLB (34 meshes, Draco, 3.3 MB);
 * geometry and materials are left untouched. Lighting is a three-point rig plus
 * a PMREM environment so the metal and glass have something to reflect.
 */
type Angle = { rotY: number; rotX: number; z: number; x: number; y: number; scale: number };

/** front -> three-quarter -> side -> rear/top -> hero */
const ANGLES: Angle[] = [
  { rotY: -0.15, rotX: 0.05, z: 0, x: 0.2, y: 0, scale: 1 },
  { rotY: -1.3, rotX: 0.14, z: 1.2, x: 0.6, y: -0.2, scale: 1.08 },
  { rotY: -2.6, rotX: 0.06, z: 0.2, x: 0.1, y: 0.15, scale: 1 },
  { rotY: -4.2, rotX: 0.42, z: -1.0, x: -0.3, y: 0.35, scale: 0.94 },
  { rotY: -5.8, rotX: 0.16, z: 1.6, x: 0.4, y: -0.1, scale: 1.12 },
];

export function ServicesHero({ dict }: { dict: Dict }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const capRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fitRef = useRef<(() => void) | null>(null);
  const [mobile, setMobile] = useState(false);

  const beats = dict.services.items.slice(0, ANGLES.length);

  useEffect(() => {
    setMobile(window.matchMedia('(max-width: 1023px)').matches);
  }, []);

  useEffect(() => {
    if (mobile) return;
    const section = sectionRef.current;
    const mount = mountRef.current;
    if (!section || !mount) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [THREE, { GLTFLoader }, { DRACOLoader }, { RoomEnvironment }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/loaders/DRACOLoader.js'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
      ]);
      if (disposed) return;

      let renderer: import('three').WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch {
        return; // no WebGL — the section still reads as a normal editorial block
      }

      const w = () => mount.clientWidth || 1;
      const h = () => mount.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w(), h());
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.display = 'block';

      const scene = new THREE.Scene();
      const view = new THREE.PerspectiveCamera(32, w() / h(), 0.1, 200);
      view.position.set(0, 0.4, 15);
      view.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(5, 8, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.far = 40;
      key.shadow.bias = -0.0015;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xdce6ff, 0.7);
      fill.position.set(-5, 1, 4);
      scene.add(fill);

      // Soft contact shadow on a white floor, so the product sits on something.
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.ShadowMaterial({ opacity: 0.16 }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -3.1;
      floor.receiveShadow = true;
      scene.add(floor);

      const rig = new THREE.Group();
      scene.add(rig);

      const draco = new DRACOLoader();
      draco.setDecoderPath('/draco/');
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);

      loader.load('/model/camera.glb', (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        const pivot = new THREE.Group();
        pivot.add(root);
        rig.add(pivot);
        rig.updateMatrixWorld(true);

        const kept: import('three').Object3D[] = [];
        const doomed: import('three').Object3D[] = [];
        const size = new THREE.Vector3();
        root.traverse((o) => {
          const m = o as import('three').Mesh;
          if (!m.isMesh || !m.geometry) return;
          m.geometry.computeBoundingBox();
          m.geometry.boundingBox?.getSize(size);
          // The export ships a flat backdrop plane; it would swallow the shadow.
          if (size.x < 0.001 || size.y < 0.001 || size.z < 0.001) {
            doomed.push(m);
            return;
          }
          m.castShadow = true;
          kept.push(m);
        });
        doomed.forEach((m) => m.removeFromParent());

        const bounds = new THREE.Box3();
        kept.forEach((m) => bounds.expandByObject(m));
        const bs = new THREE.Vector3();
        const mid = new THREE.Vector3();
        bounds.getSize(bs);
        bounds.getCenter(mid);
        pivot.position.copy(mid).multiplyScalar(-1);

        const narrow = w() < 700;
        const base = (narrow ? 5.2 : 7.6) / Math.max(bs.x, bs.y, bs.z);
        rig.scale.setScalar(base);

        /*
         * Frame from the bounding sphere so the whole product always fits: on a
         * portrait viewport the horizontal FOV is the limiting axis, so the view
         * has to pull back rather than let the lens run off the edge.
         */
        const fitView = () => {
          const radius = Math.max(bs.x, bs.y, bs.z) * 0.5 * rig.scale.x;
          const vFov = (view.fov * Math.PI) / 180;
          const hFov = 2 * Math.atan(Math.tan(vFov / 2) * view.aspect);
          const dist = radius / Math.sin(Math.min(vFov, hFov) / 2);
          view.position.set(0, 0.4, dist * 1.12);
          view.lookAt(0, 0, 0);
        };
        fitView();
        fitRef.current = fitView;
        rig.rotation.set(ANGLES[0].rotX, ANGLES[0].rotY, 0);
        rig.position.set(ANGLES[0].x, ANGLES[0].y, ANGLES[0].z);

        // ---- Scroll-scrubbed timeline -----------------------------------
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=2700',
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
          },
        });

        ANGLES.slice(1).forEach((a, i) => {
          const prev = ANGLES[i];
          tl.to(rig.rotation, { y: a.rotY, x: a.rotX, duration: 1, ease: 'none' }, i)
            .to(rig.position, { x: a.x, y: a.y, z: a.z, duration: 1, ease: 'none' }, i)
            .to(rig.scale, { x: base * a.scale, y: base * a.scale, z: base * a.scale, duration: 1, ease: 'none' }, i)
            .fromTo(
              capRefs.current[i + 1],
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' },
              i + 0.25,
            )
            .to(capRefs.current[i], { autoAlpha: 0, y: -24, duration: 0.3, ease: 'power2.in' }, i + 0.05);
          void prev;
        });

        ScrollTrigger.refresh();
      });

      const render = () => renderer.render(scene, view);
      gsap.ticker.add(render);

      const onResize = () => {
        renderer.setSize(w(), h());
        view.aspect = w() / h();
        view.updateProjectionMatrix();
        fitRef.current?.();
        ScrollTrigger.refresh();
      };
      const ro = new ResizeObserver(onResize);
      ro.observe(mount);

      cleanup = () => {
        gsap.ticker.remove(render);
        ro.disconnect();
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === section) t.kill();
        });
        scene.traverse((o) => (o as import('three').Mesh).geometry?.dispose?.());
        envRT.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [mobile]);

  return (
    <div ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden bg-[#f4f4f2] text-ink">
      {/* Product stage */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-full max-w-full overflow-hidden lg:w-[62%]"
      />
      {mobile ? (
        <div className="absolute inset-x-0 top-[10%] h-[42%]" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cam/cam4.webp" alt="" className="mx-auto h-full w-auto max-w-[86vw] object-contain" />
        </div>
      ) : null}

      {/* Editorial column — the model never travels into it. */}
      <div className="absolute inset-y-0 left-0 flex w-full flex-col justify-center px-[6vw] lg:w-[40%] max-lg:top-[52%] max-lg:justify-start">
        <div className="relative min-h-[15rem]">
          {beats.map((b, i) => (
            <div
              key={b.no}
              ref={(el) => {
                capRefs.current[i] = el;
              }}
              style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}
              className="absolute inset-x-0 top-0"
            >
              <p className="kicker mb-5 flex items-center gap-3 text-[#1b7a55]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1b7a55]" aria-hidden="true" />
                {b.no} / {String(beats.length).padStart(2, '0')}
              </p>
              <h3 className="display text-[clamp(2rem,4vw,3.6rem)] leading-[0.96] text-ink">{b.title}</h3>
              <p className="mt-5 max-w-[36ch] text-[1.0625rem] leading-[1.7] text-slate">{b.long}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="kicker absolute inset-x-0 bottom-8 text-center text-slate">{dict.hero.scroll} ↓</p>
    </div>
  );
}
