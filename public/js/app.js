(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=routes;var _index=require("./index");var _index2=_interopRequireDefault(_index);function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}function routes(path){switch(path){case"/":case"/index.html":default:return(0,_index2.default)()}}routes(window.location.pathname)},{"./index":2}],2:[function(require,module,exports){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.default=index;function index(){var width=view.offsetWidth;var height=view.offsetHeight;view.setAttribute("width",width);view.setAttribute("height",height);var renderer=new THREE.WebGLRenderer({canvas:view,antialias:true});renderer.setClearColor(16777215,1);var scene=new THREE.Scene;var camera=new THREE.PerspectiveCamera(60,width/height,1,200);camera.position.set(0,10,-30);camera.lookAt(new THREE.Vector3(0,0,0));var floorMirror=new THREE.Mirror(renderer,camera,{textureWidth:2048,textureHeight:2048,color:11184810});var controls=new THREE.OrbitControls(camera,renderer.domElement);var reflectionCube=(new THREE.CubeTextureLoader).load(["./img/cubemap/posx.jpg","./img/cubemap/negx.jpg","./img/cubemap/posy.jpg","./img/cubemap/negy.jpg","./img/cubemap/posz.jpg","./img/cubemap/negz.jpg"]);var hairline=(new THREE.TextureLoader).load("./img/hairline.png");hairline.repeat.set(1,2);hairline.wrapS=hairline.wrapT=THREE.RepeatWrapping;var materialParams={envMap:reflectionCube,roughness:.6,metalness:.99,color:16777215,bumpMap:hairline,bumpScale:-.002};var material=new THREE.MeshStandardMaterial(Object.assign({},materialParams));var points=[];var segments=64;for(var i=0;i<segments;i++){var theta=Math.PI*2*i/segments;points.push(new THREE.Vector2(theta<Math.PI?Math.sin(theta)*.3-6:Math.sin(theta)*.5-6,Math.cos(theta)*1))}points.push(points[0].clone());var geometry=new THREE.LatheBufferGeometry(points,64);var mesh=new THREE.Mesh(geometry,material);mesh.rotation.z=Math.PI/2;mesh.rotation.y=-Math.PI/6;mesh.position.y=.15;scene.add(mesh);var floorGeometry=new THREE.PlaneBufferGeometry(100,100,4);var floor=new THREE.Mesh(floorGeometry,floorMirror.material);floor.rotation.set(-Math.PI/2,0,0);floor.position.set(0,-6.3,0);floor.add(floorMirror);scene.add(floor);var pointLight=new THREE.PointLight(15790335,.9);pointLight.position.set(-100,300,-100);var directionalLight=new THREE.DirectionalLight(16777215,.3);directionalLight.position.set(0,-100,-100);scene.add(directionalLight);scene.add(pointLight);function tick(time){floorMirror.render();renderer.render(scene,camera);requestAnimationFrame(tick)}requestAnimationFrame(tick)}},{}]},{},[1]);
