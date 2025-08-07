import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const splash = document.getElementById('splash');
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b0c);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(12, 5, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.49;

const hemi = new THREE.HemisphereLight(0xe8f2ff, 0x080808, 0.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(50,80,20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
scene.add(sun);

// Ground
const groundMat = new THREE.MeshStandardMaterial({color:0x202225, roughness:0.95, metalness:0.0});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400,400), groundMat);
ground.rotation.x = -Math.PI/2;
ground.receiveShadow = true;
scene.add(ground);

// UI helpers
const caption = document.getElementById('caption');
function setCaption(t){ caption.textContent = t; }

// Hotspots
const hotspotGeo = new THREE.SphereGeometry(0.2, 16, 16);
const hotspotMat = new THREE.MeshBasicMaterial({color:0x00e0a4});
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hotspots = [];
function makeHotspot(pos, text, onHit){
  const m = new THREE.Mesh(hotspotGeo, hotspotMat.clone());
  m.position.copy(pos);
  m.userData = { text, onHit };
  m.layers.set(1);
  scene.add(m); hotspots.push(m);
  return m;
}
canvas.addEventListener('pointerdown', (e)=>{
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left)/rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top)/rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(hotspots, false);
  if(hits[0]){
    const h = hits[0].object.userData;
    setCaption(h.text);
    if(h.onHit) h.onHit();
  }
});

// First-person lite
let vel = new THREE.Vector3();
let dir = new THREE.Vector3();
let forward=0, strafe=0;
const keys = {};
addEventListener('keydown', e=>keys[e.code]=true);
addEventListener('keyup', e=>keys[e.code]=false);

const joystick = document.getElementById('joystick');
const stick = document.getElementById('stick');
let joyActive=false, joyBase, joyVec={x:0,y:0};

function setJoystick(dx, dy){
  const len = Math.hypot(dx, dy);
  const max = 42;
  const cl = len>max?max:len;
  const ang = Math.atan2(dy, dx);
  stick.style.transform = `translate(calc(-50% + ${Math.cos(ang)*cl}px), calc(-50% + ${Math.sin(ang)*cl}px))`;
  joyVec.x = (cl/max) * Math.cos(ang);
  joyVec.y = (cl/max) * Math.sin(ang);
}

joystick.addEventListener('pointerdown', e=>{
  joyActive=true;
  joyBase={x:e.clientX,y:e.clientY};
  joystick.setPointerCapture(e.pointerId);
});
joystick.addEventListener('pointermove', e=>{
  if(!joyActive) return;
  setJoystick(e.clientX-joyBase.x, e.clientY-joyBase.y);
});
addEventListener('pointerup', ()=>{
  joyActive=false; joyVec.x=0; joyVec.y=0; stick.style.transform='translate(-50%,-50%)';
});

// Camera rig
const rig = new THREE.Object3D();
rig.position.set(0,1.7,5);
scene.add(rig);
rig.add(camera);

// Audio stub
const audio = new Audio();
audio.loop = true;
audio.src = 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAA';
let audioOn = false;
document.getElementById('muteBtn').onclick=()=>{
  audioOn=!audioOn;
  if(audioOn) { audio.play(); } else { audio.pause(); }
};

