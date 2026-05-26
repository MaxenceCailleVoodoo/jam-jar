import * as THREE from 'three';
import { ARENA } from '../model/LevelConfig.js';

export class UniverseWorld {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'universe';
    scene.add(this.root);
    this.decor = new THREE.Group();
    this.root.add(this.decor);
    this.particles = [];
    this.animTime = 0;
  }

  apply(universe) {
    this.clear();
    const h = ARENA.half;

    this.scene.background = new THREE.Color(universe.sky);
    this.scene.fog = new THREE.Fog(universe.fog, 25, 70);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(h * 2.2, h * 2.2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: universe.floor,
        roughness: 0.85,
        metalness: 0.1,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.root.add(floor);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(h * 0.85, h * 0.95, 64),
      new THREE.MeshBasicMaterial({
        color: universe.accent,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    this.root.add(ring);

    const amb = new THREE.AmbientLight(universe.light, 0.45);
    amb.name = 'amb';
    this.root.add(amb);

    const sun = new THREE.DirectionalLight(universe.accent, 1.1);
    sun.position.set(12, 28, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.name = 'sun';
    this.root.add(sun);

    const fill = new THREE.PointLight(universe.accent, 0.8, 50);
    fill.position.set(-10, 8, -8);
    fill.name = 'fill';
    this.root.add(fill);

    this.buildProps(universe, h);
    this.buildBoundaryWalls(universe, h);
  }

  buildBoundaryWalls(universe, h) {
    const wallMat = new THREE.MeshStandardMaterial({
      color: universe.floorAccent,
      transparent: true,
      opacity: 0.35,
      emissive: universe.accent,
      emissiveIntensity: 0.1,
    });
    const wallGeo = new THREE.BoxGeometry(h * 2.2, 3, 0.4);
    const positions = [
      [0, 1.5, -h],
      [0, 1.5, h],
      [-h, 1.5, 0],
      [h, 1.5, 0],
    ];
    const scales = [
      [1, 1, 1],
      [1, 1, 1],
      [0.018, 1, 1],
      [0.018, 1, 1],
    ];
    positions.forEach((pos, i) => {
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(...pos);
      wall.scale.set(scales[i][0] / (i < 2 ? 1 : 1), 1, scales[i][2] / (i >= 2 ? 1 : 1));
      if (i >= 2) wall.rotation.y = Math.PI / 2;
      this.decor.add(wall);
    });
  }

  buildProps(universe, h) {
    const mat = new THREE.MeshStandardMaterial({
      color: universe.accent,
      emissive: universe.accent,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    });

    const count = 24;
    for (let i = 0; i < count; i++) {
      let mesh;
      const angle = (i / count) * Math.PI * 2;
      const dist = h * (0.55 + Math.random() * 0.35);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      switch (universe.prop) {
        case 'jars':
          mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8), mat);
          mesh.position.set(x, 0.6, z);
          break;
        case 'grid':
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), mat);
          mesh.position.set(x, 1.5, z);
          break;
        case 'stars':
          mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), mat);
          mesh.position.set(x, 1 + Math.random() * 3, z);
          this.particles.push({ mesh, float: Math.random() * 6 });
          break;
        case 'crystals':
          mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 4), mat);
          mesh.position.set(x, 0.9, z);
          break;
        case 'rocks':
          mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 0), mat);
          mesh.position.set(x, 0.5, z);
          break;
        case 'lollipops':
          mesh = new THREE.Group();
          const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), mat);
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), mat);
          head.position.y = 1;
          mesh.add(stick, head);
          mesh.position.set(x, 0, z);
          break;
        case 'temple':
          mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4, 1.5), mat);
          mesh.position.set(x, 2, z);
          break;
        default:
          mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
          mesh.position.set(x, 0.4, z);
      }

      mesh.rotation.y = Math.random() * Math.PI * 2;
      this.decor.add(mesh);
    }

    for (let i = 0; i < 12; i++) {
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: universe.accent, transparent: true, opacity: 0.7 }),
      );
      orb.position.set(
        (Math.random() - 0.5) * h * 1.6,
        2 + Math.random() * 6,
        (Math.random() - 0.5) * h * 1.6,
      );
      this.decor.add(orb);
      this.particles.push({ mesh: orb, float: Math.random() * 8 });
    }
  }

  update(delta) {
    this.animTime += delta;
    for (const p of this.particles) {
      p.mesh.position.y += Math.sin(this.animTime * 2 + p.float) * delta * 0.5;
      p.mesh.rotation.y += delta * 0.5;
    }
    this.decor.rotation.y = Math.sin(this.animTime * 0.08) * 0.02;
  }

  clear() {
    const dispose = (obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    };

    this.decor.traverse(dispose);
    this.decor.clear();
    this.particles = [];

    [...this.root.children].forEach((child) => {
      if (child === this.decor) return;
      child.traverse(dispose);
      this.root.remove(child);
    });
    this.scene.fog = null;
  }
}
