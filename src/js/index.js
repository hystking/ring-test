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

const hairlineImage = new Image();
hairlineImage.src = "./img/hairline.png";

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
    if(x > .15) {
      x = (x + .15 * 7) / 8
    }
    x -= radius;
    points.push(new THREE.Vector2(x, y));
  }
  points.push(points[0].clone());
  return new THREE.LatheBufferGeometry(points, 128);
}

function generateEmbossTexture(text) {
  const canvasSize = 1024;
  const ctx = createCtx(canvasSize, canvasSize);
  const bokashiCtx = createCtx(canvasSize, canvasSize);
  const normalCtx = createCtx(canvasSize, canvasSize);

  ctx.translate(canvasSize / 2, canvasSize * 3 / 4);
  ctx.scale(-1, -1);
  ctx.font = `${canvasSize / 8}px Serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.fillText(text, 0, 0);

  generateBokashi(ctx, bokashiCtx);
  generateNormal(bokashiCtx, normalCtx);
  generateBokashi(normalCtx, normalCtx);

  const embossNormalTexture = new THREE.Texture(normalCtx.canvas);
  embossNormalTexture.repeat.set(5, 1);
  // embossNormalTexture.wrapS = embossNormalTexture.wrapT = THREE.RepeatWrapping;
  embossNormalTexture.needsUpdate = true;

  return embossNormalTexture;
}

function generateRingMaterial(material_name, text) {
  const embossNormalTexture = generateEmbossTexture(text);
  const material = new THREE.MeshStandardMaterial({
    envMap: reflectionTexture,
    roughness: .4,
    metalness: .95,
    color:
        material_name == "platinum" ? 0xffffff
      : material_name == "gold" ? 0xffd280 
      : material_name == "red_gold" ? 0xffccaa
      : 0xfefffc,
    // map: embossNormalTexture,
    bumpMap: hairline,
    bumpScale: -.0004,
    normalMap: embossNormalTexture,
    normalScale: new THREE.Vector2(-1, -1),
  });
  return material
}

function generateRingMesh(radius, width, material_name, text) {
  const geometry = generateRingGeometry(radius, width);
  const material = generateRingMaterial(material_name, text);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.z = Math.PI / 2;
  mesh.rotation.y = - Math.PI / 6;
  mesh.position.y = 0;
  return mesh;
}

const SQRT2 = Math.sqrt(2);

function createCtx(width, height) {
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

function generateBokashi(srcCtx, dstCtx) {
  const {width, height} = srcCtx.canvas;
  const srcImageData = srcCtx.getImageData(0, 0, width, height);
  const dstImageData = dstCtx.getImageData(0, 0, width, height);
  const srcData = srcImageData.data;
  const dstData = dstImageData.data;

  function i(x, y) {
    if(x < 0) {
      x = 0;
    }
    if(x > width - 1) {
      x = width - 1;
    }
    if(y < 0) {
      y = 0;
    }
    if(y > height - 1) {
      y = height - 1;
    }
    return x + y * width;
  }

  function gaussianAround(data, x, y, k) {
    return (
      + data[i(x, y) * 4 + k] * 4 /16
      + data[i(x + 1, y) * 4 + k] * 2 /16
      + data[i(x - 1, y) * 4 + k] * 2 /16
      + data[i(x, y + 1) * 4 + k] * 2 /16
      + data[i(x, y - 1) * 4 + k] * 2 /16
      + data[i(x + 1, y + 1) * 4 + k] * 1 /16
      + data[i(x - 1, y + 1) * 4 + k] * 1 /16
      + data[i(x + 1, y - 1) * 4 + k] * 1 /16
      + data[i(x - 1, y - 1) * 4 + k] * 1 /16
    ) | 0;
  }

  for(let y=0; y<height; y++){
    for(let x=0; x<width; x++){
      const k = i(x, y) * 4;
      dstData[k] = gaussianAround(srcData, x, y, 0);
      dstData[k+1] = gaussianAround(srcData, x, y, 1);
      dstData[k+2] = gaussianAround(srcData, x, y, 2);
      dstData[k+3] = gaussianAround(srcData, x, y, 3);
    }
  }

  dstCtx.putImageData(dstImageData, 0, 0);
}

function generateNormal(srcCtx, dstCtx, scale = 1) {
  const {width, height} = srcCtx.canvas;
  const srcImageData = srcCtx.getImageData(0, 0, width, height);
  const dstImageData = dstCtx.getImageData(0, 0, width, height);
  const srcData = srcImageData.data;
  const dstData = dstImageData.data;
  const tempData = new Float32Array(width * height);

  function i(x, y) {
    if(x < 0) {
      x = 0;
    }
    if(x > width - 1) {
      x = width - 1;
    }
    if(y < 0) {
      y = 0;
    }
    if(y > height - 1) {
      y = height - 1;
    }
    return x + y * width;
  }

  for(let y=0; y<height; y++){
    for(let x=0; x<width; x++){
      const k = i(x, y) * 4;
      const r = k;
      const g = k + 1;
      const b = k + 2;
      const a = k + 3;

      tempData[i(x, y)] = (srcData[r] + srcData[g] + srcData[b]) / (255 * 3);
    }
  }

  for(let y=0; y<height; y++){
    for(let x=0; x<width; x++){
      const k = i(x, y) * 4;
      const r = k;
      const g = k + 1;
      const b = k + 2;
      const a = k + 3;

      const dx =(
        tempData[i(x - 1, y)] * -2 + tempData[i(x - 1, y - 1)]  * -1 + tempData[i(x - 1, y + 1)] * -1 +
          tempData[i(x + 1, y)] * 2 + tempData[i(x + 1, y - 1)] * 1 + tempData[i(x + 1, y + 1)] * 1
      ) / SQRT2 * scale;

      const dy =(
        tempData[i(x, y - 1)] * -2 + tempData[i(x - 1, y - 1)]  * -1 + tempData[i(x + 1, y - 1)] * -1 +
          tempData[i(x, y + 1)] * 2 + tempData[i(x - 1, y + 1)] * 1 + tempData[i(x + 1, y + 1)] * 1
      ) / SQRT2 * scale;

      const dxDySqNorm = dx * dx + dy * dy;
      const dz = dxDySqNorm > 1 ? 1 - Math.sqrt(dxDySqNorm　- 1) : Math.sqrt(1 - dxDySqNorm);

      dstData[r] = (dx * .5 + .5) * 255 | 0;
      dstData[g] = (dy * .5 + .5) * 255 | 0;
      dstData[b] = dz * 255  | 0;
      dstData[a] = 255;
    }
  }
  dstCtx.putImageData(dstImageData, 0, 0);
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
  camera.position.set(0, 10, 30);
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

  function changeRing(radius, width, material_name, text) {
    if(currentMesh) {
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
      currentMesh.material.normalMap.dispose();
      scene.remove(currentMesh);
    }
    currentMesh = generateRingMesh(radius, width, material_name, text);
    scene.add(currentMesh);
    floor.position.set(0, -radius - .555, 0);
  }

  function updateRing() {
    const radius = 4.5 + (radiusSlider.value / 100);
    const width = .5 + (widthSlider.value / 100);
    const material_name = _.find(document.getElementsByName("material"), dom => dom.checked).value
    const text = embossText.value;
    changeRing(radius, width, material_name, text);
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
  embossText.addEventListener("change", updateRing)
  requestAnimationFrame(tick);
  updateRing();
}
