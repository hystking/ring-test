export default function index() {
  const width = view.offsetWidth;
  const height = view.offsetHeight;

  view.setAttribute("width", width);
  view.setAttribute("height", height);

  const renderer = new THREE.WebGLRenderer({canvas: view});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 200);
  camera.position.set(0, 10, -30);
  camera.lookAt(new THREE.Vector3(0, 0, 0))

  const geometry = new THREE.TorusGeometry(7, 3, 32, 64);
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function tick(time) {
    mesh.rotation.y = time * .001;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
