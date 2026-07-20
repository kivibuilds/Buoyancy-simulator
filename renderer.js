// renderer.js — animation loop and all canvas drawing
// Depends on: state.js, physics.js, particles.js (calls drawBubbles/drawSplashParticles)

/**
 * Main animation loop
 * Handles physics simulation and rendering
 */
function animate() {
    update();
    draw();
    state.animFrame = requestAnimationFrame(animate);
}

/**
 * Physics update step
 * Moves object based on forces
 */
function update() {
    // Wave animation
    waves.offset1 += 0.025;
    waves.offset2 += 0.018;
    waves.offset3 += 0.012;

    // Bubble animation
    updateBubbles();

    // Splash particles
    updateSplashParticles();

    if (!state.isDropped) {
        // Before drop: position object above water
        state.objectY = getWaterSurface() - getObjectHeight() * 0.8;
        return;
    }

    const waterSurface = getWaterSurface();
    const tankBottom = getTankBottom();
    const objSize = getObjectSize();

    if (state.floatState === 'sinking') {
        // Apply gravity and buoyancy physics
        const maxForce = 500;
        const netAcc = Math.min((state.netForce / state.mass) * 0.2, maxForce);
        state.objectVY -= netAcc * 0.05; // Negative net = downward

        // Terminal velocity
        state.objectVY = Math.max(state.objectVY, -8);
        state.objectVY = Math.min(state.objectVY, 8);

        state.objectY += state.objectVY;

        // Hit bottom
        if (state.objectY + objSize / 2 >= tankBottom - 15) {
            state.objectY = tankBottom - 15 - objSize / 2;
            state.objectVY = 0;
        }

        // Start from surface if just dropped
        if (state.objectY < waterSurface) {
            state.objectVY = 2; // Give initial downward velocity
        }

    } else if (state.floatState === 'floating') {
        // Float position: partial submersion
        const targetY = waterSurface + (objSize * state.submersionFraction) - objSize / 2;

        // Smooth approach to target
        const diff = targetY - state.objectY;
        state.objectVY = diff * 0.12;
        state.objectY += state.objectVY;

        // Bobbing effect for floating objects
        state.bobOffset += state.bobSpeed * state.bobDirection;
        if (Math.abs(state.bobOffset) > 4) state.bobDirection *= -1;
        state.objectY += Math.sin(Date.now() * 0.003) * 0.5;

    } else if (state.floatState === 'neutral') {
        // Neutral: hover in the middle of the water
        const targetY = waterSurface + (tankBottom - waterSurface) * 0.5;
        const diff = targetY - state.objectY;
        state.objectVY = diff * 0.05;
        state.objectY += state.objectVY;

        // Gentle oscillation
        state.objectY += Math.sin(Date.now() * 0.002) * 0.8;
    }
}

/**
 * Main draw function - renders everything to canvas
 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTank();
    drawLiquid();
    drawWaves();
    drawBubbles();
    drawSplashParticles();
    drawObject();
    drawForceArrows();
    drawWaterLevelIndicator();
    drawLabels();
}

/**
 * Draw sky background
 */
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#B3E5FC');
    grad.addColorStop(0.4, '#E1F5FE');
    grad.addColorStop(1, '#F5F5F5');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Draw the glass tank container
 */
function drawTank() {
    const margin = 40;
    const x = margin;
    const y = getWaterSurface() - 20;
    const w = canvas.width - margin * 2;
    const h = getTankBottom() - y;

    // Tank shadow
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Tank glass effect - outer
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
    ctx.lineWidth = 5;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);

    // Tank bottom
    ctx.fillStyle = '#B0BEC5';
    ctx.fillRect(x - 3, getTankBottom(), w + 6, 8);
    ctx.roundRect && ctx.roundRect(x - 3, getTankBottom(), w + 6, 8, [0, 0, 4, 4]);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draw the liquid with gradient
 */
function drawLiquid() {
    const margin = 40;
    const x = margin;
    const waterSurface = getWaterSurface();
    const w = canvas.width - margin * 2;
    const h = getTankBottom() - waterSurface;

    const colors = getLiquidColors();

    const grad = ctx.createLinearGradient(x, waterSurface, x, getTankBottom());
    grad.addColorStop(0, colors.surface);
    grad.addColorStop(0.5, colors.mid);
    grad.addColorStop(1, colors.deep);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.rect(x, waterSurface, w, h);
    ctx.fill();

    // Glass reflection overlay
    const reflectGrad = ctx.createLinearGradient(x, 0, x + w * 0.3, 0);
    reflectGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    reflectGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = reflectGrad;
    ctx.fillRect(x, waterSurface, w * 0.3, h);
}

