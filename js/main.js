/**
 * BROMATRIX INNOVATION PLATFORM
 * Apple-Inspired Framer Motion Animation Engine & Interactive Controls
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroScrollSequence();
    initFramerMotionAnimations();
    initNavbarScroll();
    initCurriculumControls();
    initTopologyVisualizer();
    initEstimatorCalculator();
    initModalHandlers();
    initMobileNav();
    initCosmicThemeObserver();
    initNavGlassMouseEffect();
    initTypewriterEffect();
    initCountUpAnimation();
});

/* ===================================================================
   COUNT-UP ANIMATION — Manifesto Stats
   =================================================================== */
function initCountUpAnimation() {
    const counters = document.querySelectorAll('.count-up');
    if (!counters.length) return;

    const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

    function animateCounter(el) {
        const target   = parseInt(el.dataset.count, 10);
        const suffix   = el.dataset.suffix || '';
        const pad      = parseInt(el.dataset.pad || '0', 10);
        const duration = 1800; // ms
        const start    = performance.now();

        function tick(now) {
            const elapsed  = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased    = easeOutQuart(progress);
            const current  = Math.round(eased * target);

            // Zero-pad if needed (e.g. "02", "04")
            const display = pad > 0
                ? String(current).padStart(pad, '0')
                : String(current);

            el.textContent = display + suffix;

            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target); // run once
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
}


/* ===================================================================
   TYPEWRITER EFFECT — Manifesto Section
   =================================================================== */
function initTypewriterEffect() {
    const el = document.getElementById('manifesto-typewriter');
    if (!el) return;

    const line1Text = el.dataset.textLine1 || '';
    const line2Text = el.dataset.textLine2 || '';
    const line1El   = el.querySelector('.typewriter-line-1');
    const line2El   = el.querySelector('.typewriter-line-2');
    const cursor    = el.querySelector('.typewriter-cursor');

    let hasPlayed = false;

    function typeText(target, text, speed, onDone) {
        target.textContent = '';
        let i = 0;
        const tick = setInterval(() => {
            target.textContent += text[i++];
            if (i >= text.length) {
                clearInterval(tick);
                if (onDone) onDone();
            }
        }, speed);
    }

    function playAnimation() {
        line1El.textContent = '';
        line2El.textContent = '';
        if (cursor) cursor.classList.remove('hidden');

        // Type line 1 at 45ms/char
        typeText(line1El, line1Text, 45, () => {
            // Pause 400ms then type line 2 at 28ms/char
            setTimeout(() => {
                typeText(line2El, line2Text, 28, () => {
                    // Hide cursor after 2s when done
                    setTimeout(() => {
                        if (cursor) cursor.classList.add('hidden');
                    }, 2000);
                });
            }, 400);
        });
    }

    // Trigger on scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPlayed) {
                hasPlayed = true;
                playAnimation();
            }
        });
    }, { threshold: 0.1 });

    observer.observe(el);

    // Click to replay
    el.addEventListener('click', () => {
        hasPlayed = false;
        playAnimation();
    });
}


/* ===================================================================
   NAV LIQUID GLASS — WATER FLOW HOVER EFFECT
   =================================================================== */
function initNavGlassMouseEffect() {
    const capsule = document.querySelector('.nav-capsule');
    if (!capsule) return;

    // Inject the dark glass bubble
    const bubble = document.createElement('div');
    bubble.className = 'nav-glass-cursor';
    capsule.prepend(bubble);

    const links = capsule.querySelectorAll('a');

    // Move bubble to hovered link — stays visible between links (no flicker)
    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            const capsuleRect = capsule.getBoundingClientRect();
            const linkRect    = link.getBoundingClientRect();
            const centerX     = linkRect.left - capsuleRect.left + linkRect.width / 2;

            bubble.style.width   = `${linkRect.width + 28}px`;
            bubble.style.left    = `${centerX}px`;
            bubble.style.opacity = '1';
        });
    });

    // Only fade out when mouse leaves the entire capsule
    capsule.addEventListener('mouseleave', () => {
        bubble.style.opacity = '0';
        setTimeout(() => {
            if (bubble.style.opacity === '0') bubble.style.left = '-999px';
        }, 300);
    });
}


/* ===================================================================
   1. APPLE-STYLE FRAMER MOTION ANIMATION OBSERVER
   =================================================================== */
function initFramerMotionAnimations() {
    const animatedElements = document.querySelectorAll('.fm-reveal, .fm-scale, .fm-mask-inner');

    if (!('IntersectionObserver' in window)) {
        // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('is-inview'));
        return;
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px 50px 0px',
        threshold: 0.01
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-inview');
                // Once animated, keep in view like Apple product pages
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));

    // Stagger children within any .fm-stagger container
    document.querySelectorAll('.fm-stagger').forEach(container => {
        Array.from(container.children).forEach((child, index) => {
            child.style.transitionDelay = `${(index * 0.08) + 0.05}s`;
        });
    });
}

/* ===================================================================
   2. HERO SCROLL-DRIVEN 3D FRAME SEQUENCE ENGINE (120 FRAMES)
   =================================================================== */
