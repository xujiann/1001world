/* ============================================================
   1001 世界 3D · AAA Engine Module (aaa-engine.js)
   五大核心方向模块化引擎:
   1. Rapier3D WASM 刚体物理交互 (可踢/推的木箱与沙滩球)
   2. 全身坡度 Foot IK 与沙滩脚印 / 帆船尾迹
   3. 电影级动态 FOV / 对话景深 DOF / 沉浸式自动隐藏 HUD
   4. Web Audio 3D HRTF 空间声场
   5. 自适应 60FPS 分辨率调度器
   ============================================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class AdaptivePerf9 {
  constructor(renderer, baseDpr = Math.min(devicePixelRatio || 1, 2)) {
    this.renderer = renderer;
    this.baseDpr = baseDpr;
    this.curDpr = baseDpr;
    this.avgDt = 0.0167;
    this.timer = 0;
  }
  update(dt) {
    this.avgDt = this.avgDt * 0.92 + Math.min(dt, 0.1) * 0.08;
    this.timer += dt;
    if (this.timer < 2.0) return;
    this.timer = 0;
    const target = this.avgDt > 0.028 ? Math.max(0.85, this.baseDpr * 0.72)
      : this.avgDt < 0.019 ? this.baseDpr : this.curDpr;
    if (Math.abs(target - this.curDpr) > 0.08) {
      this.curDpr = target;
      this.renderer.setPixelRatio(this.curDpr);
    }
  }
}

export class RapierPhysics9 {
  constructor(scene, heightFn) {
    this.scene = scene;
    this.heightFn = heightFn;
    this.RAPIER = null;
    this.world = null;
    this.bodies = [];
    this.ready = false;
    this.booting = false;
  }
  async init(spots) {
    if (this.booting || this.ready) return;
    this.booting = true;
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.12.0/rapier.es.js');
      const RAPIER = mod.default || mod;
      await RAPIER.init();
      this.RAPIER = RAPIER;
      this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      const crateGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const crateMat = new THREE.MeshStandardMaterial({ color: 0xb8844c, roughness: 0.78, metalness: 0.05 });
      const ballGeo = new THREE.SphereGeometry(0.55, 16, 12);
      const ballMat = new THREE.MeshPhysicalMaterial({ color: 0xff5a36, roughness: 0.25, clearcoat: 0.85 });

      for (const sp of spots) {
        const gy = Math.max(this.heightFn(sp.x, sp.z), 0);
        const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(sp.x, gy + 1.2, sp.z)
          .setLinearDamping(0.45)
          .setAngularDamping(0.6);
        const rb = this.world.createRigidBody(bodyDesc);
        const colDesc = sp.kind === 'ball'
          ? RAPIER.ColliderDesc.ball(0.55).setRestitution(0.75).setDensity(0.6)
          : RAPIER.ColliderDesc.cuboid(0.45, 0.45, 0.45).setRestitution(0.25).setDensity(1.2);
        this.world.createCollider(colDesc, rb);
        const mesh = new THREE.Mesh(sp.kind === 'ball' ? ballGeo : crateGeo, sp.kind === 'ball' ? ballMat : crateMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(sp.x, gy + 1.2, sp.z);
        this.scene.add(mesh);
        this.bodies.push({ rb, mesh, r: sp.kind === 'ball' ? 0.55 : 0.62 });
      }
      this.ready = true;
    } catch (e) {
      // Rapier optional fallback
    }
  }
  update(dt, playerPos, playerVelX, playerVelZ) {
    if (!this.ready || !this.world) return;
    const stepDt = Math.min(dt, 0.033);
    for (const b of this.bodies) {
      const t = b.rb.translation();
      const dx = t.x - playerPos.x, dz = t.z - playerPos.z;
      const dist = Math.hypot(dx, dz);
      if (dist < b.r + 0.85 && Math.abs(t.y - playerPos.y) < 2.2) {
        const nx = dist > 0.01 ? dx / dist : 1, nz = dist > 0.01 ? dz / dist : 0;
        const speed = Math.hypot(playerVelX, playerVelZ);
        const push = 0.28 + speed * 0.045;
        b.rb.applyImpulse({ x: nx * push, y: 0.14 + speed * 0.012, z: nz * push }, true);
      }
      const gy = Math.max(this.heightFn(t.x, t.z), 0);
      if (t.y < gy + b.r) {
        const v = b.rb.linvel();
        b.rb.setTranslation({ x: t.x, y: gy + b.r, z: t.z }, true);
        if (v.y < 0) b.rb.setLinvel({ x: v.x * 0.92, y: -v.y * 0.35, z: v.z * 0.92 }, true);
      }
    }
    this.world.timestep = stepDt;
    this.world.step();
    for (const b of this.bodies) {
      const p = b.rb.translation(), q = b.rb.rotation();
      b.mesh.position.set(p.x, p.y, p.z);
      b.mesh.quaternion.set(q.x, q.y, q.z, q.w);
    }
  }
}

export class TrailEffects9 {
  constructor(scene, heightFn) {
    this.scene = scene;
    this.heightFn = heightFn;
    this.items = [];
    this.stepTimer = 0;
    this.wakeTimer = 0;
    this.footGeo = new THREE.CircleGeometry(0.18, 8);
    this.footGeo.rotateX(-Math.PI / 2);
    this.footMat = new THREE.MeshBasicMaterial({ color: 0x9c8258, transparent: true, opacity: 0.36, depthWrite: false });
    this.wakeGeo = new THREE.RingGeometry(0.55, 0.95, 12);
    this.wakeGeo.rotateX(-Math.PI / 2);
    this.wakeMat = new THREE.MeshBasicMaterial({ color: 0xe6f4ff, transparent: true, opacity: 0.42, depthWrite: false });
  }
  update(dt, playerPos, faceYaw, pMoving, grounded, vehicle, tideY) {
    if (vehicle === 0 && grounded && pMoving) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.28;
        const gh = this.heightFn(playerPos.x, playerPos.z);
        if (gh > 0.25 && gh < 2.4) {
          const m = new THREE.Mesh(this.footGeo, this.footMat.clone());
          m.position.set(playerPos.x, gh + 0.04, playerPos.z);
          m.rotation.y = faceYaw;
          this.scene.add(m);
          this.items.push({ m, life: 4.5, maxLife: 4.5, grow: 0 });
        }
      }
    } else if (vehicle === 2 && pMoving) {
      this.wakeTimer -= dt;
      if (this.wakeTimer <= 0) {
        this.wakeTimer = 0.18;
        const m = new THREE.Mesh(this.wakeGeo, this.wakeMat.clone());
        m.position.set(playerPos.x - Math.sin(faceYaw) * 2.4, 0.22 + tideY, playerPos.z - Math.cos(faceYaw) * 2.4);
        this.scene.add(m);
        this.items.push({ m, life: 2.2, maxLife: 2.2, grow: 1.8 });
      }
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.life <= 0) {
        this.scene.remove(it.m);
        it.m.material.dispose();
        this.items.splice(i, 1);
      } else {
        const k = it.life / it.maxLife;
        it.m.material.opacity = k * (it.grow > 0 ? 0.42 : 0.34);
        if (it.grow > 0) it.m.scale.setScalar(1 + (1 - k) * it.grow);
      }
    }
    if (this.items.length > 48) {
      const old = this.items.shift();
      this.scene.remove(old.m);
      old.m.material.dispose();
    }
  }
}

export class SpatialAudio9 {
  constructor() {
    this.booted = false;
    this.nodes = [];
  }
  boot(actx, sources) {
    if (this.booted || !actx || !actx.listener) return;
    this.booted = true;
    try {
      for (const s of sources) {
        const panner = actx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = s.refDist || 8;
        panner.maxDistance = s.maxDist || 90;
        panner.rolloffFactor = 1.4;
        if (panner.positionX) {
          panner.positionX.value = s.x; panner.positionY.value = s.y; panner.positionZ.value = s.z;
        }
        const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        const src = actx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const filt = actx.createBiquadFilter();
        filt.type = s.type || 'bandpass';
        filt.frequency.value = s.freq || 600;
        const gain = actx.createGain();
        gain.gain.value = s.gain || 0.018;
        src.connect(filt).connect(gain).connect(panner).connect(actx.destination);
        src.start();
        this.nodes.push({ panner, gain, baseGain: s.gain || 0.018 });
      }
    } catch (e) {}
  }
  update(actx, camera, playerPos) {
    if (!this.booted || !actx || actx.state !== 'running') return;
    const L = actx.listener;
    if (L.positionX) {
      L.positionX.value = playerPos.x;
      L.positionY.value = playerPos.y + 1.6;
      L.positionZ.value = playerPos.z;
    }
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    if (L.forwardX) {
      L.forwardX.value = dir.x; L.forwardY.value = dir.y; L.forwardZ.value = dir.z;
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    }
  }
}

export function applyHumanSlopeIK9(playerRig, player, heightFn, pMoving, grounded, dt) {
  if (!playerRig || !playerRig.spine || !grounded) return;
  const fx = Math.sin(player.rotation.y) * 0.45, fz = Math.cos(player.rotation.y) * 0.45;
  const hF = heightFn(player.position.x + fx, player.position.z + fz);
  const hB = heightFn(player.position.x - fx, player.position.z - fz);
  const slopePitch = Math.max(-0.22, Math.min(0.22, (hF - hB) * 0.24));
  playerRig.spine.rotation.x += slopePitch * (pMoving ? 0.75 : 0.45);
}

export class CinematicCamAndHud9 {
  constructor() {
    this.idleT = 0;
    this.dimmed = false;
    this.hudEl = document.getElementById('hudRight');
    const wake = () => { this.idleT = 0; if (this.dimmed && this.hudEl) { this.dimmed = false; this.hudEl.style.opacity = '1'; } };
    addEventListener('pointermove', wake, { passive: true });
    addEventListener('keydown', wake, { passive: true });
  }
  update(dt, camera, speedMag, isMoving, modalOpen, bokehPass) {
    const targetFov = isMoving ? Math.min(68, 60 + speedMag * 0.16) : 60;
    if (Math.abs(camera.fov - targetFov) > 0.04) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
    }
    if (bokehPass && bokehPass.uniforms && bokehPass.uniforms.aperture) {
      bokehPass.enabled = modalOpen;
    }
    this.idleT += dt;
    if (this.hudEl) {
      this.hudEl.style.transition = 'opacity 0.6s ease';
      if (this.idleT > 12 && isMoving && !modalOpen && !this.dimmed) {
        this.dimmed = true;
        this.hudEl.style.opacity = '0.32';
      }
    }
  }
}

export class BiomeMoodSystem9 {
  constructor(scene, biomes) {
    this.scene = scene;
    this.biomes = biomes || [];
    this.curColor = new THREE.Color();
    this.curBiome = null;
    this.wLight = new THREE.PointLight(0xffe69c, 0, 48, 1.8);
    scene.add(this.wLight);
    const pGeo = new THREE.BufferGeometry();
    const pArr = new Float32Array(60 * 3);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      pArr[i * 3] = Math.cos(a) * (2.5 + (i % 5) * 1.4);
      pArr[i * 3 + 1] = (i % 10) * 1.2;
      pArr[i * 3 + 2] = Math.sin(a) * (2.5 + (i % 5) * 1.4);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
    this.motes = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffeaa8, size: 0.45, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.motes.frustumCulled = false;
    scene.add(this.motes);
  }
  update(t, dt, playerPos, skyCol, fog, bloomPass, onEnterBiome) {
    let best = null, bestW = 0;
    for (const b of this.biomes) {
      const d = Math.hypot(playerPos.x - b.x, playerPos.z - b.z);
      if (d < b.r) {
        const w = Math.pow(1 - d / b.r, 1.4);
        if (w > bestW) { bestW = w; best = b; }
      }
    }
    if (best && bestW > 0.25 && best.id !== this.curBiome) {
      this.curBiome = best.id;
      if (onEnterBiome) onEnterBiome(best);
    } else if (!best && this.curBiome) {
      this.curBiome = null;
    }
    if (best && bestW > 0.02) {
      this.curColor.setHex(best.fog);
      skyCol.lerp(this.curColor, bestW * 0.42);
      fog.color.copy(skyCol);
      this.scene.background.copy(skyCol);
      if (bloomPass) bloomPass.strength = 0.22 + bestW * (best.bloom || 0.25);
      this.motes.position.set(playerPos.x, playerPos.y, playerPos.z);
      this.motes.rotation.y = t * 0.25;
      this.motes.material.color.setHex(best.particle || 0xffeaa8);
      this.motes.material.opacity = bestW * 0.72;
      this.wLight.color.setHex(best.particle || 0xffeaa8);
      this.wLight.position.set(playerPos.x, playerPos.y + 4, playerPos.z);
      this.wLight.intensity = bestW * 3.5;
    } else {
      this.motes.material.opacity *= Math.exp(-dt * 3);
      this.wLight.intensity *= Math.exp(-dt * 3);
    }
  }
}

export function buildWeenieLandmarks9(scene, heightFn) {
  const grp = new THREE.Group();
  const rings = [];

  // 1. 苍穹水晶圣塔 (NW Highland Crest: -220, -240, ~135m 发光水晶尖塔 + 旋转符文环)
  const spX = -220, spZ = -240, spH = Math.max(heightFn(spX, spZ), 12);
  const spireM = new THREE.MeshPhysicalMaterial({ color: 0x6ce8ff, emissive: 0x1a78a8, emissiveIntensity: 0.65, roughness: 0.15, metalness: 0.2, clearcoat: 0.9, transparent: true, opacity: 0.88 });
  const spire = new THREE.Mesh(new THREE.OctahedronGeometry(12, 1), spireM);
  spire.scale.set(0.65, 5.2, 0.65); spire.position.set(spX, spH + 56, spZ); grp.add(spire);
  const beamM = new THREE.MeshBasicMaterial({ color: 0x9ef6ff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 9.5, 160, 12, 1, true), beamM);
  beam.position.set(spX, spH + 85, spZ); grp.add(beam);
  const ringM = new THREE.MeshStandardMaterial({ color: 0xffdf88, emissive: 0xd49b35, emissiveIntensity: 0.7, roughness: 0.28, metalness: 0.8 });
  for (let i = 0; i < 2; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(18 + i * 7, 0.9, 8, 36), ringM);
    r.position.set(spX, spH + 72 + i * 14, spZ);
    r.rotation.x = Math.PI * (0.35 + i * 0.25);
    grp.add(r);
    rings.push({ m: r, sx: 0.25 + i * 0.15, sy: 0.45 - i * 0.2 });
  }

  // 2. 远海星环之门 (SE Ocean Horizon: 460, 480, 90m 宏伟双环海上圣门)
  const gtX = 460, gtZ = 480;
  const gateM = new THREE.MeshStandardMaterial({ color: 0x3b4452, roughness: 0.55, metalness: 0.4 });
  const archO = new THREE.Mesh(new THREE.TorusGeometry(42, 3.6, 10, 48, Math.PI * 1.15), gateM);
  archO.position.set(gtX, 8, gtZ); archO.rotation.z = -0.22; archO.rotation.y = -0.6; grp.add(archO);
  const archI = new THREE.Mesh(new THREE.TorusGeometry(35, 1.4, 8, 48), new THREE.MeshBasicMaterial({ color: 0x7effc6, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending }));
  archI.position.set(gtX, 8, gtZ); archI.rotation.y = -0.6; grp.add(archI);
  rings.push({ m: archI, sx: 0.08, sy: 0.18 });

  // 3. 鲸背古代太阳浑天仪 (Central Crest: 110, -260, 65m 旋转金色天体仪)
  const asX = 110, asZ = -260, asH = Math.max(heightFn(asX, asZ), 10);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 18, 12), gateM);
  ped.position.set(asX, asH + 9, asZ); grp.add(ped);
  for (let i = 0; i < 3; i++) {
    const ar = new THREE.Mesh(new THREE.TorusGeometry(20 - i * 3.8, 0.85, 8, 36), ringM);
    ar.position.set(asX, asH + 38, asZ);
    ar.rotation.set(i * 0.6, i * 0.9, 0);
    grp.add(ar);
    rings.push({ m: ar, sx: 0.18 * (i % 2 ? 1 : -1), sy: 0.28 + i * 0.1 });
  }

  scene.add(grp);
  return {
    grp,
    update(t, dt) {
      for (const r of rings) { r.m.rotation.x += r.sx * dt; r.m.rotation.y += r.sy * dt; }
      spire.position.y = spH + 56 + Math.sin(t * 0.9) * 2.5;
      beamM.opacity = 0.12 + Math.sin(t * 1.4) * 0.05;
    }
  };
}

export class ImmersiveMode9 {
  constructor() {
    this.on = false;
    this.selectors = ['#hud', '#minimap', '#compass', '#hub-link'];
    addEventListener('keydown', e => {
      if (e.key === 'F1') { e.preventDefault(); this.toggle(); }
    });
  }
  toggle() {
    this.on = !this.on;
    for (const sel of this.selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.style.transition = 'opacity 0.45s ease';
        el.style.opacity = this.on ? '0' : '1';
        el.style.pointerEvents = this.on ? 'none' : '';
      }
    }
    const btn = document.getElementById('btnImmerse9');
    if (btn) btn.textContent = this.on ? '🖥️ 恢复UI' : '🌿 沉浸';
    return this.on;
  }
}

export class CityTraffic9 {
  constructor(scene, cx, cz, yBase) {
    this.cars = [];
    this.lights = [];
    const bodyCols = [0x263242, 0xb83a2e, 0xd8dce2, 0x1e2228, 0x3a6484, 0xc89a3c];
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.25, metalness: 0.6 });
    const headM = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
    const tailM = new THREE.MeshBasicMaterial({ color: 0xff2e2e });
    const wheelM = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.85 });

    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const bMat = new THREE.MeshPhysicalMaterial({ color: bodyCols[i % bodyCols.length], roughness: 0.24, metalness: 0.45, clearcoat: 0.88 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 4.2), bMat);
      body.position.y = 0.56; body.castShadow = true; g.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.58, 2.2), cabMat);
      cabin.position.set(0, 1.15, -0.15); g.add(cabin);
      for (const sx of [-0.72, 0.72]) {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), headM);
        hl.position.set(sx, 0.62, 2.11); g.add(hl);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), tailM);
        tl.position.set(sx, 0.62, -2.11); g.add(tl);
        for (const sz of [-1.25, 1.25]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), wheelM);
          w.rotation.z = Math.PI / 2; w.position.set(sx * 1.25, 0.32, sz); g.add(w);
        }
      }
      const beam = new THREE.SpotLight(0xfff0c8, 0, 26, 0.45, 0.5, 1.5);
      beam.position.set(0, 0.8, 2.1);
      const tgt = new THREE.Object3D(); tgt.position.set(0, 0.1, 14);
      g.add(beam); g.add(tgt); beam.target = tgt;
      this.lights.push(beam);

      const axis = i % 2; // 0: X-avenue, 1: Z-avenue
      const dir = i % 4 < 2 ? 1 : -1;
      const lane = dir * 4.5;
      const offset = -90 + (i * 33);
      g.position.set(axis === 0 ? cx + offset : cx + lane, yBase + 0.18, axis === 1 ? cz + offset : cz + lane);
      g.rotation.y = axis === 0 ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      scene.add(g);
      this.cars.push({ g, axis, dir, cx, cz, lane, pos: offset, spd: 11 + (i % 3) * 3.5 });
    }
  }
  update(dt, curDA) {
    const nightBoost = Math.max(0, 1 - curDA * 1.4);
    for (const l of this.lights) l.intensity = nightBoost * 16;
    for (const c of this.cars) {
      c.pos += c.dir * c.spd * dt;
      if (c.pos > 102) c.pos = -102;
      if (c.pos < -102) c.pos = 102;
      if (c.axis === 0) c.g.position.set(c.cx + c.pos, c.g.position.y, c.cz + c.lane);
      else c.g.position.set(c.cx + c.lane, c.g.position.y, c.cz + c.pos);
    }
  }
}

export class CityTowersFX9 {
  constructor(scene, cx, cz, yBase) {
    this.beacons = [];
    this.winMats = [];
    const bMat = new THREE.MeshBasicMaterial({ color: 0xff2828, transparent: true, opacity: 0.9 });
    const bGeo = new THREE.SphereGeometry(0.45, 8, 6);
    const locs = [
      [-55, -55, 62], [55, -55, 74], [-58, 52, 56], [56, 54, 82],
      [-82, -18, 48], [82, 22, 66], [24, -78, 58], [-22, 82, 60]
    ];
    for (let i = 0; i < locs.length; i++) {
      const [ox, oz, h] = locs[i];
      const m = new THREE.Mesh(bGeo, bMat.clone());
      m.position.set(cx + ox, yBase + h, cz + oz);
      scene.add(m);
      this.beacons.push({ m, ph: i * 0.9 });
    }
    // 视差感透光室内橱窗带 (贴合塔楼立面呈现温暖室内灯层)
    const wTexCv = document.createElement('canvas'); wTexCv.width = 128; wTexCv.height = 256;
    const wx = wTexCv.getContext('2d');
    wx.fillStyle = '#0c121a'; wx.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) {
      if ((r * 7 + c * 13) % 5 !== 0) {
        wx.fillStyle = ((r + c) % 3 === 0) ? '#ffdca0' : ((r * c) % 4 === 0 ? '#9ed8ff' : '#e8c47a');
        wx.fillRect(c * 16 + 3, r * 16 + 3, 10, 10);
        wx.fillStyle = 'rgba(0,0,0,0.32)';
        wx.fillRect(c * 16 + 3, r * 16 + 8, 10, 5);
      }
    }
    const wTex = new THREE.CanvasTexture(wTexCv);
    wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping;
    wTex.repeat.set(2, 4);
    const wMat = new THREE.MeshStandardMaterial({ map: wTex, emissiveMap: wTex, emissive: 0xffdf9e, emissiveIntensity: 0.65, roughness: 0.18, metalness: 0.6 });
    this.winMats.push(wMat);
    for (let i = 0; i < 4; i++) {
      const [ox, oz, h] = locs[i];
      const tw = new THREE.Mesh(new THREE.BoxGeometry(16.2, h * 0.85, 16.2), wMat);
      tw.position.set(cx + ox, yBase + h * 0.425, cz + oz);
      scene.add(tw);
    }
  }
  update(t, curDA) {
    const night = Math.max(0.15, 1 - curDA * 1.1);
    for (const m of this.winMats) m.emissiveIntensity = 0.25 + night * 0.95;
    for (const b of this.beacons) {
      const pulse = Math.sin(t * 3.4 + b.ph) > 0.35 ? 1 : 0.15;
      b.m.material.opacity = pulse;
      b.m.scale.setScalar(0.8 + pulse * 0.5);
    }
  }
}

export function buildArrakis9(scene, heightFn, cx, cz, boxObs = []) {
  const grp = new THREE.Group();
  const safeH = (x, z, min = 6) => {
    const v = typeof heightFn === 'function' ? heightFn(x, z) : min;
    return Number.isFinite(v) ? Math.max(v, min) : min;
  };
  const sandStoneM = new THREE.MeshStandardMaterial({ color: 0xc28f56, roughness: 0.78, metalness: 0.08 });
  const darkBasaltM = new THREE.MeshStandardMaterial({ color: 0x3b312a, roughness: 0.85, metalness: 0.1 });
  const spiceGlowM = new THREE.MeshBasicMaterial({ color: 0x4ad4ff, transparent: true, opacity: 0.82, blending: THREE.AdditiveBlending });

  // 0. 高精物理沙海覆盖层 (140x140 平滑沙丘网格 + 风成沙纹法线贴图 + 《风之旅人》微晶闪烁着色器)
  const rCv = document.createElement('canvas'); rCv.width = rCv.height = 256;
  const rCtx = rCv.getContext('2d');
  const rImg = rCtx.createImageData(256, 256);
  for (let py = 0; py < 256; py++) {
    for (let px = 0; px < 256; px++) {
      const u = (px / 256) * Math.PI * 2, v = (py / 256) * Math.PI * 2;
      const rip = Math.sin(u * 14 + Math.sin(v * 3) * 1.6) * 0.55 + Math.sin(u * 28 + v * 2) * 0.15;
      const grain = (Math.sin(px * 12.9898 + py * 78.233) * 43758.5453) % 1;
      const nx = Math.max(0, Math.min(255, Math.floor(128 + rip * 42 + (grain - 0.5) * 16)));
      const ny = Math.max(0, Math.min(255, Math.floor(128 + Math.cos(v * 3) * 14 + (grain - 0.5) * 16)));
      const idx = (py * 256 + px) * 4;
      rImg.data[idx] = nx; rImg.data[idx + 1] = ny; rImg.data[idx + 2] = 245; rImg.data[idx + 3] = 255;
    }
  }
  rCtx.putImageData(rImg, 0, 0);
  const rippleTex = new THREE.CanvasTexture(rCv);
  rippleTex.wrapS = rippleTex.wrapT = THREE.RepeatWrapping;
  rippleTex.repeat.set(34, 34);

  const duneSeg = 136, duneSpan = 280;
  const duneGeo = new THREE.PlaneGeometry(duneSpan, duneSpan, duneSeg, duneSeg);
  duneGeo.rotateX(-Math.PI / 2);
  const dPos = duneGeo.attributes.position;
  const dCol = new Float32Array(dPos.count * 3);
  const cCrest = new THREE.Color(0xebb464), cSlip = new THREE.Color(0xc87434), cBasalt = new THREE.Color(0x4a3b32);
  for (let i = 0; i < dPos.count; i++) {
    const lx = dPos.getX(i), lz = dPos.getZ(i);
    const wx = cx + lx, wz = cz + lz;
    const dist = Math.hypot(lx, lz);
    const gh = typeof heightFn === 'function' ? heightFn(wx, wz) : 0;
    const y = dist < 142 && gh > 0.4 ? gh + 0.12 : gh - 2.5;
    dPos.setY(i, y);
    const isWall = lz < -50 && gh > 20;
    const tCol = isWall ? cBasalt : cSlip.clone().lerp(cCrest, Math.max(0, Math.min(1, (gh - 5) / 14)));
    dCol[i * 3] = tCol.r; dCol[i * 3 + 1] = tCol.g; dCol[i * 3 + 2] = tCol.b;
  }
  duneGeo.setAttribute('color', new THREE.BufferAttribute(dCol, 3));
  duneGeo.computeVertexNormals();

  const sandMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    normalMap: rippleTex,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.88,
    metalness: 0.04
  });
  sandMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSandWPos;\nvarying vec3 vSandWNorm;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvSandWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvSandWNorm = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSandWPos;\nvarying vec3 vSandWNorm;')
      .replace('#include <dithering_fragment>', `
        vec3 sV = normalize(cameraPosition - vSandWPos);
        float rim = pow(1.0 - max(dot(normalize(vSandWNorm), sV), 0.0), 2.8);
        vec2 gCell = floor(vSandWPos.xz * 7.5);
        float gHash = fract(sin(dot(gCell, vec2(127.1, 311.7))) * 43758.5453);
        float glint = step(0.985, gHash) * pow(max(dot(reflect(-sV, normalize(vSandWNorm)), normalize(vec3(0.55, 0.72, 0.42))), 0.0), 10.0);
        gl_FragColor.rgb += vec3(1.0, 0.86, 0.56) * (rim * 0.14 + glint * 0.95);
        #include <dithering_fragment>
      `);
  };
  const duneMesh = new THREE.Mesh(duneGeo, sandMat);
  duneMesh.position.set(cx, 0, cz);
  duneMesh.receiveShadow = true;
  grp.add(duneMesh);

  // 1. 可进入的厄拉奇恩野兽派圣殿堡垒 (Enterable Arrakeen Brutalist Great Hall)
  const citX = cx, citZ = cz - 46, citH = safeH(citX, citZ, 21.5);
  const obsidianM = new THREE.MeshStandardMaterial({ color: 0x221d1a, roughness: 0.35, metalness: 0.45 });
  const hallW = 36, hallD = 36, wallH = 34, wallT = 4.2, doorHalf = 5.5;
  // 室内黑曜石抛光地面 + 南侧仪式入口长阶
  const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(hallW, 0.8, hallD), obsidianM);
  hallFloor.position.set(citX, citH - 0.15, citZ); hallFloor.receiveShadow = true; grp.add(hallFloor);
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2 + 4, 0.8, 12), darkBasaltM);
  ramp.position.set(citX, citH - 0.65, citZ + hallD / 2 + 5); ramp.rotation.x = 0.08; ramp.receiveShadow = true; grp.add(ramp);
  // 后墙（北）+ 东西侧倾斜巨墙 + 南侧双翼门墙（中间留 11m 宽可步入大门）
  const addCitWall = (wx, wy, wz, w, h, d, col = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), sandStoneM);
    m.position.set(wx, wy, wz); m.castShadow = true; m.receiveShadow = true; grp.add(m);
    if (col && boxObs) boxObs.push({ x1: wx - w / 2, z1: wz - d / 2, x2: wx + w / 2, z2: wz + d / 2 });
  };
  addCitWall(citX, citH + wallH / 2, citZ - hallD / 2, hallW + wallT, wallH, wallT); // 北墙
  for (const sgn of [-1, 1]) {
    addCitWall(citX + sgn * (hallW / 2), citH + wallH / 2, citZ, wallT, wallH, hallD); // 东/西墙
    const swW = (hallW - doorHalf * 2) / 2;
    addCitWall(citX + sgn * (doorHalf + swW / 2), citH + wallH / 2, citZ + hallD / 2, swW, wallH, wallT); // 南门两侧墙
    // 门框斜柱 + 发光香料竖幅
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5.2, wallH + 6, 4), darkBasaltM);
    pylon.rotation.y = Math.PI / 4; pylon.position.set(citX + sgn * (doorHalf + 2.2), citH + (wallH + 6) / 2, citZ + hallD / 2 + 2.2);
    pylon.castShadow = true; grp.add(pylon);
    const ban = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 22), spiceGlowM);
    ban.position.set(citX + sgn * (doorHalf + 5.5), citH + 17, citZ + hallD / 2 + 2.25); grp.add(ban);
    // 外侧野兽派斜翼堡 + 弗雷曼风阱蓄水塔 (Windtrap Towers)
    const wing = new THREE.Mesh(new THREE.CylinderGeometry(7, 13, 28, 4), darkBasaltM);
    wing.rotation.y = Math.PI / 4; wing.position.set(citX + sgn * 26, citH + 13, citZ + 6); wing.castShadow = true; grp.add(wing);
    const wt = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.6, 22, 8), darkBasaltM);
    wt.position.set(citX + sgn * 28, citH + 10, citZ - 14); wt.castShadow = true; grp.add(wt);
  }
  // 门楣横梁（15m 净高，人物可轻松步入）
  addCitWall(citX, citH + 15 + (wallH - 15) / 2, citZ + hallD / 2, doorHalf * 2 + 2, wallH - 15, wallT + 1.5, false);
  // 穹顶天窗框（Oculus Skylight: 四周封顶，中央留 14×14 采光井）
  const rSide = (hallW - 14) / 2;
  addCitWall(citX, citH + wallH, citZ - (7 + rSide / 2), hallW + 2, 2.4, rSide, false);
  addCitWall(citX, citH + wallH, citZ + (7 + rSide / 2), hallW + 2, 2.4, rSide, false);
  addCitWall(citX - (7 + rSide / 2), citH + wallH, citZ, rSide, 2.4, 14, false);
  addCitWall(citX + (7 + rSide / 2), citH + wallH, citZ, rSide, 2.4, 14, false);
  // 室内 6 根野兽派巨柱（带蓝晶导光槽）
  for (const sx of [-10.5, 10.5]) for (const sz of [-9, 0, 9]) {
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.85, wallH - 1, 6), darkBasaltM);
    colMesh.position.set(citX + sx, citH + wallH / 2, citZ + sz); colMesh.castShadow = true; grp.add(colMesh);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, wallH - 8, 0.28), spiceGlowM);
    strip.position.set(citX + sx * 0.88, citH + wallH / 2, citZ + sz); grp.add(strip);
    if (boxObs) boxObs.push({ x1: citX + sx - 1.6, z1: citZ + sz - 1.6, x2: citX + sx + 1.6, z2: citZ + sz + 1.6 });
  }
  // 穹顶体积光柱 + 室内暖金照明
  const shaftM = new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 11.5, wallH - 2, 12, 1, true), shaftM);
  shaft.position.set(citX, citH + wallH / 2, citZ); grp.add(shaft);
  const hallLight = new THREE.PointLight(0xffb868, 2.4, 48, 1.4);
  hallLight.position.set(citX, citH + 14, citZ); grp.add(hallLight);
  // 室内中央：厄崔迪全息香料星图祭坛 + 北侧王座高台
  const altar = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.0, 1.5, 8), darkBasaltM);
  altar.position.set(citX, citH + 0.9, citZ); grp.add(altar);
  const holoGlobe = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), new THREE.MeshBasicMaterial({ color: 0x58d8ff, wireframe: true, transparent: true, opacity: 0.78 }));
  holoGlobe.position.set(citX, citH + 3.4, citZ); grp.add(holoGlobe);
  const holoRing = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.08, 6, 32), spiceGlowM);
  holoRing.position.set(citX, citH + 3.4, citZ); holoRing.rotation.x = Math.PI / 2.4; grp.add(holoRing);
  const dais = new THREE.Mesh(new THREE.BoxGeometry(14, 1.6, 6), darkBasaltM);
  dais.position.set(citX, citH + 0.9, citZ - 13); grp.add(dais);
  const throne = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, 2.0), obsidianM);
  throne.position.set(citX, citH + 3.6, citZ - 14.2); grp.add(throne);
  const windTurbines = [];
  for (const sgn of [-1, 1]) {
    const turb = new THREE.Group();
    for (let bi = 0; bi < 4; bi++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 0.5), sandStoneM);
      blade.rotation.y = (bi / 4) * Math.PI * 2; turb.add(blade);
    }
    turb.position.set(citX + sgn * 28, citH + 22, citZ - 14);
    grp.add(turb); windTurbines.push(turb);
  }

  // 2. 振翼扑翼机 (Ornithopter)
  const thop = new THREE.Group();
  const thopM = new THREE.MeshPhysicalMaterial({ color: 0x5c5346, roughness: 0.35, metalness: 0.65, clearcoat: 0.5 });
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffb85c, roughness: 0.1, metalness: 0.2, clearcoat: 0.95, transparent: true, opacity: 0.85 });
  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 4.2, 6, 10), thopM);
  fuse.rotation.x = Math.PI / 2; fuse.scale.set(0.85, 1, 0.9); thop.add(fuse);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), glassM);
  canopy.scale.set(0.85, 0.72, 1.5); canopy.position.set(0, 0.45, 1.6); thop.add(canopy);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 5.2, 8), thopM);
  boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.25, -4.4); thop.add(boom);
  const thopWings = [];
  const wingGeo = new THREE.BoxGeometry(6.8, 0.06, 0.85);
  wingGeo.translate(3.4, 0, 0);
  for (const sx of [-1, 1]) for (const sz of [0.8, -0.6]) {
    const w = new THREE.Mesh(wingGeo, thopM);
    w.scale.x = sx; w.position.set(sx * 0.8, 0.55, sz);
    thop.add(w); thopWings.push({ m: w, sx, ph: sz });
  }
  const padX = cx + 22, padZ = cz + 4, padH = safeH(padX, padZ, 6);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(10, 11, 0.8, 16), darkBasaltM);
  pad.position.set(padX, padH + 0.3, padZ); pad.receiveShadow = true; grp.add(pad);
  thop.position.set(padX, padH + 4.0, padZ); thop.rotation.y = -0.6; grp.add(thop);

  // 3. 电影级连续无缝巨型沙虫 (Shai-Hulud: 48环连续可变形甲壳管躯 + 三瓣深喉晶牙巨口 + 破沙尘暴)
  const WORM_RINGS = 48, WORM_RAD = 18;
  const wormVertCount = WORM_RINGS * (WORM_RAD + 1);
  const wormPos = new Float32Array(wormVertCount * 3);
  const wormCol = new Float32Array(wormVertCount * 3);
  const wormIdx = [];
  const cPlate = new THREE.Color(0x936b44), cCrease = new THREE.Color(0x3f2b1b), cBelly = new THREE.Color(0xb48a5a);
  for (let i = 0; i < WORM_RINGS; i++) {
    const isCrease = (i % 2 === 1);
    const baseC = isCrease ? cCrease : cPlate;
    for (let j = 0; j <= WORM_RAD; j++) {
      const ang = (j / WORM_RAD) * Math.PI * 2;
      const bellyMix = Math.max(0, -Math.sin(ang)) * 0.35;
      const c = baseC.clone().lerp(cBelly, bellyMix);
      const vi = (i * (WORM_RAD + 1) + j) * 3;
      wormCol[vi] = c.r; wormCol[vi + 1] = c.g; wormCol[vi + 2] = c.b;
    }
    if (i < WORM_RINGS - 1) {
      for (let j = 0; j < WORM_RAD; j++) {
        const a = i * (WORM_RAD + 1) + j;
        const b = a + (WORM_RAD + 1);
        wormIdx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const wormGeo = new THREE.BufferGeometry();
  wormGeo.setAttribute('position', new THREE.BufferAttribute(wormPos, 3));
  wormGeo.setAttribute('color', new THREE.BufferAttribute(wormCol, 3));
  wormGeo.setIndex(wormIdx);
  const wormBodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.1, side: THREE.DoubleSide });
  const wormMesh = new THREE.Mesh(wormGeo, wormBodyMat);
  wormMesh.castShadow = true; wormMesh.receiveShadow = true; wormMesh.frustumCulled = false;
  grp.add(wormMesh);

  // 沙虫头部：三瓣外翻唇瓣 + 深邃漏斗咽喉 + 24枚向内弯曲晶牙（无缝衔接第0环）
  const wormHead = new THREE.Group();
  const wormRidgeM = new THREE.MeshStandardMaterial({ color: 0x4b3624, roughness: 0.88, metalness: 0.08 });
  const wormFleshM = new THREE.MeshStandardMaterial({ color: 0x6b3222, roughness: 0.75 });
  const toothM = new THREE.MeshStandardMaterial({ color: 0xf6eedb, emissive: 0x443828, emissiveIntensity: 0.25, roughness: 0.25, metalness: 0.15 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(4.9, 0.7, 8, 20), wormRidgeM);
  collar.position.z = 0.2; wormHead.add(collar);
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 0.9, 6.8, 18, 1, true), new THREE.MeshBasicMaterial({ color: 0x120604, side: THREE.BackSide }));
  funnel.rotation.x = Math.PI / 2; funnel.position.z = -1.6; wormHead.add(funnel);
  for (let li = 0; li < 3; li++) {
    const la = (li / 3) * Math.PI * 2 + Math.PI / 6;
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(2.8, 10, 8), wormFleshM);
    lobe.scale.set(1.2, 0.68, 1.4);
    lobe.position.set(Math.cos(la) * 3.3, Math.sin(la) * 3.3, 1.2);
    lobe.rotation.z = la + Math.PI / 2;
    wormHead.add(lobe);
  }
  for (let ti = 0; ti < 16; ti++) {
    const a = (ti / 16) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.25, 2.0, 5), toothM);
    tooth.position.set(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 1.45);
    tooth.rotation.z = a + Math.PI / 2; tooth.rotation.x = 0.72;
    wormHead.add(tooth);
  }
  for (let ti = 0; ti < 8; ti++) {
    const a = (ti / 8) * Math.PI * 2 + 0.2;
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.4, 4), toothM);
    tooth.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0.35);
    tooth.rotation.z = a + Math.PI / 2; tooth.rotation.x = 0.85;
    wormHead.add(tooth);
  }
  grp.add(wormHead);

  const wSpine = Array.from({ length: WORM_RINGS }, () => new THREE.Vector3());
  const wT = new THREE.Vector3(), wB = new THREE.Vector3(), wN = new THREE.Vector3(), wUp = new THREE.Vector3(0, 1, 0);

  // 3b. 破沙尘暴扬尘云 + 贴地流沙雾
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xdca560, transparent: true, opacity: 0.34, depthWrite: false });
  const sandPlumes = [];
  for (let i = 0; i < 14; i++) {
    const pm = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2 + (i % 3) * 1.1, 1), plumeMat);
    grp.add(pm);
    sandPlumes.push({ m: pm, ph: i * 0.45 });
  }
  const streakCount = 48;
  const streakGeo = new THREE.BufferGeometry();
  const streakPos = new Float32Array(streakCount * 3);
  for (let i = 0; i < streakCount; i++) {
    const a = (i / streakCount) * Math.PI * 2 * 3, r = 12 + (i % 12) * 10;
    const sx = cx + Math.cos(a) * r, sz = cz + Math.sin(a) * r;
    streakPos[i * 3] = sx; streakPos[i * 3 + 1] = safeH(sx, sz, 4) + 1.1; streakPos[i * 3 + 2] = sz;
  }
  streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPos, 3));
  const sandStreaks = new THREE.Points(streakGeo, new THREE.PointsMaterial({ color: 0xf2c888, size: 3.4, transparent: true, opacity: 0.28, depthWrite: false }));
  grp.add(sandStreaks);

  // 4. 香料矿脉涌泉 (Spice Melange Vents + 蓝晶簇)
  for (const [ox, oz] of [[-16, 12], [14, 14], [-26, -14], [30, -18]]) {
    const vh = safeH(cx + ox, cz + oz, 4);
    const vent = new THREE.Mesh(new THREE.CircleGeometry(4.5, 16), spiceGlowM);
    vent.rotation.x = -Math.PI / 2; vent.position.set(cx + ox, vh + 0.25, cz + oz);
    grp.add(vent);
    const spire = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), spiceGlowM);
    spire.scale.set(0.7, 2.2, 0.7); spire.position.set(cx + ox, vh + 1.8, cz + oz);
    grp.add(spire);
  }

  scene.add(grp);
  return {
    grp,
    update(t) {
      // 扑翼机悬停微振翼 + 圣殿全息星图与风阱叶轮旋转
      thop.position.y = padH + 4.0 + Math.sin(t * 2.2) * 0.45;
      for (const w of thopWings) {
        w.m.rotation.z = w.sx * Math.sin(t * 24 + w.ph) * 0.34;
      }
      holoGlobe.rotation.y = t * 0.45;
      holoRing.rotation.z = t * 0.7;
      for (const tb of windTurbines) tb.rotation.y = t * 1.4;
      // 沙虫在沙海连续破沙潜行跃动
      const baseA = t * 0.24;
      for (let i = 0; i < WORM_RINGS; i++) {
        const a = baseA - i * 0.038;
        const wr = 46 + Math.sin(a * 2.0) * 10;
        const wx = (cx - 18) + Math.cos(a) * wr, wz = (cz - 8) + Math.sin(a) * wr;
        const gh = safeH(wx, wz, 2);
        const arc = Math.sin(a * 2.5) * 9.5 + 3.0;
        wSpine[i].set(wx, gh + arc, wz);
      }
      const pAttr = wormGeo.attributes.position;
      for (let i = 0; i < WORM_RINGS; i++) {
        const prev = wSpine[Math.max(0, i - 1)];
        const next = wSpine[Math.min(WORM_RINGS - 1, i + 1)];
        wT.subVectors(prev, next).normalize();
        wB.crossVectors(wT, wUp);
        if (wB.lengthSq() < 1e-4) wB.set(1, 0, 0);
        wB.normalize();
        wN.crossVectors(wB, wT).normalize();
        const tNorm = i / (WORM_RINGS - 1);
        const taper = i === 0 ? 4.9 : Math.max(0.45, (5.35 - tNorm * 4.2) * (i === WORM_RINGS - 1 ? 0.35 : 1.0));
        const plateRipple = i % 2 === 0 ? 1.06 : 0.93;
        const baseR = taper * plateRipple;
        for (let j = 0; j <= WORM_RAD; j++) {
          const ang = (j / WORM_RAD) * Math.PI * 2;
          const dorsal = Math.max(0, Math.sin(ang)) * 0.26 * (1 - tNorm);
          const rad = baseR + dorsal;
          const ca = Math.cos(ang) * rad, sa = Math.sin(ang) * rad;
          const vi = i * (WORM_RAD + 1) + j;
          pAttr.setXYZ(vi,
            wSpine[i].x + wB.x * ca + wN.x * sa,
            wSpine[i].y + wB.y * ca + wN.y * sa,
            wSpine[i].z + wB.z * ca + wN.z * sa
          );
        }
      }
      pAttr.needsUpdate = true;
      wormGeo.computeVertexNormals();
      wormHead.position.copy(wSpine[0]);
      wT.subVectors(wSpine[0], wSpine[1]).normalize();
      wormHead.lookAt(wSpine[0].x + wT.x, wSpine[0].y + wT.y, wSpine[0].z + wT.z);
      // 破沙扬尘随沙虫头部与中段翻涌
      const headPos = wSpine[0];
      const headGh = safeH(headPos.x, headPos.z, 2);
      for (let i = 0; i < sandPlumes.length; i++) {
        const p = sandPlumes[i];
        const cycle = (t * 1.4 + p.ph) % 1;
        const ang = i * 0.9 + t * 0.8;
        const rad = 3.5 + cycle * 9.5;
        p.m.position.set(headPos.x + Math.cos(ang) * rad, headGh + 1.2 + cycle * 6.5, headPos.z + Math.sin(ang) * rad);
        const sc = (1 - cycle) * 1.4 + 0.3;
        p.m.scale.setScalar(sc);
      }
      // 贴地风沙顺风飘移
      const sp = streakGeo.attributes.position;
      for (let i = 0; i < streakCount; i++) {
        let sx = sp.getX(i) + 0.14;
        let sz = sp.getZ(i) + 0.08;
        if (Math.hypot(sx - cx, sz - cz) > 135) {
          sx = cx - 90 + ((i * 37) % 180);
          sz = cz - 90 + ((i * 53) % 180);
        }
        sp.setXYZ(i, sx, safeH(sx, sz, 4) + 1.1 + Math.sin(t * 2 + i) * 0.4, sz);
      }
      sp.needsUpdate = true;
    }
  };
}

function keepInDeepWater9(heightFn, x, z, minDepth = 3.2) {
  if (typeof heightFn !== 'function') return { x, z };
  let px = x, pz = z;
  for (let step = 0; step < 12; step++) {
    const h = heightFn(px, pz);
    if (h <= -minDepth) break;
    const gx = heightFn(px + 5, pz) - heightFn(px - 5, pz);
    const gz = heightFn(px, pz + 5) - heightFn(px, pz - 5);
    const gl = Math.hypot(gx, gz);
    if (gl > 0.05) {
      px -= (gx / gl) * 7.5;
      pz -= (gz / gl) * 7.5;
    } else {
      const rl = Math.hypot(px, pz) || 1;
      px += (px / rl) * 7.5;
      pz += (pz / rl) * 7.5;
    }
  }
  return { x: px, z: pz };
}

export class OceanWhales9 {
  constructor(scene, heightFn = null) {
    this.heightFn = heightFn;
    this.grp = new THREE.Group();
    this.whales = [];
    const specs = [
      // 1. 蓝鲸 (Blue Whale: 28m 长，深蓝灰背部+浅灰腹沟+小镰刀背鳍+高大喷水柱)
      { kind: 'blue', cx: 340, cz: 420, r: 58, sp: 0.14, len: 28, rad: 3.1, breach: false, spout: true },
      // 2. 座头鲸 (Humpback Whale: 16m 长，超长白色瘤状胸鳍+周期性跃出海面 Breaching)
      { kind: 'humpback', cx: -280, cz: 400, r: 44, sp: 0.22, len: 16, rad: 2.3, breach: true, spout: true },
      // 3. 虎鲸双鲸群 (Orca Pod × 2: 黑白分明+眼后白斑+高耸镰刀背鳍)
      { kind: 'orca', cx: -440, cz: 230, r: 34, sp: 0.34, len: 9.5, rad: 1.55, phase: 0, breach: false, spout: false },
      { kind: 'orca', cx: -440, cz: 230, r: 30, sp: 0.34, len: 8.2, rad: 1.35, phase: 0.55, breach: false, spout: false },
      // 4. 独角鲸 (Narwhal: 北方冷水海域，银白斑驳皮肤+螺旋长牙)
      { kind: 'narwhal', cx: -410, cz: -540, r: 32, sp: 0.26, len: 7.4, rad: 1.25, breach: false, spout: false },
    ];
    for (const s of specs) {
      this.whales.push(this._makeWhale(s));
    }
    scene.add(this.grp);
  }

  _makeWhale(s) {
    const wg = new THREE.Group();
    const RINGS = 26, RAD = 16;
    const pos = new Float32Array(RINGS * (RAD + 1) * 3);
    const basePos = new Float32Array(RINGS * (RAD + 1) * 3);
    const col = new Float32Array(RINGS * (RAD + 1) * 3);
    const idx = [];

    const cTop = new THREE.Color(
      s.kind === 'blue' ? 0x2f5373 : s.kind === 'humpback' ? 0x1e242b : s.kind === 'orca' ? 0x101318 : 0x708496
    );
    const cBelly = new THREE.Color(
      s.kind === 'blue' ? 0x7c9eb8 : s.kind === 'humpback' ? 0xdce4ea : s.kind === 'orca' ? 0xf6f8fa : 0xdbe3e8
    );
    const cWhite = new THREE.Color(0xf6f8fa);

    for (let i = 0; i < RINGS; i++) {
      const u = i / (RINGS - 1); // 0 = 吻端(front +Z), 1 = 尾柄(back -Z)
      const z = (0.5 - u) * s.len;
      // 真实鲸类流线轮廓：头部饱满微扁，中段宽厚，后半部收细至尾柄
      const profile = u < 0.22
        ? Math.pow(Math.sin((u / 0.22) * (Math.PI / 2)), 0.72)
        : Math.pow(Math.cos(((u - 0.22) / 0.78) * (Math.PI / 2)), 1.25);
      const rx = s.rad * Math.max(0.08, profile) * (s.kind === 'blue' ? 0.92 : 1.0);
      const ry = s.rad * Math.max(0.08, profile) * (u < 0.2 ? 0.78 : 0.95);

      for (let j = 0; j <= RAD; j++) {
        const ang = (j / RAD) * Math.PI * 2;
        const ca = Math.cos(ang), sa = Math.sin(ang);
        const vi = (i * (RAD + 1) + j) * 3;
        const px = ca * rx, py = sa * ry;
        pos[vi] = basePos[vi] = px;
        pos[vi + 1] = basePos[vi + 1] = py;
        pos[vi + 2] = basePos[vi + 2] = z;

        // 物种精准涂装
        let vc = cTop.clone();
        if (sa < -0.15) vc.lerp(cBelly, Math.min(1, (-sa - 0.15) * 1.4));
        if (s.kind === 'orca') {
          // 虎鲸眼后白斑 + 背后灰白鞍斑
          if (u > 0.10 && u < 0.21 && sa > 0.05 && Math.abs(ca) > 0.55) vc.copy(cWhite);
          if (u > 0.42 && u < 0.56 && sa > 0.35) vc.lerp(cWhite, 0.72);
        } else if (s.kind === 'blue' && sa < -0.2 && u < 0.55) {
          // 蓝鲸腹褶沟条纹感
          if (j % 2 === 0) vc.multiplyScalar(0.86);
        } else if (s.kind === 'narwhal' && ((i + j) % 3 === 0)) {
          vc.lerp(cWhite, 0.45);
        }
        col[vi] = vc.r; col[vi + 1] = vc.g; col[vi + 2] = vc.b;
      }
      if (i < RINGS - 1) {
        for (let j = 0; j < RAD; j++) {
          const a = i * (RAD + 1) + j, b = a + (RAD + 1);
          idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const skinMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.24, metalness: 0.05, clearcoat: 0.92, clearcoatRoughness: 0.08
    });
    const bodyMesh = new THREE.Mesh(geo, skinMat);
    bodyMesh.castShadow = true; bodyMesh.receiveShadow = true;
    wg.add(bodyMesh);

    // 胸鳍 (座头鲸标志性超长白胸鳍)
    const finLen = s.kind === 'humpback' ? s.len * 0.33 : s.len * 0.18;
    const finMat = new THREE.MeshPhysicalMaterial({
      color: s.kind === 'humpback' ? 0xeef2f5 : cTop.getHex(), roughness: 0.28, clearcoat: 0.85
    });
    for (const sgn of [-1, 1]) {
      const fGeo = new THREE.ConeGeometry(s.rad * 0.34, finLen, 6);
      fGeo.scale(0.28, 1, 0.65);
      const fin = new THREE.Mesh(fGeo, finMat);
      fin.position.set(sgn * (s.rad * 0.85 + finLen * 0.32), -s.rad * 0.35, s.len * 0.16);
      fin.rotation.set(0.25, -sgn * 0.35, sgn * 1.18);
      wg.add(fin);
    }

    // 背鳍 (虎鲸高耸直立镰刀鳍 / 蓝鲸小背鳍 / 座头鲸驼峰背鳍)
    if (s.kind !== 'narwhal') {
      const dH = s.kind === 'orca' ? s.rad * 1.55 : s.kind === 'humpback' ? s.rad * 0.48 : s.rad * 0.32;
      const dGeo = new THREE.ConeGeometry(s.rad * 0.32, dH, 5);
      dGeo.scale(0.24, 1, 0.9);
      const dorsal = new THREE.Mesh(dGeo, new THREE.MeshPhysicalMaterial({ color: cTop.getHex(), roughness: 0.25, clearcoat: 0.85 }));
      dorsal.position.set(0, s.rad * 0.85 + dH * 0.35, -s.len * 0.05);
      dorsal.rotation.x = -0.35;
      wg.add(dorsal);
    }

    // 独角鲸螺旋长牙
    if (s.kind === 'narwhal') {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.11, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0xf4ecd4, roughness: 0.35 }));
      tusk.rotation.x = Math.PI / 2;
      tusk.position.set(0, 0.05, s.len * 0.5 + 1.25);
      wg.add(tusk);
    }

    // 水平新月尾鳍 (随尾柄同步实时波动)
    const flukeGrp = new THREE.Group();
    const flW = s.rad * 1.65;
    for (const sgn of [-1, 1]) {
      const flGeo = new THREE.ConeGeometry(s.rad * 0.42, flW, 6);
      flGeo.scale(1, 1, 0.22);
      const fl = new THREE.Mesh(flGeo, skinMat);
      fl.position.set(sgn * flW * 0.42, 0, -s.len * 0.5 - 0.15);
      fl.rotation.set(0, sgn * 0.48, -sgn * Math.PI / 2);
      flukeGrp.add(fl);
    }
    wg.add(flukeGrp);

    // 呼吸孔喷水柱
    let spout = null;
    if (s.spout) {
      spout = new THREE.Mesh(
        new THREE.ConeGeometry(s.rad * 0.45, s.rad * 3.2, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xe6f8ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
      );
      spout.rotation.x = Math.PI;
      spout.position.set(0, s.rad * 2.1, s.len * 0.28);
      wg.add(spout);
    }

    this.grp.add(wg);
    return { s, wg, geo, basePos, RINGS, RAD, flukeGrp, spout };
  }

  update(t) {
    for (const w of this.whales) {
      const { s, wg, geo, basePos, RINGS, RAD, flukeGrp, spout } = w;
      const a = t * s.sp + (s.phase || 0);
      const pSafe = keepInDeepWater9(this.heightFn, s.cx + Math.cos(a) * s.r, s.cz + Math.sin(a) * s.r, Math.max(3.6, s.rad * 1.4));
      const wx = pSafe.x, wz = pSafe.z;
      // 跃水与上浮周期
      let wy = -1.6 + Math.sin(t * 0.55 + (s.phase || 0)) * 1.4;
      let pitch = Math.cos(t * 0.55 + (s.phase || 0)) * 0.12;
      if (s.breach) {
        const bCycle = (t * 0.12) % 1;
        if (bCycle < 0.28) {
          const bp = Math.sin((bCycle / 0.28) * Math.PI);
          wy = -2.0 + bp * 9.5;
          pitch = Math.cos((bCycle / 0.28) * Math.PI) * 0.55;
        }
      }
      wg.position.set(wx, wy, wz);
      const nSafe = keepInDeepWater9(this.heightFn, s.cx + Math.cos(a + 0.05) * s.r, s.cz + Math.sin(a + 0.05) * s.r, Math.max(3.6, s.rad * 1.4));
      wg.lookAt(nSafe.x, wy, nSafe.z);
      wg.rotateX(pitch);

      // 连续软体尾柄波浪摆动
      const pAttr = geo.attributes.position;
      const wavePhase = t * (s.kind === 'orca' ? 3.8 : 2.3) + (s.phase || 0);
      for (let i = 0; i < RINGS; i++) {
        const u = i / (RINGS - 1);
        const bend = u > 0.45 ? Math.pow((u - 0.45) / 0.55, 1.7) * Math.sin(wavePhase - u * 2.4) * (s.rad * 0.68) : 0;
        for (let j = 0; j <= RAD; j++) {
          const vi = i * (RAD + 1) + j;
          pAttr.setY(vi, basePos[vi * 3 + 1] + bend);
        }
      }
      pAttr.needsUpdate = true;
      const tailBend = Math.sin(wavePhase - 2.4) * (s.rad * 0.68);
      flukeGrp.position.y = tailBend;
      flukeGrp.rotation.x = Math.cos(wavePhase - 2.4) * 0.35;

      if (spout) {
        const spOp = wy > -1.0 ? Math.max(0, Math.sin(t * 1.5)) * 0.55 : 0;
        spout.material.opacity = spOp;
        spout.scale.setScalar(0.8 + spOp * 0.7);
      }
    }
  }
}

export class SkyCityFX9 {
  constructor(scene, skyPos) {
    this.grp = new THREE.Group();
    this.grp.position.set(skyPos.x, skyPos.y, skyPos.z);
    this.rings = [];
    this.mixers = [];
    this.birds = [];

    // 1. 岛底飞行石反重力光锥 + 三重旋转符文能量环
    const beamMat = new THREE.MeshBasicMaterial({ color: 0x6ce8ff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(8, 32, 90, 16, 1, true), beamMat);
    beam.position.y = -48; this.grp.add(beam);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0x26a8d8, emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(11 + i * 5.5, 0.45, 8, 36), ringMat);
      r.position.y = -54 + i * 4;
      r.rotation.x = Math.PI / 2 + (i - 1) * 0.25;
      this.grp.add(r);
      this.rings.push({ m: r, sx: 0.22 * (i % 2 ? 1 : -1), sy: 0.45 + i * 0.12 });
    }

    // 2. 中央穹顶金色浑天观测仪 + 四风塔飞行石灯标
    const armMat = new THREE.MeshStandardMaterial({ color: 0xffd56b, emissive: 0xc88a24, emissiveIntensity: 0.4, roughness: 0.22, metalness: 0.88 });
    for (let i = 0; i < 2; i++) {
      const ar = new THREE.Mesh(new THREE.TorusGeometry(4.2 - i * 0.9, 0.18, 6, 28), armMat);
      ar.position.set(0, 18.5, -8); ar.rotation.set(i * 0.7, i * 1.1, 0);
      this.grp.add(ar);
      this.rings.push({ m: ar, sx: 0.35, sy: 0.55 - i * 0.2 });
    }
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x7ef2ff, fog: false });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const b = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), beaconMat);
      b.position.set(Math.cos(a) * 34, 20.5, Math.sin(a) * 34);
      this.grp.add(b);
      this.rings.push({ m: b, sx: 0, sy: 1.2 });
    }

    // 3. 东缘瀑布水雾云团
    this.mist = [];
    const mistMat = new THREE.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.28, depthWrite: false });
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(2.8 + (i % 3), 8, 6), mistMat);
      m.position.set(skyPos.r - 1.5, -10 - i * 8, (i % 2 ? 4 : -4));
      this.grp.add(m);
      this.mist.push({ m, ph: i * 0.8, y0: -10 - i * 8 });
    }

    // 4. 真实骨骼动画飞鸟绕天空之城盘旋 (Stork.glb + Flamingo.glb)
    const loader = new GLTFLoader();
    ['./assets/models/Stork.glb', './assets/models/Flamingo.glb'].forEach((url, ui) => {
      loader.load(url, gltf => {
        if (!gltf.scene) return;
        for (let k = 0; k < 3; k++) {
          const b = SkeletonUtils.clone(gltf.scene);
          b.scale.setScalar(0.032);
          this.grp.add(b);
          const ang = (ui * 3 + k) * (Math.PI * 2 / 6);
          this.birds.push({ m: b, r: 46 + k * 7, y: 20 + k * 4.5, sp: 0.28 + ui * 0.06, ph: ang });
          if (gltf.animations && gltf.animations[0]) {
            const mx = new THREE.AnimationMixer(b);
            mx.clipAction(gltf.animations[0]).startAt(k * 0.25).play();
            this.mixers.push(mx);
          }
        }
      }, undefined, () => {});
    });

    scene.add(this.grp);
  }
  update(t, dt) {
    for (const r of this.rings) { r.m.rotation.x += r.sx * dt; r.m.rotation.y += r.sy * dt; }
    for (const ms of this.mist) {
      ms.m.position.y = ms.y0 - ((t * 6 + ms.ph) % 12);
      ms.m.scale.setScalar(0.9 + Math.sin(t * 2 + ms.ph) * 0.25);
    }
    for (const b of this.birds) {
      const a = t * b.sp + b.ph;
      const x = Math.cos(a) * b.r, z = Math.sin(a) * b.r, y = b.y + Math.sin(t * 1.4 + b.ph) * 1.8;
      b.m.position.set(x, y, z);
      b.m.lookAt(Math.cos(a + 0.05) * b.r, y, Math.sin(a + 0.05) * b.r);
    }
    for (const mx of this.mixers) mx.update(dt);
  }
}

export class CoastalBirds9 {
  constructor(scene) {
    this.grp = new THREE.Group();
    this.flocks = [];
    this.mixers = [];
    const loader = new GLTFLoader();
    const specs = [
      // 热带彩鹦鹉群 (主岛植物园与广场低空穿梭)
      { url: './assets/models/Parrot.glb', count: 8, cx: 40, cz: 30, y: 16, r: 65, sp: 0.42, sc: 0.036 },
      // 海岸白鹳群 (主岛西海岸与灯塔屿跨海大桥低空滑翔)
      { url: './assets/models/Stork.glb', count: 6, cx: -320, cz: -140, y: 24, r: 95, sp: 0.26, sc: 0.038 },
      // 碧湾火烈鸟群 (南湾浅滩盘旋)
      { url: './assets/models/Flamingo.glb', count: 6, cx: 140, cz: 360, y: 20, r: 75, sp: 0.30, sc: 0.035 },
    ];
    for (const sp of specs) {
      loader.load(sp.url, gltf => {
        if (!gltf.scene) return;
        for (let i = 0; i < sp.count; i++) {
          const b = SkeletonUtils.clone(gltf.scene);
          b.scale.setScalar(sp.sc);
          this.grp.add(b);
          const ph = (i / sp.count) * Math.PI * 2;
          this.flocks.push({ m: b, cx: sp.cx, cz: sp.cz, r: sp.r + (i % 3) * 14, y: sp.y + (i % 3) * 4, sp: sp.sp, ph });
          if (gltf.animations && gltf.animations[0]) {
            const mx = new THREE.AnimationMixer(b);
            mx.clipAction(gltf.animations[0]).startAt(i * 0.18).play();
            this.mixers.push(mx);
          }
        }
      }, undefined, () => {});
    }
    scene.add(this.grp);
  }
  update(t, dt) {
    for (const f of this.flocks) {
      const a = t * f.sp + f.ph;
      const x = f.cx + Math.cos(a) * f.r, z = f.cz + Math.sin(a) * f.r;
      const y = f.y + Math.sin(t * 1.6 + f.ph) * 2.2;
      f.m.position.set(x, y, z);
      f.m.lookAt(f.cx + Math.cos(a + 0.05) * f.r, y, f.cz + Math.sin(a + 0.05) * f.r);
    }
    for (const mx of this.mixers) mx.update(dt);
  }
}

export class OceanMarineLife9 {
  constructor(scene, heightFn = null) {
    this.heightFn = heightFn;
    this.grp = new THREE.Group();
    this.creatures = [];
    this.mixers = [];
    this.sharks = [];

    // 1. 外部真实骨骼模型：大白鲨/礁鲨 (BabylonJS/MeshesLibrary shark.glb × 3)
    new GLTFLoader().load('./assets/models/shark.glb', gltf => {
      if (!gltf.scene) return;
      const sharkSpots = [
        { cx: -290, cz: 290, r: 44, sp: 0.32, y: -1.8, ph: 0 },
        { cx: 320, cz: 410, r: 48, sp: 0.28, y: -2.0, ph: 2.1 },
        { cx: -410, cz: 200, r: 36, sp: 0.35, y: -1.6, ph: 4.2 },
      ];
      for (const sp of sharkSpots) {
        const m = SkeletonUtils.clone(gltf.scene);
        const box = new THREE.Box3().setFromObject(m);
        const sz = box.getSize(new THREE.Vector3());
        const norm = 7.5 / Math.max(sz.x, sz.y, sz.z, 0.01);
        m.scale.setScalar(norm);
        this.grp.add(m);
        this.sharks.push({ m, cx: sp.cx, cz: sp.cz, r: sp.r, sp: sp.sp, y: sp.y, ph: sp.ph });
        if (gltf.animations && gltf.animations[0]) {
          const mx = new THREE.AnimationMixer(m);
          mx.clipAction(gltf.animations[0]).play();
          this.mixers.push(mx);
        }
      }
    }, undefined, () => {});

    // 2. 巨型蝠鲼 / 魔鬼鱼 (Manta Ray × 3)
    const mantaMat = new THREE.MeshPhysicalMaterial({ color: 0x1a2634, roughness: 0.25, clearcoat: 0.9 });
    const mantaBellyMat = new THREE.MeshPhysicalMaterial({ color: 0xdce6ec, roughness: 0.3, clearcoat: 0.8 });
    for (let i = 0; i < 3; i++) {
      const mg = new THREE.Group();
      const wings = [];
      for (const sgn of [-1, 1]) {
        const wg = new THREE.ConeGeometry(2.6, 4.4, 4);
        wg.scale(0.16, 1, 0.85);
        wg.translate(0, 2.1, 0);
        const wm = new THREE.Mesh(wg, mantaMat);
        wm.rotation.z = -sgn * Math.PI / 2;
        mg.add(wm); wings.push({ m: wm, sgn });
      }
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.14, 4.5, 5), mantaBellyMat);
      tail.rotation.x = Math.PI / 2; tail.position.z = -2.8; mg.add(tail);
      this.grp.add(mg);
      this.creatures.push({ kind: 'manta', m: mg, wings, cx: i < 2 ? -240 : 200, cz: 300 + i * 25, r: 28 + i * 8, sp: 0.36, ph: i * 2.1, y: -1.4 });
    }

    // 3. 绿海龟 (Sea Turtle × 4)
    const shellMat = new THREE.MeshPhysicalMaterial({ color: 0x3b633c, roughness: 0.42, clearcoat: 0.65 });
    const tSkinMat = new THREE.MeshStandardMaterial({ color: 0x728a52, roughness: 0.55 });
    for (let i = 0; i < 4; i++) {
      const tg = new THREE.Group();
      const shell = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
      shell.scale.set(1.0, 0.55, 1.3); tg.add(shell);
      const tHead = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), tSkinMat);
      tHead.scale.set(0.9, 0.8, 1.25); tHead.position.set(0, 0.12, 1.45); tg.add(tHead);
      const flippers = [];
      for (const sgn of [-1, 1]) {
        const fl = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.45), tSkinMat);
        fl.position.set(sgn * 1.15, 0.05, 0.55); tg.add(fl); flippers.push({ m: fl, sgn });
      }
      this.grp.add(tg);
      this.creatures.push({ kind: 'turtle', m: tg, flippers, cx: i < 2 ? -140 : 140, cz: 345, r: 22 + i * 6, sp: 0.28, ph: i * 1.6, y: -0.9 });
    }

    // 4. 宽吻海豚跃浪群 (Bottlenose Dolphins × 4)
    const dolMat = new THREE.MeshPhysicalMaterial({ color: 0x4d748e, roughness: 0.18, clearcoat: 0.94 });
    for (let i = 0; i < 4; i++) {
      const dg = new THREE.Group();
      const dBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.48, 2.4, 8, 12), dolMat);
      dBody.rotation.x = Math.PI / 2; dg.add(dBody);
      const snout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), dolMat);
      snout.rotation.x = Math.PI / 2; snout.position.z = 1.75; dg.add(snout);
      const dFin = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.7, 4), dolMat);
      dFin.scale.set(0.3, 1, 0.8); dFin.position.set(0, 0.62, -0.1); dFin.rotation.x = -0.35; dg.add(dFin);
      const dFluke = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.45), dolMat);
      dFluke.position.z = -1.65; dg.add(dFluke);
      this.grp.add(dg);
      this.creatures.push({ kind: 'dolphin', m: dg, cx: -200, cz: 310, r: 26 + (i % 2) * 5, sp: 0.52, ph: i * 0.45, y: -0.7 });
    }

    // 5. 巨型章鱼 (Giant Octopus × 2)
    const octMat = new THREE.MeshPhysicalMaterial({ color: 0xb8463a, roughness: 0.28, clearcoat: 0.85 });
    for (let i = 0; i < 2; i++) {
      const og = new THREE.Group();
      const mantle = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 10), octMat);
      mantle.scale.set(0.95, 1.35, 0.95); mantle.position.y = 1.1; og.add(mantle);
      const arms = [];
      for (let ai = 0; ai < 8; ai++) {
        const aa = (ai / 8) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.ConeGeometry(0.22, 3.4, 6), octMat);
        arm.position.set(Math.cos(aa) * 1.1, -0.8, Math.sin(aa) * 1.1);
        arm.rotation.z = -Math.cos(aa) * 0.65; arm.rotation.x = Math.sin(aa) * 0.65;
        og.add(arm); arms.push({ m: arm, aa });
      }
      this.grp.add(og);
      this.creatures.push({ kind: 'octopus', m: og, arms, cx: i === 0 ? -310 : 290, cz: 265, r: 16, sp: 0.22, ph: i * 3.1, y: -1.6 });
    }

    // 6. 双髻鲨 (Hammerhead Shark × 2)
    const hamMat = new THREE.MeshPhysicalMaterial({ color: 0x5c6874, roughness: 0.24, clearcoat: 0.9 });
    for (let i = 0; i < 2; i++) {
      const hg = new THREE.Group();
      const hBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 3.6, 8, 12), hamMat);
      hBody.rotation.x = Math.PI / 2; hg.add(hBody);
      const hammer = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.26, 0.52), hamMat);
      hammer.position.set(0, 0.05, 2.1); hg.add(hammer);
      const hFin = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.15, 4), hamMat);
      hFin.scale.set(0.25, 1, 0.8); hFin.position.set(0, 0.78, 0.1); hFin.rotation.x = -0.35; hg.add(hFin);
      this.grp.add(hg);
      this.creatures.push({ kind: 'hammer', m: hg, cx: 380, cz: 320, r: 26 + i * 8, sp: 0.38, ph: i * 2.8, y: -1.5 });
    }

    // 7. 皇带鱼 (Giant Oarfish × 2)
    const oarMat = new THREE.MeshPhysicalMaterial({ color: 0xc8d8e6, roughness: 0.18, metalness: 0.5, clearcoat: 0.9 });
    const crestMat = new THREE.MeshBasicMaterial({ color: 0xe63b3b });
    for (let i = 0; i < 2; i++) {
      const og = new THREE.Group();
      const segs = [];
      for (let si = 0; si < 12; si++) {
        const sm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95 - si * 0.06, 1.05), oarMat);
        sm.position.z = -si * 0.95; og.add(sm); segs.push(sm);
      }
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 4), crestMat);
      cr.position.set(0, 0.75, 0.2); cr.rotation.x = -0.3; og.add(cr);
      this.grp.add(og);
      this.creatures.push({ kind: 'oarfish', m: og, segs, cx: -310, cz: 360, r: 24 + i * 8, sp: 0.30, ph: i * 3.1, y: -1.7 });
    }

    // 8. 发光海月水母群 (Bioluminescent Jellyfish × 10)
    const jMat = new THREE.MeshBasicMaterial({ color: 0x9ef0ff, transparent: true, opacity: 0.62, fog: false });
    for (let i = 0; i < 10; i++) {
      const j = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), jMat);
      const rawX = (i < 5 ? -260 : 300) + (i % 5 - 2) * 10;
      const rawZ = (i < 5 ? 310 : 410) + ((i % 3) - 1) * 9;
      const safeJ = keepInDeepWater9(this.heightFn, rawX, rawZ, 2.2);
      j.position.set(safeJ.x, -1.6 - (i % 2) * 0.5, safeJ.z);
      this.grp.add(j);
      this.creatures.push({ kind: 'jelly', m: j, y0: j.position.y, ph: i * 0.85 });
    }

    scene.add(this.grp);
  }

  update(t, dt) {
    for (const mx of this.mixers) mx.update(dt);
    for (const sh of this.sharks) {
      const a = t * sh.sp + sh.ph;
      const pSafe = keepInDeepWater9(this.heightFn, sh.cx + Math.cos(a) * sh.r, sh.cz + Math.sin(a) * sh.r, 3.0);
      const nSafe = keepInDeepWater9(this.heightFn, sh.cx + Math.cos(a + 0.05) * sh.r, sh.cz + Math.sin(a + 0.05) * sh.r, 3.0);
      sh.m.position.set(pSafe.x, sh.y + Math.sin(t * 1.2 + sh.ph) * 0.3, pSafe.z);
      sh.m.lookAt(nSafe.x, sh.m.position.y, nSafe.z);
    }
    for (const c of this.creatures) {
      if (c.kind === 'jelly') {
        c.m.position.y = c.y0 + Math.sin(t * 1.4 + c.ph) * 0.55;
        const sc = 1 + Math.sin(t * 3.2 + c.ph) * 0.16;
        c.m.scale.set(sc, 2 - sc, sc);
        continue;
      }
      const a = t * c.sp + c.ph;
      const minD = c.kind === 'oarfish' ? 3.5 : 2.6;
      const pSafe = keepInDeepWater9(this.heightFn, c.cx + Math.cos(a) * c.r, c.cz + Math.sin(a) * c.r, minD);
      const nSafe = keepInDeepWater9(this.heightFn, c.cx + Math.cos(a + 0.05) * c.r, c.cz + Math.sin(a + 0.05) * c.r, minD);
      let y = c.y + Math.sin(t * 1.5 + c.ph) * 0.35;
      let pitch = 0;
      if (c.kind === 'dolphin') {
        const leap = Math.sin(t * 2.1 + c.ph);
        y = -0.9 + Math.max(-0.4, leap * 2.6);
        pitch = Math.cos(t * 2.1 + c.ph) * 0.45;
      }
      c.m.position.set(pSafe.x, y, pSafe.z);
      c.m.lookAt(nSafe.x, y, nSafe.z);
      if (pitch) c.m.rotateX(pitch);
      if (c.kind === 'manta') {
        for (const w of c.wings) w.m.rotation.z = -w.sgn * (Math.PI / 2 + Math.sin(t * 3.4 + c.ph) * 0.28);
      } else if (c.kind === 'turtle') {
        for (const f of c.flippers) f.m.rotation.x = Math.sin(t * 4.2 + c.ph + f.sgn) * 0.42;
      } else if (c.kind === 'octopus') {
        for (const arm of c.arms) arm.m.rotation.x = Math.sin(arm.aa) * (0.65 + Math.sin(t * 3.2 + arm.aa) * 0.25);
      } else if (c.kind === 'oarfish') {
        c.segs.forEach((sm, si) => { sm.position.x = Math.sin(t * 4.0 - si * 0.55) * 0.55; });
      }
    }
  }
}

export class AirportSystems9 {
  constructor(scene, heightFn, airports, cirObs = []) {
    this.grp = new THREE.Group();
    this.radars = [];
    this.beacons = [];
    this.flyers = [];
    this.mixers = [];

    const asphM = new THREE.MeshStandardMaterial({ color: 0x383e46, roughness: 0.88, metalness: 0.08 });
    const lineM = new THREE.MeshBasicMaterial({ color: 0xf0ece0 });
    const termM = new THREE.MeshStandardMaterial({ color: 0xe6ecf2, roughness: 0.38, metalness: 0.15 });
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0x62b8e8, roughness: 0.1, metalness: 0.25, clearcoat: 0.9, transparent: true, opacity: 0.78 });
    const towerGlassM = new THREE.MeshPhysicalMaterial({ color: 0x58e2a8, roughness: 0.12, metalness: 0.2, transparent: true, opacity: 0.82 });
    const darkM = new THREE.MeshStandardMaterial({ color: 0x262c34, roughness: 0.6, metalness: 0.45 });
    const edgeLightM = new THREE.MeshBasicMaterial({ color: 0xffd26a, fog: false });
    const greenLightM = new THREE.MeshBasicMaterial({ color: 0x5eff9e, fog: false });

    const pads = [];
    airports.forEach(([k3, nm3, ax, az], idx) => {
      const ah = Math.max(heightFn(ax, az), 0.5);
      // 1. 加宽加长跑道 (7.6m × 46m) + 斑马线与双排助航灯
      const run = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.28, 46), asphM);
      run.position.set(ax, ah + 0.28, az); run.receiveShadow = true; this.grp.add(run);
      for (let i = -3; i <= 3; i++) {
        const dash = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 2.6), lineM);
        dash.position.set(ax, ah + 0.44, az + i * 5.6); this.grp.add(dash);
      }
      for (const sz of [-21, 21]) for (let xi = -2; xi <= 2; xi++) {
        const zeb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 2.2), lineM);
        zeb.position.set(ax + xi * 1.2, ah + 0.44, az + sz); this.grp.add(zeb);
      }
      for (let li = -4; li <= 4; li++) {
        for (const sx of [-3.6, 3.6]) {
          const lm = Math.abs(li) === 4 ? greenLightM : edgeLightM;
          const el = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 5), lm);
          el.position.set(ax + sx, ah + 0.55, az + li * 5.2); this.grp.add(el);
        }
      }
      // 停机坪 + 直升机坪
      const apron = new THREE.Mesh(new THREE.BoxGeometry(10, 0.24, 14), asphM);
      apron.position.set(ax + 8.5, ah + 0.24, az - 4); apron.receiveShadow = true; this.grp.add(apron);
      const hpad = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.24, 16), asphM);
      hpad.position.set(ax - 7.5, ah + 0.24, az + 6); this.grp.add(hpad);
      const hring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.6, 20), edgeLightM);
      hring.rotation.x = -Math.PI / 2; hring.position.set(ax - 7.5, ah + 0.38, az + 6); this.grp.add(hring);
      pads.push({ idx, ax, az, ah });

      // 2. 现代化玻璃幕墙航站楼 + 遮雨弧顶 + 登机廊桥
      const term = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.6, 9.2), termM);
      term.position.set(ax + 9.2, ah + 1.9, az + 8.5); term.castShadow = true; term.receiveShadow = true; this.grp.add(term);
      const glassWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 8.2), glassM);
      glassWall.position.set(ax + 5.78, ah + 1.9, az + 8.5); this.grp.add(glassWall);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.45, 10.6), darkM);
      roof.position.set(ax + 8.8, ah + 3.9, az + 8.5); roof.castShadow = true; this.grp.add(roof);
      const jetway = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.3, 1.4), termM);
      jetway.position.set(ax + 6.2, ah + 2.4, az + 1.5); this.grp.add(jetway);
      cirObs.push({ x: ax + 9.2, z: az + 8.5, r: 4.5 });

      // 3. 航空管制塔台 (ATC Tower + 旋转雷达 + 红色警示信标)
      const tx = ax + 9.5, tz = az + 15.5;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 10.5, 8), termM);
      shaft.position.set(tx, ah + 5.25, tz); shaft.castShadow = true; this.grp.add(shaft);
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.7, 2.1, 8), towerGlassM);
      cab.position.set(tx, ah + 11.2, tz); this.grp.add(cab);
      const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.35, 8), darkM);
      cabRoof.position.set(tx, ah + 12.4, tz); this.grp.add(cabRoof);
      const radar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.25), darkM);
      radar.position.set(tx, ah + 13.1, tz); this.grp.add(radar);
      this.radars.push(radar);
      const bMat = new THREE.MeshBasicMaterial({ color: 0xff3b3b, fog: false });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), bMat);
      beacon.position.set(tx, ah + 13.5, tz); this.grp.add(beacon);
      this.beacons.push({ m: bMat, ph: idx * 0.9 });
      cirObs.push({ x: tx, z: tz, r: 2.0 });
    });

    // 4. 加载外部真实 GLB 模型：A350_nologo.glb 与 helicopter.glb
    const loader = new GLTFLoader();
    loader.load('./assets/models/A350_nologo.glb', gltf => {
      if (!gltf.scene) return;
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const sz = box.getSize(new THREE.Vector3());
      const norm = 12.5 / Math.max(sz.x, sz.y, sz.z, 0.01);
      // 停靠在主机场与主要枢纽停机坪
      pads.filter((_, i) => i % 3 === 0).forEach(p => {
        const m = SkeletonUtils.clone(gltf.scene);
        m.scale.setScalar(norm);
        m.position.set(p.ax + 8.5, p.ah + 1.1, p.az - 4);
        m.rotation.y = Math.PI * 0.82;
        this.grp.add(m);
      });
      // 2 架高空巡航 A350 客机
      for (let i = 0; i < 2; i++) {
        const fm = SkeletonUtils.clone(gltf.scene);
        fm.scale.setScalar(norm * 1.15);
        this.grp.add(fm);
        this.flyers.push({ m: fm, cx: i === 0 ? 120 : -320, cz: i === 0 ? 160 : -220, r: 240 + i * 80, y: 82 + i * 24, sp: 0.14, ph: i * 2.4 });
      }
    }, undefined, () => {});

    loader.load('./assets/models/helicopter.glb', gltf => {
      if (!gltf.scene) return;
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const sz = box.getSize(new THREE.Vector3());
      const norm = 5.4 / Math.max(sz.x, sz.y, sz.z, 0.01);
      pads.filter((_, i) => i % 2 === 1).forEach(p => {
        const m = SkeletonUtils.clone(gltf.scene);
        m.scale.setScalar(norm);
        m.position.set(p.ax - 7.5, p.ah + 0.9, p.az + 6);
        m.rotation.y = 0.5;
        this.grp.add(m);
      });
      // 2 架低空巡逻直升机
      for (let i = 0; i < 2; i++) {
        const hm = SkeletonUtils.clone(gltf.scene);
        hm.scale.setScalar(norm);
        this.grp.add(hm);
        this.flyers.push({ m: hm, cx: i === 0 ? 320 : -400, cz: i === 0 ? 220 : 120, r: 130, y: 36 + i * 10, sp: 0.28, ph: i * 3.1 });
        if (gltf.animations && gltf.animations[0]) {
          const mx = new THREE.AnimationMixer(hm);
          mx.clipAction(gltf.animations[0]).play();
          this.mixers.push(mx);
        }
      }
    }, undefined, () => {});

    scene.add(this.grp);
  }
  update(t, dt) {
    for (const r of this.radars) r.rotation.y = t * 1.8;
    for (const b of this.beacons) b.m.color.setHex(Math.sin(t * 4.5 + b.ph) > 0.2 ? 0xff3b3b : 0x441010);
    for (const f of this.flyers) {
      const a = t * f.sp + f.ph;
      const x = f.cx + Math.cos(a) * f.r, z = f.cz + Math.sin(a) * f.r;
      f.m.position.set(x, f.y + Math.sin(t * 0.8 + f.ph) * 2.5, z);
      f.m.lookAt(f.cx + Math.cos(a + 0.05) * f.r, f.m.position.y, f.cz + Math.sin(a + 0.05) * f.r);
    }
    for (const mx of this.mixers) mx.update(dt);
  }
}

export function buildRealisticEagle9() {
  const g = new THREE.Group();

  // 程序化羽毛法线贴图（斜向羽支条纹）
  const fCv = document.createElement('canvas'); fCv.width = fCv.height = 256;
  const fCtx = fCv.getContext('2d');
  const fImg = fCtx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const barb = Math.sin(x * 0.45 + Math.abs(y - 128) * 0.18) * 0.5 + Math.sin(y * 0.35) * 0.35;
      const idx = (y * 256 + x) * 4;
      fImg.data[idx] = Math.max(0, Math.min(255, Math.floor(128 + barb * 46)));
      fImg.data[idx + 1] = Math.max(0, Math.min(255, Math.floor(128 + Math.cos(y * 0.35) * 32)));
      fImg.data[idx + 2] = 242; fImg.data[idx + 3] = 255;
    }
  }
  fCtx.putImageData(fImg, 0, 0);
  const featherNorm = new THREE.CanvasTexture(fCv);
  featherNorm.wrapS = featherNorm.wrapT = THREE.RepeatWrapping;
  featherNorm.repeat.set(4, 4);

  const darkPlumage = new THREE.MeshStandardMaterial({ color: 0x3b281c, roughness: 0.72, metalness: 0.04, normalMap: featherNorm, normalScale: new THREE.Vector2(0.7, 0.7) });
  const hackleMat = new THREE.MeshStandardMaterial({ color: 0x9c6d38, roughness: 0.65, metalness: 0.06, normalMap: featherNorm, normalScale: new THREE.Vector2(0.65, 0.65) });
  const chestMat = new THREE.MeshStandardMaterial({ color: 0x5c402c, roughness: 0.75, normalMap: featherNorm, normalScale: new THREE.Vector2(0.6, 0.6) });
  const primaryMat = new THREE.MeshStandardMaterial({ color: 0x261a12, roughness: 0.68, normalMap: featherNorm, normalScale: new THREE.Vector2(0.8, 0.8) });
  const goldEdgeMat = new THREE.MeshStandardMaterial({ color: 0xc89242, roughness: 0.6, normalMap: featherNorm });
  const cereMat = new THREE.MeshStandardMaterial({ color: 0xe6b832, roughness: 0.45 });
  const beakMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2622, roughness: 0.22, metalness: 0.1, clearcoat: 0.85 });
  const talonMat = new THREE.MeshPhysicalMaterial({ color: 0x161412, roughness: 0.2, clearcoat: 0.9 });
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0xffb824, roughness: 0.1, clearcoat: 0.95 });

  // 1. 连续流线型猛禽躯干（LatheGeometry 20环，胸肌饱满，尾柄收束）
  const bodyPts = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18; // 0=尾基(-Z), 1=胸前(+Z)
    const r = Math.sin(Math.pow(u, 0.72) * Math.PI) * 1.48 + 0.12;
    bodyPts.push(new THREE.Vector2(r, (u - 0.48) * 6.2));
  }
  const bodyGeo = new THREE.LatheGeometry(bodyPts, 18);
  bodyGeo.rotateX(Math.PI / 2);
  bodyGeo.scale(0.95, 0.88, 1.0);
  const body = new THREE.Mesh(bodyGeo, darkPlumage);
  body.castShadow = true; g.add(body);
  // 胸腹斑驳浅羽
  const breast = new THREE.Mesh(new THREE.SphereGeometry(1.22, 14, 12), chestMat);
  breast.scale.set(0.92, 0.85, 1.8); breast.position.set(0, -0.32, 0.85); g.add(breast);

  // 2. 金褐色颈部披肩羽 (Golden Hackles) + 威严猛禽头部 + 锐利眉骨 + 两段弯钩喙
  const headGrp = new THREE.Group();
  headGrp.position.set(0, 0.75, 2.55);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.95, 1.85, 14), hackleMat);
  neck.rotation.x = 0.55; neck.position.set(0, 0.35, 0.35); headGrp.add(neck);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.76, 14, 12), hackleMat);
  skull.scale.set(0.92, 0.88, 1.25); skull.position.set(0, 1.05, 1.05); headGrp.add(skull);
  // 猛禽锐利眉骨 (Supraorbital Ridge) + 琥珀金虹膜与黑瞳孔
  for (const s of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.56), darkPlumage);
    brow.position.set(s * 0.44, 1.24, 1.22); brow.rotation.set(0.18, s * 0.25, -s * 0.22); headGrp.add(brow);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), eyeMat);
    iris.position.set(s * 0.46, 1.1, 1.26); headGrp.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), talonMat);
    pupil.position.set(s * 0.54, 1.1, 1.28); headGrp.add(pupil);
  }
  // 明黄蜡膜 + 两段式弯钩角质猛禽喙
  const cere = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.36, 10), cereMat);
  cere.rotation.x = Math.PI / 2; cere.position.set(0, 1.02, 1.78); headGrp.add(cere);
  const beakBase = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.68, 10), beakMat);
  beakBase.rotation.x = Math.PI / 2 + 0.18; beakBase.position.set(0, 0.96, 2.15); headGrp.add(beakBase);
  const beakHook = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.48, 8), beakMat);
  beakHook.rotation.x = Math.PI / 2 + 0.95; beakHook.position.set(0, 0.76, 2.48); headGrp.add(beakHook);
  g.add(headGrp);

  // 3. 覆羽大腿 + 鳞片跗跖 + 四趾弯曲利爪
  for (const s of [-1, 1]) {
    const legG = new THREE.Group();
    legG.position.set(s * 0.72, -0.78, 0.15);
    const thigh = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.25, 10), darkPlumage);
    thigh.rotation.x = Math.PI; thigh.position.y = -0.35; legG.add(thigh);
    const tarsus = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.95, 8), cereMat);
    tarsus.position.set(0, -1.05, 0.15); tarsus.rotation.x = 0.22; legG.add(tarsus);
    for (let ti = -1; ti <= 1; ti++) {
      const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.55, 6), cereMat);
      toe.rotation.set(Math.PI / 2 + 0.25, ti * 0.35, 0);
      toe.position.set(ti * 0.14, -1.5, 0.42); legG.add(toe);
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 6), talonMat);
      claw.rotation.x = Math.PI / 2 + 0.85;
      claw.position.set(ti * 0.22, -1.62, 0.68); legG.add(claw);
    }
    g.add(legG);
  }

  // 4. 11 枚层叠扇形尾羽
  for (let i = -5; i <= 5; i++) {
    const tMat = i % 2 === 0 ? darkPlumage : chestMat;
    const tf = new THREE.Mesh(new THREE.ConeGeometry(0.58 - Math.abs(i) * 0.03, 4.6 - Math.abs(i) * 0.18, 5), tMat);
    tf.scale.set(1.1, 1, 0.16);
    tf.rotation.x = -Math.PI / 2 - 0.08;
    tf.rotation.z = i * 0.11;
    tf.position.set(i * 0.22, 0.12 - Math.abs(i) * 0.02, -3.3);
    g.add(tf);
  }

  // 5. 双关节（肩-肘内翼 + 肘-腕外翼）多羽片逼真猛禽翅膀（总翼展 ~22m，翼尖分叉缝隙）
  const wings = [];
  for (const s of [-1, 1]) {
    const inner = new THREE.Group();
    inner.position.set(s * 0.95, 0.55, 0.6);
    // 内翼覆羽与次级飞羽
    const patagium = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.28, 3.0), darkPlumage);
    patagium.position.set(s * 2.8, 0, -0.3); inner.add(patagium);
    const cov = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.22, 1.4), hackleMat);
    cov.position.set(s * 2.7, 0.14, 0.85); inner.add(cov);
    for (let si = 0; si < 7; si++) {
      const sf = new THREE.Mesh(new THREE.ConeGeometry(0.68, 3.6, 5), si % 2 ? chestMat : darkPlumage);
      sf.scale.set(1, 1, 0.14);
      sf.rotation.x = -Math.PI / 2; sf.rotation.z = -s * 0.12;
      sf.position.set(s * (0.8 + si * 0.72), -0.05, -1.8);
      inner.add(sf);
    }

    // 外翼腕关节（肘-腕-翼尖：10枚独立扇形初级飞羽，带经典大雕翼尖分叉上翘！）
    const outer = new THREE.Group();
    outer.position.set(s * 5.4, 0.04, 0.1);
    const carpal = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 1.5), darkPlumage);
    carpal.position.set(s * 1.6, 0, 0.15); outer.add(carpal);
    const primaries = [];
    for (let pi = 0; pi < 9; pi++) {
      const pLen = 5.4 - pi * 0.22;
      const pf = new THREE.Mesh(new THREE.ConeGeometry(0.52 - pi * 0.02, pLen, 5), pi === 0 ? goldEdgeMat : primaryMat);
      pf.scale.set(1, 1, 0.12);
      const fanAng = -s * (Math.PI / 2 - 0.18 - pi * 0.085);
      pf.rotation.z = fanAng;
      pf.rotation.x = 0.06 * (8 - pi); // 翼尖自然上翘缝隙
      pf.position.set(s * (2.6 + (8 - pi) * 0.42), (8 - pi) * 0.08, 0.35 - pi * 0.26);
      outer.add(pf);
      primaries.push(pf);
    }
    inner.add(outer);
    g.add(inner);
    wings.push({ inner, outer, s, primaries });
  }

  return { grp: g, wings, headGrp };
}

export function buildDalianBridge9(scene, brA, brB, deckYFn) {
  const grp = new THREE.Group();
  const dx = brB[0] - brA[0], dz = brB[1] - brA[1];
  const brLen = Math.hypot(dx, dz), brAng = Math.atan2(dx, dz);
  const nx = Math.cos(brAng), nz = -Math.sin(brAng);

  const asphM = new THREE.MeshStandardMaterial({ color: 0x363c44, roughness: 0.85, metalness: 0.08 });
  const lowerDeckM = new THREE.MeshStandardMaterial({ color: 0x2c323a, roughness: 0.88, metalness: 0.1 });
  const trussRedM = new THREE.MeshStandardMaterial({ color: 0xc2382b, roughness: 0.45, metalness: 0.35 });
  const pylonWhiteM = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.42, metalness: 0.18 });
  const pierConcM = new THREE.MeshStandardMaterial({ color: 0x7a828c, roughness: 0.85 });
  const cableM = new THREE.MeshStandardMaterial({ color: 0xc8d2dc, roughness: 0.3, metalness: 0.72 });
  const roadLineM = new THREE.MeshBasicMaterial({ color: 0xf6e6a8 });
  const railM = new THREE.MeshStandardMaterial({ color: 0xc8d0d8, roughness: 0.4, metalness: 0.55 });
  const lampGlowM = new THREE.MeshBasicMaterial({ color: 0xffe49c, fog: false });
  const beaconRedM = new THREE.MeshBasicMaterial({ color: 0xff3b3b, fog: false });

  // 1. 双层公路沥青桥面 + 道路标线 + 双层沃伦式红色钢桁架 (40跨)
  const N = 40, segL = brLen / N + 0.35, trussH = 4.2, hw = 4.9;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    const x = brA[0] + dx * t, z = brA[1] + dz * t;
    const yTop = deckYFn(t);
    const yBot = yTop - trussH;
    const pitch = -Math.cos(t * Math.PI) * (6 * Math.PI / brLen);

    // 上层行车沥青面 (保留与 deckY 完全一致的可行走高度)
    const topDeck = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.55, segL), asphM);
    topDeck.position.set(x, yTop - 0.1, z); topDeck.rotation.set(pitch, brAng, 0, 'YXZ');
    topDeck.receiveShadow = true; grp.add(topDeck);

    // 下层桥面
    const botDeck = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.42, segL), lowerDeckM);
    botDeck.position.set(x, yBot, z); botDeck.rotation.set(pitch, brAng, 0, 'YXZ');
    grp.add(botDeck);

    // 道路双黄中线 + 白色边线
    const midLine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, segL * 0.7), roadLineM);
    midLine.position.set(x, yTop + 0.19, z); midLine.rotation.set(pitch, brAng, 0, 'YXZ');
    grp.add(midLine);

    for (const sgn of [-1, 1]) {
      const rx = x + nx * hw * sgn, rz = z + nz * hw * sgn;
      // 金属护栏
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.05, segL), railM);
      rail.position.set(rx, yTop + 0.72, rz); rail.rotation.set(pitch, brAng, 0, 'YXZ');
      grp.add(rail);
      // 沃伦式红色钢桁架：上/下弦杆 + 竖杆 + 斜腹杆
      const chordT = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, segL), trussRedM);
      chordT.position.set(rx, yTop - 0.15, rz); chordT.rotation.set(pitch, brAng, 0, 'YXZ'); grp.add(chordT);
      const chordB = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, segL), trussRedM);
      chordB.position.set(rx, yBot, rz); chordB.rotation.set(pitch, brAng, 0, 'YXZ'); grp.add(chordB);
      const vPost = new THREE.Mesh(new THREE.BoxGeometry(0.28, trussH, 0.28), trussRedM);
      vPost.position.set(rx, yTop - trussH / 2, rz); vPost.rotation.set(pitch, brAng, 0, 'YXZ'); grp.add(vPost);
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.22, Math.hypot(segL, trussH), 0.24), trussRedM);
      diag.position.set(rx, yTop - trussH / 2, rz);
      diag.rotation.set(pitch + (i % 2 === 0 ? 1 : -1) * Math.atan2(segL, trussH), brAng, 0, 'YXZ');
      grp.add(diag);

      // 每隔 2 跨设置海景双臂路灯
      if (i % 2 === 0) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.2, 6), pylonWhiteM);
        pole.position.set(rx, yTop + 2.3, rz); grp.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 5), lampGlowM);
        lamp.position.set(rx - nx * 0.45 * sgn, yTop + 4.35, rz + nz * 0.45 * sgn); grp.add(lamp);
      }
    }
  }

  // 2. 两座高耸 H 形浅灰白主塔 (t = 0.28, 0.72) + 双横梁 + 海上承台桥墩
  for (const tt of [0.28, 0.72]) {
    const x = brA[0] + dx * tt, z = brA[1] + dz * tt;
    // 海上六边形混凝土承台
    const caisson = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 8.2, 6.5, 6), pierConcM);
    caisson.position.set(x, -1.8, z); grp.add(caisson);
    for (const sgn of [-1, 1]) {
      const px = x + nx * 5.8 * sgn, pz = z + nz * 5.8 * sgn;
      const col = new THREE.Mesh(new THREE.BoxGeometry(1.9, 46, 2.5), pylonWhiteM);
      col.position.set(px, 21, pz); col.rotation.y = brAng; col.castShadow = true; grp.add(col);
      const bcn = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 5), beaconRedM);
      bcn.position.set(px, 44.4, pz); grp.add(bcn);
    }
    // 上/下门式横梁
    for (const cy of [17.5, 38.5]) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(13.2, 2.1, 2.2), pylonWhiteM);
      cross.position.set(x, cy, z); cross.rotation.y = brAng; cross.castShadow = true; grp.add(cross);
    }
  }
  // 引桥辅助海墩
  for (const tt of [0.10, 0.90]) {
    const x = brA[0] + dx * tt, z = brA[1] + dz * tt;
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 12, 8), pierConcM);
    pier.position.set(x, deckYFn(tt) - trussH - 5.5, z); grp.add(pier);
  }

  // 3. 悬链线主缆 + 垂直钢吊索
  const cableY = t => {
    if (t <= 0.28) { const u = t / 0.28; return 5 + u * u * 37.5; }
    if (t >= 0.72) { const u = (1 - t) / 0.28; return 5 + u * u * 37.5; }
    const u = (t - 0.5) / 0.22;
    return 11.5 + u * u * 31.0;
  };
  for (const sgn of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      pts.push(new THREE.Vector3(brA[0] + dx * t + nx * 5.8 * sgn, cableY(t), brA[1] + dz * t + nz * 5.8 * sgn));
    }
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.34, 8, false), cableM);
    grp.add(cable);

    // 32 对垂直钢吊索
    for (let si = 2; si <= 38; si++) {
      const t = si / 40;
      if (Math.abs(t - 0.28) < 0.03 || Math.abs(t - 0.72) < 0.03) continue;
      const cy = cableY(t), dy = deckYFn(t);
      const h = Math.max(0.5, cy - dy);
      const susp = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, h, 5), cableM);
      susp.position.set(brA[0] + dx * t + nx * 5.4 * sgn, dy + h / 2, brA[1] + dz * t + nz * 5.4 * sgn);
      grp.add(susp);
    }
  }

  scene.add(grp);
  return { grp };
}

export function buildBarracudaBayStadium9(scene, cx, cz, yBase) {
  const grp = new THREE.Group();
  grp.position.set(cx, yBase, cz);

  const pw = 54, pd = 36; // 专业绿茵场尺寸
  // 1. 专业高清条纹草坪 (512×512 CanvasTexture: 交替割草纹 + 标准白线 + 禁区 + 中圈)
  const pCv = document.createElement('canvas'); pCv.width = 512; pCv.height = 384;
  const pc = pCv.getContext('2d');
  for (let i = 0; i < 12; i++) {
    pc.fillStyle = i % 2 === 0 ? '#2b8a3e' : '#359c4a';
    pc.fillRect((i / 12) * 512, 0, 512 / 12 + 1, 384);
  }
  pc.strokeStyle = 'rgba(248,252,250,0.92)'; pc.lineWidth = 3;
  pc.strokeRect(18, 18, 476, 348);
  pc.beginPath(); pc.moveTo(256, 18); pc.lineTo(256, 366); pc.stroke();
  pc.beginPath(); pc.arc(256, 192, 46, 0, Math.PI * 2); pc.stroke();
  pc.fillStyle = '#fff'; pc.beginPath(); pc.arc(256, 192, 4, 0, Math.PI * 2); pc.fill();
  for (const sx of [18, 494 - 74]) { pc.strokeRect(sx, 96, 74, 192); }
  for (const sx of [18, 494 - 28]) { pc.strokeRect(sx, 144, 28, 96); }
  const pitchTex = new THREE.CanvasTexture(pCv);
  const pitch = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.85 }));
  pitch.rotation.x = -Math.PI / 2; pitch.position.y = 0.08; pitch.receiveShadow = true; grp.add(pitch);

  // 2. 真实 3D 球门（门柱/横梁/球网）+ 替补席 + 角旗
  const postM = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.3, metalness: 0.4 });
  const netM = new THREE.MeshBasicMaterial({ color: 0xdce8f0, wireframe: true, transparent: true, opacity: 0.45 });
  for (const sgn of [-1, 1]) {
    const gx = sgn * (pw / 2 - 1.8);
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), postM); gl.position.set(gx, 1.3, -2.8); grp.add(gl);
    const gr = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), postM); gr.position.set(gx, 1.3, 2.8); grp.add(gr);
    const gb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.76, 6), postM); gb.rotation.x = Math.PI / 2; gb.position.set(gx, 2.6, 0); grp.add(gb);
    const net = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 5.5), netM); net.position.set(gx + sgn * 0.75, 1.28, 0); grp.add(net);
  }
  const dugout = new THREE.Mesh(new THREE.BoxGeometry(10, 1.6, 1.8), new THREE.MeshPhysicalMaterial({ color: 0x3898e8, transparent: true, opacity: 0.65, roughness: 0.1 }));
  dugout.position.set(0, 0.85, pd / 2 + 1.8); grp.add(dugout);

  // 3. 双层梭鱼湾标志性“海蓝-冰白”渐变专业看台碗 + 360° 环场 LED 广告屏
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0x165ca8, roughness: 0.55 });
  const tier2Mat = new THREE.MeshStandardMaterial({ color: 0x36a2eb, roughness: 0.5 });
  const concMat = new THREE.MeshStandardMaterial({ color: 0xdce4ec, roughness: 0.72 });
  // 四周双层看台（矩形圆角布局）
  for (const [bx, bz, bw, bd, ry] of [
    [0, -pd / 2 - 9.5, pw + 14, 12, 0],
    [0, pd / 2 + 9.5, pw + 14, 12, Math.PI],
    [-pw / 2 - 9.5, 0, pd + 8, 12, Math.PI / 2],
    [pw / 2 + 9.5, 0, pd + 8, 12, -Math.PI / 2],
  ]) {
    const sg = new THREE.Group(); sg.position.set(bx, 0, bz); sg.rotation.y = ry;
    for (let st = 0; st < 7; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(bw, 1.15, 1.45), st < 4 ? bowlMat : tier2Mat);
      step.position.set(0, 0.6 + st * 1.1, 4.5 - st * 1.35);
      step.castShadow = true; step.receiveShadow = true; sg.add(step);
    }
    const backW = new THREE.Mesh(new THREE.BoxGeometry(bw, 9.5, 1.2), concMat);
    backW.position.set(0, 4.8, -5.2); sg.add(backW);
    grp.add(sg);
  }
  // 环场 LED 滚动广告屏
  const ledCv = document.createElement('canvas'); ledCv.width = 512; ledCv.height = 64;
  const lc = ledCv.getContext('2d');
  lc.fillStyle = '#061a36'; lc.fillRect(0, 0, 512, 64);
  lc.fillStyle = '#4ad4ff'; lc.font = 'bold 28px system-ui,sans-serif';
  lc.fillText('DALIAN BARRACUDA BAY  ·  大连梭鱼湾专业足球场  ·  海风主场', 18, 42);
  const ledTex = new THREE.CanvasTexture(ledCv); ledTex.wrapS = THREE.RepeatWrapping;
  const ledMat = new THREE.MeshBasicMaterial({ map: ledTex });
  for (const [lx, lz, lw, ry] of [
    [0, -pd / 2 - 2.6, pw + 4, 0], [0, pd / 2 + 2.6, pw + 4, Math.PI],
    [-pw / 2 - 2.6, 0, pd + 2, Math.PI / 2], [pw / 2 + 2.6, 0, pd + 2, -Math.PI / 2]
  ]) {
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(lw, 1.1), ledMat);
    lm.position.set(lx, 0.72, lz); lm.rotation.y = ry; grp.add(lm);
  }

  // 4. 梭鱼湾招牌“炫彩叠浪”蓝白螺旋膜结构外立面 + 悬挑采光罩棚 (40组螺旋海浪肋架)
  const etfeMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f6ff, roughness: 0.16, metalness: 0.12, clearcoat: 0.92, transparent: true, opacity: 0.76, side: THREE.DoubleSide });
  const ribBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e88e5, roughness: 0.35, metalness: 0.45 });
  const ribWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf2f7fc, roughness: 0.35, metalness: 0.25 });
  const roofRing = new THREE.Mesh(new THREE.RingGeometry(24, 46, 48), etfeMat);
  roofRing.rotation.x = -Math.PI / 2; roofRing.position.y = 14.5; roofRing.scale.set(1.22, 0.92, 1); grp.add(roofRing);
  const N_RIBS = 40;
  for (let i = 0; i < N_RIBS; i++) {
    const a = (i / N_RIBS) * Math.PI * 2;
    const rx = Math.cos(a) * 44.5 * 1.22, rz = Math.sin(a) * 44.5 * 0.92;
    const waveH = 13.5 + Math.sin(a * 4) * 2.2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.65, waveH, 2.2), i % 2 === 0 ? ribWhiteMat : ribBlueMat);
    rib.position.set(rx, waveH / 2, rz);
    rib.rotation.y = -a;
    rib.rotation.z = 0.22; // 标志性外倾叠浪弧度
    rib.castShadow = true; grp.add(rib);
    // 顶部内挑悬臂钢梁
    const cant = new THREE.Mesh(new THREE.BoxGeometry(16, 0.45, 0.55), ribWhiteMat);
    cant.position.set(Math.cos(a) * 35 * 1.22, 14.2 + Math.sin(a * 4) * 0.8, Math.sin(a) * 35 * 0.92);
    cant.rotation.y = -a; grp.add(cant);
  }
  // 发光海浪氛围灯带（绕场一圈）
  const neonRing = new THREE.Mesh(new THREE.TorusGeometry(43, 0.28, 6, 64), new THREE.MeshBasicMaterial({ color: 0x4ad4ff, fog: false }));
  neonRing.rotation.x = Math.PI / 2; neonRing.position.y = 11.2; neonRing.scale.set(1.22, 0.92, 1); grp.add(neonRing);

  // 5. 四角泛光照明灯塔 + 巨型悬吊计分牌 (Jumbotron)
  const scoreCv = document.createElement('canvas'); scoreCv.width = 256; scoreCv.height = 128;
  const sc = scoreCv.getContext('2d');
  const scoreTex = new THREE.CanvasTexture(scoreCv);
  let scoreA = 2, scoreB = 1;
  const drawScore = (min) => {
    sc.fillStyle = '#07162a'; sc.fillRect(0, 0, 256, 128);
    sc.strokeStyle = '#38c8ff'; sc.lineWidth = 4; sc.strokeRect(4, 4, 248, 120);
    sc.fillStyle = '#4ad4ff'; sc.font = 'bold 16px system-ui,sans-serif'; sc.textAlign = 'center';
    sc.fillText('大连梭鱼湾 · BARRACUDA BAY', 128, 28);
    sc.fillStyle = '#fff'; sc.font = 'bold 34px monospace';
    sc.fillText(`${scoreA}  :  ${scoreB}`, 128, 76);
    sc.fillStyle = '#ffd84d'; sc.font = 'bold 14px system-ui,sans-serif';
    sc.fillText(`大连英博 vs 上海申花  ${min}'`, 128, 108);
    scoreTex.needsUpdate = true;
  };
  drawScore(68);
  const jMat = new THREE.MeshBasicMaterial({ map: scoreTex });
  for (const sx of [-1, 1]) {
    const jb = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.5), jMat);
    jb.position.set(sx * (pw / 2 + 2.5), 11.5, 0); jb.rotation.y = -sx * Math.PI / 2; grp.add(jb);
  }
  const pitchLight = new THREE.PointLight(0xeef8ff, 3.2, 120, 1.2);
  pitchLight.position.set(0, 22, 0); grp.add(pitchLight);

  // 6. 2,000 名 InstancedMesh 荧光海蓝球迷（随比赛人浪起伏）
  const FANS = 1600;
  const fanGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.85, 5);
  const fanMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const fanInst = new THREE.InstancedMesh(fanGeo, fanMat, FANS);
  const fm4 = new THREE.Matrix4(), fCol = new THREE.Color();
  const fanBase = [];
  for (let i = 0; i < FANS; i++) {
    const side = i % 4, row = (i >> 2) % 7, u = ((i * 73) % 1000) / 1000 - 0.5;
    let fx = 0, fz = 0;
    const fy = 1.25 + row * 1.1;
    if (side < 2) { fx = u * (pw + 10); fz = (side === 0 ? -1 : 1) * (pd / 2 + 5.2 + row * 1.35); }
    else { fz = u * (pd + 4); fx = (side === 2 ? -1 : 1) * (pw / 2 + 5.2 + row * 1.35); }
    fanBase.push({ fx, fy, fz, ph: i * 0.23 });
    fm4.makeTranslation(fx, fy, fz);
    fanInst.setMatrixAt(i, fm4);
    fCol.setHex(i % 5 === 0 ? 0xf6f8fa : i % 3 === 0 ? 0x4ad4ff : 0x1672d8);
    fanInst.setColorAt(i, fCol);
  }
  fanInst.instanceMatrix.needsUpdate = true;
  if (fanInst.instanceColor) fanInst.instanceColor.needsUpdate = true;
  grp.add(fanInst);

  // 7. 14 名场上球员 + 实时足球比赛
  const players = [];
  const teamBlueM = new THREE.MeshStandardMaterial({ color: 0x1878e8, roughness: 0.5 });
  const teamRedM = new THREE.MeshStandardMaterial({ color: 0xe63b3b, roughness: 0.5 });
  const skinM = new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.6 });
  for (let i = 0; i < 14; i++) {
    const pg = new THREE.Group();
    const tM = i < 7 ? teamBlueM : teamRedM;
    const bd = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.75, 4, 6), tM); bd.position.y = 0.75; pg.add(bd);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 5), skinM); hd.position.y = 1.48; pg.add(hd);
    const bx = (i < 7 ? -1 : 1) * (4 + (i % 7) * 2.8), bz = ((i % 3) - 1) * 8;
    pg.position.set(bx, 0.12, bz);
    grp.add(pg);
    players.push({ m: pg, bx, bz, ph: i * 0.9, team: i < 7 ? 0 : 1 });
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }));
  ball.position.set(0, 0.42, 0); grp.add(ball);

  scene.add(grp);
  let lastMin = 68;
  return {
    grp,
    update(t) {
      ledTex.offset.x = (t * 0.08) % 1;
      // 足球在场内连续传球射门轨迹
      const bpx = Math.sin(t * 0.85) * 19 + Math.cos(t * 1.9) * 4;
      const bpz = Math.cos(t * 1.15) * 12;
      const bpy = 0.4 + Math.abs(Math.sin(t * 3.8)) * 0.9;
      ball.position.set(bpx, bpy, bpz);
      ball.rotation.x += 0.12; ball.rotation.z += 0.09;
      for (const pl of players) {
        const tx = pl.bx * 0.55 + bpx * 0.45 + Math.sin(t * 1.4 + pl.ph) * 3.2;
        const tz = pl.bz * 0.55 + bpz * 0.45 + Math.cos(t * 1.2 + pl.ph) * 2.6;
        pl.m.position.set(Math.max(-pw / 2 + 2, Math.min(pw / 2 - 2, tx)), 0.12 + Math.abs(Math.sin(t * 8 + pl.ph)) * 0.12, Math.max(-pd / 2 + 2, Math.min(pd / 2 - 2, tz)));
        pl.m.lookAt(cx + bpx, yBase + 0.12, cz + bpz);
      }
      // 球迷人浪
      for (let i = 0; i < FANS; i += 4) {
        const fb = fanBase[i];
        const wave = Math.max(0, Math.sin(t * 3.2 - fb.fx * 0.12 + fb.fz * 0.1)) * 0.45;
        fm4.makeTranslation(fb.fx, fb.fy + wave, fb.fz);
        fanInst.setMatrixAt(i, fm4);
      }
      fanInst.instanceMatrix.needsUpdate = true;
      const curMin = (68 + Math.floor(t / 12)) % 90 + 1;
      if (curMin !== lastMin) {
        lastMin = curMin;
        if (curMin % 15 === 0) scoreA = (scoreA + 1) % 6;
        drawScore(curMin);
      }
    }
  };
}

export function buildAlexandriaLibrary9(scene, zn, addSpot, boxObs, cirObs, makeSign) {
  const grp = new THREE.Group();
  grp.position.set(zn.x, zn.h, zn.z);

  const graniteM = new THREE.MeshStandardMaterial({ color: 0xcab89c, roughness: 0.78, metalness: 0.05 });
  const marbleM = new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.45, metalness: 0.08 });
  const roofDiscM = new THREE.MeshPhysicalMaterial({ color: 0x3b6e8c, roughness: 0.14, metalness: 0.25, clearcoat: 0.9, transparent: true, opacity: 0.84, side: THREE.DoubleSide });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x2a3542, roughness: 0.45, metalness: 0.55 });
  const goldM = new THREE.MeshStandardMaterial({ color: 0xe6b84c, roughness: 0.28, metalness: 0.82 });
  const woodM = new THREE.MeshStandardMaterial({ color: 0x5c3e24, roughness: 0.72 });
  const scrollM = new THREE.MeshStandardMaterial({ color: 0xf0dfa8, roughness: 0.65 });

  // 1. 阶梯式大理石基座 + 花岗岩半圆形外墙（亚历山大图书馆标志性象形弧墙）
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(23.5 - s * 1.1, 24.2 - s * 1.1, 0.5, 32), marbleM);
    step.position.y = 0.25 + s * 0.45; step.receiveShadow = true; grp.add(step);
  }
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(20.8, 20.8, 0.3, 32), marbleM);
  floor.position.y = 1.45; floor.receiveShadow = true; grp.add(floor);

  // 后半圆花岗岩铭文弧墙（南侧留出宽阔柱廊入口）
  const arcWall = new THREE.Mesh(new THREE.CylinderGeometry(20.6, 21.2, 11.5, 28, 1, true, Math.PI * 0.28, Math.PI * 1.44), graniteM);
  arcWall.material.side = THREE.DoubleSide;
  arcWall.position.y = 7.2; arcWall.castShadow = true; arcWall.receiveShadow = true; grp.add(arcWall);

  // 2. 标志性「倾斜日轮」玻璃格栅斜屋顶 (Tilted Sun-Disc Skylight Roof)
  const roofGrp = new THREE.Group();
  roofGrp.position.set(0, 12.8, -1.2);
  roofGrp.rotation.x = 0.24; // 朝南/朝海倾斜日轮
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(21.6, 21.6, 0.7, 36), roofDiscM);
  roofGrp.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(21.6, 0.45, 8, 48), goldM);
  rim.rotation.x = Math.PI / 2; roofGrp.add(rim);
  for (let gi = -3; gi <= 3; gi++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(39, 0.35, 0.35), frameM);
    rib.position.set(0, 0.38, gi * 5.2); roofGrp.add(rib);
    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 39), frameM);
    rib2.position.set(gi * 5.2, 0.38, 0); roofGrp.add(rib2);
  }
  grp.add(roofGrp);

  // 3. 古典亚历山大柱廊门厅（10根科林斯大理石巨柱 + 山花门楣）
  for (let ci = 0; ci < 8; ci++) {
    const px = -14 + ci * 4;
    const pz = 15.2 + Math.abs(ci - 3.5) * 0.35;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.66, 8.8, 12), marbleM);
    col.position.set(px, 5.8, pz); col.castShadow = true; grp.add(col);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.56, 0.65, 12), goldM);
    cap.position.set(px, 10.3, pz); grp.add(cap);
    cirObs.push({ x: zn.x + px, z: zn.z + pz, r: 0.9 });
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(31, 1.5, 2.2), marbleM);
  lintel.position.set(0, 11.4, 15.8); grp.add(lintel);
  if (makeSign) {
    const sign = makeSign('亚历山大 · 千夜图书馆', 10, '#1c2430', '#ffe49c');
    sign.position.set(0, 13.0, 16.8); grp.add(sign);
  }

  // 4. 室内 12 组卷轴壁龛书架（保留全部 12 个交互点）+ 中央旋转黄金浑天仪
  let n = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    if (n++ >= 12) break;
    const lx = -10.5 + c * 7, lz = -8 + r * 6;
    const sh = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.6, 1.3), woodM);
    sh.position.set(lx, 3.3, lz); sh.castShadow = true; grp.add(sh);
    for (let b = 0; b < 6; b++) {
      const scr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.1, 6), scrollM);
      scr.rotation.x = Math.PI / 2; scr.position.set(lx - 1.9 + b * 0.76, 3.5, lz); grp.add(scr);
    }
    boxObs.push({ x1: zn.x + lx - 2.5, z1: zn.z + lz - 0.8, x2: zn.x + lx + 2.5, z2: zn.z + lz + 0.8 });
    const s = addSpot(zn.x + lx, zn.z + lz + 2.6, 'books', 'shelf'); s.y = zn.h + 1.4;
  }
  const astro = new THREE.Group(); astro.position.set(0, 5.2, 8.5);
  const aRings = [];
  for (let i = 0; i < 3; i++) {
    const ar = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i * 0.45, 0.08, 6, 32), goldM);
    ar.rotation.set(i * 0.6, i * 0.8, 0); astro.add(ar); aRings.push(ar);
  }
  grp.add(astro);
  const hallLight = new THREE.PointLight(0xffe0a8, 2.2, 42, 1.3);
  hallLight.position.set(0, 9.5, 2); grp.add(hallLight);

  scene.add(grp);
  return {
    grp,
    update(t) {
      aRings.forEach((ar, i) => { ar.rotation.y = t * (0.35 + i * 0.18); ar.rotation.x = t * (0.2 + i * 0.1); });
    }
  };
}

export function buildSpaceAsteroidB612(scene, B612) {
  const grp = new THREE.Group();
  const R = 30;
  const cx = B612.x, cy = B612.y - R, cz = B612.z; // 球顶位于 B612.y (265m 外太空)
  grp.position.set(cx, cy, cz);

  // 1. 雕塑感外太空陨石星球主体（陨石坑 + 金褐星尘岩壳）
  const astGeo = new THREE.IcosahedronGeometry(R, 3);
  const pos = astGeo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const cTop = new THREE.Color(0x9a7b56), cCrater = new THREE.Color(0x4b3b2c), cDust = new THREE.Color(0xc8a46e);
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const n = Math.sin(vx * 0.22) * Math.cos(vy * 0.24) * Math.sin(vz * 0.21);
    const crater = vy < R * 0.65 ? Math.max(0, Math.sin(vx * 0.35 + vz * 0.3)) * 1.4 : 0;
    const scale = 1 + n * 0.045 - crater * 0.03;
    pos.setXYZ(i, vx * scale, vy * scale, vz * scale);
    const c = vy > R * 0.72 ? cDust : (crater > 0.5 ? cCrater : cTop);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  astGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  astGeo.computeVertexNormals();
  const astMesh = new THREE.Mesh(astGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.06 }));
  astMesh.castShadow = true; astMesh.receiveShadow = true;
  grp.add(astMesh);

  // 2. 3座小火山（两座喷发微红熔岩，一座熄灭）
  for (let vi = 0; vi < 3; vi++) {
    const va = vi * 2.1 + 0.5, vr = 10 + vi * 2;
    const vx = Math.cos(va) * vr, vz = Math.sin(va) * vr;
    const vy = Math.sqrt(Math.max(1, R * R - vx * vx - vz * vz));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x4a382c, roughness: 0.9 }));
    cone.position.set(vx, vy + 0.8, vz);
    grp.add(cone);
    if (vi < 2) {
      const lava = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff6b2b, fog: false }));
      lava.position.set(vx, vy + 2.35, vz); grp.add(lava);
    }
  }

  // 3. 外太空星环碎石带 + 金色星尘光环
  const belt = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7c6a58, roughness: 0.88 });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const rr = R + 12 + (i % 4) * 3.5;
    const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (i % 3) * 0.45, 0), rockMat);
    rk.position.set(Math.cos(a) * rr, (i % 5 - 2) * 1.4, Math.sin(a) * rr);
    rk.rotation.set(i, i * 0.7, 0);
    belt.add(rk);
  }
  const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(R + 16, 0.16, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.45, fog: false }));
  orbitRing.rotation.x = Math.PI / 2.2; belt.add(orbitRing);
  grp.add(belt);

  const starGlow = new THREE.PointLight(0xffe099, 2.2, 95, 1.2);
  starGlow.position.set(0, R + 12, 0); grp.add(starGlow);

  scene.add(grp);
  return {
    grp,
    surfaceY(x, z) {
      const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 > (R - 2) * (R - 2)) return null;
      return cy + Math.sqrt(Math.max(0, R * R - d2)) + 0.15;
    },
    update(t) {
      belt.rotation.y = t * 0.12;
      belt.rotation.z = Math.sin(t * 0.25) * 0.08;
    }
  };
}

export function buildSpaceRocket9(scene, px, py, pz) {
  const grp = new THREE.Group();
  grp.position.set(px, py, pz);

  const steelM = new THREE.MeshStandardMaterial({ color: 0xd8dfe6, roughness: 0.22, metalness: 0.86 });
  const tileM = new THREE.MeshStandardMaterial({ color: 0x161920, roughness: 0.62, metalness: 0.25 });
  const darkM = new THREE.MeshStandardMaterial({ color: 0x262e38, roughness: 0.5, metalness: 0.65 });
  const winM = new THREE.MeshPhysicalMaterial({ color: 0x6ce8ff, roughness: 0.08, clearcoat: 0.95, emissive: 0x114466, emissiveIntensity: 0.45 });

  // SpaceX 轨道发射台（八边形基座 + 4 组机械夹臂）
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 0.65, 8), darkM);
  pad.position.y = 0.32; grp.add(pad);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 1.1), darkM);
    arm.position.set(Math.cos(a) * 2.5, 1.1, Math.sin(a) * 2.5);
    arm.rotation.y = -a + Math.PI / 2;
    grp.add(arm);
  }

  // SpaceX Starship 星舰主体
  const ship = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.38, 6.8, 18), steelM);
  hull.position.y = 4.1; hull.castShadow = true; ship.add(hull);
  const heatShield = new THREE.Mesh(
    new THREE.CylinderGeometry(1.37, 1.4, 6.6, 18, 1, true, Math.PI * 0.62, Math.PI * 0.76),
    tileM
  );
  heatShield.position.y = 4.1; ship.add(heatShield);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.2, 18), steelM);
  nose.position.y = 9.1; nose.castShadow = true; ship.add(nose);
  const noseShield = new THREE.Mesh(
    new THREE.ConeGeometry(1.37, 3.15, 18, 1, true, Math.PI * 0.62, Math.PI * 0.76),
    tileM
  );
  noseShield.position.y = 9.1; ship.add(noseShield);

  const cabinWin = new THREE.Mesh(new THREE.CylinderGeometry(1.37, 1.37, 0.48, 18, 1, true, -0.55, 1.1), winM);
  cabinWin.position.y = 7.15; ship.add(cabinWin);

  const logoCv = document.createElement('canvas');
  logoCv.width = 128; logoCv.height = 512;
  const lctx = logoCv.getContext('2d');
  lctx.clearRect(0, 0, 128, 512);
  lctx.fillStyle = '#0f1722';
  lctx.font = 'bold 42px system-ui, sans-serif';
  lctx.textAlign = 'center';
  'SPACEX'.split('').forEach((ch, idx) => lctx.fillText(ch, 64, 92 + idx * 66));
  const logoTex = new THREE.CanvasTexture(logoCv);
  const logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 4.2), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true }));
  logoPlane.position.set(0, 4.3, 1.39); ship.add(logoPlane);

  for (const sgn of [-1, 1]) {
    const fwdFlap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.75, 0.14), tileM);
    fwdFlap.position.set(sgn * 1.45, 7.8, -0.15);
    fwdFlap.rotation.z = -sgn * 0.28;
    ship.add(fwdFlap);

    const aftFlap = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.75, 0.18), tileM);
    aftFlap.position.set(sgn * 1.78, 2.05, -0.15);
    aftFlap.rotation.z = -sgn * 0.18;
    ship.add(aftFlap);
  }

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.65, 8, 1, true), darkM);
    bell.position.set(Math.cos(a) * 0.68, 0.55, Math.sin(a) * 0.68);
    ship.add(bell);
  }

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(1.05, 4.8, 12),
    new THREE.MeshBasicMaterial({ color: 0x66ccff, transparent: true, opacity: 0, fog: false })
  );
  flame.rotation.x = Math.PI; flame.position.y = -1.6; ship.add(flame);

  // 若存在外部 SpaceX .glb 资源则自动加载替换船体
  new GLTFLoader().load('./assets/models/spacex_starship.glb', gltf => {
    const ext = gltf.scene;
    ext.scale.setScalar(1.2);
    ship.children.forEach(c => { if (c !== flame) c.visible = false; });
    ship.add(ext);
  }, undefined, () => {});

  grp.add(ship);
  scene.add(grp);
  return { grp, ship, flame };
}

export function buildSpaceMars9(scene, MARS) {
  const grp = new THREE.Group();
  const R = 52;
  const cx = MARS.x, cy = MARS.y - R, cz = MARS.z;
  grp.position.set(cx, cy, cz);

  // 1. 火星铁锈红星体（奥林帕斯山 + 水手谷 + 陨石坑 + 极冠冰盖）
  const marsGeo = new THREE.IcosahedronGeometry(R, 4);
  const pos = marsGeo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const cRust = new THREE.Color(0xc85a32), cDark = new THREE.Color(0x6e2a18), cHigh = new THREE.Color(0xe07e4a), cIce = new THREE.Color(0xf2efe9);
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const n = Math.sin(vx * 0.14) * Math.cos(vy * 0.16) * Math.sin(vz * 0.14);
    const canyon = Math.abs(vz) < 6 && vx > 4 && vy > R * 0.35 ? -1.4 : 0;
    const olympus = (vx + 16) * (vx + 16) + (vz + 12) * (vz + 12) < 160 && vy > R * 0.55 ? 2.4 : 0;
    const scale = 1 + n * 0.032 + (canyon + olympus) * 0.012;
    pos.setXYZ(i, vx * scale, vy * scale, vz * scale);
    let c = n > 0.25 ? cHigh : (canyon < 0 || n < -0.25 ? cDark : cRust);
    if (vy < -R * 0.84) c = cIce;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  marsGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  marsGeo.computeVertexNormals();
  const marsMesh = new THREE.Mesh(marsGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.04 }));
  marsMesh.castShadow = true; marsMesh.receiveShadow = true;
  grp.add(marsMesh);

  // 2. 火星稀薄橙红大气辉光壳
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R + 3.8, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0xff7b42, transparent: true, opacity: 0.14, side: THREE.BackSide, fog: false })
  );
  grp.add(atmo);

  const surfH = (lx, lz) => Math.sqrt(Math.max(1, R * R - lx * lx - lz * lz));

  // 3. SpaceX 火星基地：双穹顶生态舱 + 太阳能翼板 + 火星车
  const domeMat = new THREE.MeshPhysicalMaterial({ color: 0xcbeeff, transparent: true, opacity: 0.42, roughness: 0.1, clearcoat: 0.9 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xd8dfe6, roughness: 0.35, metalness: 0.6 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1c3a6e, roughness: 0.2, metalness: 0.7 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.75 });

  [[6, -4, 4.6], [14, 3, 3.3]].forEach(([dx, dz, dr]) => {
    const dy = surfH(dx, dz);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(dr + 0.3, dr + 0.5, 0.8, 16), baseMat);
    ring.position.set(dx, dy + 0.2, dz); grp.add(ring);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(dr, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.set(dx, dy + 0.4, dz); grp.add(dome);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(dr * 0.48, 10, 8), leafMat);
    plant.scale.set(1.2, 0.65, 1.2);
    plant.position.set(dx, dy + 0.9, dz); grp.add(plant);
  });

  for (let si = 0; si < 3; si++) {
    const sx = -2 + si * 4.2, sz = 11, sy = surfH(sx, sz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.2, 8), baseMat);
    pole.position.set(sx, sy + 0.9, sz); grp.add(pole);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.8), solarMat);
    panel.position.set(sx, sy + 2.0, sz); panel.rotation.x = 0.45; grp.add(panel);
  }

  const rover = new THREE.Group();
  const rBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.2), baseMat);
  rBody.position.y = 0.85; rover.add(rBody);
  const rMast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.05, 8), baseMat);
  rMast.position.set(0, 1.55, 0.7); rover.add(rMast);
  const rCam = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.35), new THREE.MeshStandardMaterial({ color: 0x222a34 }));
  rCam.position.set(0, 2.1, 0.72); rover.add(rCam);
  for (const wx of [-0.95, 0.95]) {
    for (const wz of [-0.85, 0, 0.85]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.8 }));
      wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.32, wz); rover.add(wh);
    }
  }
  grp.add(rover);

  // 4. 火星双卫星：火卫一 Phobos & 火卫二 Deimos
  const moons = new THREE.Group();
  const mMat = new THREE.MeshStandardMaterial({ color: 0x8b7768, roughness: 0.92 });
  const phobos = new THREE.Mesh(new THREE.DodecahedronGeometry(2.1, 1), mMat);
  phobos.position.set(R + 18, 8, 0); moons.add(phobos);
  const deimos = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), mMat);
  deimos.position.set(-(R + 28), -6, 14); moons.add(deimos);
  grp.add(moons);

  const marsGlow = new THREE.PointLight(0xff8e5a, 2.4, 140, 1.1);
  marsGlow.position.set(0, R + 18, 0); grp.add(marsGlow);

  scene.add(grp);
  return {
    grp,
    surfaceY(x, z) {
      const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 > (R - 3) * (R - 3)) return null;
      return cy + Math.sqrt(Math.max(0, R * R - d2)) + 0.18;
    },
    update(t) {
      moons.rotation.y = t * 0.14;
      const ra = t * 0.22;
      const rx = Math.cos(ra) * 14, rz = Math.sin(ra) * 14;
      rover.position.set(rx, surfH(rx, rz) + 0.08, rz);
      rover.rotation.y = -ra;
    }
  };
}
