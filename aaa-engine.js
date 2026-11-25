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

export class OceanWhales9 {
  constructor(scene) {
    this.grp = new THREE.Group();
    this.whales = [];
    const specs = [
      // 1. 蓝鲸 (Blue Whale: 28m 长，深蓝灰背部+浅灰腹沟+小镰刀背鳍+高大喷水柱)
      { kind: 'blue', cx: 260, cz: 340, r: 58, sp: 0.14, len: 28, rad: 3.1, breach: false, spout: true },
      // 2. 座头鲸 (Humpback Whale: 16m 长，超长白色瘤状胸鳍+周期性跃出海面 Breaching)
      { kind: 'humpback', cx: -240, cz: 360, r: 44, sp: 0.22, len: 16, rad: 2.3, breach: true, spout: true },
      // 3. 虎鲸双鲸群 (Orca Pod × 2: 黑白分明+眼后白斑+高耸镰刀背鳍)
      { kind: 'orca', cx: -420, cz: 220, r: 34, sp: 0.34, len: 9.5, rad: 1.55, phase: 0, breach: false, spout: false },
      { kind: 'orca', cx: -420, cz: 220, r: 30, sp: 0.34, len: 8.2, rad: 1.35, phase: 0.55, breach: false, spout: false },
      // 4. 独角鲸 (Narwhal: 北方冷水海域，银白斑驳皮肤+螺旋长牙)
      { kind: 'narwhal', cx: -380, cz: -520, r: 32, sp: 0.26, len: 7.4, rad: 1.25, breach: false, spout: false },
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
      const wx = s.cx + Math.cos(a) * s.r, wz = s.cz + Math.sin(a) * s.r;
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
      const nx = s.cx + Math.cos(a + 0.05) * s.r, nz = s.cz + Math.sin(a + 0.05) * s.r;
      wg.lookAt(nx, wy, nz);
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