function initHeroScrollSequence() {
    const canvas = document.getElementById('hero-frame-canvas');
    const container = document.getElementById('hero-scroll');
    const progressBar = document.getElementById('hero-progress-bar');
    const stageCounter = document.getElementById('hero-current-step');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const TOTAL_FRAMES = 120;
    const frames = [];
    let imagesLoaded = 0;
    let targetFrame = 0;
    let currentFrame = 0;
    let isTicking = false;

    let currentProgress = 0;

    // Helper for formatted frame URL (ezgif-frame-001.png to ezgif-frame-120.png)
    function getFrameSrc(index) {
        const num = String(index).padStart(3, '0');
        return `Public/Images/Hero section/ezgif-frame-${num}.png`;
    }

    // Initialize frames array with placeholders
    for (let i = 0; i < TOTAL_FRAMES; i++) {
        frames.push(null);
    }

    // Load a specific frame on demand
    function loadFrame(index, callback) {
        if (frames[index] && frames[index].complete && frames[index].naturalWidth > 0) {
            if (callback) callback();
            return;
        }
        const img = new Image();
        img.onload = () => {
            frames[index] = img;
            imagesLoaded++;
            if (callback) callback();
        };
        img.onerror = () => {};
        img.src = getFrameSrc(index + 1);
        frames[index] = img;
    }

    // Preload a window of frames around the target index
    function preloadWindow(centerIndex, windowSize) {
        const start = Math.max(0, centerIndex - windowSize);
        const end = Math.min(TOTAL_FRAMES - 1, centerIndex + windowSize);
        for (let i = start; i <= end; i++) {
            loadFrame(i);
        }
    }

    // Load first frame immediately so the hero is visible at once
    loadFrame(0, () => {
        renderFrame(0);
        resizeCanvas();
        // After first frame, preload frames 0-20 for initial scroll range
        setTimeout(() => preloadWindow(0, 20), 100);
        // Then load all remaining frames in background after page is interactive
        setTimeout(() => {
            for (let i = 20; i < TOTAL_FRAMES; i++) {
                (function(idx) {
                    setTimeout(() => loadFrame(idx), idx * 8);
                })(i);
            }
        }, 1500);
    });

    // High-DPI canvas sizing
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        renderFrame(Math.round(currentFrame));
    }

    // Aspect-ratio cover/contain rendering centered on canvas
    function renderFrame(frameIndex) {
        const img = frames[frameIndex];
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const hRatio = w / imgW;
        const vRatio = h / imgH;
        const ratio = Math.max(hRatio, vRatio); // Cover to fill viewport

        const drawW = imgW * ratio;
        const drawH = imgH * ratio;
        const drawX = (w - drawW) / 2;
        const drawY = (h - drawH) / 2;

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    // Story Stages Configuration with continuous coverage (no blank gaps)
    const stages = [
        { el: document.getElementById('hero-stage-1'), center: 0.10, span: 0.16 },
        { el: document.getElementById('hero-stage-2'), center: 0.36, span: 0.18 },
        { el: document.getElementById('hero-stage-3'), center: 0.64, span: 0.18 },
        { el: document.getElementById('hero-stage-4'), center: 0.88, span: 0.18 }
    ];

    function updateScrollProgress() {
        const rect = container.getBoundingClientRect();
        const totalScrollable = container.offsetHeight - window.innerHeight;
        if (totalScrollable <= 0) return;

        const rawProgress = -rect.top / totalScrollable;
        const progress = Math.min(Math.max(rawProgress, 0), 1);
        currentProgress = progress;

        // Frame target (0 to 119)
        if (progress >= 0.99) {
            targetFrame = TOTAL_FRAMES - 1;
        } else if (progress <= 0.005) {
            targetFrame = 0;
        } else {
            targetFrame = progress * (TOTAL_FRAMES - 1);
        }

        // Progress bar width
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }

        // Cross-fade text stages with smooth cosine curve and no blank gaps
        let activeStageIndex = 0;
        let maxOpacity = 0;

        stages.forEach((stage, idx) => {
            if (!stage.el) return;

            let opacity = 0;
            let translateY = 0;

            if (idx === 0) {
                // First stage: 100% visible from initial load (progress = 0) up to 0.14, then fades out smoothly
                if (progress <= 0.14) {
                    opacity = 1;
                    translateY = 0;
                } else if (progress <= 0.28) {
                    const t = (progress - 0.14) / (0.28 - 0.14);
                    opacity = 0.5 * (1 + Math.cos(t * Math.PI));
                    translateY = -30 * t;
                }
            } else if (idx === stages.length - 1) {
                // Last stage: fades in smoothly around 0.68, peaks at ~0.78-0.90, then fades out cleanly before the manifesto section appears
                if (progress >= 0.72 && progress <= 0.90) {
                    opacity = 1;
                    translateY = 0;
                } else if (progress > 0.90) {
                    const t = (progress - 0.90) / (0.99 - 0.90);
                    opacity = Math.max(0, 0.5 * (1 + Math.cos(Math.min(t, 1) * Math.PI)));
                    translateY = -25 * Math.min(t, 1);
                } else if (progress >= 0.58) {
                    const t = (0.72 - progress) / (0.72 - 0.58);
                    opacity = 0.5 * (1 + Math.cos(t * Math.PI));
                    translateY = 25 * t;
                }
            } else {
                // Intermediate stages
                const dist = Math.abs(progress - stage.center);
                if (dist < stage.span) {
                    const factor = 0.5 * (1 + Math.cos((dist / stage.span) * Math.PI));
                    opacity = factor;
                    translateY = (1 - factor) * (progress < stage.center ? 30 : -30);
                }
            }

            stage.el.style.opacity = opacity.toFixed(3);
            // Crucial: preserve center anchoring -50%, -50% and apply slight vertical parallax
            stage.el.style.transform = `translate(-50%, calc(-50% + ${translateY.toFixed(1)}px))`;
            stage.el.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';

            if (opacity > maxOpacity) {
                maxOpacity = opacity;
                activeStageIndex = idx;
            }
        });

        // Stage counter (01 to 04)
        if (stageCounter) {
            stageCounter.innerText = String(activeStageIndex + 1).padStart(2, '0');
            const counterContainer = stageCounter.closest('.hero-stage-counter');
            if (counterContainer) {
                const counterOpacity = progress > 0.90 ? Math.max(0, (1 - progress) / 0.10) : 1;
                counterContainer.style.opacity = counterOpacity.toFixed(2);
            }
        }
    }

    // Apple-style smooth lerp loop
    function loop() {
        const diff = targetFrame - currentFrame;
        if (Math.abs(diff) > 0.005) {
            // Adaptive lerp: snappy when scrolling fast, smooth when settling
            const lerpFactor = Math.abs(diff) > 6 ? 0.35 : 0.22;
            currentFrame += diff * lerpFactor;

            // Guarantee clean arrival at endpoints
            if (currentProgress <= 0.005 && currentFrame < 0.5) currentFrame = 0;
            if (currentProgress >= 0.985 && currentFrame > (TOTAL_FRAMES - 2)) currentFrame = TOTAL_FRAMES - 1;

            renderFrame(Math.round(currentFrame));
            preloadWindow(Math.round(currentFrame), 8);
        }

        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', () => {
        if (!isTicking) {
            requestAnimationFrame(() => {
                updateScrollProgress();
                isTicking = false;
            });
            isTicking = true;
        }
    }, { passive: true });

    resizeCanvas();
    updateScrollProgress();
    loop();
}

