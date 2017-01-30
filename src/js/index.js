export default function index() {
  const width = view.offsetWidth;
  const height = view.offsetHeight;

  view.setAttribute("width", width);
  view.setAttribute("height", height);

  const renderer = new THREE.WebGLRenderer({
    canvas: view,
    antialias: true,
  });
  renderer.setClearColor(0xffffff, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 200);
  camera.position.set(0, 10, -30);
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  var reflectionCube = new THREE.CubeTextureLoader().load([
    "./img/cubemap/posx.jpg",
    "./img/cubemap/negx.jpg",
    "./img/cubemap/posy.jpg",
    "./img/cubemap/negy.jpg",
    "./img/cubemap/posz.jpg",
    "./img/cubemap/negz.jpg",
  ]);

  var material = new THREE.MeshStandardMaterial({
    envMap: reflectionCube,
    roughness: .7,
    metalness: .98,
    color: 0xffffff,
  });


  const points = [];
  const segments = 64
  for(let i=0; i<segments; i++) {
    const theta = Math.PI * 2 * i / (segments - 1);
    points.push(new THREE.Vector2(
      theta < Math.PI ? Math.sin(theta) * .3 - 6 : Math.sin(theta) * .5 - 6,
      Math.cos(theta) * 1,
    ));
  }
  // const geometry = new THREE.TorusGeometry(7, 1.5, 32, 64);
  const geometry = new THREE.LatheBufferGeometry(points, 64);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const pointLight = new THREE.PointLight( 0xffffee, .7);
  pointLight.position.set(-10000, 30000, -10000);

  const directionalLight = new THREE.DirectionalLight( 0xffffff, .4);
  directionalLight.position.set(0, -100, -100);

  scene.add(directionalLight);
  scene.add(pointLight);

  function tick(time) {
    mesh.rotation.y = time * .0001;
    mesh.rotation.x = time * .0002;
    mesh.rotation.z = time * .0003;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
