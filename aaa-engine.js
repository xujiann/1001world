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