/* ===================================================================
   3. CURSOR DOT & MOUSE GLOW
   =================================================================== */
function initCursorDot() {
    const dot = document.getElementById('cursor-dot');
    if (!dot) return;

    window.addEventListener('mousemove', (e) => {
        dot.style.left = `${e.clientX}px`;
        dot.style.top = `${e.clientY}px`;

        document.querySelectorAll('.glow-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    const clickables = document.querySelectorAll('a, button, input, textarea, .arch-tab-btn, .calc-option-btn, .curriculum-card');
    clickables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.style.transform = 'translate(-50%, -50%) scale(1.6)';
            dot.style.background = 'rgba(255, 255, 255, 0.18)';
        });
        el.addEventListener('mouseleave', () => {
            dot.style.transform = 'translate(-50%, -50%) scale(1)';
            dot.style.background = 'rgba(255, 255, 255, 0.06)';
        });
    });
}

/* ===================================================================
   4. NAVBAR SCROLL EFFECT
   =================================================================== */
function initNavbarScroll() {
    const header = document.getElementById('navbar');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ===================================================================
   5. CURRICULUM TIMELINE CAROUSEL SCROLLER CONTROLS
   =================================================================== */
function initCurriculumControls() {
    const scroller = document.getElementById('curriculum-scroller');
    const prevBtn = document.getElementById('scroll-curr-prev');
    const nextBtn = document.getElementById('scroll-curr-next');

    if (!scroller) return;

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            scroller.scrollBy({ left: -340, behavior: 'smooth' });
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            scroller.scrollBy({ left: 340, behavior: 'smooth' });
        });
    }
}

/* ===================================================================
   6. HARDWARE TOPOLOGY VISUALIZER
   =================================================================== */
const archTopologies = {
    iot: {
        title: "Smart IoT & Telemetry Architecture",
        nodes: [
            { title: "Sensor Node & Data Acquisition", status: "Environmental Telemetry (DHT22, Ultrasonic, PIR, MQ-135)", type: "Edge Sensor" },
            { title: "ESP32 / STM32 Dual-Core MCU", status: "ADC Sampling, Hardware Interrupts & Firmware C/C++", type: "Processing" },
            { title: "Wi-Fi & MQTT Protocol Broker", status: "Low-latency sub-40ms payload broadcast with TLS", type: "Transmission" },
            { title: "Cloud Analytics & Actuator Relays", status: "Dynamic Dashboard Visualization & Automated Relays", type: "Output" }
        ],
        controller: "ESP32 Dual-Core 240MHz",
        handsOn: "100% Practical Hardware"
    },
    drone: {
        title: "Quad-Rotor Aerial Drone System",
        nodes: [
            { title: "Transmitter / Telemetry Link", status: "2.4GHz Spread Spectrum RF Command Ingestion", type: "Radio Input" },
            { title: "Flight Controller (PX4 / Betaflight)", status: "6-Axis MPU6000 IMU, PID Stabilizer Loop at 8kHz", type: "Autopilot" },
            { title: "Electronic Speed Controllers (ESCs)", status: "DShot600 Protocol, High-Efficiency BLDC Motors", type: "Actuation" },
            { title: "Autonomous Navigation & Telemetry", status: "GPS Waypoint Hold, Return-to-Home & FPV Link", type: "Field Output" }
        ],
        controller: "STM32F405 / Betaflight",
        handsOn: "Flight Sim + Live Test"
    },
    rd: {
        title: "R&D Prototype Development Pipeline",
        nodes: [
            { title: "Schematic & 3D CAD Modeling", status: "Autodesk Fusion 360 Custom Modular Enclosure Design", type: "CAD Design" },
            { title: "Custom PCB Fabrication & Soldering", status: "Surface-mount Component Placement & Trace Inspection", type: "Hardware Build" },
            { title: "Low-Level Firmware Drivers", status: "Bare-Metal Registers, FreeRTOS & Peripheral SPI/I2C", type: "Firmware" },
            { title: "Stress Bench Testing & Validation", status: "Thermal Profiling, Vibration Testing & Field Proof", type: "QA Certification" }
        ],
        controller: "Custom ARM Cortex / STM32",
        handsOn: "Concept to Prototype"
    }
};

