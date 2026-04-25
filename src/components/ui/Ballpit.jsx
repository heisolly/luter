import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

class BallpitScene {
  #config;
  canvas;
  camera;
  cameraMinAspect;
  cameraMaxAspect;
  cameraFov;
  maxPixelRatio;
  minPixelRatio;
  scene;
  renderer;
  #postprocessing;
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
  render = this.#internalRender;
  onBeforeRender = () => {};
  onAfterRender = () => {};
  onAfterResize = () => {};
  #isIntersecting = false;
  #isRunning = false;
  isDisposed = false;
  #intersectionObserver;
  #resizeObserver;
  #resizeTimeout;
  #timer = new THREE.Timer();
  #time = { elapsed: 0, delta: 0 };
  #requestAnimationFrameId;

  constructor(options) {
    this.#config = { ...options };
    this.#timer.connect(document);
    this.#initCamera();
    this.#initScene();
    this.#initRenderer();
    this.resize();
    this.#initObservers();
  }

  #initCamera() {
    this.camera = new THREE.PerspectiveCamera();
    this.cameraFov = this.camera.fov;
  }

  #initScene() {
    this.scene = new THREE.Scene();
  }

  #initRenderer() {
    if (this.#config.canvas) {
      this.canvas = this.#config.canvas;
    } else if (this.#config.id) {
      this.canvas = document.getElementById(this.#config.id);
    } else {
      console.error('Three: Missing canvas or id parameter');
      return;
    }

    this.canvas.style.display = 'block';

    const rendererOptions = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
      ...(this.#config.rendererOptions ?? {})
    };

    try {
      this.renderer = new THREE.WebGLRenderer(rendererOptions);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } catch (e) {
      console.error('Failed to create WebGLRenderer:', e);
    }
  }

  #initObservers() {
    if (!(this.#config.size instanceof Object)) {
      window.addEventListener('resize', this.#handleResize.bind(this));
      if (this.#config.size === 'parent' && this.canvas.parentNode) {
        this.#resizeObserver = new ResizeObserver(this.#handleResize.bind(this));
        this.#resizeObserver.observe(this.canvas.parentNode);
      }
    }

    this.#intersectionObserver = new IntersectionObserver(this.#handleIntersection.bind(this), {
      root: null,
      rootMargin: '0px',
      threshold: 0
    });
    this.#intersectionObserver.observe(this.canvas);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange.bind(this));
  }

  #removeObservers() {
    window.removeEventListener('resize', this.#handleResize.bind(this));
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange.bind(this));
  }

  #handleIntersection(entries) {
    this.#isIntersecting = entries[0].isIntersecting;
    this.#isIntersecting ? this.#start() : this.#stop();
  }

  #handleVisibilityChange() {
    if (this.#isIntersecting) {
      document.hidden ? this.#stop() : this.#start();
    }
  }

  #handleResize() {
    if (this.#resizeTimeout) clearTimeout(this.#resizeTimeout);
    this.#resizeTimeout = setTimeout(this.resize.bind(this), 100);
  }

  resize() {
    if (!this.renderer) return;
    
    let width, height;
    if (this.#config.size instanceof Object) {
      width = this.#config.size.width;
      height = this.#config.size.height;
    } else if (this.#config.size === 'parent' && this.canvas.parentNode) {
      width = this.canvas.parentNode.offsetWidth;
      height = this.canvas.parentNode.offsetHeight;
    } else {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    this.size.width = width;
    this.size.height = height;
    this.size.ratio = width / height;

    this.#updateCamera();
    this.#updateRenderer();
    this.onAfterResize(this.size);
  }

  #updateCamera() {
    this.camera.aspect = this.size.width / this.size.height;
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.#adjustFov(this.cameraMinAspect);
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.#adjustFov(this.cameraMaxAspect);
      } else {
        this.camera.fov = this.cameraFov;
      }
    }
    this.camera.updateProjectionMatrix();
    this.updateWorldSize();
  }

  #adjustFov(aspect) {
    const fovRad = THREE.MathUtils.degToRad(this.cameraFov / 2);
    const vFov = Math.tan(fovRad) / (this.camera.aspect / aspect);
    this.camera.fov = 2 * THREE.MathUtils.radToDeg(Math.atan(vFov));
  }

  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180;
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length();
      this.size.wWidth = this.size.wHeight * this.camera.aspect;
    }
  }

  #updateRenderer() {
    if (!this.renderer) return;
    this.renderer.setSize(this.size.width, this.size.height);
    this.#postprocessing?.setSize(this.size.width, this.size.height);
    
    let pixelRatio = window.devicePixelRatio;
    if (this.maxPixelRatio && pixelRatio > this.maxPixelRatio) {
      pixelRatio = this.maxPixelRatio;
    } else if (this.minPixelRatio && pixelRatio < this.minPixelRatio) {
      pixelRatio = this.minPixelRatio;
    }
    this.renderer.setPixelRatio(pixelRatio);
    this.size.pixelRatio = pixelRatio;
  }

  #start() {
    if (this.#isRunning || !this.renderer) return;
    this.#timer.reset();
    const animate = (timestamp) => {
      this.#requestAnimationFrameId = requestAnimationFrame(animate);
      this.#timer.update(timestamp);
      this.#time.delta = this.#timer.getDelta();
      this.#time.elapsed = this.#timer.getElapsed();
      this.onBeforeRender(this.#time);
      this.render();
      this.onAfterRender(this.#time);
    };
    this.#isRunning = true;
    animate();
  }

  #stop() {
    if (this.#isRunning) {
      cancelAnimationFrame(this.#requestAnimationFrameId);
      this.#isRunning = false;
    }
  }

  #internalRender() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  clear() {
    this.scene.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => this.#disposeMaterial(m));
        } else {
          this.#disposeMaterial(obj.material);
        }
        obj.geometry.dispose();
      }
    });
    this.scene.clear();
  }

  #disposeMaterial(material) {
    Object.keys(material).forEach(key => {
      const value = material[key];
      if (value && typeof value.dispose === 'function') {
        value.dispose();
      }
    });
    material.dispose();
  }

  dispose() {
    this.#removeObservers();
    this.#stop();
    this.#timer.dispose();
    this.clear();
    this.#postprocessing?.dispose();
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.isDisposed = true;
  }
}

