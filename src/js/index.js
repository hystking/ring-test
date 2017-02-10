import RendererStats from "./renderer-stats"
import TimeSkipper from "./time-skipper"
import _ from "lodash"

/*
var reflectionTexture = new THREE.CubeTextureLoader().load([
  "./img/cubemap/posx.jpg",
  "./img/cubemap/negx.jpg",
  "./img/cubemap/posy.jpg",
  "./img/cubemap/negy.jpg",
  "./img/cubemap/posz.jpg",
  "./img/cubemap/negz.jpg",
]);
*/

const reflectionTexture = new THREE.TextureLoader().load("./img/equirecmap.jpg");
reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;
reflectionTexture.magFilter = THREE.LinearFilter;
reflectionTexture.minFilter = THREE.LinearMipMapLinearFilter;

var hairline = new THREE.TextureLoader().load("./img/hairline.png");
hairline.repeat.set(8, 2);
hairline.wrapS = hairline.wrapT = THREE.RepeatWrapping;

function pingPong(t) {
  t = t % (Math.PI * 2)
  if(t < Math.PI) {
    return t / Math.PI
  }
  return 1 - (t - Math.PI) / Math.PI
}

function generateRingGeometry(radius, width) {
  const points = [];
  const segments = 127
  for(let i=0; i<segments; i++) {
    const theta = Math.PI * 2 * i / segments;
    const wave = theta < Math.PI ? 1 : Math.pow(pingPong((theta - Math.PI) * 4), 2) * .2 + 1
    let x = Math.sin(theta) * (2 - Math.sin(theta)) * wave * .2;
    let y = Math.cos(theta) * width;
    /*
    if(x < -.555) {
      x = (x + -.555 * 7) / 8
    }
   */
    if(x > .15) {
      x = (x + .15 * 7) / 8
    }
    x -= radius;
    points.push(new THREE.Vector2(x, y));
  }
  points.push(points[0].clone());
  return new THREE.LatheBufferGeometry(points, 128);
}

function generateRingMesh(radius, width, material_name) {
  /*
  var material = new THREE.MeshStandardMaterial({
    envMap: reflectionTexture,
    roughness: .74,
    metalness: .99,
    color: 0xf6fffc,
    bumpMap: hairline,
    bumpScale: -.0007,
  });
  */

  var material = new THREE.MeshStandardMaterial({
    envMap: reflectionTexture,
    roughness: .4,
    metalness: .95,
    color:
        material_name == "platinum" ? 0xffffff
      : material_name == "gold" ? 0xffd280 
      : material_name == "red_gold" ? 0xffccaa
      : 0xfefffc,
    bumpMap: hairline,
    bumpScale: -.0002,
  });

  const geometry = generateRingGeometry(radius, width);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.z = Math.PI / 2;
  mesh.rotation.y = - Math.PI / 6;
  mesh.position.y = 0;
  return mesh;
}

export default function index() {
  const width = view.offsetWidth;
  const height = view.offsetHeight;

  view.setAttribute("width", width * 2);
  view.setAttribute("height", height * 2);

  const renderer = new THREE.WebGLRenderer({
    canvas: view,
    antialias: true,
  });
  renderer.setClearColor(0xffffff, 1);
  const rendererStats = new RendererStats(renderer);
  document.body.appendChild(rendererStats.dom);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 200);
  camera.position.set(0, 10, -30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false
  controls.maxDistance = 40
  controls.minDistance = 15
  controls.target.set(0, 0, 0)
  controls.maxPolarAngle = Math.PI * .45


  /* Floor */

  const floorMirror = new THREE.Mirror(renderer, camera, {
    textureWidth: 2048,
    textureHeight: 2048,
    color: 0xaaaaad,
  });

  const floorGeometry = new THREE.PlaneBufferGeometry(100, 100, 4);
  const floor = new THREE.Mesh(floorGeometry, floorMirror.material);
  floor.rotation.set(- Math.PI / 2, 0, 0);
  floor.add(floorMirror);
  scene.add(floor);

  /* Lights */

  const pointLight = new THREE.PointLight( 0xf0f0ff, .4);
  pointLight.position.set(-100, 300, -100);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, .5);
  directionalLight.position.set(0, -100, -100);

  scene.add(pointLight);
  scene.add(directionalLight);

  let currentMesh = null

  function changeRing(radius, width, material_name) {
    if(currentMesh) {
      currentMesh.geometry.dispose();
      scene.remove(currentMesh);
    }
    currentMesh = generateRingMesh(radius, width, material_name);
    scene.add(currentMesh);
    floor.position.set(0, -radius - .555, 0);
  }

  function updateRing() {
    const radius = 4.5 + (radiusSlider.value / 100);
    const width = .5 + (widthSlider.value / 100);
    const material_name = _.find(document.getElementsByName("material"), dom => dom.checked).value
    changeRing(radius, width, material_name);
  }

  function tick(time) {
    controls.update();
    timeSkipper.exec(time);
    requestAnimationFrame(tick);
  }

  function update(time) {
    floorMirror.render();
    renderer.render(scene, camera);
    rendererStats.update(time);
  }

  const timeSkipper = new TimeSkipper(update, 60);

  radiusSlider.addEventListener("change", updateRing)
  widthSlider.addEventListener("change", updateRing)
  _.forEach(document.getElementsByName("material"), dom => dom.addEventListener("change", updateRing))
  requestAnimationFrame(tick);
  updateRing();
}
