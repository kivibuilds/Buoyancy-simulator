// particles.js — bubble and splash particle systems
// Depends on: state.js

// ============================================
// BUBBLE SYSTEM
// ============================================

/**
 * Generate animated bubbles in the water
 */
function generateBubbles() {
    bubbles = [];
    for (let i = 0; i < 20; i++) {
        bubbles.push(createBubble());
    }
}

function createBubble() {
    const margin = 45;
    return {
        x: margin + Math.random() * (canvas.width - margin * 2),
        y: getTankBottom() - Math.random() * (getTankBottom() - getWaterSurface()),
        r: 2 + Math.random() * 6,
        speed: 0.3 + Math.random() * 1.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.04,
        opacity: 0.2 + Math.random() * 0.5
    };
}

/**
 * Update bubble positions
 */
function updateBubbles() {
    bubbles.forEach(b => {
        b.y -= b.speed;
        b.wobble += b.wobbleSpeed;
        b.x += Math.sin(b.wobble) * 0.5;

        if (b.y < getWaterSurface()) {
            Object.assign(b, createBubble());
            b.y = getTankBottom() - 10;
        }
    });
}

/**
 * Draw water bubbles
 */
function drawBubbles() {
    bubbles.forEach(b => {
        if (b.y < getWaterSurface()) return;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${b.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bubble shine
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.7})`;
        ctx.fill();
    });
}

// ============================================
// SPLASH PARTICLE SYSTEM
// ============================================

/**
 * Create splash particles when object hits water
 */
function createSplash(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i - Math.PI / 2;
        const speed = 2 + Math.random() * 5;
        splashParticles.push({
            x, y,
            vx: Math.cos(angle) * speed * (0.5 + Math.random()),
            vy: Math.sin(angle) * speed - 3,
            r: 3 + Math.random() * 5,
            opacity: 0.8,
            color: getLiquidColors().surface
        });
    }
}

function updateSplashParticles() {
    splashParticles = splashParticles.filter(p => p.opacity > 0.02);
    splashParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity on droplets
        p.opacity -= 0.04;
        p.r *= 0.97;
    });
}

function drawSplashParticles() {
    splashParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace('0.9', p.opacity.toString());
        ctx.fill();
    });
}

// ============================================
// BACKGROUND BUBBLES (CSS DOM)
// ============================================

function generateBackgroundBubbles() {
    for (let i = 0; i < 8; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bg-bubble';
        const size = 20 + Math.random() * 60;
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            animation-duration: ${8 + Math.random() * 15}s;
            animation-delay: ${-Math.random() * 15}s;
        `;
        document.body.appendChild(bubble);
    }
}