const interactionMap = new Map();
const mousePosition = new THREE.Vector2();
let isListeningToGlobalEvents = false;

function setupInteraction(sceneInstance) {
  const interaction = {
    position: new THREE.Vector2(),
    nPosition: new THREE.Vector2(),
    hover: false,
    touching: false,
    onEnter() {},
    onMove() {},
    onClick() {},
    onLeave() {},
    ...sceneInstance
  };

  const domElement = sceneInstance.domElement;
  if (!interactionMap.has(domElement)) {
    interactionMap.set(domElement, interaction);
    if (!isListeningToGlobalEvents) {
      document.body.addEventListener('pointermove', onPointerMove);
      document.body.addEventListener('pointerleave', onPointerLeave);
      document.body.addEventListener('click', onPointerClick);

      document.body.addEventListener('touchstart', onTouchStart, { passive: false });
      document.body.addEventListener('touchmove', onTouchMove, { passive: false });
      document.body.addEventListener('touchend', onTouchEnd, { passive: false });
      document.body.addEventListener('touchcancel', onTouchEnd, { passive: false });

      isListeningToGlobalEvents = true;
    }
  }

  interaction.dispose = () => {
    interactionMap.delete(domElement);
    if (interactionMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove);
      document.body.removeEventListener('pointerleave', onPointerLeave);
      document.body.removeEventListener('click', onPointerClick);

      document.body.removeEventListener('touchstart', onTouchStart);
      document.body.removeEventListener('touchmove', onTouchMove);
      document.body.removeEventListener('touchend', onTouchEnd);
      document.body.removeEventListener('touchcancel', onTouchEnd);

      isListeningToGlobalEvents = false;
    }
  };

  return interaction;
}

function onPointerMove(e) {
  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;
  updateInteractions();
}

function updateInteractions() {
  for (const [elem, interaction] of interactionMap) {
    const rect = elem.getBoundingClientRect();
    if (isPointInsideRect(rect)) {
      updateInteractionPosition(interaction, rect);
      if (!interaction.hover) {
        interaction.hover = true;
        interaction.onEnter(interaction);
      }
      interaction.onMove(interaction);
    } else if (interaction.hover && !interaction.touching) {
      interaction.hover = false;
      interaction.onLeave(interaction);
    }
  }
}

