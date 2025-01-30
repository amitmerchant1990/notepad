const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const message = document.getElementById('message');

let breathingInterval;
let timeoutIds = [];

startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    stopButton.style.display = 'block';
    
    console.log('start button clicked');

    const innerCircle = document.querySelector('.c-deep-breathing-tool__inner-circle');

    message.classList.add('c-deep-breathing-tool__message--fade');

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
                }, 4000)); // Exhale duration
            }, 4000)); // Hold duration
        }, 4000)); // Inhale duration
    };

    // Start the animation immediately
    performBreathingAnimation();

    breathingInterval = setInterval(performBreathingAnimation, 16000); // 8 seconds for one full cycle
});

// Add this code to handle the stop button
stopButton.addEventListener('click', () => {
    // Clear the breathing interval
    clearInterval(breathingInterval);

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
    message.classList.remove('c-deep-breathing-tool__message--fade'); // Optional: remove fade class if needed

    // Show the start button and hide the stop button
    startButton.style.display = 'block';
    stopButton.style.display = 'none';
});