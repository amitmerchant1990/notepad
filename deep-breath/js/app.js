const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const message = document.getElementById('message');
const innerCircle = document.querySelector('.c-deep-breathing-tool__inner-circle');

const muteButton = document.getElementById('muteButton');
const speakerIcon = document.getElementById('speakerIcon');
const breathingPresetSelect = document.getElementById('breathingPreset');
const breathingDescription = document.getElementById('breathingDescription');

const breathingPresets = {
    box: {
        name: 'Box Breathing',
        description: 'Inhale for 4 seconds, hold the breath for 4 seconds, exhale for 6 seconds, and hold again for 4 seconds. This steady loop helps calm the nervous system.',
        phases: [
            { type: 'inhale', duration: 4000, message: 'Breathe in slowly' },
            { type: 'hold-in', duration: 4000, message: 'Now hold your breath' },
            { type: 'exhale', duration: 6000, message: 'Breathe out slowly' },
            { type: 'hold-out', duration: 4000, message: 'Now hold your breath' }
        ]
    },
    478: {
        name: '4-7-8 Breathing',
        description: 'Inhale for 4 seconds, hold the breath for 7 seconds, and exhale for 8 seconds. This slower rhythm can help you unwind.',
        phases: [
            { type: 'inhale', duration: 4000, message: 'Breathe in slowly' },
            { type: 'hold-in', duration: 7000, message: 'Now hold your breath' },
            { type: 'exhale', duration: 8000, message: 'Breathe out slowly' }
        ]
    },
    pursed: {
        name: 'Pursed Lip Breathing',
        description: 'Inhale through the nose for 2 seconds, then exhale slowly through pursed lips for 4 seconds. It helps slow down the breath.',
        phases: [
            { type: 'inhale', duration: 2000, message: 'Inhale through your nose' },
            { type: 'exhale', duration: 4000, message: 'Exhale through pursed lips' }
        ]
    },
    resonant: {
        name: 'Resonant Breathing',
        description: 'Breathe in and out evenly, usually around 6 breaths per minute. This balanced pace can support a calmer rhythm.',
        phases: [
            { type: 'inhale', duration: 5000, message: 'Breathe in evenly' },
            { type: 'exhale', duration: 5000, message: 'Breathe out evenly' }
        ]
    },
    diaphragmatic: {
        name: 'Diaphragmatic Breathing',
        description: 'Inhale deeply, expanding the diaphragm, for 4 seconds, and exhale for 6 seconds. This exercise encourages fuller breaths.',
        phases: [
            { type: 'inhale', duration: 4000, message: 'Inhale deeply' },
            { type: 'exhale', duration: 6000, message: 'Exhale slowly' }
        ]
    }
};

let breathingTimeoutIds = [];
let countdownTimeoutIds = [];
let intervalId;
let isMuted = false;
let music;

function getSelectedPreset() {
    return breathingPresets[breathingPresetSelect.value] || breathingPresets.box;
}

function updatePresetDescription() {
    const preset = getSelectedPreset();
    breathingDescription.innerHTML = `<strong>${preset.name}:</strong> ${preset.description}`;
}

function clearTimeoutList(timeoutIds) {
    timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutIds.length = 0;
}

function setCircleState(phaseType) {
    if (phaseType === 'inhale') {
        innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-out');
        innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-in');
        return;
    }

    if (phaseType === 'exhale') {
        innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-in');
        innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-out');
        return;
    }

    if (phaseType === 'hold-in') {
        innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-out');
        innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-in');
        return;
    }

    if (phaseType === 'hold-out') {
        innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-in');
        innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-out');
    }
}

function runBreathingPhase(preset, phaseIndex) {
    const phase = preset.phases[phaseIndex];

    setCircleState(phase.type);
    message.textContent = phase.message;

    const nextPhaseIndex = (phaseIndex + 1) % preset.phases.length;
    breathingTimeoutIds.push(setTimeout(() => runBreathingPhase(preset, nextPhaseIndex), phase.duration));
}

function startCountdown(preset) {
    let count = 3;

    const tick = () => {
        if (count === 0) {
            message.textContent = `Starting ${preset.name}...`;
            breathingTimeoutIds.push(setTimeout(() => runBreathingPhase(preset, 0), 500));
            return;
        }

        message.textContent = `Starting in ${count}...`;
        count -= 1;
        countdownTimeoutIds.push(setTimeout(tick, 1000));
    };

    tick();
}

startButton.addEventListener('click', () => {
    const preset = getSelectedPreset();

    startMusic();
    updatePresetDescription();

    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    breathingPresetSelect.disabled = true;

    clearTimeoutList(countdownTimeoutIds);
    clearTimeoutList(breathingTimeoutIds);
    clearInterval(intervalId);

    startCountdown(preset);
});

stopButton.addEventListener('click', () => {
    stopMusic();

    clearTimeoutList(breathingTimeoutIds);
    clearTimeoutList(countdownTimeoutIds);
    clearInterval(intervalId);

    innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-in');
    innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-out');

    message.textContent = "When you're ready...";
    breathingPresetSelect.disabled = false;

    startButton.style.display = 'block';
    stopButton.style.display = 'none';
});

breathingPresetSelect.addEventListener('change', () => {
    updatePresetDescription();
    message.textContent = "When you're ready...";
});

$('#fullScreenButton').click(function () {
    toggleFullScreen();
});

document.addEventListener("fullscreenchange", function () {
	if (!document.fullscreenElement) {
		$('#arrowPointsIn').hide();
		$('#arrowPointsOut').show();
	}
});

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        $('#arrowPointsOut').hide();
        $('#arrowPointsIn').show();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
        $('#arrowPointsIn').hide();
        $('#arrowPointsOut').show();
    }
}

function startMusic() {
    music = new Audio('/sounds/meditation.mp3');
    music.loop = true;
    music.volume = isMuted ? 0 : 1;
    speakerIcon.style.display = 'block';
    music.play();
}

function stopMusic() {
    if (!music) {
        return;
    }

    speakerIcon.style.display = 'none';
    music.pause();
    music.currentTime = 0;
}

muteButton.addEventListener('click', () => {
    if (!music) {
        return;
    }

    if (isMuted) {
        music.volume = 1;
        speakerIcon.src = "img/icons/speaker.svg";
    } else {
        music.volume = 0;
        speakerIcon.src = "img/icons/mute.svg";
    }

    isMuted = !isMuted;
});

updatePresetDescription();