function initTopologyVisualizer() {
    window.switchArch = function(key) {
        document.querySelectorAll('.arch-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`tab-${key}`);
        if (activeBtn) activeBtn.classList.add('active');

        const topo = archTopologies[key];
        const container = document.getElementById('arch-diagram-container');
        if (!container || !topo) return;

        container.innerHTML = topo.nodes.map((node, idx) => `
            <div class="arch-node-item">
                <div class="arch-node-idx">${idx + 1}</div>
                <div style="flex: 1;">
                    <div style="color: #ffffff; font-weight: 600; font-size: 0.85rem;">${node.title}</div>
                    <div style="color: #71717a; font-size: 0.75rem; margin-top: 2px;">${node.status}</div>
                </div>
                <span style="font-family: var(--font-mono); font-size: 0.7rem; color: #a1a1aa; border: 1px solid rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px;">
                    ${node.type}
                </span>
            </div>
        `).join('');

        const leftMetric = document.getElementById('arch-metric-left');
        const rightMetric = document.getElementById('arch-metric-right');
        if (leftMetric) leftMetric.innerHTML = `Controller: <strong style="color: #ffffff;">${topo.controller}</strong>`;
        if (rightMetric) rightMetric.innerHTML = `Track: <strong style="color: #ffffff;">${topo.handsOn}</strong>`;
    };

    window.switchArch('iot');
}

/* ===================================================================
   7. AI STEM ADVISOR
   =================================================================== */
window.toggleAISettings = function() {
    const drawer = document.getElementById('ai-settings-drawer');
    if (drawer) {
        drawer.classList.toggle('open');
    }
};

window.handleModelProviderChange = function() {
    const providerSelect = document.getElementById('ai-model-provider');
    const provider = providerSelect ? providerSelect.value : 'pollinations';
    const keyField = document.getElementById('gemini-key-field');
    const label = document.getElementById('ai-engine-label');

    if (provider.startsWith('gemini')) {
        if (keyField) keyField.style.display = 'block';
        if (label) label.textContent = provider === 'gemini2' 
            ? 'ENGINE: GOOGLE GEMINI 2.0 FLASH (CUSTOM API KEY)' 
            : 'ENGINE: GOOGLE GEMINI 1.5 FLASH (CUSTOM API KEY)';
    } else {
        if (keyField) keyField.style.display = 'none';
        if (label) label.textContent = 'LIVE REAL AI MODEL CONNECTED: GPT-4o / LLAMA-3 NEURAL ENGINE';
    }
    localStorage.setItem('bromatrix_ai_provider', provider);
};

window.saveGeminiApiKey = function() {
    const input = document.getElementById('gemini-api-key-input');
    if (input && input.value.trim()) {
        localStorage.setItem('bromatrix_gemini_api_key', input.value.trim());
        alert('Gemini API Key saved securely in your browser!');
    } else {
        localStorage.removeItem('bromatrix_gemini_api_key');
        alert('API Key cleared. Reverting to default High-Speed Neural Cloud.');
    }
};

// Initialize saved settings on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedProvider = localStorage.getItem('bromatrix_ai_provider');
    const savedKey = localStorage.getItem('bromatrix_gemini_api_key');
    const providerSelect = document.getElementById('ai-model-provider');
    const keyInput = document.getElementById('gemini-api-key-input');

    if (savedProvider && providerSelect) {
        providerSelect.value = savedProvider;
        window.handleModelProviderChange();
    }
    if (savedKey && keyInput) {
        keyInput.value = savedKey;
    }
});

window.setSamplePrompt = function(text) {
    const textarea = document.getElementById('ai-prompt');
    if (textarea) {
        textarea.value = text;
        textarea.focus();
    }
};

