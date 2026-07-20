// physics.js — force calculations, density/status logic, geometry helpers
// Depends on: state.js

// ============================================
// PHYSICS CALCULATIONS
// ============================================

/**
 * Calculate all physics values based on current state
 * Core physics engine - runs every frame
 */
function updatePhysics() {
    const { mass, volume, liquidDensity } = state;

    // 1. Object Density: ρ = m / V
    state.objectDensity = mass / volume;

    // 2. Gravity Force: Fg = m × g
    state.gravityForce = mass * g;

    // 3. Determine submersion fraction for floating vs sinking
    if (state.objectDensity < liquidDensity) {
        // Floating: fraction submerged = ρ_object / ρ_liquid
        state.submersionFraction = state.objectDensity / liquidDensity;
        state.floatState = 'floating';
    } else if (state.objectDensity > liquidDensity) {
        // Sinking: fully submerged
        state.submersionFraction = 1.0;
        state.floatState = 'sinking';
    } else {
        // Neutral: fully submerged, neutrally buoyant
        state.submersionFraction = 1.0;
        state.floatState = 'neutral';
    }

    // 4. Buoyant Force: Fb = ρ_liquid × V_submerged × g
    const volumeSubmerged = volume * state.submersionFraction;
    state.buoyantForce = liquidDensity * volumeSubmerged * g;

    // 5. Net Force (positive = up)
    state.netForce = state.buoyantForce - state.gravityForce;

    // Update all UI elements
    updateUI();
}

// ============================================
// UI UPDATES
// ============================================

/**
 * Update all display elements with current calculated values
 */
function updateUI() {
    const { mass, volume, liquidDensity, objectDensity,
            buoyantForce, gravityForce, netForce, floatState } = state;

    // Format helpers
    const fmt = (n, d = 1) => parseFloat(n.toFixed(d));
    const fmtForce = (n) => fmt(n, 1) + ' N';

    // Slider display values
    document.getElementById('massDisplay').textContent = fmt(mass, 1) + ' kg';
    document.getElementById('volumeDisplay').textContent = volume.toFixed(3) + ' m³';
    document.getElementById('liquidDensityDisplay').textContent = fmt(liquidDensity, 0) + ' kg/m³';

    // Data cards
    document.getElementById('objDensity').textContent = fmt(objectDensity, 1);
    document.getElementById('buoyantForce').textContent = fmtForce(buoyantForce);
    document.getElementById('gravityForce').textContent = fmtForce(gravityForce);

    const displacedMassKg = liquidDensity * volume * state.submersionFraction;
    document.getElementById('displacedMass').textContent = fmt(displacedMassKg, 1) + ' kg';

    const netSign = netForce >= 0 ? '+' : '';
    document.getElementById('netForce').textContent = netSign + fmtForce(netForce);

    // Density comparison
    document.getElementById('dc-objDensity').textContent = fmt(objectDensity, 0);
    document.getElementById('dc-liqDensity').textContent = fmt(liquidDensity, 0);

    // Formula display
    document.getElementById('fDensity').textContent = fmt(objectDensity, 1);
    document.getElementById('fMass').textContent = fmt(mass, 1);
    document.getElementById('fVolume').textContent = volume.toFixed(3);
    document.getElementById('fBuoyant').textContent = fmtForce(buoyantForce);
    document.getElementById('fRhoL').textContent = fmt(liquidDensity, 0);
    document.getElementById('fVSub').textContent = (volume * state.submersionFraction).toFixed(3);

    // Force bars (normalized to max 100%)
    const maxForce = Math.max(buoyantForce, gravityForce, 1);
    const buoyantPct = Math.min((buoyantForce / maxForce) * 100, 100);
    const gravityPct = Math.min((gravityForce / maxForce) * 100, 100);

    document.getElementById('buoyantBar').style.width = buoyantPct + '%';
    document.getElementById('gravityBar').style.width = gravityPct + '%';
    document.getElementById('fb-val').textContent = fmtForce(buoyantForce);
    document.getElementById('fg-val').textContent = fmtForce(gravityForce);

    // Archimedes section
    document.getElementById('archDisplaced').textContent = fmt(displacedMassKg, 1) + ' kg';
    document.getElementById('archFb').textContent = fmtForce(buoyantForce);

    // Status banner
    updateStatusBanner();

    // Scientific explanation
    document.getElementById('expObjDensity').textContent = fmt(objectDensity, 1);
    document.getElementById('expLiqDensity').textContent = fmt(liquidDensity, 0);

    // Update density VS symbol color
    const vsEl = document.getElementById('densityVsSymbol');
    if (floatState === 'floating') {
        vsEl.textContent = '<';
        vsEl.style.color = '#2E7D32';
    } else if (floatState === 'sinking') {
        vsEl.textContent = '>';
        vsEl.style.color = '#B71C1C';
    } else {
        vsEl.textContent = '=';
        vsEl.style.color = '#E65100';
    }

    if (floatState === 'floating') {
        document.getElementById('expComparison').textContent = 'LESS THAN';
        document.getElementById('expState').textContent = 'FLOATS ↑';
    } else if (floatState === 'sinking') {
        document.getElementById('expComparison').textContent = 'GREATER THAN';
        document.getElementById('expState').textContent = 'SINKS ↓';
    } else {
        document.getElementById('expComparison').textContent = 'EQUAL TO';
        document.getElementById('expState').textContent = 'HOVERS (Neutral Buoyancy)';
    }
}

