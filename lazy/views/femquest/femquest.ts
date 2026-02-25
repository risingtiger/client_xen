


import { num,str } from "../../../defs_server_symlink.js";
import { $NT, GenericRowT, LazyLoadFuncReturnT, ViewHeaderT } from "../../../defs_client_symlink.js";

declare var render: any;
declare var html: any;
declare var $N: $NT;
let THREE:any = null;


type AttributesT = {
	propa: string,
}

type ModelT = {
	questions_max:num,
}

type StateT = {
	questions:num[],
	scalevalue:num,
}


const ATTRIBUTES:AttributesT = { propa:"" }

const STRAND_COUNT = 5;
const SEGMENTS_PER_STRAND = 40;
const RING_COUNT = 10;
const RING_MIN_RADIUS_PX = 60;  // ring 1 pixel radius
const RING_MAX_RADIUS_PX = 300; // ring 10 pixel radius


// ── Noise ────────────────────────────────────────────────────────────────

function hash(p:number):number {
	let s = Math.sin(p * 127.1 + p * 311.7) * 43758.5453123;
	return s - Math.floor(s);
}

function noise3D(x:number, y:number, z:number):number {
	const ix = Math.floor(x);
	const iy = Math.floor(y);
	const iz = Math.floor(z);
	const fx = x - ix;
	const fy = y - iy;
	const fz = z - iz;
	const ux = fx * fx * (3.0 - 2.0 * fx);
	const uy = fy * fy * (3.0 - 2.0 * fy);
	const uz = fz * fz * (3.0 - 2.0 * fz);

	const a = hash(ix + iy * 157.0 + iz * 113.0);
	const b = hash(ix + 1.0 + iy * 157.0 + iz * 113.0);
	const c = hash(ix + (iy + 1.0) * 157.0 + iz * 113.0);
	const d = hash(ix + 1.0 + (iy + 1.0) * 157.0 + iz * 113.0);
	const e = hash(ix + iy * 157.0 + (iz + 1.0) * 113.0);
	const f = hash(ix + 1.0 + iy * 157.0 + (iz + 1.0) * 113.0);
	const g = hash(ix + (iy + 1.0) * 157.0 + (iz + 1.0) * 113.0);
	const hh = hash(ix + 1.0 + (iy + 1.0) * 157.0 + (iz + 1.0) * 113.0);

	const ab = a + (b - a) * ux;
	const cd = c + (d - c) * ux;
	const ef = e + (f - e) * ux;
	const gh = g + (hh - g) * ux;
	const abcd = ab + (cd - ab) * uy;
	const efgh = ef + (gh - ef) * uy;
	return abcd + (efgh - abcd) * uz;
}


// ── Strand data structure ────────────────────────────────────────────────

type StrandT = {
	baseAngle: number,		// starting orbital angle
	orbitRadius: number,	// how far from center this strand orbits (0..1 normalized)
	orbitSpeed: number,		// angular speed
	noiseOffset: number,	// unique noise seed
	ribbonWidth: number,	// base half-width of the ribbon
	lengthFactor: number,	// how much of a full arc it covers
	radialOscSpeed: number,	// speed of breathing in/out
	radialOscAmp: number,	// amplitude of radial oscillation
}


// ── GLSL Shaders ─────────────────────────────────────────────────────────

const VERTEX_SHADER = `
	attribute float aAlongStrand;
	attribute float aAcrossStrand;

	uniform float uTime;
	uniform float uIntensity;
	uniform float uPulse;

	varying float vAlong;
	varying float vAcross;
	varying float vIntensity;

	void main() {
		vAlong = aAlongStrand;
		vAcross = aAcrossStrand;
		vIntensity = uIntensity;

		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const FRAGMENT_SHADER = `
	uniform float uIntensity;
	uniform float uPulse;
	uniform float uTime;
	uniform float uOpacity;
	uniform vec3 uColor;

	varying float vAlong;
	varying float vAcross;
	varying float vIntensity;

	void main() {
		// Soft fade along the strand length (fade at both tips)
		float alongFade = smoothstep(0.0, 0.15, vAlong) * smoothstep(1.0, 0.85, vAlong);

		// Soft fade across the strand width (soft edges, no hard boundary)
		float acrossDist = abs(vAcross);
		float acrossFade = exp(-acrossDist * acrossDist * 2.5);

		// Combined softness
		float alpha = alongFade * acrossFade;

		vec3 color = uColor;

		// Pulse brightness
		float brightness = 1.0 + uPulse * 0.4;

		// Bold, visible wisps (consistent at all levels)
		float baseAlpha = 0.85;
		alpha *= baseAlpha * brightness * uOpacity;

		// Premultiply RGB by alpha to prevent gray fringing during canvas compositing
		gl_FragColor = vec4(color * brightness * alpha, alpha);
	}