// Markdown Parser for Real LLM Responses
function renderMarkdownToHTML(markdown) {
    if (!markdown) return '';

    let text = markdown
        .replace(/\r\n/g, '\n')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks
    text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Horizontal Rules
    text = text.replace(/^(?:---|\*\*\*|___)\s*$/gim, '<hr>');

    // Bold & Italics
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    text = text.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');

    // Tables
    text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableText) => {
        const lines = tableText.trim().split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return tableText;
        let isHeader = true;
        let rowsHtml = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('---')) continue;
            const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (cells.length === 0) continue;
            const tag = isHeader ? 'th' : 'td';
            rowsHtml += `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
            if (isHeader) isHeader = false;
        }
        return `<table>${rowsHtml}</table>`;
    });

    // Unordered lists
    text = text.replace(/(?:^[ \t]*[-*]\s+(.+)(?:\r?\n|$))+/gm, (match) => {
        const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^[ \t]*[-*]\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `<ul>${items}</ul>`;
    });

    // Ordered lists
    text = text.replace(/(?:^[ \t]*\d+\.\s+(.+)(?:\r?\n|$))+/gm, (match) => {
        const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^[ \t]*\d+\.\s+/, '');
            return `<li>${content}</li>`;
        }).join('');
        return `<ol>${items}</ol>`;
    });

    // Double linebreaks to paragraph
    text = text.replace(/\n\s*\n/g, '</p><p>');
    text = text.replace(/\n/g, '<br>');

    return `<div class="ai-markdown-rendered"><p>${text}</p></div>`;
}

// Real AI Generation Execution
window.generateAIArchitecture = async function() {
    const promptInput = document.getElementById('ai-prompt');
    const query = promptInput ? promptInput.value.trim() : '';

    if (!query) {
        alert("Please enter a workshop query, training syllabus idea, or hardware project topic.");
        return;
    }

    const submitBtn = document.getElementById('ai-submit-btn');
    const responseBox = document.getElementById('ai-response-box');
    const responseContent = document.getElementById('ai-response-content');
    const modelTag = document.getElementById('ai-model-tag');
    const timeTag = document.getElementById('ai-generation-time');

    if (!submitBtn || !responseBox || !responseContent) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Querying Real AI...</span>`;

    responseBox.classList.add('active');
    responseContent.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem 0;">
            <div style="display: flex; align-items: center; gap: 0.75rem; font-family: var(--font-mono); font-size: 0.85rem; color: #ffffff;">
                <i class="fa-solid fa-brain fa-fade" style="color: #10b981;"></i>
                <span>Dispatched to Real Neural Model &bull; Synthesizing Hardware Blueprint...</span>
            </div>
            <div style="width: 100%; height: 2px; background: rgba(255,255,255,0.06); overflow: hidden; border-radius: 99px;">
                <div style="width: 35%; height: 100%; background: #ffffff; animation: aiLoadProgress 1.4s infinite ease-in-out;"></div>
            </div>
        </div>
    `;

    const startTime = performance.now();
    const providerSelect = document.getElementById('ai-model-provider');
    const provider = providerSelect ? providerSelect.value : 'pollinations';
    const geminiKey = localStorage.getItem('bromatrix_gemini_api_key');

    const systemPrompt = `You are the Bromatrix AI STEM Advisor & Senior Systems Architect. Bromatrix is a cutting-edge research and innovation hub specializing in:
1. IoT & Embedded Systems (ESP32 dual-core, STM32, FreeRTOS, MQTT, Edge ML).
2. Aerial Drones (UAVs) & Autonomous Flight (Betaflight, Pixhawk, ArduPilot, PID tuning, GPS waypoint navigation).
3. Autonomous Robotics & Mechatronics (differential drive, kinematics, closed-loop PID, sensor fusion, encoders).
4. 3D Design, Rapid Prototyping & Additive Manufacturing (Fusion 360, slicing, FDM/SLA calibration).

When a student, educator, or engineer queries about a workshop syllabus, component stack, curriculum outline, or hardware project architecture, provide an ultra-thorough, authoritative, and actionable blueprint.
Structure your answer clearly with Markdown:
### 1. Executive Blueprint & System Architecture
### 2. Progressive Learning Syllabus (Modules with concrete objectives & timeline)
### 3. Exact Hardware Bill of Materials (BOM) & Sensor Stack (explicit part numbers: e.g. ESP32-WROOM-32E, Pixhawk 4, MPU6050, 2205 Brushless Motors, 30A ESC)
### 4. Firmware, Protocol & Software Stack
### 5. Verified Capstone Deliverable & Performance Metrics