function onPointerClick(e) {
  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;
  for (const [elem, interaction] of interactionMap) {
    const rect = elem.getBoundingClientRect();
    updateInteractionPosition(interaction, rect);
    if (isPointInsideRect(rect)) interaction.onClick(interaction);
  }
}

function onPointerLeave() {
  for (const interaction of interactionMap.values()) {
    if (interaction.hover) {
      interaction.hover = false;
      interaction.onLeave(interaction);
    }
  }
}

function onTouchStart(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    mousePosition.x = e.touches[0].clientX;
    mousePosition.y = e.touches[0].clientY;

    for (const [elem, interaction] of interactionMap) {
      const rect = elem.getBoundingClientRect();
      if (isPointInsideRect(rect)) {
        interaction.touching = true;
        updateInteractionPosition(interaction, rect);
        if (!interaction.hover) {
          interaction.hover = true;
          interaction.onEnter(interaction);
        }
        interaction.onMove(interaction);
      }
    }
  }
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    e.preventDefault();
    mousePosition.x = e.touches[0].clientX;
    mousePosition.y = e.touches[0].clientY;

    for (const [elem, interaction] of interactionMap) {
      const rect = elem.getBoundingClientRect();
      updateInteractionPosition(interaction, rect);

      if (isPointInsideRect(rect)) {
        if (!interaction.hover) {
          interaction.hover = true;
          interaction.touching = true;
          interaction.onEnter(interaction);
        }
        interaction.onMove(interaction);
      } else if (interaction.hover && interaction.touching) {
        interaction.onMove(interaction);
      }
    }
  }
}

function onTouchEnd() {
  for (const interaction of interactionMap.values()) {
    if (interaction.touching) {
      interaction.touching = false;
      if (interaction.hover) {
        interaction.hover = false;
        interaction.onLeave(interaction);
      }
    }
  }
}

function updateInteractionPosition(interaction, rect) {
  interaction.position.x = mousePosition.x - rect.left;
  interaction.position.y = mousePosition.y - rect.top;
  interaction.nPosition.x = (interaction.position.x / rect.width) * 2 - 1;
  interaction.nPosition.y = -(interaction.position.y / rect.height) * 2 + 1;
}

function isPointInsideRect(rect) {
  return (
    mousePosition.x >= rect.left &&
    mousePosition.x <= rect.right &&
    mousePosition.y >= rect.top &&
    mousePosition.y <= rect.bottom
  );
}

const tempVecA = new THREE.Vector3();
const tempVecB = new THREE.Vector3();
const tempVecC = new THREE.Vector3();
const tempVecD = new THREE.Vector3();
const tempVecE = new THREE.Vector3();
const tempVecF = new THREE.Vector3();
const tempVecG = new THREE.Vector3();
const tempVecH = new THREE.Vector3();
const tempVecI = new THREE.Vector3();
const tempVecJ = new THREE.Vector3();

