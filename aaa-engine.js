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