// Chapters
const chapters = {
  copenhill: {
    title: "CopenHill — power plant as public landscape",
    enter: ()=>{
      clearSceneContent();
      rig.position.set(-10,1.7,12);
      camera.lookAt(0,4,0);
      const shape = new THREE.Shape();
      shape.moveTo(-12,0); shape.lineTo(12,0); shape.lineTo(12,8); shape.lineTo(-12,2); shape.lineTo(-12,0);
      const geo = new THREE.ExtrudeGeometry(shape, {depth: 30, bevelEnabled:false});
      geo.rotateY(Math.PI/2);
      const mat = new THREE.MeshStandardMaterial({color:0x9aa3a8, metalness:0.2, roughness:0.6});
      const mass = new THREE.Mesh(geo, mat); mass.castShadow=true; mass.receiveShadow=true;
      mass.position.set(0,0,0);
      scene.add(mass);

      const pathPts = [];
      for(let i=0;i<80;i++){
        const t = i/79;
        const x = THREE.MathUtils.lerp(-10.5, 10.5, t);
        const z = (Math.sin(t*Math.PI*2)*4.0);
        const y = THREE.MathUtils.lerp(7.5, 1.0, t) + 0.2;
        pathPts.push(new THREE.Vector3(x,y,z));
      }
      const curve = new THREE.CatmullRomCurve3(pathPts);
      const tube = new THREE.TubeGeometry(curve, 200, 0.15, 8, false);
      const tmesh = new THREE.Mesh(tube, new THREE.MeshStandardMaterial({color:0x00e0a4, metalness:0.0, roughness:0.4}));
      tmesh.castShadow = true; scene.add(tmesh);

      const p = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({size:0.25, color:0xffffff, transparent:true, opacity:0.6}));
      const N=200; const pos = new Float32Array(N*3);
      for(let i=0;i<N;i++){ pos[i*3]= -13 + Math.random()*2; pos[i*3+1]=8+Math.random()*2; pos[i*3+2]=(Math.random()-0.5)*2; }
      p.geometry.setAttribute('position', new THREE.BufferAttribute(pos,3));
      scene.add(p);

      makeHotspot(new THREE.Vector3(-5,1.2,6), "A public slope crowns a working plant — a city-scale hybrid.", ()=>{});
      makeHotspot(new THREE.Vector3(8,2,0), "Route wraps the roof: sport stitched into infrastructure.", ()=>{});
      setCaption("CopenHill: power + play. Tap the green path or walk the roof.");
    }
  },
  eight: {
    title: "8 House — courtyard loop as neighborhood",
    enter: ()=>{
      clearSceneContent();
      rig.position.set(0,1.7,18);
      camera.lookAt(0,0,0);
      const loop = new THREE.Shape();
      const r=6, s=1.1;
      loop.absellipse(-r,0, r, r*s, 0, Math.PI*2, false, 0);
      const hole = new THREE.Path();
      hole.absellipse(+r,0, r, r*s, 0, Math.PI*2, false, 0);
      loop.holes.push(hole);

      const base = new THREE.ExtrudeGeometry(loop, {depth: 12, bevelEnabled:false});
      base.rotateX(-Math.PI/2);
      base.translate(0,0,0);
      const mat = new THREE.MeshStandardMaterial({color:0xd4d1cc, roughness:0.8});
      const mass = new THREE.Mesh(base, mat); mass.castShadow=true; mass.receiveShadow=true;
      scene.add(mass);

      const rampPts=[];
      for(let i=0;i<240;i++){
        const t=i/239, ang=t*Math.PI*2;
        const rad= r*1.8;
        rampPts.push(new THREE.Vector3(Math.cos(ang)*rad, 1 + t*8, Math.sin(ang)*rad));
      }
      const ramp = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rampPts), 400, 0.12, 8, false);
      const rmesh = new THREE.Mesh(ramp, new THREE.MeshStandardMaterial({color:0x00e0a4}));
      rmesh.castShadow=true; scene.add(rmesh);

      makeHotspot(new THREE.Vector3(0,1.3,0), "Two courts, one loop: the ramp ties homes, work, and street into a continuous life.", ()=>{});
      setCaption("8 House: a looped neighborhood. Follow the ribbon.");
    }
  },
  via: {
    title: "VIA 57 West — tetra-courtyard tower",
    enter: ()=>{
      clearSceneContent();
      rig.position.set(14,2,20);
      camera.lookAt(0,5,0);
      const geo = new THREE.ConeGeometry(15, 22, 4, 1, false);
      geo.rotateY(Math.PI/4);
      const mat = new THREE.MeshStandardMaterial({color:0xbfc6cd, metalness:0.1, roughness:0.7, flatShading:true});
      const mass = new THREE.Mesh(geo, mat); mass.position.y=11; mass.castShadow=true; mass.receiveShadow=true;
      scene.add(mass);

      const court = new THREE.Mesh(new THREE.SphereGeometry(8, 48, 24), new THREE.MeshStandardMaterial({color:0x111214, metalness:0.0, roughness:1.0}));
      court.position.set(0,7,0);
      scene.add(court);

      const pool = new THREE.Mesh(new THREE.BoxGeometry(20,0.1,6), new THREE.MeshStandardMaterial({color:0x0e1f2b, metalness:0.0, roughness:0.2}));
      pool.position.set(0,0.05, -10);
      pool.receiveShadow=true; scene.add(pool);

      makeHotspot(new THREE.Vector3(0,1.2,-6), "Courtyard brings light, air, and community into the block.", ()=>{});
      setCaption("VIA 57 West: a block folded into a courtyard tower.");
    }
  }
};

