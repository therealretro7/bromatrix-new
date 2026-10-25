/**
 * BROMATRIX - OUR EVENTS SHOWCASE
 * Reference Card Design with Transparent Glass Effects & Animations
 * ThreeUI <PredictiveArcCanvas /> + ThreeUI <LiquidMetalButton variant="circle" />
 */

(function(global) {
    // Only authentic completed events with details given in the project
    const BROMATRIX_EVENTS = [
        {
            id: "ajec-victory",
            tag: "Tech-Fest AJEC",
            title: "Championship Victory",
            desc: "First official championship victory at Amal Jyothi College of Engineering.",
            image: "images/ajec_win_1.webp",
            gallery: ["images/ajec_win_1.webp", "images/ajec_win_2.webp", "images/ajec_techfest.jpg"],
            fullText: "A defining milestone: Bromatrix emerged victorious at the premier Technical Championship hosted by Amal Jyothi College of Engineering (AJEC), demonstrating hardware precision, robotics agility, and autonomous aerial navigation."
        },
        {
            id: "summer-internship",
            tag: "Summer Internship",
            title: "Flagship Program Inauguration",
            desc: "Two-week intensive immersion across IoT, Aerial Drones & Autonomous Robotics.",
            image: "images/internship_banner.webp",
            gallery: ["images/internship_banner.webp", "images/internship_inaug_1.webp", "images/internship_inaug_2.webp"],
            fullText: "Successfully inaugurated with enthusiastic participation across institutions: a comprehensive immersion spanning IoT Connected Systems, Aerial Drones, Autonomous Robotics, and 3D Rapid Prototyping with 100% hardware kit allocation for every batch."
        },
        {
            id: "bootcamp-10day",
            tag: "10-Day Bootcamp",
            title: "10-Day Hardware Journey",
            desc: "Full-stack student engineering bootcamp from circuit wiring to quadcopter flight.",
            image: "images/workshop_action_1.jpg",
            gallery: ["images/workshop_action_1.jpg", "images/workshop_action_5.jpg", "images/workshop_action_6.jpg"],
            fullText: "A hands-on, component-level hardware residency. From schematic design, soldering ESCs, and programming flight microcontrollers, to maiden test-flights in our outdoor aerial arena."
        }
    ];

    /**
     * Initialize Events Page
     */
    function initEventsPage() {
        // 1. Mount ThreeUI PredictiveArcCanvas (Variant: ribbon-field)
        const arcHost = document.getElementById('predictive-arc-bg');
        if (arcHost && global.ThreeUIPredictiveArc) {
            // Exact configured usage from prompt:
            // variant="ribbon-field", speed={1.00}, pointerAmount={1.00}, smoothing={0.035}, hue={0}, saturation={1.00}, brightness={1.00}, opacity={1.00}
            global.ThreeUIPredictiveArc.mountPredictiveArc(arcHost, {
                variant: 'ribbon-field',
                speed: 1.00,
                pointerAmount: 1.00,
                smoothing: 0.035,
                hue: 0,
                saturation: 1.00,
                brightness: 1.00,
                opacity: 1.00
            });
        }

        // 2. Render Cards Grid
        renderEventsGrid();

        // 3. Setup Liquid Metal Message Bridge
        setupLiquidMetalMessageBridge();

        // 4. Setup Modal Listeners
        setupModalListeners();
    }

    /**
     * Render Reference Design Cards with Transparent Glass & Image Overlay
     */
    function renderEventsGrid() {
        const grid = document.getElementById('events-reference-grid');
        if (!grid) return;

        grid.innerHTML = BROMATRIX_EVENTS.map(evt => `
            <div class="ref-event-card" data-event-id="${evt.id}" onclick="window.openEventModal('${evt.id}')" role="button" tabindex="0" aria-label="Inspect ${evt.title}">
                <!-- Card Background Image -->
                <img src="${evt.image}" alt="${evt.title}" class="ref-card-bg-image" loading="lazy">
                
                <!-- Transparent Gradient Overlays -->
                <div class="ref-card-overlay"></div>

                <!-- Top Pill Tag (Reference Style) -->
                <div class="ref-card-top">
                    <span class="ref-card-tag">
                        <i class="fa-solid fa-trophy" style="font-size: 0.72rem; color: #60a5fa;"></i>
                        ${evt.tag}
                    </span>
                </div>

                <!-- Bottom Section: Title, Subtitle, ThreeUI Liquid Metal Orb Button -->
                <div class="ref-card-bottom">
                    <div class="ref-card-info">
                        <h3 class="ref-card-title">${evt.title}</h3>
                        <p class="ref-card-desc">${evt.desc}</p>
                    </div>

                    <!-- Liquid Metal Circle Button (ThreeUI) -->
                    <div class="ref-card-orb-host shader-frame" title="Click Liquid Orb to view milestone">
                        <div class="liquid-metal-button" data-variant="circle" data-event-id="${evt.id}">
                            <iframe class="liquid-metal-button__frame is-ready" src="src/shaders/liquid-metal-button/liquid-metal-circle.html" title="Interactive liquid metal circle button" tabIndex="-1" aria-hidden="true" loading="lazy"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Handle postMessage events sent from ThreeUI LiquidMetalButton iframe
     */
    function setupLiquidMetalMessageBridge() {
        window.addEventListener('message', (event) => {
            if (!event.data || !event.data.liquidMetalButton) return;
            if (event.data.liquidMetalButton.type === 'activate') {
                const iframes = document.querySelectorAll('.liquid-metal-button__frame');
                for (const iframe of iframes) {
                    if (iframe.contentWindow === event.source) {
                        const host = iframe.closest('[data-event-id]');
                        const eventId = host ? host.dataset.eventId : BROMATRIX_EVENTS[0].id;
                        openEventModal(eventId);
                        break;
                    }
                }
            }
        });
    }

    /**
     * Open Event Modal
     */
    function openEventModal(eventId) {
        const evt = BROMATRIX_EVENTS.find(e => e.id === eventId) || BROMATRIX_EVENTS[0];
        const modal = document.getElementById('event-modal');
        if (!modal) return;

        document.getElementById('modal-event-img').src = evt.image;
        document.getElementById('modal-event-img').alt = evt.title;
        document.getElementById('modal-event-tag').textContent = evt.tag;
        document.getElementById('modal-event-title').textContent = evt.title;
        document.getElementById('modal-event-desc').textContent = evt.fullText;

        const gallery = document.getElementById('modal-event-gallery');
        if (gallery && evt.gallery) {
            gallery.innerHTML = evt.gallery.map(imgSrc => `
                <img src="${imgSrc}" alt="${evt.title}" loading="lazy">
            `).join('');
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close Event Modal
     */
    function closeEventModal() {
        const modal = document.getElementById('event-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Setup Modal Listeners
     */
    function setupModalListeners() {
        const modal = document.getElementById('event-modal');
        if (!modal) return;

        const closeBtn = document.getElementById('event-modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeEventModal);
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEventModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeEventModal();
            }
        });
    }

    // Export to global scope
    global.BROMATRIX_EVENTS = BROMATRIX_EVENTS;
    global.openEventModal = openEventModal;
    global.closeEventModal = closeEventModal;
    global.initEventsPage = initEventsPage;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventsPage);
    } else {
        initEventsPage();
    }
})(typeof window !== "undefined" ? window : globalThis);
