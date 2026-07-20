
function showEduInfo(type) {
    const info = {
        float: {
            title: '🛶 Why Objects Float',
            text: 'An object floats when its AVERAGE DENSITY is less than the liquid density. This is why huge ships float — they are hollow and their average density (ship + air) is less than water! The buoyant force exceeds the weight of the object.'
        },
        sink: {
            title: '⚓ Why Objects Sink',
            text: 'An object sinks when its density is greater than the liquid. A rock sinks in water because its density (~2500 kg/m³) is much higher than water (1000 kg/m³). Gravity force exceeds the buoyant force.'
        },
        neutral: {
            title: '🐟 Neutral Buoyancy',
            text: 'When an object\'s density exactly equals liquid density, it neither floats nor sinks — it hovers! Fish use swim bladders to adjust their buoyancy. Submarines blow water in/out of ballast tanks to achieve this!'
        },
        archimedes: {
            title: '🏛️ Archimedes Principle (250 BC)',
            text: 'Legend says Archimedes discovered this while taking a bath! He noticed the water level rose when he got in. He ran through the streets shouting "EUREKA!" (I found it!). The key insight: upward force = weight of displaced fluid. Fb = ρ_liquid × V_submerged × g'
        }
    };

    const i = info[type];
    showToast('📚 ' + i.title + ': ' + i.text.substring(0, 80) + '...');
}

// ============================================
// SOUND EFFECTS (Web Audio API)
// ============================================

let audioCtx = null;

/**
 * Create splash sound using Web Audio API
 */
function playSplashSound() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Create a brief white noise burst for splash effect
        const bufferSize = audioCtx.sampleRate * 0.3;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start();

    } catch(e) {
        // Sound not available in some browsers
    }
}

// ============================================
// TOAST NOTIFICATION
// ============================================

let toastTimeout = null;

/**
 * Show temporary toast notification
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

