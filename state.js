// state.js — physics constants, shared simulation state, canvas setup, particle arrays
// No dependencies. Must load first.

/* ============================================
   PHYSICS CONSTANTS & STATE
   ============================================ */
const g = 9.81; // gravitational acceleration (m/s²)

// Simulation State Object
const state = {
    mass: 5.0,           // kg
    volume: 0.01,        // m³
    liquidDensity: 1000, // kg/m³
    shape: 'cube',
    liquidType: 'water',

    // Animation state
    objectY: 0,          // Current Y position (canvas units)
    objectVY: 0,         // Vertical velocity
    isDropped: false,
    isDragging: false,
    dragStartY: 0,
    animFrame: null,
    bobOffset: 0,
    bobDirection: 1,
    bobSpeed: 0.03,

    // Calculated physics
    objectDensity: 500,
    buoyantForce: 0,
    gravityForce: 0,
    netForce: 0,
    floatState: 'floating', // 'floating', 'sinking', 'neutral'
    submersionFraction: 1.0 // 0 to 1

    
};

// Canvas Setup
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');

// Wave animation state
const waves = {
    offset1: 0,
    offset2: 0,
    offset3: 0
};

// Bubble particles
let bubbles = [];
let splashParticles = [];