Keep it technical, rigorous, and direct.`;

    let generatedMarkdown = '';
    let usedModelName = 'Real Neural Engine (GPT-4o / Llama 3)';

    try {
        if (provider.startsWith('gemini') && geminiKey) {
            // Google Gemini Direct Inference
            const modelEndpoint = provider === 'gemini2' ? 'gemini-2.0-flash' : 'gemini-1.5-flash';
            usedModelName = provider === 'gemini2' ? 'Google Gemini 2.0 Flash' : 'Google Gemini 1.5 Flash';

            const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelEndpoint}:generateContent?key=${encodeURIComponent(geminiKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemPrompt }]
                    },
                    contents: [
                        { role: 'user', parts: [{ text: query }] }
                    ]
                })
            });

            if (!geminiRes.ok) {
                const errData = await geminiRes.json().catch(() => ({}));
                throw new Error(errData.error?.message || `Gemini API HTTP Error ${geminiRes.status}`);
            }

            const data = await geminiRes.json();
            generatedMarkdown = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!generatedMarkdown) throw new Error("Empty response received from Gemini API.");

        } else {
            // High-Speed Real Neural Cloud (Zero setup required)
            usedModelName = 'Live Neural LLM (OpenAI / Llama-3)';
            
            const aiRes = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query }
                    ],
                    model: 'openai',
                    seed: Math.floor(Math.random() * 1000000)
                })
            });

            if (!aiRes.ok) {
                throw new Error(`Cloud Neural endpoint responded with status ${aiRes.status}`);
            }

            generatedMarkdown = await aiRes.text();
            if (!generatedMarkdown || generatedMarkdown.trim().length < 10) {
                throw new Error("Invalid output received from real neural model.");
            }
        }
    } catch (err) {
        console.warn("Live Real AI connection fallback triggered:", err);
        // Seamless fallback to Bromatrix specialized offline knowledge engine
        usedModelName = 'Bromatrix STEM Knowledge Engine (Offline Fallback)';
        generatedMarkdown = generateEngineeredBlueprint(query);
    }

    const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(2);

    if (modelTag) modelTag.textContent = usedModelName.toUpperCase();
    if (timeTag) timeTag.textContent = `Completed in ${elapsedSeconds}s`;

    // Render markdown into response container
    responseContent.innerHTML = renderMarkdownToHTML(generatedMarkdown);

    // Scroll smoothly into view
    responseBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Generate Plan</span>`;
};

function generateEngineeredBlueprint(topic) {
    const isDrone = topic.toLowerCase().includes('drone') || topic.toLowerCase().includes('uav') || topic.toLowerCase().includes('flight');
    const isRobotics = topic.toLowerCase().includes('robot') || topic.toLowerCase().includes('arm') || topic.toLowerCase().includes('car');

    if (isDrone) {
        return `### 1. Executive Blueprint & Architecture
**Bromatrix Aerial Drone & Flight Dynamics Blueprint**
Engineered for college technical fests, aerospace clubs, and hands-on UAV certification.

### 2. Syllabus & Progressive Learning Modules
- **Module 1:** Aerodynamics, Quad-rotor Frame Physics & Center of Gravity calculation.
- **Module 2:** Flight Controller architecture, MPU6000 Gyro calibration & Betaflight PID tuning.
- **Module 3:** Electronic Speed Controllers (ESCs), Brushless Motors & 2.4GHz RF Transmitter pairing.
- **Module 4:** Autonomous Waypoint navigation, Fail-safe GPS RTH (Return-To-Home) & Maiden Flight Test.

### 3. Hardware Bill of Materials (BOM) & Sensor Stack
- **Flight Controller:** STM32F405 / Pixhawk 4 with Betaflight/PX4 firmware.
- **Propulsion:** 2205 2300KV Brushless Motors + 30A BLHeli_S ESCs + 5045 3-blade props.
- **Power:** 3S/4S 1500mAh 75C LiPo with integrated Power Distribution Board (PDB) & Current Sensor.
- **Navigation & Telemetry:** U-blox NEO-M8N GPS + FS-i6X 10CH 2.4GHz Transmitter/Receiver.
- **Frame & Enclosure:** Carbon fiber structural airframe with 3D Printed vibration dampers.

### 4. Firmware, Protocol & Software Stack
- Betaflight Configurator / QGroundControl for mission parameters.
- DShot600 digital ESC protocol for low-latency motor control.

### 5. Practical Capstone Deliverable
Each student batch builds, calibrates, and autonomously pilots a complete working UAV drone with verified flight certification.`;
    } else if (isRobotics) {
        return `### 1. Executive Blueprint & Architecture
**Bromatrix Autonomous Robotics & Mechatronics Blueprint**
Engineered for multi-tier school and university innovation labs.

### 2. Syllabus & Progressive Learning Modules
- **Module 1:** Kinematics, Motor Drivers (L298N/DRV8833) & Differential Drive Dynamics.
- **Module 2:** Sensor Fusion (IR Array, Ultrasonic Distance, Wheel Encoders) & ADC Calibration.
- **Module 3:** Closed-Loop PID algorithm design for high-speed tracking & precision obstacle evasion.
- **Module 4:** Bluetooth/Wi-Fi Telemetry control interface & Final Roborace Arena Trial.

### 3. Hardware Bill of Materials (BOM) & Sensor Stack
- **Controller Board:** Arduino / ESP32-WROOM-32 with dual H-bridge motor drivers.
- **Actuators:** High-torque metal gear DC motors & MG996R servo steering mechanisms.
- **Sensors:** 8-channel Analog IR Sensor Bar + HC-SR04 Ultrasonic Sonar.
- **Chassis:** Laser-cut acrylic / 3D Printed structural chassis with shock absorbers.

### 4. Firmware & Protocol Stack
- C/C++ embedded firmware with hardware timer interrupts for PID calculation loops.
- Serial telemetry over Bluetooth SPP.

### 5. Practical Capstone Deliverable
Full autonomous robotics platform capable of line navigation, maze resolution, and real-time obstacle telemetry.`;
    } else {
        return `### 1. Executive Blueprint & Architecture
**Bromatrix IoT & Connected Embedded Systems Blueprint**
Customized blueprint addressing: *"${topic}"*

### 2. Syllabus & Progressive Learning Modules
- **Module 1:** Architecture Deep Dive (ESP32 dual-core Xtensa, GPIO registers, FreeRTOS tasks).
- **Module 2:** Sensor Acquisition & Bus Protocols (I2C, SPI, UART telemetry processing).
- **Module 3:** IoT Networking Protocols: MQTT Publish/Subscribe, WebSockets & TLS security.
- **Module 4:** Interactive Cloud Dashboards, Real-Time Alerts & Mobile Client Remote Relays.

### 3. Hardware Bill of Materials (BOM) & Sensor Stack
- **Development Board:** ESP32-WROOM-32 with USB-UART programming bridge.
- **Sensor Modules:** DHT22, BME280 (Temp/Humidity/Pressure), Soil Moisture, Light LDR.
- **Output Actuators:** 4-Channel Optocoupler Relays, 0.96" OLED Display (SSD1306).
- **Cloud Stack:** Private MQTT Broker + Node-RED / InfluxDB live dashboard.

### 4. Firmware & Software Architecture
- FreeRTOS multitasking firmware with non-blocking Wi-Fi reconnect routines.
- JSON-encoded MQTT telemetry packets with secure token authentication.

### 5. Practical Capstone Deliverable
Deployed smart system streaming sensor metrics with sub-second cloud sync and remote actuator switching.`;
    }
}

