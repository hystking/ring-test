import Delayer from "./delayer"

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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 200);
  const cameraTarget = new THREE.PerspectiveCamera(60, width / height, 1, 200);
  cameraTarget.position.set(0, 10, -30);
  camera.position.copy(cameraTarget.position);
  cameraTarget.lookAt(new THREE.Vector3(0, 0, 0));
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  const cameraDelayer = new Delayer({
    object: camera,
    target: cameraTarget,
    delay: .9,
  })
  const controls = new THREE.OrbitControls(cameraTarget, renderer.domElement);
  controls.enablePan = false
  controls.maxDistance = 40
  controls.minDistance = 15
  controls.target.set(0, 0, 0)
  controls.maxPolarAngle = Math.PI * .45

  const floorMirror = new THREE.Mirror(renderer, camera, {
    textureWidth: 2048,
    textureHeight: 2048,
    color: 0xaaaaad,
  });

  var reflectionCube = new THREE.CubeTextureLoader().load([
    "./img/cubemap/posx.jpg",
    "./img/cubemap/negx.jpg",
    "./img/cubemap/posy.jpg",
    "./img/cubemap/negy.jpg",
    "./img/cubemap/posz.jpg",
    "./img/cubemap/negz.jpg",
  ]);

  var hairline = new THREE.TextureLoader().load("./img/hairline.png");
  hairline.repeat.set(8, 1);
  hairline.wrapS = hairline.wrapT = THREE.RepeatWrapping;

  const materialParams = {
    envMap: reflectionCube,
    roughness: .74,
    metalness: .99,
    color: 0xf6fffc,
    bumpMap: hairline,
    bumpScale: -.0005,
  };

  var material = new THREE.MeshStandardMaterial(Object.assign({}, materialParams))

  const points = [];
  const segments = 128
  for(let i=0; i<segments; i++) {
    const theta = Math.PI * 2 * i / segments;
    points.push(new THREE.Vector2(
      theta < Math.PI ? Math.sin(theta) * .3 - 6 : Math.sin(theta) * .5 - 6,
      Math.cos(theta) * 1,
    ));
  }
  points.push(points[0].clone());
  const geometry = new THREE.LatheBufferGeometry(points, 128);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.z = Math.PI / 2;
  mesh.rotation.y = - Math.PI / 6;
  mesh.position.y = .15;

  scene.add(mesh);

  const floorGeometry = new THREE.PlaneBufferGeometry(100, 100, 4);

  const floor = new THREE.Mesh(floorGeometry, floorMirror.material);
  floor.rotation.set(- Math.PI / 2, 0, 0);
  floor.position.set(0, -6.3, 0);
  floor.add(floorMirror);

  scene.add(floor);

  const pointLight = new THREE.PointLight( 0xf0f0ff, .9);
  pointLight.position.set(-100, 300, -100);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, .3);
  directionalLight.position.set(0, -100, -100);

  scene.add(directionalLight);
  scene.add(pointLight);

  function tick(time) {
    controls.update();
    cameraDelayer.update();
    floorMirror.render();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