/**
 * Draw animated water surface waves
 */
function drawWaves() {
    const margin = 40;
    const x = margin;
    const w = canvas.width - margin * 2;
    const waterSurface = getWaterSurface();
    const colors = getLiquidColors();

    // Wave layer 1 (foreground)
    ctx.beginPath();
    ctx.moveTo(x, waterSurface);

    for (let i = 0; i <= w; i += 3) {
        const waveY = waterSurface
            + Math.sin((i / w * 4 * Math.PI) + waves.offset1) * 5
            + Math.sin((i / w * 7 * Math.PI) + waves.offset2) * 2.5;
        ctx.lineTo(x + i, waveY);
    }

    ctx.lineTo(x + w, waterSurface);
    ctx.closePath();

    const waveGrad = ctx.createLinearGradient(x, waterSurface - 8, x, waterSurface + 8);
    waveGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    waveGrad.addColorStop(0.5, colors.surface);
    waveGrad.addColorStop(1, colors.mid);

    ctx.fillStyle = waveGrad;
    ctx.fill();

    // Wave layer 2 (highlight)
    ctx.beginPath();
    ctx.moveTo(x, waterSurface + 3);

    for (let i = 0; i <= w; i += 4) {
        const waveY = waterSurface + 3
            + Math.sin((i / w * 6 * Math.PI) + waves.offset3) * 3;
        ctx.lineTo(x + i, waveY);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Surface sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 6; i++) {
        const sx = x + (i * (w / 5)) + Math.sin(waves.offset1 + i) * 15;
        const sy = waterSurface + Math.sin(waves.offset2 + i * 0.7) * 4;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw the floating/sinking object
 */
function drawObject() {
    const objSize = getObjectSize();
    const cx = canvas.width / 2;
    const cy = state.objectY;
    const colors = getObjectColor();

    ctx.save();

    // Object glow/shadow
    ctx.shadowColor = colors.shadow;
    ctx.shadowBlur = 20;

    // Draw based on selected shape
    switch (state.shape) {
        case 'cube':
            drawCube(cx, cy, objSize, colors);
            break;
        case 'sphere':
            drawSphere(cx, cy, objSize, colors);
            break;
        case 'cylinder':
            drawCylinder(cx, cy, objSize, colors);
            break;
        case 'boat':
            drawBoat(cx, cy, objSize, colors);
            break;
        default:
            drawCube(cx, cy, objSize, colors);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

/**
 * Draw a cube shape
 */
function drawCube(cx, cy, size, colors) {
    const x = cx - size / 2;
    const y = cy - size / 2;

    // Main face
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.3, colors.fill);
    grad.addColorStop(1, colors.stroke);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, size, size, [8]) : ctx.rect(x, y, size, size);
    ctx.fill();

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3D top face
    const topDepth = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + topDepth, y - topDepth);
    ctx.lineTo(x + size + topDepth, y - topDepth);
    ctx.lineTo(x + size, y);
    ctx.closePath();
    ctx.fill();

    // 3D right face
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size + topDepth, y - topDepth);
    ctx.lineTo(x + size + topDepth, y + size - topDepth);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(9, size * 0.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.objectDensity.toFixed(0)}`, cx, cy);
    ctx.font = `bold ${Math.max(7, size * 0.14)}px Arial`;
    ctx.fillText('kg/m³', cx, cy + size * 0.2);
}

/**
 * Draw a sphere shape
 */
function drawSphere(cx, cy, size, colors) {
    const r = size / 2;
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.3, colors.fill);
    grad.addColorStop(1, colors.stroke);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shine
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Label
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(9, size * 0.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.objectDensity.toFixed(0)}`, cx, cy);
    ctx.font = `bold ${Math.max(7, size * 0.14)}px Arial`;
    ctx.fillText('kg/m³', cx, cy + r * 0.38);
}

/**
 * Draw a cylinder shape
 */