/* ===================================================================
   8. ESTIMATOR & PROGRAM CALCULATOR
   =================================================================== */
const calcState = {
    type: 'school',
    batchIndex: 2,
    addons: { kits: false, drone: false, '3d': false, cert: false }
};

function initEstimatorCalculator() {
    window.updateCalc = function(type, el) {
        calcState.type = type;
        document.querySelectorAll('.calc-option-btn').forEach(btn => btn.classList.remove('active'));
        if (el) el.classList.add('active');
        recalculateEstimate();
    };

    window.updateCalcRange = function(val) {
        calcState.batchIndex = parseInt(val, 10);
        const labels = ["25 Students", "50 Students", "150 Students", "300+ Students"];
        const labelEl = document.getElementById('concurrency-label');
        if (labelEl) labelEl.innerText = labels[calcState.batchIndex - 1];
        recalculateEstimate();
    };

    window.toggleAddon = function(key, isChecked) {
        calcState.addons[key] = isChecked;
        recalculateEstimate();
    };

    function recalculateEstimate() {
        let daysMin = 2;
        let daysMax = 3;
        let mode = "Hands-On Practical Lab";

        if (calcState.type === 'rd') {
            daysMin = 2;
            daysMax = 4;
            mode = "Custom R&D Prototype Development";
        } else if (calcState.type === 'curriculum') {
            daysMin = 5;
            daysMax = 10;
            mode = "Full Institutional Syllabus & Lab Setup";
        }

        if (calcState.batchIndex === 3) daysMax += 2;
        if (calcState.batchIndex === 4) daysMax += 4;

        const timeEl = document.getElementById('est-time');
        const costEl = document.getElementById('est-cost');
        if (timeEl) timeEl.innerText = `${daysMin} - ${daysMax} Days / Duration`;
        if (costEl) costEl.innerText = mode;
    }

    recalculateEstimate();
}

/* ===================================================================
   9. MODAL HANDLERS
   =================================================================== */
