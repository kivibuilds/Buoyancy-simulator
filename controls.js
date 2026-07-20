// controls.js — mouse/touch handlers and UI control actions (liquid, shape, drop, reset, randomize)
// Depends on: state.js, physics.js, particles.js, ui-feedback.js (showToast, playSplashSound)

// ============================================
// EVENT HANDLERS & CONTROLS
// ============================================

/**
 * Add all event listeners
 */
function addEventListeners() {
    // Sliders
    document.getElementById('massSlider').addEventListener('input', function() {
        state.mass = parseFloat(this.value);
        updatePhysics();
    });

    document.getElementById('volumeSlider').addEventListener('input', function() {
        state.volume = parseFloat(this.value);
        updatePhysics();
    });

    document.getElementById('liquidDensitySlider').addEventListener('input', function() {
        state.liquidDensity = parseFloat(this.value);
        updateLiquidTypeFromDensity();
        updatePhysics();
    });

    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        generateBubbles();
    });

    // Canvas mouse/touch events for dragging
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);
    canvas.addEventListener('mouseup', onCanvasMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onCanvasMouseUp);
}

function onCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = state.objectY;
    const size = getObjectSize();

    if (Math.abs(mx - cx) < size && Math.abs(my - cy) < size) {
        state.isDragging = true;
        state.dragStartY = my - cy;
        canvas.style.cursor = 'grabbing';
    }
}

function onCanvasMouseMove(e) {
    if (!state.isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const my = (e.clientY - rect.top) * scaleY;

    state.objectY = my - state.dragStartY;
    state.objectVY = 0;
    state.isDropped = true;
}

function onCanvasMouseUp() {
    if (state.isDragging) {
        state.isDragging = false;
        canvas.style.cursor = 'grab';
        // If dropped in water, trigger splash
        if (state.objectY > getWaterSurface() - 10) {
            createSplash(canvas.width / 2, getWaterSurface());
            playSplashSound();
        }
    }
}

function onTouchStart(e) {
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
    onCanvasMouseDown(fakeEvent);
}

function onTouchMove(e) {
    const touch = e.touches[0];
    const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
    onCanvasMouseMove(fakeEvent);
}

// ============================================
// CONTROL ACTIONS
// ============================================

/**
 * Set liquid type preset
 */
function setLiquid(type) {
    const presets = {
        water: 1000,
        oil: 800,
        saltwater: 1025,
        mercury: 13600
    };

    state.liquidType = type;
    state.liquidDensity = presets[type];
    document.getElementById('liquidDensitySlider').value = state.liquidDensity;
    document.getElementById('liquidDensityDisplay').textContent = state.liquidDensity + ' kg/m³';

    // Update active button
    document.querySelectorAll('.liquid-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('btn-' + type).classList.add('active');

    updatePhysics();
    showToast('🧪 Switched to ' + type.charAt(0).toUpperCase() + type.slice(1) + '!');
}

/**
 * Determine liquid type from manual density slider
 */
function updateLiquidTypeFromDensity() {
    const d = state.liquidDensity;
    document.querySelectorAll('.liquid-btn').forEach(btn => btn.classList.remove('active'));

    if (Math.abs(d - 1000) < 50) {
        state.liquidType = 'water';
        document.getElementById('btn-water').classList.add('active');
    } else if (Math.abs(d - 800) < 50) {
        state.liquidType = 'oil';
        document.getElementById('btn-oil').classList.add('active');
    } else if (Math.abs(d - 1025) < 50) {
        state.liquidType = 'saltwater';
        document.getElementById('btn-saltwater').classList.add('active');
    } else if (d > 10000) {
        state.liquidType = 'mercury';
        document.getElementById('btn-mercury').classList.add('active');
    } else {
        state.liquidType = 'water'; // Default visual
    }
}

/**
 * Set object shape
 */
function setShape(shape) {
    state.shape = shape;
    document.querySelectorAll('.shape-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('shape-' + shape).classList.add('active');
    showToast('🔷 Shape changed to ' + shape + '!');
}

/**
 * Drop the object into water
 */
function dropObject() {
    state.isDropped = true;
    state.objectY = getWaterSurface() - getObjectSize() * 0.5;
    state.objectVY = 3;
    createSplash(canvas.width / 2, getWaterSurface());
    playSplashSound();
    showToast('💧 Object dropped into liquid!');
}

/**
 * Reset simulation to defaults
 */
function resetSimulation() {
    state.mass = 5.0;
    state.volume = 0.01;
    state.liquidDensity = 1000;
    state.liquidType = 'water';
    state.shape = 'cube';
    state.isDropped = false;
    state.objectY = getWaterSurface() - getObjectSize();
    state.objectVY = 0;
    state.bobOffset = 0;

    document.getElementById('massSlider').value = 5;
    document.getElementById('volumeSlider').value = 0.01;
    document.getElementById('liquidDensitySlider').value = 1000;

    setLiquid('water');
    setShape('cube');
    updatePhysics();
    showToast('🔄 Simulation Reset!');
}

/**
 * Randomize all values
 */
function randomize() {
    const liquids = ['water', 'oil', 'saltwater', 'mercury'];
    const shapes = ['cube', 'sphere', 'cylinder', 'boat'];

    state.mass = parseFloat((0.5 + Math.random() * 30).toFixed(1));
    state.volume = parseFloat((0.001 + Math.random() * 0.09).toFixed(3));

    const randomLiquid = liquids[Math.floor(Math.random() * liquids.length)];
    setLiquid(randomLiquid);

    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    setShape(randomShape);

    document.getElementById('massSlider').value = state.mass;
    document.getElementById('volumeSlider').value = state.volume;

    state.isDropped = true;
    state.objectVY = 2;

    updatePhysics();
    createSplash(canvas.width / 2, getWaterSurface());
    showToast('🎲 Randomized! Observe what happens!');
}