let content = [];
function clearSceneContent(){
  for(const h of hotspots){ scene.remove(h); }
  hotspots = [];
  for(const o of content){ scene.remove(o); }
  content.length = 0;
  const _add = scene.add.bind(scene);
  scene.add = (...args)=>{ content.push(...args); _add(...args); };
}
const origAdd = scene.add.bind(scene);

function activateChapter(id){
  document.querySelectorAll('#chapters button').forEach(b=>b.classList.toggle('active', b.dataset.ch===id));
  setCaption('');
  scene.add = origAdd;
  chapters[id].enter();
  history.replaceState({}, '', `?ch=${id}`);
  setCaption(chapters[id].title);
}

document.querySelectorAll('#chapters button').forEach(b=>{
  b.onclick=()=>activateChapter(b.dataset.ch);
});

document.getElementById('photoBtn').onclick=()=>{
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href=url; a.download='big_scene.png'; a.click();
};
document.getElementById('shareBtn').onclick=async()=>{
  const url = new URL(location.href);
  url.searchParams.set('ch', currentChapter);
  url.searchParams.set('cx', camera.position.x.toFixed(2));
  url.searchParams.set('cy', camera.position.y.toFixed(2));
  url.searchParams.set('cz', camera.position.z.toFixed(2));
  const shareUrl = url.toString();
  if(navigator.share){
    try{ await navigator.share({title:'BIG Interactive', url: shareUrl}); }catch{}
  } else {
    await navigator.clipboard.writeText(shareUrl);
    setCaption('Link copied to clipboard.');
  }
};

function onResize(){
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);

// Animate
let t=0, dt=0;
let last = performance.now();
let currentChapter = 'copenhill';
activateChapter('copenhill');

function animate(){
  const now = performance.now();
  dt = Math.min(0.05, (now-last)/1000);
  last = now;
  requestAnimationFrame(animate);

  // Input
  forward = (keys['KeyW']?1:0) + (keys['ArrowUp']?1:0) - (keys['KeyS']?1:0) - (keys['ArrowDown']?1:0) + (-joyVec.y);
  strafe  = (keys['KeyD']?1:0) + (keys['ArrowRight']?1:0) - (keys['KeyA']?1:0) - (keys['ArrowLeft']?1:0) + (joyVec.x);
  const speed = 4.0;
  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  dir.y=0; dir.normalize();
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).multiplyScalar(-1);
  rig.position.addScaledVector(dir, forward*dt*speed);
  rig.position.addScaledVector(right, strafe*dt*speed);

  controls.target.copy(rig.position);
  controls.update();
  renderer.render(scene, camera);
  t += dt;

  // Hide splash after first frame drawn
  if(splash && !splash.classList.contains('hide')){
    splash.classList.add('hide');
  }
}
animate();

// deep-linking
const url = new URL(location.href);
if(url.searchParams.get('ch')){
  const ch = url.searchParams.get('ch');
  if(chapters[ch]) { currentChapter=ch; activateChapter(ch); }
}
const cx = parseFloat(url.searchParams.get('cx'));
const cy = parseFloat(url.searchParams.get('cy'));
const cz = parseFloat(url.searchParams.get('cz'));
if(!Number.isNaN(cx)){ camera.position.set(cx, cy, cz); }

document.getElementById('chapters').addEventListener('click', (e)=>{
  if(e.target.dataset?.ch){
    currentChapter = e.target.dataset.ch;
  }
});
