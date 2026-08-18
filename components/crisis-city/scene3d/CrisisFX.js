// États visuels de crise pilotés par les ressources — section 2.5, directive 3.4.
import * as THREE from 'three';

const RAIN_COUNT = 1500;

export class CrisisFX {
  constructor(scene, pays) {
    this.scene = scene;
    this.pays = pays;
    this.clock = 0;

    if (pays === 'maroc') {
      this.scene.fog = new THREE.FogExp2(0xf0b8a0, 0.006);
    } else {
      this.waterLevel = -2;
      const waterGeo = new THREE.PlaneGeometry(200, 200);
      const waterMat = new THREE.MeshLambertMaterial({ color: 0x1c5a8c, transparent: true, opacity: 0.85 });
      this.water = new THREE.Mesh(waterGeo, waterMat);
      this.water.rotation.x = -Math.PI / 2;
      this.water.position.y = this.waterLevel;
      this.scene.add(this.water);

      const rainGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(RAIN_COUNT * 3);
      for (let i = 0; i < RAIN_COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 160;
        positions[i * 3 + 1] = Math.random() * 60;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 160;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const rainMat = new THREE.PointsMaterial({ color: 0xa8d0e8, size: 0.35, transparent: true, opacity: 0.7 });
      this.rain = new THREE.Points(rainGeo, rainMat);
      this.rain.visible = false;
      this.scene.add(this.rain);

      this.emergencyLights = [];
      for (let i = 0; i < 4; i++) {
        const light = new THREE.PointLight(0xe0392b, 0, 60, 2);
        light.position.set((Math.random() - 0.5) * 100, 12, (Math.random() - 0.5) * 100);
        this.scene.add(light);
        this.emergencyLights.push(light);
      }
    }
  }

  // Appelé à chaque changement de ressources / d'acte (pas nécessairement à chaque frame).
  // `cosmetic.heureDoree` : déblocage du grade « Officier de liaison » (Annexe 1, 8.1) — teinte
  // dorée appliquée par-dessus l'état de crise, purement décorative.
  update({ resources, acteIndex, cosmetic }) {
    const heureDoree = !!cosmetic?.heureDoree;
    if (this.pays === 'maroc') {
      const eau = resources.EAU ?? 55;
      const density = 0.002 + Math.max(0, (60 - eau) / 60) * 0.028;
      this.scene.fog.density = density;
      this.scene.fog.color.set(heureDoree ? 0xe8845c : 0xf0b8a0);
    } else {
      const inf = resources.INF ?? 55;
      const tempete = acteIndex === 1;
      this.targetWaterLevel = tempete ? -2 + (1 - inf / 100) * 4 : -2;
      this.rain.visible = tempete;
      const intensity = tempete ? 1.4 : 0;
      for (const light of this.emergencyLights) light.intensity = intensity;
      this.water.material.color.set(heureDoree ? 0xe08a5c : 0x1c5a8c);
    }
  }

  animate(dt) {
    this.clock += dt;
    if (this.pays === 'egypte') {
      if (this.targetWaterLevel !== undefined) {
        this.waterLevel += (this.targetWaterLevel - this.waterLevel) * Math.min(1, dt * 0.6);
        this.water.position.y = this.waterLevel;
      }
      if (this.rain.visible) {
        const pos = this.rain.geometry.attributes.position;
        for (let i = 0; i < RAIN_COUNT; i++) {
          const y = pos.getY(i) - dt * 40;
          pos.setY(i, y < 0 ? 60 : y);
        }
        pos.needsUpdate = true;
      }
      for (const light of this.emergencyLights) {
        light.intensity = light.intensity > 0 ? 1.1 + Math.sin(this.clock * 3 + light.position.x) * 0.3 : 0;
      }
    }
  }
}

export function animateHalos(interactables, clock) {
  for (const it of interactables) {
    it.halo.material.opacity = 0.5 + Math.sin(clock * 2 + it.worldPosition.x) * 0.3;
    it.halo.rotation.z += 0.01;
    it.icon.position.y = 10 + Math.sin(clock * 2 + it.worldPosition.z) * 0.6;
    it.icon.rotation.y += 0.02;
  }
}
