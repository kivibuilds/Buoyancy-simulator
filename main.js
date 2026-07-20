// main.js — bootstraps the simulator on page load
// Depends on: all other JS files (must load last)

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the simulator
 * Sets up canvas, event listeners, and starts animation
 */
function init() {
    resizeCanvas();
    generateBubbles();
    generateBackgroundBubbles();
    addEventListeners();
    updatePhysics();
    state.objectY = getWaterSurface() - getObjectHeight() / 2;
    state.isDropped = false;
    animate();

    // Hide loading screen after delay
    setTimeout(() => {
        document.getElementById('loadingOverlay').classList.add('hidden');
        showToast('🌊 Welcome to Buoyancy Simulator!');
    }, 1800);
}

/**
 * Resize canvas to fit container
 */
function resizeCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth - 30;
    canvas.width = Math.min(width, 750);
    canvas.height = 420;
}

// ============================================
// START THE SIMULATOR
// ============================================
window.addEventListener('load', init);

// Handle visibility change - pause/resume animation
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(state.animFrame);
    } else {
        animate();
    }
});