function initModalHandlers() {
    window.openModal = function(category = 'general') {
        const modal = document.getElementById('contact-modal');
        const tag = document.getElementById('modal-category-tag');
        if (!modal) return;

        if (category === 'training') tag.innerText = "WORKSHOP & TRAINING ENQUIRY";
        else if (category === 'rd') tag.innerText = "CUSTOM R&D & PROJECT SUPPORT";
        else if (category === 'internship') tag.innerText = "FLAGSHIP INTERNSHIP COHORT ENQUIRY";
        else tag.innerText = "BROMATRIX GENERAL ENQUIRY";

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.openModalWithEstimate = function() {
        const time = document.getElementById('est-time')?.innerText || '';
        const cost = document.getElementById('est-cost')?.innerText || '';
        const batch = document.getElementById('concurrency-label')?.innerText || '';
        const summary = document.getElementById('modal-project-summary');

        if (summary) {
            summary.value = `Program: ${cost}\nEstimated Timeline: ${time}\nTarget Batch: ${batch}\nInterested in immediate schedule & hardware quotation.`;
        }
        window.openModal('training');
    };

    window.closeModal = function() {
        const modal = document.getElementById('contact-modal');
        const formEl = document.getElementById('contact-form');
        const successEl = document.getElementById('modal-success');
        const submitBtn = document.getElementById('modal-submit-btn');
        const submitLabel = document.getElementById('modal-submit-label');

        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (formEl) formEl.style.display = 'flex';
        if (successEl) successEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = false;
            if (submitLabel) submitLabel.textContent = 'Submit Enquiry to Bromatrix Desk';
        }
    };

    let lastFormSubmitTime = 0;

    window.handleFormSubmit = async function(e) {
        e.preventDefault();
        const formEl = document.getElementById('contact-form');
        const submitBtn = document.getElementById('modal-submit-btn');
        const submitLabel = document.getElementById('modal-submit-label');
        const successEl = document.getElementById('modal-success');
        if (!formEl) return;

        // Anti-Bot Honeypot Verification
        const honeypot = document.getElementById('modal-honeypot');
        if (honeypot && honeypot.value.trim() !== '') {
            // Silently pretend success to trap malicious spam bots
            if (formEl) formEl.style.display = 'none';
            if (successEl) successEl.style.display = 'block';
            setTimeout(() => {
                if (formEl) formEl.reset();
                window.closeModal();
            }, 1800);
            return;
        }

        // Rate Limiting Protection (enforce 6s cooldown between submissions)
        const now = Date.now();
        if (now - lastFormSubmitTime < 6000) {
            alert('Please wait a few moments before transmitting another enquiry.');
            return;
        }
        lastFormSubmitTime = now;

        if (submitBtn) {
            submitBtn.disabled = true;
            if (submitLabel) {
                submitLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>Transmitting to Bromatrix...';
            }
        }

        const formData = new FormData(formEl);
        formData.delete('_anti_bot_trap'); // Exclude honeypot from transmitted payload

        // Sanitize string inputs (strip dangerous HTML tags and trim)
        for (let [key, val] of Array.from(formData.entries())) {
            if (typeof val === 'string') {
                formData.set(key, val.replace(/<[^>]*>/g, '').trim());
            }
        }

        const actionUrl = formEl.getAttribute('action') || 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSdvgHHZ3TcUOMpdW74oYFwD8hqpg3tUbBUoMZsfGdVpEj1taw/formResponse';

        try {
            // Post data to Google Forms using URL-encoded format with no-cors mode
            const urlEncodedData = new URLSearchParams(formData);
            await fetch(actionUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: urlEncodedData.toString()
            });
        } catch (err) {
            console.warn("Direct fetch transmission failed, using iframe fallback:", err);
            try {
                formEl.submit();
            } catch (iframeErr) {
                console.error("Iframe submission fallback error:", iframeErr);
            }
        }

        // Show elegant success state inside the modal
        if (formEl) formEl.style.display = 'none';
        if (successEl) successEl.style.display = 'block';

        setTimeout(() => {
            if (formEl) {
                formEl.reset();
                formEl.style.display = 'flex';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                if (submitLabel) submitLabel.textContent = 'Submit Enquiry to Bromatrix Desk';
            }
            if (successEl) successEl.style.display = 'none';
            window.closeModal();
        }, 3200);
    };

    window.openAboutModal = function() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.add('active');
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeAboutModal = function() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeModal();
            window.closeAboutModal();
        }
    });

    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeModal();
        });
    }

    const aboutModal = document.getElementById('about-modal');
    if (aboutModal) {
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) window.closeAboutModal();
        });
    }
}

/* ===================================================================
   10. MOBILE NAVIGATION
   =================================================================== */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const drawer   = document.getElementById('mobile-menu');
    if (!toggleBtn || !drawer) return;

    const hamburgerSvg = toggleBtn.querySelector('.hamburger-icon');
    const closeSvg     = toggleBtn.querySelector('.close-icon');
    const faIcon       = toggleBtn.querySelector('i');

    function openDrawer() {
        drawer.classList.add('is-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (hamburgerSvg && closeSvg) {
            hamburgerSvg.style.display = 'none';
            closeSvg.style.display = 'block';
        }
        if (faIcon) { faIcon.classList.remove('fa-bars'); faIcon.classList.add('fa-xmark'); }
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        drawer.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (hamburgerSvg && closeSvg) {
            hamburgerSvg.style.display = 'block';
            closeSvg.style.display = 'none';
        }
        if (faIcon) { faIcon.classList.remove('fa-xmark'); faIcon.classList.add('fa-bars'); }
        document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });

    // Close when tapping any link inside drawer
    drawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // Close button inside drawer if present
    const closeBtn = drawer.querySelector('.mobile-drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    // Close when clicking outside drawer
    document.addEventListener('click', (e) => {
        if (drawer.classList.contains('is-open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
            closeDrawer();
        }
    });

    // Close when screen grows past tablet breakpoint
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) closeDrawer();
    });
}

/* ===================================================================
   11. SCROLL-DRIVEN DYNAMIC THEME MORPHING (Cosmic Theme Transition)
   =================================================================== */
function initCosmicThemeObserver() {
    const cosmicSections = document.querySelectorAll('.cosmic-section');
    const navbar = document.getElementById('navbar');
    if (!cosmicSections.length) return;

    function evaluateTheme() {
        const anyInView = Array.from(cosmicSections).some(sec => {
            const rect = sec.getBoundingClientRect();
            // Active when cosmic section enters middle/upper part of viewport
            return rect.top < window.innerHeight * 0.55 && rect.bottom > 90;
        });

        if (anyInView) {
            document.body.classList.add('theme-cosmic');
            if (navbar) navbar.classList.add('cosmic-mode');
        } else {
            document.body.classList.remove('theme-cosmic');
            if (navbar) navbar.classList.remove('cosmic-mode');
        }
    }

    window.addEventListener('scroll', evaluateTheme, { passive: true });
    evaluateTheme();
}