class BallPhysics {
  constructor(config) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new THREE.Vector3();
    this.initPositions();
    this.initSizes();
  }

  initPositions() {
    const { count, maxX, maxY, maxZ } = this.config;
    this.center.toArray(this.positionData, 0);
    for (let i = 1; i < count; i++) {
      const base = 3 * i;
      this.positionData[base] = THREE.MathUtils.randFloatSpread(2 * maxX);
      this.positionData[base + 1] = THREE.MathUtils.randFloatSpread(2 * maxY);
      this.positionData[base + 2] = THREE.MathUtils.randFloatSpread(2 * maxZ);
    }
  }

  initSizes() {
    const { count, size0, minSize, maxSize } = this.config;
    this.sizeData[0] = size0;
    for (let i = 1; i < count; i++) {
      this.sizeData[i] = THREE.MathUtils.randFloat(minSize, maxSize);
    }
  }

  update(time) {
    const { count, controlSphere0, gravity, friction, maxVelocity, maxX, maxY, maxZ, wallBounce, maxSize } = this.config;
    let startIdx = 0;

    if (controlSphere0) {
      startIdx = 1;
      tempVecA.fromArray(this.positionData, 0);
      tempVecA.lerp(this.center, 0.1).toArray(this.positionData, 0);
      tempVecD.set(0, 0, 0).toArray(this.velocityData, 0);
    }

    for (let i = startIdx; i < count; i++) {
      const base = 3 * i;
      tempVecB.fromArray(this.positionData, base);
      tempVecE.fromArray(this.velocityData, base);
      
      tempVecE.y -= time.delta * gravity * this.sizeData[i];
      tempVecE.multiplyScalar(friction);
      tempVecE.clampLength(0, maxVelocity);
      
      tempVecB.add(tempVecE);
      tempVecB.toArray(this.positionData, base);
      tempVecE.toArray(this.velocityData, base);
    }

    for (let i = startIdx; i < count; i++) {
      const base = 3 * i;
      tempVecB.fromArray(this.positionData, base);
      tempVecE.fromArray(this.velocityData, base);
      const radius = this.sizeData[i];

      for (let j = i + 1; j < count; j++) {
        const otherBase = 3 * j;
        tempVecC.fromArray(this.positionData, otherBase);
        tempVecF.fromArray(this.velocityData, otherBase);
        const otherRadius = this.sizeData[j];
        
        tempVecG.copy(tempVecC).sub(tempVecB);
        const dist = tempVecG.length();
        const sumRadius = radius + otherRadius;

        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          tempVecH.copy(tempVecG).normalize().multiplyScalar(0.5 * overlap);
          tempVecI.copy(tempVecH).multiplyScalar(Math.max(tempVecE.length(), 1));
          tempVecJ.copy(tempVecH).multiplyScalar(Math.max(tempVecF.length(), 1));
          
          tempVecB.sub(tempVecH);
          tempVecE.sub(tempVecI);
          tempVecB.toArray(this.positionData, base);
          tempVecE.toArray(this.velocityData, base);
          
          tempVecC.add(tempVecH);
          tempVecF.add(tempVecJ);
          tempVecC.toArray(this.positionData, otherBase);
          tempVecF.toArray(this.velocityData, otherBase);
        }
      }

      if (controlSphere0) {
        tempVecG.copy(tempVecA).sub(tempVecB);
        const dist = tempVecG.length();
        const sumRadius0 = radius + this.sizeData[0];
        if (dist < sumRadius0) {
          const overlap = sumRadius0 - dist;
          tempVecH.copy(tempVecG.normalize()).multiplyScalar(overlap);
          tempVecI.copy(tempVecH).multiplyScalar(Math.max(tempVecE.length(), 2));
          tempVecB.sub(tempVecH);
          tempVecE.sub(tempVecI);
        }
      }

      if (Math.abs(tempVecB.x) + radius > maxX) {
        tempVecB.x = Math.sign(tempVecB.x) * (maxX - radius);
        tempVecE.x = -tempVecE.x * wallBounce;
      }

      if (gravity === 0) {
        if (Math.abs(tempVecB.y) + radius > maxY) {
          tempVecB.y = Math.sign(tempVecB.y) * (maxY - radius);
          tempVecE.y = -tempVecE.y * wallBounce;
        }
      } else if (tempVecB.y - radius < -maxY) {
        tempVecB.y = -maxY + radius;
        tempVecE.y = -tempVecE.y * wallBounce;
      }

      const zBoundary = Math.max(maxZ, maxSize);
      if (Math.abs(tempVecB.z) + radius > zBoundary) {
        tempVecB.z = Math.sign(tempVecB.z) * (maxZ - radius);
        tempVecE.z = -tempVecE.z * wallBounce;
      }

      tempVecB.toArray(this.positionData, base);
      tempVecE.toArray(this.velocityData, base);
    }
  }
}

class ScatteringMaterial extends THREE.MeshPhysicalMaterial {
  constructor(params) {
    super(params);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 }
    };
    this.defines.USE_UV = '';
    this.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader = `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
        ${shader.fragmentShader}
      `;
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          #ifdef USE_COLOR
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor.rgb;
          #else
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          #endif
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }
        void main() {
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        THREE.ShaderChunk.lights_fragment_begin.replaceAll(
          'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
          `
          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
          `
        )
      );
    };
  }
}

const DEFAULT_CONFIG = {
  count: 200,
  colors: [0x4338ca, 0x6366f1, 0x1e1b4b],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15
  },
  minSize: 0.5,
  maxSize: 1,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  controlSphere0: false,
  followCursor: true
};

const transformObject = new THREE.Object3D();

