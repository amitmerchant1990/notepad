// Timer configuration
const timerConfig = {
    periods: [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 45, label: '45 minutes' },
        { value: 60, label: '60 minutes' }
    ],
    timer: null,
    isRunning: false,
    remainingTime: 0,
    endTime: null
};

const timerPillRightPositionWithoutWordCount = '1.4em';

// Timer modal HTML
const timerModalHtml = `
    <div class="timer-modal modal fade" id="timerModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">&times;</button>
                    <h4 class="modal-title custom-modal-title generic-gap">
                        Select Writing Duration
                        <a href="#" data-placement="bottom" data-toggle="tooltip" title="Once selected, the timer will start ticking at the bottom right corner.">
                            <img src="img/tooltip.svg" alt="Tooltip Icon" />                
                        </a>
                    </h4>    
                </div>
                <div class="modal-body">
                    <div class="timer-options">
                        ${timerConfig.periods.map(period => `
                            <button class="btn btn-primary timer-option" data-minutes="${period.value}">
                                ${period.label}
                            </button>
                        `).join('')}
                    </div>
                    <div class="chime-container">
                         <input type="checkbox" id="timerChime" />
                         <label for="timerChime">Play chime sound</label>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

// Add timer HTML to the DOM
$(document.body).append(timerModalHtml);

$(document).ready(function() {
    if (localStorage.getItem('timerChime') && localStorage.getItem('timerChime') == 'true') {
        $('#timerChime').prop('checked', true);
    }

    $('#timerChime').change(function() {
        if (this.checked) {
            localStorage.setItem('timerChime', 'true');
        } else {
            localStorage.setItem('timerChime', 'false');
        }
    })
})

// Timer functions
function startTimer(minutes) {
    if (timerConfig.timer) {
        stopTimer();
    }

    const durationInSeconds = minutes * 60;
    timerConfig.endTime = Date.now() + (durationInSeconds * 1000);
    timerConfig.remainingTime = durationInSeconds;
    timerConfig.isRunning = true;
    timerConfig.timer = setInterval(updateTimer, 1000);
    
    // Show timer pill
    $('.timer-pill').show().removeClass('timer-ending');
    updateTimerDisplay();

    // check if word-count-container is hidden and 
    // based on that change right position of timer pill
    if ($('.word-count-container').is(':hidden')) {
        $('.timer-pill').css('right', timerPillRightPositionWithoutWordCount);
    }
}

function stopTimer() {
    if (timerConfig.timer) {
        clearInterval(timerConfig.timer);
    }
    timerConfig.timer = null;
    timerConfig.isRunning = false;
    timerConfig.remainingTime = 0;
    timerConfig.endTime = null;
    $('.timer-pill').hide().removeClass('timer-ending');
    $('.timer-display').text('00:00');
}

function updateTimer() {
    // Interval callbacks can be throttled while the tab is in the background.
    // Calculate the remaining time from the deadline so that throttling only
    // delays the display update; it does not pause the timer itself.
    timerConfig.remainingTime = Math.max(
        0,
        Math.ceil((timerConfig.endTime - Date.now()) / 1000)
    );

    if (timerConfig.remainingTime <= 0) {
        if (localStorage.getItem('timerChime') && localStorage.getItem('timerChime') == 'true') {
            playChimeSound();
        }
        
        stopTimer();
        return;
    }

    $('.timer-pill').toggleClass('timer-ending', timerConfig.remainingTime <= 10);
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerConfig.remainingTime / 60);
    const seconds = timerConfig.remainingTime % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    $('.timer-display').text(display);
}

// Initialize alarm sound
function playChimeSound() {
    timerConfig.alarmSound = new Audio('sounds/short-alarm-beep.mp3');
    timerConfig.alarmSound.loop = false;
    timerConfig.alarmSound.play();
}

// Event listeners
$(document).on('click', '.timer-option', function() {
    const minutes = $(this).data('minutes');
    startTimer(minutes);
    $('#timerModal').modal('hide');
});

$(document).on('click', '#stopTimer', function() {
    stopTimer();
});

// Refresh immediately when returning to the tab. Browsers may pause or
// heavily throttle interval callbacks while a page is hidden.
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && timerConfig.isRunning) {
        updateTimer();
    }
});