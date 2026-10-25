/**
 * BROMATRIX AEROSPACE 3D HOLOGRAPHIC DRONE EXPERIENCE
 * Full-page interactive 3D model viewer with smooth inertia and PBR/hologram modes
 * Model: Public/3d/drone.glb
 */

(function () {
    'use strict';

    // State & Configuration
    const state = {
        loaded: false,
        isDragging: false,
        dragButton: 0, // 0 = rotate, 2 = pan
        prevPointerX: 0,
        prevPointerY: 0,
        velX: 0,
        velY: 0,
        targetRotX: 0.1,
        targetRotY: 0.0,
        currentRotX: 0.1,
        currentRotY: 0.0,
        targetPanX: 0,
        targetPanY: 0,
        currentPanX: 0,
        currentPanY: 0,
        targetZoom: 4.0,
        currentZoom: 4.0,
        zoomMin: 2.2,
        zoomMax: 7.2,
        pitchMin: -1.25,
        pitchMax: 1.25,
        lastInteractionTime: performance.now(),
        autoResumeWeight: 1.0,
        autoRotateSpeed: 0.0035,
        autoRotateEnabled: true,
        wireframeEnabled: false,
        activeColorTheme: 'cyan',
        currentHotspot: null,
        touchDistanceStart: 0,
        touchZoomStart: 4.0
    };

    // Color Palettes for Hologram Themes
    const HOLO_THEMES = {
        cyan: {
            base: new THREE.Color(0x00f5d4),   // Electric Mint Cyan
            rim: new THREE.Color(0xcffafe),    // Luminous White Rim
            particle: 0x2dd4bf,
            glowRgba: 'rgba(0, 245, 212, 0.4)'
        },
        violet: {
            base: new THREE.Color(0xc084fc),
            rim: new THREE.Color(0xf5d0fe),
            particle: 0xd8b4fe,
            glowRgba: 'rgba(192, 132, 252, 0.4)'
        },
        emerald: {
            base: new THREE.Color(0x10b981),
            rim: new THREE.Color(0xa7f3d0),
            particle: 0x34d399,
            glowRgba: 'rgba(16, 185, 129, 0.4)'
        }
    };

    let scene, camera, renderer, container;
    let droneRootGroup, dronePivot, loadedModelMesh;
    let holoMaterial, wireframeMaterial;
    let particleSystem, projectorRings = [];
    let pbrLights = [];
    let animFrameId = null;
    let clock = new THREE.Clock();

    // Hotspots data
    const HOTSPOTS = {
        avionics: {
            title: 'STM32F405 Avionics Core',
            subtitle: 'Real-Time Flight Controller',
            specs: [
                { label: 'Clock', value: '168 MHz Cortex-M4' },
                { label: 'IMU Gyro', value: 'ICM-42688-P (8 kHz Loop)' },
                { label: 'Firmware', value: 'Betaflight 4.5.1 / ArduPilot' },
                { label: 'Fail-Safe', value: 'Autonomous GPS Return-to-Home' }
            ],
            rot: { x: 0.55, y: -0.2 }
        },
        motors: {
            title: '2207 Brushless Outrunner Motors',
            subtitle: 'Propulsion & Aerodynamic Dynamics',
            specs: [
                { label: 'Stator Size', value: '2207 / 2750KV' },
                { label: 'Protocol', value: 'DShot600 Digital Telemetry' },
                { label: 'Max Thrust', value: '1,850g per motor' },
                { label: 'Props', value: '51466 Tri-Blade Polycarbonate' }
            ],
            rot: { x: 0.35, y: 0.85 }
        },
        telemetry: {
            title: 'Dual-Band Telemetry Transceiver',
            subtitle: 'Low-Latency IoT Uplink',
            specs: [
                { label: 'Protocol', value: 'ESP32 TLS Encrypted MQTT' },
                { label: 'Frequency', value: '2.4 GHz + 5.8 GHz FPV' },
                { label: 'Latency', value: '< 9ms Sub-Ghz Radio' },
                { label: 'Range', value: 'Up to 7.5 km Line-of-Sight' }
            ],
            rot: { x: -0.2, y: -1.2 }
        },
        battery: {
            title: 'Graphene LiPo Energy Cell',
            subtitle: 'High-Discharge Power System',
            specs: [
                { label: 'Configuration', value: '4S1P 1500mAh 14.8V' },
                { label: 'Discharge', value: '120C Continuous / 240C Burst' },
                { label: 'Flight Endurance', value: '18-24 Minutes' },
                { label: 'BMS', value: 'Active Cell Balancing & Overcurrent' }
            ],
            rot: { x: -0.65, y: 0.15 }
        }
    };

    /**
     * Initialize on DOM Ready
     */
    function init() {
        container = document.getElementById('drone-viewport');
        if (!container) return;

        if (typeof THREE === 'undefined') {
            setTimeout(init, 200);
            return;
        }

        setupScene();
        setupHologramShader();
        setupProjectorEnvironment();
        setupEventListeners();
        loadDroneModel();
        setupUIControls();
        animate();
    }

    /**
     * 1. Setup Three.js Scene, Camera, High-DPI Renderer & Studio Lighting
     */
    function setupScene() {
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x020206, 0.035);

        camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
        camera.position.set(0, 0.25, state.currentZoom);
        camera.lookAt(0, 0, 0);

        const canvas = document.getElementById('drone-canvas');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;

        // Hierarchical Transform Groups
        droneRootGroup = new THREE.Group();
        dronePivot = new THREE.Group();
        droneRootGroup.add(dronePivot);
        scene.add(droneRootGroup);

        // Studio Lighting for Original PBR Material Textures
        const mainSun = new THREE.DirectionalLight(0xffffff, 2.2);
        mainSun.position.set(5, 8, 5);
        scene.add(mainSun);
        pbrLights.push(mainSun);

        const fillLight = new THREE.DirectionalLight(0xe0e7ff, 1.4);
        fillLight.position.set(-5, 4, -4);
        scene.add(fillLight);
        pbrLights.push(fillLight);

        const bottomBounce = new THREE.DirectionalLight(0x38bdf8, 1.0);
        bottomBounce.position.set(0, -4, 2);
        scene.add(bottomBounce);
        pbrLights.push(bottomBounce);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f172a, 1.2);
        scene.add(hemiLight);
        pbrLights.push(hemiLight);
    }

    /**
     * 2. Custom Holographic GLSL Shader Material
     */
    function setupHologramShader() {
        const currentTheme = HOLO_THEMES.cyan;

        const customUniforms = {
            uTime: { value: 0 },
            uColor: { value: currentTheme.base.clone() },
            uRimColor: { value: currentTheme.rim.clone() },
            uOpacity: { value: 0.82 },
            uGlitch: { value: 0.0 },
            uEdgePulse: { value: 0.0 }
        };

        const vertexShader = `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying vec2 vUv;
            uniform float uTime;
            uniform float uGlitch;

            void main() {
                vUv = uv;
                vNormal = normalize(normalMatrix * normal);
                
                vec3 transformed = position;
                
                // Dynamic Holographic slice displacement glitch
                if (uGlitch > 0.01) {
                    float sliceId = floor((transformed.y + uTime * 6.0) * 12.0);
                    float sliceTrigger = sin(sliceId * 91.3 + floor(uTime * 22.0));
                    float isGlitchSlice = step(0.58, sliceTrigger);

                    float shiftAmount = sin(sliceId * 163.1 + uTime * 60.0);
                    transformed.x += isGlitchSlice * shiftAmount * 0.08 * uGlitch;
                    transformed.z += isGlitchSlice * cos(sliceId * 74.7 + uTime * 50.0) * 0.06 * uGlitch;

                    // High-frequency jitter
                    transformed.y += sin(transformed.x * 60.0 + uTime * 90.0) * 0.015 * uGlitch;
                }
                
                vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
                vWorldPosition = worldPos.xyz;
                
                vec4 mvPosition = viewMatrix * worldPos;
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vViewPosition;
            varying vec2 vUv;

            uniform float uTime;
            uniform vec3 uColor;
            uniform vec3 uRimColor;
            uniform float uOpacity;
            uniform float uEdgePulse;
            uniform float uGlitch;

            void main() {
                vec3 viewDir = normalize(vViewPosition);
                vec3 norm = normalize(vNormal);

                // Strong Fresnel / Rim lighting on mechanical edges
                float NdotV = abs(dot(viewDir, norm));
                float fresnel = 1.0 - NdotV;
                float fresnelGlow = pow(fresnel, 2.2);

                // Animated horizontal holographic scanlines
                float scanline = sin(vWorldPosition.y * 95.0 - uTime * 6.5) * 0.5 + 0.5;
                scanline = pow(scanline, 1.8) * 0.28;

                // Secondary wide atmospheric sweep
                float sweep = sin(vWorldPosition.y * 16.0 - uTime * 2.0) * 0.5 + 0.5;
                sweep = pow(sweep, 3.0) * 0.18;

                // Fine CAD wireframe contour grid
                float gridX = abs(fract(vWorldPosition.x * 22.0) - 0.5);
                float gridZ = abs(fract(vWorldPosition.z * 22.0) - 0.5);
                float cadGrid = (smoothstep(0.05, 0.0, gridX) + smoothstep(0.05, 0.0, gridZ)) * 0.24;

                // Holographic Glitch effects: Chromatic RGB split and digital noise
                vec3 glitchRgbShift = vec3(0.0);
                if (uGlitch > 0.01) {
                    float sliceY = fract(vWorldPosition.y * 16.0 + uTime * 26.0);
                    float isGlitchLine = step(0.68, sliceY);

                    // Chromatic split (RGB glitch offset)
                    glitchRgbShift.r = isGlitchLine * 0.38 * uGlitch;
                    glitchRgbShift.b = (1.0 - isGlitchLine) * 0.28 * uGlitch;
                    glitchRgbShift.g = sin(uTime * 45.0) * 0.18 * uGlitch;

                    // Digital noise scanline stutter
                    float noise = fract(sin(dot(vUv * 120.0, vec2(12.9898, 78.233)) + uTime * 15.0) * 43758.5453);
                    glitchRgbShift += vec3(noise * 0.35 * uGlitch);
                }

                // Edge pulse brightening
                float edgeBrighten = fresnelGlow * (1.25 + uEdgePulse * 0.85);

                // Base holographic color composition with glitch shift
                vec3 col = uColor * (0.32 + scanline + sweep) + glitchRgbShift;
                col += uRimColor * (edgeBrighten + cadGrid);

                // Subtle digital noise & flickering
                float flicker = 1.0 + sin(uTime * 32.0) * 0.02 + cos(uTime * 48.0) * 0.02;
                col *= flicker;

                // Alpha transparency (translucent core with glowing rims)
                float alpha = (0.32 + fresnelGlow * 0.65 + scanline * 0.12) * uOpacity;

                gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.96));
            }
        `;

        holoMaterial = new THREE.ShaderMaterial({
            uniforms: customUniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.NormalBlending
        });

        wireframeMaterial = new THREE.MeshBasicMaterial({
            color: currentTheme.base,
            wireframe: true,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending
        });
    }

    /**
     * 4. Holographic Pedestal Environment
     */
    function setupProjectorEnvironment() {
        const currentTheme = HOLO_THEMES.cyan;

        const envGroup = new THREE.Group();
        scene.add(envGroup);

        const ringGeom1 = new THREE.RingGeometry(1.4, 1.42, 64);
        const ringMat1 = new THREE.MeshBasicMaterial({
            color: currentTheme.base,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const ring1 = new THREE.Mesh(ringGeom1, ringMat1);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = -1.35;
        envGroup.add(ring1);
        projectorRings.push({ mesh: ring1, speed: 0.005 });

        const ringGeom2 = new THREE.RingGeometry(1.8, 1.83, 64);
        const ringMat2 = new THREE.MeshBasicMaterial({
            color: currentTheme.rim,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide
        });
        const ring2 = new THREE.Mesh(ringGeom2, ringMat2);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = -1.35;
        envGroup.add(ring2);
        projectorRings.push({ mesh: ring2, speed: -0.0035 });

        const ringGeom3 = new THREE.RingGeometry(2.1, 2.15, 32);
        const ringMat3 = new THREE.MeshBasicMaterial({
            color: currentTheme.base,
            transparent: true,
            opacity: 0.18,
            wireframe: true,
            side: THREE.DoubleSide
        });
        const ring3 = new THREE.Mesh(ringGeom3, ringMat3);
        ring3.rotation.x = Math.PI / 2;
        ring3.position.y = -1.35;
        envGroup.add(ring3);
        projectorRings.push({ mesh: ring3, speed: 0.002 });

        const particleCount = 450;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.2 + Math.random() * 2.4;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = -1.35 + Math.random() * 3.0;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            velocities[i] = 0.003 + Math.random() * 0.007;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.userData = { velocities: velocities };

        const particleMaterial = new THREE.PointsMaterial({
            color: currentTheme.particle,
            size: 0.035,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending
        });

        particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        envGroup.add(particleSystem);
    }

    /**
     * 5. Load Public/3d/drone.glb
     */
    function loadDroneModel() {
        const progressBar = document.getElementById('drone-load-progress-bar');
        const progressText = document.getElementById('drone-load-percent');
        const loadBytes = document.getElementById('drone-load-bytes');
        const loadingOverlay = document.getElementById('drone-loading-overlay');

        if (typeof THREE.GLTFLoader === 'undefined') {
            createFallbackProceduralDrone();
            return;
        }

        const loader = new THREE.GLTFLoader();

        // 1. Direct Base64 Binary Stream (file:/// support)
        if (window.DRONE_GLB_BASE64 && typeof window.DRONE_GLB_BASE64 === 'string' && window.DRONE_GLB_BASE64.length > 1000) {
            if (progressText) progressText.textContent = '40%';
            if (progressBar) progressBar.style.width = '40%';
            if (loadBytes) loadBytes.textContent = 'Decoding 54.9 MB Aerospace CAD...';
            updateTelemetryHUD('DECODING // drone.glb');

            setTimeout(() => {
                try {
                    const b64 = window.DRONE_GLB_BASE64;
                    const binaryString = window.atob(b64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);

                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    if (progressText) progressText.textContent = '85%';
                    if (progressBar) progressBar.style.width = '85%';
                    if (loadBytes) loadBytes.textContent = 'Parsing Geometry Mesh (989k Vertices)...';

                    loader.parse(
                        bytes.buffer,
                        '',
                        function (gltf) {
                            processLoadedModel(gltf.scene);
                            if (progressText) progressText.textContent = '100%';
                            if (progressBar) progressBar.style.width = '100%';
                            if (loadBytes) loadBytes.textContent = '54.9 MB drone.glb Ready';

                            if (loadingOverlay) {
                                loadingOverlay.classList.add('fade-out');
                                setTimeout(() => {
                                    loadingOverlay.style.display = 'none';
                                }, 500);
                            }
                            state.loaded = true;
                            updateTelemetryHUD('ONLINE // drone.glb (ACTIVE)');
                        },
                        function (parseErr) {
                            console.error('GLTF parse error:', parseErr);
                            fallbackToFetch();
                        }
                    );
                } catch (decodeErr) {
                    console.error('Base64 decode error:', decodeErr);
                    fallbackToFetch();
                }
            }, 60);
            return;
        }

        fallbackToFetch();

        function fallbackToFetch() {
            const modelPath = 'Public/3d/drone.glb';

            loader.load(
                modelPath,
                function (gltf) {
                    processLoadedModel(gltf.scene);
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('fade-out');
                        setTimeout(() => {
                            loadingOverlay.style.display = 'none';
                        }, 500);
                    }
                    state.loaded = true;
                    updateTelemetryHUD('ONLINE // drone.glb (ACTIVE)');
                },
                function (xhr) {
                    if (xhr.lengthComputable && xhr.total > 0) {
                        const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
                        if (progressBar) progressBar.style.width = `${percent}%`;
                        if (progressText) progressText.textContent = `${percent}%`;
                        if (loadBytes) {
                            const loadedMb = (xhr.loaded / (1024 * 1024)).toFixed(1);
                            const totalMb = (xhr.total / (1024 * 1024)).toFixed(1);
                            loadBytes.textContent = `${loadedMb} MB / ${totalMb} MB`;
                        }
                    }
                },
                function (error) {
                    console.warn('Could not load drone.glb directly via fetch:', error);
                    createFallbackProceduralDrone();

                    if (loadingOverlay) {
                        loadingOverlay.classList.add('fade-out');
                        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 600);
                    }
                    state.loaded = true;
                    updateTelemetryHUD('ONLINE // PROCEDURAL BACKUP');
                }
            );
        }
    }

    /**
     * Process Loaded Model: Center & Preserve Original PBR Material
     */
    function processLoadedModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const targetScale = 2.6 / (maxDim || 1.0);
        model.scale.setScalar(targetScale);

        model.position.x = -center.x * targetScale;
        model.position.y = -center.y * targetScale;
        model.position.z = -center.z * targetScale;

        model.traverse(function (child) {
            if (child.isMesh) {
                if (child.geometry && !child.geometry.attributes.normal) {
                    child.geometry.computeVertexNormals();
                }
                child.userData.originalMaterial = child.material;

                if (state.activeColorTheme === 'original') {
                    child.material = child.userData.originalMaterial;
                } else {
                    child.material = holoMaterial;
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        loadedModelMesh = model;
        dronePivot.add(model);
        dronePivot.updateMatrixWorld(true);
    }

    function createFallbackProceduralDrone() {
        const droneGroup = new THREE.Group();

        const coreGeom = new THREE.CylinderGeometry(0.35, 0.42, 0.18, 8);
        const coreMesh = new THREE.Mesh(coreGeom, holoMaterial);
        droneGroup.add(coreMesh);

        const canopyGeom = new THREE.SphereGeometry(0.28, 16, 12);
        canopyGeom.scale(1, 0.5, 1.2);
        const canopyMesh = new THREE.Mesh(canopyGeom, holoMaterial);
        canopyMesh.position.y = 0.1;
        droneGroup.add(canopyMesh);

        const armCount = 6;
        for (let i = 0; i < armCount; i++) {
            const angle = (i / armCount) * Math.PI * 2;
            const armLen = 1.05;

            const armGeom = new THREE.CylinderGeometry(0.025, 0.025, armLen, 8);
            const arm = new THREE.Mesh(armGeom, holoMaterial);
            arm.rotation.z = Math.PI / 2;
            arm.rotation.y = angle;
            arm.position.x = Math.cos(angle) * (armLen * 0.5);
            arm.position.z = Math.sin(angle) * (armLen * 0.5);
            droneGroup.add(arm);

            const motorGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 12);
            const motor = new THREE.Mesh(motorGeom, holoMaterial);
            motor.position.x = Math.cos(angle) * armLen;
            motor.position.z = Math.sin(angle) * armLen;
            motor.position.y = 0.06;
            droneGroup.add(motor);

            const propGeom = new THREE.BoxGeometry(0.48, 0.008, 0.04);
            const prop = new THREE.Mesh(propGeom, holoMaterial);
            prop.position.set(motor.position.x, motor.position.y + 0.08, motor.position.z);
            prop.rotation.y = angle * 2;
            droneGroup.add(prop);
        }

        loadedModelMesh = droneGroup;
        dronePivot.add(droneGroup);
        dronePivot.updateMatrixWorld(true);
        updateTelemetryHUD('HOLO-CAD ACTIVE // PROCEDURAL SIM');
    }

    /**
     * 6. User Input Controls: Mouse, Touch, Inertia, Zoom, Pan
     */
    function setupEventListeners() {
        const canvas = document.getElementById('drone-canvas');

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('pointerdown', (e) => {
            state.isDragging = true;
            state.dragButton = e.button;
            state.prevPointerX = e.clientX;
            state.prevPointerY = e.clientY;
            state.velX = 0;
            state.velY = 0;
            state.lastInteractionTime = performance.now();
            state.autoResumeWeight = 0;
            canvas.style.cursor = state.dragButton === 2 ? 'move' : 'grabbing';
        });

        window.addEventListener('pointermove', (e) => {
            if (!state.isDragging) return;

            const dx = e.clientX - state.prevPointerX;
            const dy = e.clientY - state.prevPointerY;
            state.prevPointerX = e.clientX;
            state.prevPointerY = e.clientY;

            state.lastInteractionTime = performance.now();
            state.autoResumeWeight = 0;

            if (state.dragButton === 2) {
                state.targetPanX += dx * 0.004;
                state.targetPanY -= dy * 0.004;
                state.targetPanX = Math.max(-1.8, Math.min(1.8, state.targetPanX));
                state.targetPanY = Math.max(-1.2, Math.min(1.2, state.targetPanY));
            } else {
                const rotSensitivity = 0.0075;
                state.targetRotY += dx * rotSensitivity;
                state.targetRotX += dy * rotSensitivity;
                state.targetRotX = Math.max(state.pitchMin, Math.min(state.pitchMax, state.targetRotX));
                state.velY = dx * rotSensitivity;
                state.velX = dy * rotSensitivity;
            }
        });

        const handlePointerEnd = () => {
            if (state.isDragging) {
                state.isDragging = false;
                state.lastInteractionTime = performance.now();
                canvas.style.cursor = 'grab';
            }
        };
        window.addEventListener('pointerup', handlePointerEnd);
        window.addEventListener('pointercancel', handlePointerEnd);

        canvas.addEventListener('wheel', (e) => {
            // Zoom only when Alt key is held (Alt + Scroll)
            if (e.altKey) {
                e.preventDefault();
                const zoomDelta = e.deltaY * 0.0035;
                state.targetZoom += zoomDelta;
                state.targetZoom = Math.max(state.zoomMin, Math.min(state.zoomMax, state.targetZoom));
                state.lastInteractionTime = performance.now();
                state.autoResumeWeight = 0;
            }
            // Without Alt, wheel scroll naturally scrolls the web page
        }, { passive: false });

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                state.isDragging = true;
                state.dragButton = 0;
                state.prevPointerX = e.touches[0].clientX;
                state.prevPointerY = e.touches[0].clientY;
                state.velX = 0;
                state.velY = 0;
            } else if (e.touches.length === 2) {
                state.isDragging = false;
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                state.touchDistanceStart = Math.hypot(dx, dy);
                state.touchZoomStart = state.targetZoom;
            }
            state.lastInteractionTime = performance.now();
            state.autoResumeWeight = 0;
        }, { passive: true });

        canvas.addEventListener('touchmove', (e) => {
            state.lastInteractionTime = performance.now();
            state.autoResumeWeight = 0;

            if (e.touches.length === 1 && state.isDragging) {
                const dx = e.touches[0].clientX - state.prevPointerX;
                const dy = e.touches[0].clientY - state.prevPointerY;
                state.prevPointerX = e.touches[0].clientX;
                state.prevPointerY = e.touches[0].clientY;

                state.targetRotY += dx * 0.008;
                state.targetRotX += dy * 0.008;
                state.targetRotX = Math.max(state.pitchMin, Math.min(state.pitchMax, state.targetRotX));

                state.velY = dx * 0.008;
                state.velX = dy * 0.008;
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.hypot(dx, dy);
                const scale = state.touchDistanceStart / (distance || 1);
                state.targetZoom = Math.max(state.zoomMin, Math.min(state.zoomMax, state.touchZoomStart * scale));
            }
        }, { passive: true });

        canvas.addEventListener('touchend', () => {
            state.isDragging = false;
            state.lastInteractionTime = performance.now();
        }, { passive: true });

        window.addEventListener('resize', handleResize);
    }

    function handleResize() {
        if (!container || !renderer || !camera) return;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    /**
     * 7. UI Controls & Presets
     */
    function setupUIControls() {
        document.querySelectorAll('[data-drone-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.getAttribute('data-drone-preset');
                applyCameraPreset(preset);
                document.querySelectorAll('[data-drone-preset]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        document.querySelectorAll('[data-holo-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const colorKey = e.currentTarget.getAttribute('data-holo-color');
                switchHoloTheme(colorKey);
                document.querySelectorAll('[data-holo-color]').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        const wireframeBtn = document.getElementById('btn-toggle-wireframe');
        if (wireframeBtn) {
            wireframeBtn.addEventListener('click', () => {
                state.wireframeEnabled = !state.wireframeEnabled;
                wireframeBtn.classList.toggle('active', state.wireframeEnabled);
                toggleWireframeMode(state.wireframeEnabled);
            });
        }

        const autoRotateBtn = document.getElementById('btn-toggle-autorotate');
        if (autoRotateBtn) {
            autoRotateBtn.addEventListener('click', () => {
                state.autoRotateEnabled = !state.autoRotateEnabled;
                autoRotateBtn.classList.toggle('active', state.autoRotateEnabled);
                autoRotateBtn.querySelector('span').textContent = state.autoRotateEnabled ? 'Auto Spin: ON' : 'Auto Spin: OFF';
            });
        }

        const resetBtn = document.getElementById('btn-reset-drone');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                state.targetRotX = 0.28;
                state.targetRotY = -0.65;
                state.targetPanX = 0;
                state.targetPanY = 0;
                state.targetZoom = 4.0;
                state.velX = 0;
                state.velY = 0;
                closeHotspotModal();
            });
        }

        document.querySelectorAll('[data-hotspot-target]').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const targetKey = e.currentTarget.getAttribute('data-hotspot-target');
                triggerHotspot(targetKey);
            });
        });

        const closeBtn = document.getElementById('drone-hotspot-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeHotspotModal);
        }
    }

    function applyCameraPreset(preset) {
        state.lastInteractionTime = performance.now();
        state.autoResumeWeight = 0;

        switch (preset) {
            case 'perspective':
                state.targetRotX = 0.28;
                state.targetRotY = -0.65;
                state.targetZoom = 4.0;
                break;
            case 'top':
                state.targetRotX = Math.PI / 2 - 0.05;
                state.targetRotY = 0;
                state.targetZoom = 4.4;
                break;
            case 'front':
                state.targetRotX = 0.08;
                state.targetRotY = 0;
                state.targetZoom = 3.6;
                break;
            case 'cockpit':
                state.targetRotX = 0.12;
                state.targetRotY = -0.2;
                state.targetZoom = 2.6;
                break;
        }
    }

    /**
     * Switch Theme: Supports Original PBR Materials + Holographic Spectrum
     */
    function switchHoloTheme(colorKey) {
        state.activeColorTheme = colorKey;

        if (!loadedModelMesh) return;

        if (colorKey === 'original') {
            loadedModelMesh.traverse(child => {
                if (child.isMesh && child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.material.needsUpdate = true;
                }
            });

            if (projectorRings.length > 0) {
                projectorRings.forEach(r => r.mesh.visible = false);
            }
            if (particleSystem) particleSystem.visible = false;

            updateTelemetryHUD('ORIGINAL CAD // PBR TEXTURES ACTIVE');
        } else {
            const theme = HOLO_THEMES[colorKey];
            if (!theme) return;

            loadedModelMesh.traverse(child => {
                if (child.isMesh) {
                    child.material = state.wireframeEnabled ? wireframeMaterial : holoMaterial;
                    child.material.needsUpdate = true;
                }
            });

            if (holoMaterial && holoMaterial.uniforms) {
                holoMaterial.uniforms.uColor.value.copy(theme.base);
                holoMaterial.uniforms.uRimColor.value.copy(theme.rim);
            }

            if (wireframeMaterial) {
                wireframeMaterial.color.copy(theme.base);
            }

            if (particleSystem) {
                particleSystem.visible = true;
                particleSystem.material.color.set(theme.particle);
            }

            if (projectorRings.length > 0) {
                projectorRings.forEach(r => r.mesh.visible = true);
                projectorRings[0].mesh.material.color.copy(theme.base);
                if (projectorRings[1]) projectorRings[1].mesh.material.color.copy(theme.rim);
                if (projectorRings[2]) projectorRings[2].mesh.material.color.copy(theme.base);
            }

            updateTelemetryHUD('ONLINE // ' + colorKey.toUpperCase() + ' HOLOGRAPH');
        }
    }

    function toggleWireframeMode(enabled) {
        if (!loadedModelMesh) return;
        loadedModelMesh.traverse(child => {
            if (child.isMesh) {
                if (enabled) {
                    child.material = wireframeMaterial;
                } else {
                    child.material = (state.activeColorTheme === 'original' && child.userData.originalMaterial) 
                        ? child.userData.originalMaterial 
                        : holoMaterial;
                }
            }
        });
    }

    function triggerHotspot(key) {
        const data = HOTSPOTS[key];
        if (!data) return;

        state.currentHotspot = key;
        state.targetRotX = data.rot.x;
        state.targetRotY = data.rot.y;
        state.targetZoom = 3.2;
        state.lastInteractionTime = performance.now();
        state.autoResumeWeight = 0;

        const card = document.getElementById('drone-hotspot-card');
        const titleEl = document.getElementById('drone-hotspot-title');
        const subtitleEl = document.getElementById('drone-hotspot-subtitle');
        const gridEl = document.getElementById('drone-hotspot-grid');

        if (card && titleEl && subtitleEl && gridEl) {
            titleEl.textContent = data.title;
            subtitleEl.textContent = data.subtitle;

            gridEl.innerHTML = data.specs.map(spec => `
                <div class="drone-spec-row">
                    <span class="drone-spec-label">${spec.label}</span>
                    <span class="drone-spec-val">${spec.value}</span>
                </div>
            `).join('');

            card.classList.add('is-active');
        }
    }

    function closeHotspotModal() {
        state.currentHotspot = null;
        const card = document.getElementById('drone-hotspot-card');
        if (card) card.classList.remove('is-active');
    }

    function updateTelemetryHUD(statusText) {
        const statusEl = document.getElementById('drone-hud-status');
        if (statusEl) statusEl.textContent = statusText;
    }

    /**
     * 8. Animation Loop with Spring Inertia and Auto-Bobbing
     */
    function animate() {
        animFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 1. Inactivity & Smooth Auto-Resume Lerp
        const inactiveTime = performance.now() - state.lastInteractionTime;
        if (!state.isDragging && inactiveTime > 2500 && state.autoRotateEnabled) {
            state.autoResumeWeight += (1.0 - state.autoResumeWeight) * 0.035;
        } else {
            state.autoResumeWeight += (0.0 - state.autoResumeWeight) * 0.12;
        }

        // 2. Inertia Momentum Decay
        if (!state.isDragging) {
            state.targetRotX += state.velX;
            state.targetRotY += state.velY;
            state.velX *= 0.925;
            state.velY *= 0.925;
            state.targetRotX = Math.max(state.pitchMin, Math.min(state.pitchMax, state.targetRotX));
        }

        // 3. Auto-Rotation
        if (state.autoRotateEnabled && state.autoResumeWeight > 0.01) {
            state.targetRotY += state.autoRotateSpeed * state.autoResumeWeight;
        }

        // 4. Smooth Damping (Spring Lerp)
        const rotDamping = 0.14;
        state.currentRotX += (state.targetRotX - state.currentRotX) * rotDamping;
        state.currentRotY += (state.targetRotY - state.currentRotY) * rotDamping;
        state.currentPanX += (state.targetPanX - state.currentPanX) * 0.1;
        state.currentPanY += (state.targetPanY - state.currentPanY) * 0.1;
        state.currentZoom += (state.targetZoom - state.currentZoom) * 0.1;

        // Apply to Drone Hierarchy
        if (dronePivot) {
            dronePivot.rotation.x = state.currentRotX;
            dronePivot.rotation.y = state.currentRotY;
            dronePivot.position.y = Math.sin(time * 1.7) * 0.11 * state.autoResumeWeight;

            // Spring scale flourish
            const curScale = dronePivot.scale.x;
            dronePivot.scale.setScalar(curScale + (1.0 - curScale) * 0.08);
        }

        if (droneRootGroup) {
            droneRootGroup.position.x = state.currentPanX;
            droneRootGroup.position.z = state.currentPanY;
        }

        // Apply Camera Smooth Zoom
        if (camera) {
            camera.position.z = state.currentZoom;
            camera.lookAt(0, 0, 0);
        }

        // 5. Update Holographic Shader Uniforms
        if (holoMaterial && holoMaterial.uniforms) {
            holoMaterial.uniforms.uTime.value = time;

            const pulseCycle = time % 4.0;
            if (pulseCycle < 0.8) {
                holoMaterial.uniforms.uEdgePulse.value = Math.sin((pulseCycle / 0.8) * Math.PI);
            } else {
                holoMaterial.uniforms.uEdgePulse.value = 0.0;
            }

            const glitchCycle = time % 7.5;
            if (glitchCycle > 7.35) {
                holoMaterial.uniforms.uGlitch.value = 0.85;
            } else {
                holoMaterial.uniforms.uGlitch.value = 0.0;
            }
        }

        // 8. Rotate Projector Rings
        if (state.activeColorTheme !== 'original') {
            for (let i = 0; i < projectorRings.length; i++) {
                projectorRings[i].mesh.rotation.z += projectorRings[i].speed;
            }
        }

        // 9. Update Ascending Floating Particles
        if (particleSystem && state.activeColorTheme !== 'original') {
            const posAttr = particleSystem.geometry.attributes.position;
            const vels = particleSystem.geometry.userData.velocities;
            const count = posAttr.count;

            for (let i = 0; i < count; i++) {
                let y = posAttr.getY(i);
                y += vels[i];
                if (y > 1.85) {
                    y = -1.35;
                }
                posAttr.setY(i, y);
            }
            posAttr.needsUpdate = true;
            particleSystem.rotation.y += 0.001;
        }

        // 10. Render Scene
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    window.initHolographicDrone = init;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 50);
    }
})();