/**
 * Update the status banner based on float state
 */
function updateStatusBanner() {
    const banner = document.getElementById('statusBanner');
    const icon = document.getElementById('statusIcon');
    const text = document.getElementById('statusText');
    const { floatState, objectDensity, liquidDensity } = state;

    banner.className = 'status-banner ' + floatState;

    if (floatState === 'floating') {
        icon.textContent = '🟢';
        text.textContent = `🛶 FLOATING! Object density (${objectDensity.toFixed(0)}) < Liquid density (${liquidDensity.toFixed(0)})`;
    } else if (floatState === 'sinking') {
        icon.textContent = '🔴';
        text.textContent = `⚓ SINKING! Object density (${objectDensity.toFixed(0)}) > Liquid density (${liquidDensity.toFixed(0)})`;
    } else {
        icon.textContent = '🟡';
        text.textContent = `🐟 NEUTRAL BUOYANCY! Object density = Liquid density (${liquidDensity.toFixed(0)})`;
    }
}

// ============================================
// CANVAS DRAWING ENGINE
// ============================================

/**
 * Get the Y coordinate of water surface on canvas
 */
function getWaterSurface() {
    return canvas.height * 0.38; // 38% from top = water surface
}

/**
 * Get the tank bottom Y coordinate
 */
function getTankBottom() {
    return canvas.height - 30;
}

/**
 * Get object drawing size based on volume
 */
function getObjectSize() {
    // Scale object visually based on volume
    const minSize = 30;
    const maxSize = 100;
    const t = (state.volume - 0.001) / (0.1 - 0.001);
    return minSize + t * (maxSize - minSize);
}

function getObjectHeight() {
    return getObjectSize();
}

/**
 * Get liquid color based on liquid type
 */
function getLiquidColors() {
    const colors = {
        water: { surface: 'rgba(100, 181, 246, 0.9)', mid: 'rgba(30, 136, 229, 0.85)', deep: 'rgba(13, 71, 161, 0.9)' },
        oil: { surface: 'rgba(255, 213, 79, 0.9)', mid: 'rgba(255, 179, 0, 0.85)', deep: 'rgba(230, 81, 0, 0.9)' },
        saltwater: { surface: 'rgba(38, 198, 218, 0.9)', mid: 'rgba(0, 131, 143, 0.85)', deep: 'rgba(0, 77, 91, 0.9)' },
        mercury: { surface: 'rgba(176, 190, 197, 0.95)', mid: 'rgba(120, 144, 156, 0.9)', deep: 'rgba(69, 90, 100, 0.95)' }
    };
    return colors[state.liquidType] || colors.water;
}

/**
 * Get object color based on density comparison
 */
function getObjectColor() {
    const { floatState } = state;
    if (floatState === 'floating') return { fill: '#FFA726', stroke: '#E65100', shadow: 'rgba(255, 167, 38, 0.6)' };
    if (floatState === 'sinking') return { fill: '#EF5350', stroke: '#B71C1C', shadow: 'rgba(239, 83, 80, 0.6)' };
    return { fill: '#AB47BC', stroke: '#6A1B9A', shadow: 'rgba(171, 71, 188, 0.6)' };
}