`;



// ── Orb Shaders ──────────────────────────────────────────────────────────

const ORB_VERTEX_SHADER = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const ORB_FRAGMENT_SHADER = `
	uniform float uProgress; // 0..1 animation progress
	varying vec2 vUv;

	void main() {
		vec2 center = vec2(0.5, 0.5);
		float dist = length(vUv - center) * 2.0; // 0 at center, 1 at edge

		// Radial gradient: bright center fading to transparent edge
		float radialFade = 1.0 - smoothstep(0.0, 1.0, dist);

		// Fade out as the orb expands
		float fadeOut = 1.0 - smoothstep(0.3, 1.0, uProgress);

		float alpha = radialFade * fadeOut * 0.9;

		vec3 color = vec3(1.0, 1.0, 1.0);
		gl_FragColor = vec4(color * alpha, alpha);
	}
`;


class VFemQuest extends HTMLElement {

	a:AttributesT = { ...ATTRIBUTES }
	m:ModelT =      { questions_max: 0, }
	s:StateT = {
		questions: [],
		scalevalue: 1,
	}
	header:ViewHeaderT = { title: '', disable: true }

	shadow:ShadowRoot

	// Three.js references
	private _scene:any = null
	private _camera:any = null
	private _renderer:any = null
	private _animationId:number = 0
	private _startTime:number = 0
	private _threeInitialized:boolean = false

	// Strand system — one set per ring level (index 0 = level 1, index 9 = level 10)
	private _levelMaterials:any[] = []
	private _levelStrands:StrandT[][] = []
	private _levelMeshes:any[][] = []
	private _levelPositions:Float32Array[][] = []
	private _levelGeometries:any[][] = []

	// Viewport / coordinate mapping
	private _viewportH:number = 0
	private _cameraFrustumSize:number = 2

	// Interaction state
	private _isDragging:boolean = false
	private _hasClicked:boolean = false
	private _pulseAmount:number = 0
	private _targetOuterR:number = 0 // camera-space outer radius (current ring)
	private _targetInnerR:number = 0 // camera-space inner radius (previous ring)
	private _currentOuterR:number = 0 // smoothly interpolated
	private _currentInnerR:number = 0 // smoothly interpolated
	private _centerX:number = 0
	private _centerY:number = 0

	// Level 10 burst effect
	private _orbMesh:any = null
	private _orbMaterial:any = null
	private _burstProgress:number = -1 // -1 = inactive, 0..1 = animating
	private _burstStartTime:number = 0
	private _burstDuration:number = 0.6 // seconds for full expansion


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }




	constructor() {
		super();
		this.shadow = this.attachShadow( { mode: 'open' } );
	}




	async connectedCallback() {
		$N.CMech.RegisterView(this);
	}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() {
		$N.CMech.ViewDisconnectedCallback(this);
		this._disposeThreeJS();
	}




	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, _rej) => {
		if (!THREE) {
			// @ts-ignore
			THREE = await import('https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.module.min.js');
		}
		const d = new Map<str,GenericRowT[]>();
		res({ d, refreshon:[] });
	})




	ingest = () =>  {
		setTimeout(()=> { // hack since the DOM has to render first for three to hook into element
			this._initThreeJS();
		}, 100)
	}




	render() {
		const canvasEl = this._renderer ? this._renderer.domElement : null;

		render(this.template(this.s), this.shadow);

		if (canvasEl && this._threeInitialized) {
			const container = this.shadow.getElementById('threejs-container');
			if (container && !container.contains(canvasEl)) {
				container.appendChild(canvasEl);
			}
		}

		if (this._threeInitialized) {
			this._attachInteractionListeners();
		}
	}



	template = (_s:any) => { return html`{--css--}{--html--}`; };




	// ── Pixel radius <-> camera-space radius conversion ──────────────────

	private _pxToCamera(px:number):number {
		// Orthographic camera: frustumSize covers viewportH pixels
		// So 1 camera unit = viewportH / frustumSize pixels
		// camera_radius = px / (viewportH / frustumSize) = px * frustumSize / viewportH
		return px * this._cameraFrustumSize / this._viewportH;
	}

	private _ringPixelRadius(ringIndex:number):number {
		// Ring 0 = center (0px), ring 1 = 60px, ring 10 = 300px, linear between 1-10
		if (ringIndex <= 0) return 0;
		return RING_MIN_RADIUS_PX + (ringIndex - 1) * (RING_MAX_RADIUS_PX - RING_MIN_RADIUS_PX) / (RING_COUNT - 1);
	}

	private _ringCameraRadius(ringIndex:number):number {
		return this._pxToCamera(this._ringPixelRadius(ringIndex));
	}




	// ── Three.js Initialization ──────────────────────────────────────────

	private _initThreeJS() {
		if (this._threeInitialized) return;

		const container = this.shadow.getElementById('threejs-container');
		if (!container) return;

		const w = container.clientWidth || window.innerWidth;
		const h = container.clientHeight || window.innerHeight;

		this._centerX = w / 2;
		this._centerY = h / 2;
		this._viewportH = h;

		// Scene
		this._scene = new THREE.Scene();

		// Camera
		const aspect = w / h;
		this._camera = new THREE.OrthographicCamera(
			-this._cameraFrustumSize * aspect / 2,
			this._cameraFrustumSize * aspect / 2,
			this._cameraFrustumSize / 2,
			-this._cameraFrustumSize / 2,
			0.1, 10
		);
		this._camera.position.z = 1;

		// Renderer
		this._renderer = new THREE.WebGLRenderer({
			alpha: true,
			premultipliedAlpha: true,
			antialias: true,
		});
		this._renderer.setSize(w, h);
		this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this._renderer.setClearColor(0x000000, 0);
		container.appendChild(this._renderer.domElement);

		// Set initial radius band (ring 1: inner=0, outer=ring1)
		this._targetOuterR = this._ringCameraRadius(this.s.scalevalue);
		this._targetInnerR = this._ringCameraRadius(Math.max(0, this.s.scalevalue - 1));
		this._currentOuterR = this._targetOuterR;
		this._currentInnerR = this._targetInnerR;

		// Build strand system
		this._initStrands();

		// Build orb for level-10 burst effect
		this._initOrb(aspect);

		// Interaction
		this._attachInteractionListeners();

		this._threeInitialized = true;

		this._startTime = performance.now();
		this._animate();
	}




	// ── Strand System ────────────────────────────────────────────────────

	private _initStrands() {
		for (let level = 0; level < RING_COUNT; level++) {
			const mat = new THREE.ShaderMaterial({
				vertexShader: VERTEX_SHADER,
				fragmentShader: FRAGMENT_SHADER,
			uniforms: {
				uTime: { value: 0 },
				uIntensity: { value: 0.0 },
				uPulse: { value: 0.0 },
				uOpacity: { value: 1.0 },
				uColor: { value: new THREE.Vector3(1.0, 1.0, 1.0) },
			},
				transparent: true,
				blending: THREE.CustomBlending,
				blendSrc: THREE.OneFactor,
				blendDst: THREE.OneMinusSrcAlphaFactor,
				blendSrcAlpha: THREE.OneFactor,
				blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
				depthWrite: false,
				depthTest: false,
				side: THREE.DoubleSide,
			});
			this._levelMaterials.push(mat);

			const strands:StrandT[] = [];
			const meshes:any[] = [];
			const positionsArr:Float32Array[] = [];
			const geometries:any[] = [];

			for (let s = 0; s < STRAND_COUNT; s++) {
				const strand:StrandT = {
					baseAngle: (s / STRAND_COUNT) * Math.PI * 2 + Math.random() * 0.3,
					orbitRadius: 0.3 + Math.random() * 0.4,
					orbitSpeed: (0.06 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
					noiseOffset: Math.random() * 1000,
					ribbonWidth: 0.025 + Math.random() * 0.04,
					lengthFactor: 0.5 + Math.random() * 0.4,
					radialOscSpeed: 0.2 + Math.random() * 0.4,
					radialOscAmp: 0.08 + Math.random() * 0.2,
				};
				strands.push(strand);

				// Build ribbon geometry
				const pointCount = SEGMENTS_PER_STRAND + 1;
				const vertCount = pointCount * 2;
				const positions = new Float32Array(vertCount * 3);
				const alongAttr = new Float32Array(vertCount);
				const acrossAttr = new Float32Array(vertCount);
				const indices:number[] = [];

				for (let p = 0; p < pointCount; p++) {
					const t = p / SEGMENTS_PER_STRAND;
					const vi = p * 2;

					alongAttr[vi] = t;
					acrossAttr[vi] = -1.0;
					alongAttr[vi + 1] = t;
					acrossAttr[vi + 1] = 1.0;

					if (p < SEGMENTS_PER_STRAND) {
						const bl = vi;
						const br = vi + 1;
						const tl = vi + 2;
						const tr = vi + 3;
						indices.push(bl, br, tl);
						indices.push(br, tr, tl);
					}
				}

				const geo = new THREE.BufferGeometry();
				geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
				geo.setAttribute('aAlongStrand', new THREE.BufferAttribute(alongAttr, 1));
				geo.setAttribute('aAcrossStrand', new THREE.BufferAttribute(acrossAttr, 1));
				geo.setIndex(indices);

				const mesh = new THREE.Mesh(geo, mat);
				mesh.frustumCulled = false;
				mesh.visible = false;
				this._scene.add(mesh);

				geometries.push(geo);
				positionsArr.push(positions);
				meshes.push(mesh);
			}

			this._levelStrands.push(strands);
			this._levelMeshes.push(meshes);
			this._levelPositions.push(positionsArr);
			this._levelGeometries.push(geometries);
		}
	}


	private _initOrb(aspect:number) {
		this._orbMaterial = new THREE.ShaderMaterial({
			vertexShader: ORB_VERTEX_SHADER,
			fragmentShader: ORB_FRAGMENT_SHADER,
			uniforms: {
				uProgress: { value: 0 },
			},
			transparent: true,
			blending: THREE.CustomBlending,
			blendSrc: THREE.OneFactor,
			blendDst: THREE.OneMinusSrcAlphaFactor,
			blendSrcAlpha: THREE.OneFactor,
			blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
			depthWrite: false,
			depthTest: false,
			side: THREE.DoubleSide,
		});

		// Plane large enough to cover the full viewport when scaled up
		const maxDim = Math.max(this._cameraFrustumSize * aspect, this._cameraFrustumSize);
		const orbGeo = new THREE.PlaneGeometry(maxDim * 2.5, maxDim * 2.5);
		this._orbMesh = new THREE.Mesh(orbGeo, this._orbMaterial);
		this._orbMesh.frustumCulled = false;
		this._orbMesh.visible = false;
		this._orbMesh.position.z = 0.1; // slightly in front of strands
		this._scene.add(this._orbMesh);
	}




	// ── Animation Loop ───────────────────────────────────────────────────

	private _animate = () => {
		this._animationId = requestAnimationFrame(this._animate);
		if (this._levelMaterials.length === 0) return;

		const elapsed = (performance.now() - this._startTime) / 1000;
		const activeLevel = this.s.scalevalue; // 1..10
		const intensity = (activeLevel - 1) / 9; // 0..1

		// Pulse decay
		if (this._pulseAmount > 0) {
			this._pulseAmount *= 0.94;
			if (this._pulseAmount < 0.01) this._pulseAmount = 0;
		}

		// Level-10 burst effect
		let burstWidthMult = 1.0;
		if (this._burstProgress >= 0) {
			const burstElapsed = elapsed - this._burstStartTime;
			this._burstProgress = Math.min(burstElapsed / this._burstDuration, 1.0);

			// Orb: start tiny, expand to full screen
			const orbScale = this._burstProgress;
			this._orbMesh.visible = true;
			this._orbMesh.scale.set(orbScale, orbScale, 1);
			this._orbMaterial.uniforms.uProgress.value = this._burstProgress;

			// Width pulse: animate up to 4x then back to 1x (breath in/out)
			// Peak at ~25% through the animation, then ease back down
			const widthT = this._burstProgress;
			const breath = Math.sin(widthT * Math.PI) * Math.pow(1.0 - widthT, 0.4);
			burstWidthMult = 1.0 + 1.5 * (breath / 0.66); // normalized so peak ≈ 2.5x

			if (this._burstProgress >= 1.0) {
				this._burstProgress = -1;
				this._orbMesh.visible = false;
			}
		}

		// Smooth radius interpolation for the active ring band
		this._currentOuterR += (this._targetOuterR - this._currentOuterR) * 0.1;
		this._currentInnerR += (this._targetInnerR - this._currentInnerR) * 0.1;

		// Active level params
		const speedRamp = 1.0 + intensity * 0.3;
		const speedMult = 0.08 * speedRamp;
		const turbMult = 3.25 * speedRamp;
		const widthScale = 1.0 + intensity; // 1.0x at level 1, 2.0x at level 10
		const widthMult = 2.0;
		const undulationAmp = this._pxToCamera(40);

		// Preceding level params (constant, matching level 1 behavior)
		const precSpeedRamp = 1.0;
		const precSpeedMult = 0.08;
		const precTurbMult = 3.25;
		const precTangentialScale = 0.5; // narrower tangential bandwidth

		for (let level = 0; level < RING_COUNT; level++) {
			const ringIndex = level + 1; // 1..10
			const mat = this._levelMaterials[level];
			const strands = this._levelStrands[level];
			const meshes = this._levelMeshes[level];
			const positionsArr = this._levelPositions[level];
			const geometries = this._levelGeometries[level];

			// Hide levels above current scalevalue
			if (ringIndex > activeLevel) {
				for (const mesh of meshes) mesh.visible = false;
				continue;
			}

			const isActive = ringIndex === activeLevel;

			// Set uniforms per level
			mat.uniforms.uTime.value = elapsed;
			mat.uniforms.uIntensity.value = intensity;
			mat.uniforms.uPulse.value = this._pulseAmount;
			// Preceding opacity: nearest preceding = 0.30, furthest = 0.05, linear between
			let levelOpacity = 1.0;
			if (!isActive) {
				const precCount = activeLevel - 1; // total preceding levels
				if (precCount <= 1) {
					levelOpacity = 0.30;
				} else {
					const distFromActive = activeLevel - ringIndex; // 1 = nearest, precCount = furthest
					const t = (distFromActive - 1) / (precCount - 1); // 0 = nearest, 1 = furthest
					levelOpacity = 0.30 + (0.05 - 0.30) * t;
				}
			}
			mat.uniforms.uOpacity.value = levelOpacity;

			// Color: interpolate from white (level 1) to target color (level 10)
			const colorT = (ringIndex - 1) / 9; // 0..1
			const cr = 1.0 + (1.0 - 1.0) * colorT;
			const cg = 1.0 + (1.0 - 1.0) * colorT;
			const cb = 1.0 + (1.0 - 1.0) * colorT;
			mat.uniforms.uColor.value.set(cr, cg, cb);

			// Ring center for this level
			const outerR = isActive ? this._currentOuterR : this._ringCameraRadius(ringIndex);
			const innerR = isActive ? this._currentInnerR : this._ringCameraRadius(Math.max(0, ringIndex - 1));
			const ringCenter = (outerR + innerR) / 2;

			// Pick params based on active vs preceding
			const sm = isActive ? speedMult : precSpeedMult;
			const sr = isActive ? speedRamp : precSpeedRamp;
			const tm = isActive ? turbMult : precTurbMult;
			const ws = isActive ? widthScale * burstWidthMult : 1.0; // preceding = level-1 width (1.0x)
			const tanScale = isActive ? 1.0 : precTangentialScale;

			for (let s = 0; s < STRAND_COUNT; s++) {
				const strand = strands[s];
				const positions = positionsArr[s];
				const geo = geometries[s];
				const mesh = meshes[s];
				const pointCount = SEGMENTS_PER_STRAND + 1;

				mesh.visible = true;

				const angle = strand.baseAngle + elapsed * strand.orbitSpeed * sm;
				const radialOsc = Math.sin(elapsed * strand.radialOscSpeed * 0.3 * sr + strand.noiseOffset) * strand.radialOscAmp;
				const no = strand.noiseOffset;

				for (let p = 0; p < pointCount; p++) {
					const t = p / SEGMENTS_PER_STRAND;
					const arcAngle = angle + t * strand.lengthFactor * Math.PI * 2;

					// Multi-octave radial undulation
					const radNoise1 = (noise3D(t * 5 + no, elapsed * 0.12 * tm, no * 0.1) - 0.5) * 2.0;
					const radNoise2 = (noise3D(t * 11 + no * 1.3, elapsed * 0.25 * tm, no * 0.3) - 0.5) * 1.0;
					const radNoise3 = (noise3D(t * 23 + no * 2.1, elapsed * 0.4 * tm, no * 0.7) - 0.5) * 0.5;
					const radialUndulation = (radNoise1 + radNoise2 + radNoise3) / 3.5;

					let r = ringCenter + radialOsc * undulationAmp * 0.5 + radialUndulation * undulationAmp;
					if (r < 0.001) r = 0.001;

					// Multi-octave tangential undulation (scaled down for preceding levels)
					const tanNoise1 = (noise3D(t * 6 + no + 200, elapsed * 0.1 * tm, no * 0.2) - 0.5) * 2.0;
					const tanNoise2 = (noise3D(t * 14 + no * 1.7 + 200, elapsed * 0.2 * tm, no * 0.5) - 0.5) * 1.0;
					const tanNoise3 = (noise3D(t * 28 + no * 2.5 + 200, elapsed * 0.35 * tm, no * 0.9) - 0.5) * 0.5;
					const tangentialUndulation = (tanNoise1 + tanNoise2 + tanNoise3) / 3.5;

					const tangentialOffset = tangentialUndulation * 0.15 * tanScale;
					const finalArcAngle = arcAngle + tangentialOffset;

					const sx = Math.cos(finalArcAngle) * r;
					const sy = Math.sin(finalArcAngle) * r;

					const perpX = -Math.sin(finalArcAngle);
					const perpY = Math.cos(finalArcAngle);

					const widthNoise = 0.5 + (noise3D(t * 8 + no + 400, elapsed * 0.15 * sr, no * 0.4)) * 1.0;
					const taper = Math.sin(t * Math.PI);
					const halfW = strand.ribbonWidth * taper * widthMult * widthNoise * ws;

					const vi = p * 2;
					positions[vi * 3]     = sx - perpX * halfW;
					positions[vi * 3 + 1] = sy - perpY * halfW;
					positions[vi * 3 + 2] = 0;

					positions[(vi + 1) * 3]     = sx + perpX * halfW;
					positions[(vi + 1) * 3 + 1] = sy + perpY * halfW;
					positions[(vi + 1) * 3 + 2] = 0;
				}

				geo.attributes.position.needsUpdate = true;
			}
		}

		this._renderer.render(this._scene, this._camera);
	}




	// ── Interaction Handlers ─────────────────────────────────────────────

	private _boundPointerDown:any = null
	private _boundPointerMove:any = null
	private _boundPointerUp:any = null
	private _currentOverlay:HTMLElement|null = null

	private _attachInteractionListeners() {
		const overlay = this.shadow.getElementById('interaction-overlay');
		if (!overlay) return;

		if (this._currentOverlay && this._currentOverlay !== overlay) {
			this._currentOverlay.removeEventListener('pointerdown', this._boundPointerDown);
			this._currentOverlay.removeEventListener('pointermove', this._boundPointerMove);
			this._currentOverlay.removeEventListener('pointerup', this._boundPointerUp);
			this._currentOverlay.removeEventListener('pointercancel', this._boundPointerUp);
		}

		if (this._currentOverlay === overlay) return;

		this._boundPointerDown = this._onPointerDown;
		this._boundPointerMove = this._onPointerMove;
		this._boundPointerUp = this._onPointerUp;

		overlay.addEventListener('pointerdown', this._boundPointerDown);
		overlay.addEventListener('pointermove', this._boundPointerMove);
		overlay.addEventListener('pointerup', this._boundPointerUp);
		overlay.addEventListener('pointercancel', this._boundPointerUp);

		this._currentOverlay = overlay;
	}


	private _onPointerDown = (e:PointerEvent) => {
		const rect = (e.target as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const dx = x - this._centerX;
		const dy = y - this._centerY;
		const dist = Math.sqrt(dx * dx + dy * dy);

		const hitRadius = Math.max(this._ringPixelRadius(this.s.scalevalue), RING_MIN_RADIUS_PX);
		if (dist > hitRadius && !this._hasClicked) return;

		this._isDragging = true;
		this._hasClicked = true;

		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}


	private _onPointerMove = (e:PointerEvent) => {
		if (!this._isDragging) return;

		const rect = (e.target as HTMLElement).getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		const dx = x - this._centerX;
		const dy = y - this._centerY;
		const dist = Math.sqrt(dx * dx + dy * dy);

		// Find closest ring to pointer distance
		let newValue = 1 as num;
		let closestDist = Infinity;
		for (let i = 1; i <= RING_COUNT; i++) {
			const ringR = this._ringPixelRadius(i);
			const d = Math.abs(dist - ringR);
			if (d < closestDist) {
				closestDist = d;
				newValue = i as num;
			}
		}
		// If pointer is beyond ring 10, clamp to 10; if inside ring 1, clamp to 1
		if (dist > this._ringPixelRadius(RING_COUNT)) newValue = RING_COUNT as num;
		if (dist < this._ringPixelRadius(1) * 0.5) newValue = 1 as num;

		if (newValue === this.s.scalevalue) return;

		const prevValue = this.s.scalevalue;
		this.s.scalevalue = newValue;

		// Trigger level-10 burst effect
		if (newValue === RING_COUNT && prevValue !== RING_COUNT) {
			const elapsed = (performance.now() - this._startTime) / 1000;
			this._burstProgress = 0;
			this._burstStartTime = elapsed;
		}

		// Sync target band to ring's camera-space radius
		this._targetOuterR = this._ringCameraRadius(newValue);
		this._targetInnerR = this._ringCameraRadius(Math.max(0, newValue - 1));

		this.render();
	}


	private _onPointerUp = (_e:PointerEvent) => {
		this._isDragging = false;
	}




	// ── Cleanup ──────────────────────────────────────────────────────────

	private _disposeThreeJS() {
		if (this._animationId) {
			cancelAnimationFrame(this._animationId);
			this._animationId = 0;
		}
		for (const geos of this._levelGeometries) {
			for (const geo of geos) if (geo) geo.dispose();
		}
		for (const mat of this._levelMaterials) {
			if (mat) mat.dispose();
		}
		if (this._orbMesh) {
			this._orbMesh.geometry.dispose();
			this._orbMesh = null;
		}
		if (this._orbMaterial) {
			this._orbMaterial.dispose();
			this._orbMaterial = null;
		}
		if (this._renderer) {
			this._renderer.dispose();
			this._renderer = null;
		}
		this._scene = null;
		this._camera = null;
		this._levelMaterials = [];
		this._levelStrands = [];
		this._levelMeshes = [];
		this._levelPositions = [];
		this._levelGeometries = [];
		this._threeInitialized = false;
	}
}




customElements.define('v-femquest', VFemQuest);


export {  }
