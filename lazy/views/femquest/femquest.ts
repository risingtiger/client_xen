


import { num,str } from "../../../defs_server_symlink.js";
import { $NT, GenericRowT, LazyLoadFuncReturnT, ViewHeaderT } from "../../../defs_client_symlink.js";

// @ts-ignore
import * as THREE from "https://unpkg.com/three@0.170.0/build/three.module.min.js";


declare var render: any;
declare var html: any;
declare var $N: $NT;


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

		// Always white
		vec3 color = vec3(1.0, 1.0, 1.0);

		// Pulse brightness
		float brightness = 1.0 + uPulse * 0.4;

		// Bold, visible wisps (consistent at all levels)
		float baseAlpha = 0.85;
		alpha *= baseAlpha * brightness;

		// Premultiply RGB by alpha to prevent gray fringing during canvas compositing
		gl_FragColor = vec4(color * brightness * alpha, alpha);
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
	private _material:any = null
	private _startTime:number = 0
	private _threeInitialized:boolean = false

	// Strand system
	private _strands:StrandT[] = []
	private _strandMeshes:any[] = []
	private _strandPositions:Float32Array[] = []
	private _strandGeometries:any[] = []

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


	static get observedAttributes() { return Object.keys(ATTRIBUTES); }




	constructor() {
		super();
		this.shadow = this.attachShadow( { mode: 'open' } );
	}




	async connectedCallback() {
		$N.CMech.RegisterView(this);
		requestAnimationFrame(() => { this._initThreeJS(); });
	}




	async attributeChangedCallback(name:str, oldval:str|boolean|number, newval:str|boolean|number) {
		$N.CMech.AttributeChangedCallback(this,name,oldval,newval);
	}




	disconnectedCallback() {
		$N.CMech.ViewDisconnectedCallback(this);
		this._disposeThreeJS();
	}




	static load = (_pathparams:GenericRowT, _searchparams:GenericRowT) => new Promise<LazyLoadFuncReturnT>(async (res, _rej) => {
		const d = new Map<str,GenericRowT[]>()
		res({ d, refreshon:[]})
	})




	ingest = () =>  {
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

		// Interaction
		this._attachInteractionListeners();

		this._threeInitialized = true;

		this._startTime = performance.now();
		this._animate();
	}




	// ── Strand System ────────────────────────────────────────────────────

	private _initStrands() {
		this._material = new THREE.ShaderMaterial({
			vertexShader: VERTEX_SHADER,
			fragmentShader: FRAGMENT_SHADER,
			uniforms: {
				uTime: { value: 0 },
				uIntensity: { value: 0.0 },
				uPulse: { value: 0.0 },
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

		for (let s = 0; s < STRAND_COUNT; s++) {
			const strand:StrandT = {
				baseAngle: (s / STRAND_COUNT) * Math.PI * 2 + Math.random() * 0.3,
				orbitRadius: 0.3 + Math.random() * 0.4,
				orbitSpeed: (0.06 + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1),
				noiseOffset: Math.random() * 1000,
				ribbonWidth: 0.025 + Math.random() * 0.04,
				lengthFactor: 0.5 + Math.random() * 0.4, // each strand covers a large arc
				radialOscSpeed: 0.2 + Math.random() * 0.4,
				radialOscAmp: 0.08 + Math.random() * 0.2,
			};
			this._strands.push(strand);

			// Build ribbon geometry
			const pointCount = SEGMENTS_PER_STRAND + 1;
			const vertCount = pointCount * 2;
			const positions = new Float32Array(vertCount * 3);
			const alongAttr = new Float32Array(vertCount);
			const acrossAttr = new Float32Array(vertCount);
			const indices:number[] = [];

			for (let p = 0; p < pointCount; p++) {
				const t = p / SEGMENTS_PER_STRAND; // 0..1 along strand
				const vi = p * 2;

				// Left vertex
				alongAttr[vi] = t;
				acrossAttr[vi] = -1.0;

				// Right vertex
				alongAttr[vi + 1] = t;
				acrossAttr[vi + 1] = 1.0;

				// Quads: two triangles per segment
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

			const mesh = new THREE.Mesh(geo, this._material);
			mesh.frustumCulled = false;
			this._scene.add(mesh);

			this._strandGeometries.push(geo);
			this._strandPositions.push(positions);
			this._strandMeshes.push(mesh);
		}
	}




	// ── Animation Loop ───────────────────────────────────────────────────

	private _animate = () => {
		this._animationId = requestAnimationFrame(this._animate);
		if (!this._material) return;

		const elapsed = (performance.now() - this._startTime) / 1000;
		const intensity = (this.s.scalevalue - 1) / 9; // 0..1

		// Update uniforms
		this._material.uniforms.uTime.value = elapsed;
		this._material.uniforms.uIntensity.value = intensity;

		// Pulse decay
		if (this._pulseAmount > 0) {
			this._pulseAmount *= 0.94;
			if (this._pulseAmount < 0.01) this._pulseAmount = 0;
		}
		this._material.uniforms.uPulse.value = this._pulseAmount;

		// Smooth radius interpolation for the ring band
		this._currentOuterR += (this._targetOuterR - this._currentOuterR) * 0.1;
		this._currentInnerR += (this._targetInnerR - this._currentInnerR) * 0.1;

		// Speed ramps from 1.0x at ring 1 to 1.3x at ring 10
		const speedRamp = 1.0 + intensity * 0.3;
		const speedMult = 0.08 * speedRamp;
		const turbMult = 2.5 * speedRamp;
		const widthMult = 2.0;

		// Fixed undulation amplitude in camera space (same at all ring levels)
		const undulationAmp = this._pxToCamera(40);

		// Strands centered on the ring midpoint
		const ringCenter = (this._currentOuterR + this._currentInnerR) / 2;

		for (let s = 0; s < STRAND_COUNT; s++) {
			const strand = this._strands[s];
			const positions = this._strandPositions[s];
			const geo = this._strandGeometries[s];
			const mesh = this._strandMeshes[s];
			const pointCount = SEGMENTS_PER_STRAND + 1;

			mesh.visible = true;

			// Time-varying base angle
			const angle = strand.baseAngle + elapsed * strand.orbitSpeed * speedMult;

			// Radial breathing (slowed)
			const radialOsc = Math.sin(elapsed * strand.radialOscSpeed * 0.3 * speedRamp + strand.noiseOffset) * strand.radialOscAmp;

			const no = strand.noiseOffset; // shorthand

			for (let p = 0; p < pointCount; p++) {
				const t = p / SEGMENTS_PER_STRAND; // 0..1

				// Base arc angle for this spine point
				const arcAngle = angle + t * strand.lengthFactor * Math.PI * 2;

				// ── Multi-octave radial undulation (perpendicular to ring path) ──
				const radNoise1 = (noise3D(t * 5 + no, elapsed * 0.12 * turbMult, no * 0.1) - 0.5) * 2.0;
				const radNoise2 = (noise3D(t * 11 + no * 1.3, elapsed * 0.25 * turbMult, no * 0.3) - 0.5) * 1.0;
				const radNoise3 = (noise3D(t * 23 + no * 2.1, elapsed * 0.4 * turbMult, no * 0.7) - 0.5) * 0.5;
				const radialUndulation = (radNoise1 + radNoise2 + radNoise3) / 3.5;

				// Center on ring midpoint, undulate with fixed amplitude
				let r = ringCenter + radialOsc * undulationAmp * 0.5 + radialUndulation * undulationAmp;

				// Soft minimum so strands don't collapse to zero
				if (r < 0.001) r = 0.001;

				// ── Multi-octave tangential undulation (along the arc) ──
				const tanNoise1 = (noise3D(t * 6 + no + 200, elapsed * 0.1 * turbMult, no * 0.2) - 0.5) * 2.0;
				const tanNoise2 = (noise3D(t * 14 + no * 1.7 + 200, elapsed * 0.2 * turbMult, no * 0.5) - 0.5) * 1.0;
				const tanNoise3 = (noise3D(t * 28 + no * 2.5 + 200, elapsed * 0.35 * turbMult, no * 0.9) - 0.5) * 0.5;
				const tangentialUndulation = (tanNoise1 + tanNoise2 + tanNoise3) / 3.5;

				// Apply tangential offset as an angular displacement
				const tangentialOffset = tangentialUndulation * 0.15;
				const finalArcAngle = arcAngle + tangentialOffset;

				// Spine position
				const sx = Math.cos(finalArcAngle) * r;
				const sy = Math.sin(finalArcAngle) * r;

				// Perpendicular direction (tangent to arc = perpendicular to radial)
				const perpX = -Math.sin(finalArcAngle);
				const perpY = Math.cos(finalArcAngle);

				// Width undulates along the strand (fixed, not intensity-dependent)
				const widthNoise = 0.5 + (noise3D(t * 8 + no + 400, elapsed * 0.15 * speedRamp, no * 0.4)) * 1.0;
				const taper = Math.sin(t * Math.PI);
				const halfW = strand.ribbonWidth * taper * widthMult * widthNoise;

				const vi = p * 2;
				// Left vertex
				positions[vi * 3]     = sx - perpX * halfW;
				positions[vi * 3 + 1] = sy - perpY * halfW;
				positions[vi * 3 + 2] = 0;

				// Right vertex
				positions[(vi + 1) * 3]     = sx + perpX * halfW;
				positions[(vi + 1) * 3 + 1] = sy + perpY * halfW;
				positions[(vi + 1) * 3 + 2] = 0;
			}

			geo.attributes.position.needsUpdate = true;
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
		this._pulseAmount = 1.0;

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

		this.s.scalevalue = newValue;

		// Sync target band to ring's camera-space radius
		this._targetOuterR = this._ringCameraRadius(newValue);
		this._targetInnerR = this._ringCameraRadius(Math.max(0, newValue - 1));

		this._pulseAmount = Math.max(this._pulseAmount, 0.3);

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
		for (const geo of this._strandGeometries) {
			if (geo) geo.dispose();
		}
		if (this._material) {
			this._material.dispose();
			this._material = null;
		}
		if (this._renderer) {
			this._renderer.dispose();
			this._renderer = null;
		}
		this._scene = null;
		this._camera = null;
		this._strandMeshes = [];
		this._strandGeometries = [];
		this._strandPositions = [];
		this._strands = [];
		this._threeInitialized = false;
	}
}




customElements.define('v-femquest', VFemQuest);


export {  }