function drawCylinder(cx, cy, size, colors) {
    const w = size * 0.8;
    const h = size;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const ry = h * 0.12; // ellipse y radius

    // Body gradient
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(0.4, colors.fill);
    grad.addColorStop(1, colors.stroke);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.rect(x, y + ry, w, h - ry * 2);
    ctx.fill();

    // Bottom ellipse
    ctx.fillStyle = colors.stroke;
    ctx.beginPath();
    ctx.ellipse(cx, y + h - ry, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Top ellipse
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, y + ry, w / 2, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + ry);
    ctx.lineTo(x, y + h - ry);
    ctx.moveTo(x + w, y + ry);
    ctx.lineTo(x + w, y + h - ry);
    ctx.stroke();

    // Label
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(9, size * 0.18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.objectDensity.toFixed(0)}`, cx, cy + ry * 0.5);
}

/**
 * Draw a boat shape (hollow hull)
 */
function drawBoat(cx, cy, size, colors) {
    const w = size * 1.3;
    const h = size * 0.6;
    const x = cx - w / 2;
    const y = cy - h / 2;

    // Hull
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.5, colors.fill);
    grad.addColorStop(1, colors.stroke);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y);
    ctx.lineTo(x + w * 0.92, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + h * 0.3);
    ctx.lineTo(x + w * 0.7, y + h);
    ctx.lineTo(x + w * 0.3, y + h);
    ctx.lineTo(x, y + h * 0.3);
    ctx.quadraticCurveTo(x, y, x + w * 0.08, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Deck (inner hollow appearance)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.3, w * 0.35, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mast
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx, y - size * 0.5);
    ctx.stroke();

    // Sail
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(cx, y - size * 0.45);
    ctx.lineTo(cx + size * 0.4, y - size * 0.1);
    ctx.lineTo(cx, y - size * 0.05);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(8, size * 0.18)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${state.objectDensity.toFixed(0)}`, cx, y + h * 0.55);
}

/**
 * Draw force arrows (Buoyant ↑ and Gravity ↓)
 */
function drawForceArrows() {
    const cx = canvas.width / 2;
    const cy = state.objectY;
    const objSize = getObjectSize();

    const maxArrow = 80;
    const maxForce = Math.max(state.buoyantForce, state.gravityForce, 10);

    const buoyantLength = Math.min((state.buoyantForce / maxForce) * maxArrow, maxArrow);
    const gravityLength = Math.min((state.gravityForce / maxForce) * maxArrow, maxArrow);

    // Only show arrows when object is in water
    if (!state.isDropped || state.objectY < getWaterSurface() - objSize) return;

    // Buoyant Force Arrow (Blue, pointing UP)
    const arrowX = cx + objSize * 0.6;
    drawArrow(arrowX, cy + objSize * 0.3, arrowX, cy + objSize * 0.3 - buoyantLength,
        '#42A5F5', 'Fb=' + state.buoyantForce.toFixed(1) + 'N');

    // Gravity Arrow (Red, pointing DOWN)
    const arrowX2 = cx - objSize * 0.6;
    drawArrow(arrowX2, cy - objSize * 0.3, arrowX2, cy - objSize * 0.3 + gravityLength,
        '#EF5350', 'Fg=' + state.gravityForce.toFixed(1) + 'N');
}

/**
 * Draw a labeled force arrow
 */
function drawArrow(x1, y1, x2, y2, color, label) {
    const headLen = 12;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = x2 < canvas.width / 2 ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    const labelX = x2 < canvas.width / 2 ? x2 - 5 : x2 + 5;
    const labelY = (y1 + y2) / 2;

    // Label background
    const textW = ctx.measureText(label).width + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const lx = x2 < canvas.width / 2 ? labelX - textW : labelX;
    ctx.fillRect(lx, labelY - 9, textW, 18);
    ctx.fillStyle = color;
    ctx.textAlign = x2 < canvas.width / 2 ? 'right' : 'left';
    ctx.fillText(label, labelX, labelY);
}

/**
 * Draw water level indicator on the side
 */
function drawWaterLevelIndicator() {
    const margin = 40;
    const waterY = getWaterSurface();
    const bottomY = getTankBottom();
    const rightX = canvas.width - margin;

    // Line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin, waterY);
    ctx.lineTo(canvas.width - margin, waterY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('▲ WATER SURFACE', canvas.width - margin - 5, waterY - 5);
}

/**
 * Draw canvas labels
 */
function drawLabels() {
    const { floatState, objectDensity, liquidDensity } = state;

    // Top area label
    ctx.fillStyle = '#1565C0';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⬇ AIR', canvas.width / 2, getWaterSurface() - 15);

    // Liquid type label
    const liquidNames = { water: '💧 WATER', oil: '🫙 OIL', saltwater: '🌊 SALT WATER', mercury: '⚗️ MERCURY' };
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(liquidNames[state.liquidType] || '💧 WATER',
        canvas.width / 2, getWaterSurface() + (getTankBottom() - getWaterSurface()) * 0.88);

    // Density label in liquid
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`ρ = ${liquidDensity} kg/m³`, canvas.width / 2,
        getWaterSurface() + (getTankBottom() - getWaterSurface()) * 0.95);

    // Float state indicator in tank
    if (!state.isDropped) {
        ctx.fillStyle = 'rgba(21, 101, 192, 0.8)';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⬇ Click "Drop Object" to start!',
            canvas.width / 2, getWaterSurface() - 35);
    }
}