class InstancedSpheres extends THREE.InstancedMesh {
  constructor(renderer, options = {}) {
    const config = { ...DEFAULT_CONFIG, ...options };
    const envScene = new RoomEnvironment();
    const envTexture = new THREE.PMREMGenerator(renderer).fromScene(envScene).texture;
    const geometry = new THREE.SphereGeometry();
    const material = new ScatteringMaterial({ envMap: envTexture, ...config.materialParams });
    material.envMapRotation.x = -Math.PI / 2;
    
    super(geometry, material, config.count);
    
    this.config = config;
    this.physics = new BallPhysics(config);
    this.initLights();
    this.initColors();
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(this.config.ambientColor, this.config.ambientIntensity);
    this.add(this.ambientLight);
    this.pointLight = new THREE.PointLight(this.config.colors[0], this.config.lightIntensity);
    this.add(this.pointLight);
  }

  initColors() {
    const { colors, count } = this.config;
    if (!Array.isArray(colors) || colors.length < 2) return;

    const threeColors = colors.map(c => new THREE.Color(c));
    const getColorAt = (ratio) => {
      const scaled = Math.max(0, Math.min(1, ratio)) * (threeColors.length - 1);
      const idx = Math.floor(scaled);
      const start = threeColors[idx];
      if (idx >= threeColors.length - 1) return start.clone();
      const alpha = scaled - idx;
      const end = threeColors[idx + 1];
      return new THREE.Color().lerpColors(start, end, alpha);
    };

    for (let i = 0; i < count; i++) {
      const color = getColorAt(i / count);
      this.setColorAt(i, color);
      if (i === 0) this.pointLight.color.copy(color);
    }
    this.instanceColor.needsUpdate = true;
  }

  update(time) {
    this.physics.update(time);
    for (let i = 0; i < this.count; i++) {
      transformObject.position.fromArray(this.physics.positionData, 3 * i);
      if (i === 0 && !this.config.followCursor) {
        transformObject.scale.setScalar(0);
      } else {
        transformObject.scale.setScalar(this.physics.sizeData[i]);
      }
      transformObject.updateMatrix();
      this.setMatrixAt(i, transformObject.matrix);
      if (i === 0) this.pointLight.position.copy(transformObject.position);
    }
    this.instanceMatrix.needsUpdate = true;
  }
}

function createBallpit(canvas, options = {}) {
  const scene = new BallpitScene({
    canvas,
    size: 'parent',
    rendererOptions: { antialias: true, alpha: true }
  });
  
  if (!scene.renderer) return null;

  let spheres;
  scene.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  scene.camera.position.set(0, 0, 20);
  scene.camera.lookAt(0, 0, 0);
  scene.cameraMaxAspect = 1.5;
  scene.resize();

  const initSpheres = (opts) => {
    if (spheres) {
      scene.clear();
      scene.scene.remove(spheres);
    }
    spheres = new InstancedSpheres(scene.renderer, opts);
    scene.scene.add(spheres);
  };

  initSpheres(options);

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersectionPoint = new THREE.Vector3();
  let isPaused = false;

  canvas.style.touchAction = 'none';

  const interaction = setupInteraction({
    domElement: canvas,
    onMove() {
      raycaster.setFromCamera(interaction.nPosition, scene.camera);
      scene.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersectionPoint);
      spheres.physics.center.copy(intersectionPoint);
      spheres.config.controlSphere0 = true;
    },
    onLeave() {
      spheres.config.controlSphere0 = false;
    }
  });

  scene.onBeforeRender = (time) => {
    if (!isPaused && spheres) spheres.update(time);
  };

  scene.onAfterResize = (size) => {
    if (spheres) {
      spheres.config.maxX = size.wWidth / 2;
      spheres.config.maxY = size.wHeight / 2;
    }
  };

  return {
    scene,
    get spheres() { return spheres; },
    setCount(count) { initSpheres({ ...spheres.config, count }); },
    togglePause() { isPaused = !isPaused; },
    dispose() {
      interaction.dispose();
      scene.dispose();
    }
  };
}

const Ballpit = ({ className = '', followCursor = true, ...props }) => {
  const canvasRef = useRef(null);
  const spheresInstanceRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    spheresInstanceRef.current = createBallpit(canvas, { followCursor, ...props });

    return () => {
      if (spheresInstanceRef.current) {
        spheresInstanceRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas className={className} ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Ballpit;
