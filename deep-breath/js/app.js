const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const message = document.getElementById('message');

const muteButton = document.getElementById('muteButton');
const speakerIcon = document.getElementById('speakerIcon');

let breathingInterval;
let timeoutIds = [];
let intervalId;
let isMuted = false;
let music;

startButton.addEventListener('click', () => {
    startMusic();

    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    
    console.log('start button clicked');

    const innerCircle = document.querySelector('.c-deep-breathing-tool__inner-circle');

    //message.classList.add('c-deep-breathing-tool__message--fade');

    // Function to perform the breathing animation
    const performBreathingAnimation = () => {
        innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-in');
        message.textContent = 'Breathe in slowly'; // Update message
    
        // Inhale duration
        timeoutIds.push(setTimeout(() => {
            // Hold for 4 seconds
            message.textContent = 'Now hold your breath'; // Update message during hold
            timeoutIds.push(setTimeout(() => {
                innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-in');
                // Start Exhale
                innerCircle.classList.add('c-deep-breathing-tool__inner-circle--breathe-out');
                message.textContent = 'Breathe out slowly'; // Update message
                
                // Exhale duration
                timeoutIds.push(setTimeout(() => {
                    
                    message.textContent = 'Now hold your breath'; // Update message during hold
                    timeoutIds.push(setTimeout(() => {
                        innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-out');
                    }, 4000));
                }, 6000)); // Exhale duration
            }, 4000)); // Hold duration
        }, 4000)); // Inhale duration
    };

    performCountdown = () => {
        let count = 3;
        intervalId = setInterval(() => {
            message.textContent = `Starting in ${count}...`;
            count--;

            if (count === -1) {
                clearInterval(intervalId);
                performBreathingAnimation();
                breathingInterval = setInterval(performBreathingAnimation, 18000);
            }
        }, 1000);
    };

    performCountdown();
});

// Add this code to handle the stop button
stopButton.addEventListener('click', () => {
    stopMusic();

    // Clear the breathing interval
    clearInterval(breathingInterval);
    clearInterval(intervalId);

    // Clear all timeouts
    timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutIds = []; // Reset the array

    // Reset the inner circle state immediately
    const innerCircle = document.querySelector('.c-deep-breathing-tool__inner-circle');
    innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-in');
    innerCircle.classList.remove('c-deep-breathing-tool__inner-circle--breathe-out');

    // Reset message immediately
    const message = document.getElementById('message');
    message.textContent = "When you're ready...";
    //message.classList.remove('c-deep-breathing-tool__message--fade'); // Optional: remove fade class if needed

    // Show the start button and hide the stop button
    startButton.style.display = 'block';
    stopButton.style.display = 'none';
});

function startMusic() {
    music = new Audio('/sounds/meditation.mp3');
    music.loop = true;
    speakerIcon.style.display = 'block';
    music.play();
}

function stopMusic() {
    speakerIcon.style.display = 'none';
    music.pause();
    music.currentTime = 0; // Reset to the start
}

muteButton.addEventListener('click', () => {
    if (isMuted) {
        music.volume = 1; // Unmute
        speakerIcon.src = "img/icons/speaker.svg";
    } else {
        music.volume = 0; // Mute
        speakerIcon.src = "img/icons/mute.svg";
    }
    isMuted = !isMuted;
});