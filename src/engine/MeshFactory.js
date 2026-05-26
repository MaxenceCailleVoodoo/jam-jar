import * as THREE from 'three';

export function createPlayerMesh() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
  );
  body.position.y = 0.9;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 }),
  );
  head.position.y = 1.55;
  group.add(head);

  const gun = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.15, 1.1),
    new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x554400, emissiveIntensity: 0.3 }),
  );
  gun.position.set(0.35, 1.0, 0.6);
  gun.name = 'gun';
  group.add(gun);

  const legMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6), legMat);
  legL.position.set(-0.2, 0.35, 0);
  const legR = legL.clone();
  legR.position.x = 0.2;
  group.add(legL, legR);

  group.userData.gun = gun;
  return group;
}

export function createZombieMesh(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 10, 10),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.35,
      emissive: color,
      emissiveIntensity: 0.15,
    }),
  );
  body.position.y = 0.85;
  group.add(body);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), eyeMat);
    eye.position.set(side * 0.28, 1.05, 0.5);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), pupilMat);
    pupil.position.set(side * 0.28, 1.05, 0.62);
    group.add(pupil);
  }

  const legMat = new THREE.MeshStandardMaterial({ color: 0xaa2222 });
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 5), legMat);
    leg.position.set(side * 0.22, 0.25, 0);
    leg.rotation.z = side * 0.25;
    leg.name = 'leg';
    group.add(leg);
  }

  return group;
}

export function createBossMesh(color) {
  const group = new THREE.Group();

  const jar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.8, 5, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffcc44,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2,
      emissive: color,
      emissiveIntensity: 0.25,
    }),
  );
  jar.position.y = 2.5;
  group.add(jar);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.4, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: 0xcc3333, metalness: 0.6, roughness: 0.3 }),
  );
  lid.position.y = 5.2;
  group.add(lid);

  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff0000, emissiveIntensity: 0.5 });
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), eyeMat);
    eye.position.set(side * 0.9, 3.2, 2.2);
    group.add(eye);
  }

  const label = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.8, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xffffff }),
  );
  label.position.set(0, 2.5, 2.85);
  group.add(label);

  group.userData.isBoss = true;
  return group;
}

export function createBulletMesh() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xffaa00,
      emissiveIntensity: 0.8,
    }),
  );
}
