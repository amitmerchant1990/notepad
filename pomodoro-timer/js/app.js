$(document).ready(function () {
    let nameActiveTab;

    function notifyUser() {
        var notiSound = document.getElementById('notiSound');
        notiSound.play();
    }

    var timer, minutes = 25, seconds = 60,
        pomodoroIntervalId, pomodoroTime;

    var display = document.querySelector('#time');
    var display_short = document.querySelector('#time_short');
    var display_long = document.querySelector('#time_long');

    let start = $('#start');
    let stop = $('#stop');

    let short_stop = $('#short_stop');
    let short_start = $('#short_start');

    let long_stop = $('#long_stop');
    let long_start = $('#long_start');
    
    $('#start').click(() => {
        if (minutes == 25 && seconds == 60) {
            pomodoroTime = minutes * seconds;
        } else {
            pomodoroTime = minutes * 60 + seconds;
        }
        
        stop.show();
        start.hide();

        startTimer(pomodoroTime, display);
    })

    $('#stop').click(() => {
        start.show();
        stop.hide();

        stopTimer();
    });

    $('#reset').click(() => {
        defaultResetTimer();
    });

    function defaultResetTimer() {
        minutes = 25;
        seconds = 60;
        display.textContent = "25:00";
        resetTimer();

        start.show();
        stop.hide();
    }

    $('#short_start').click(() => {
        if (minutes == 5 && seconds == 60) {
            pomodoroTime = minutes * seconds;
        } else {
            pomodoroTime = minutes * 60 + seconds;
        }

        startTimer(pomodoroTime, display_short);

        short_stop.show();
        short_start.hide();
    })

    $('#short_stop').click(() => {
        stopTimer();
        short_start.show();
        short_stop.hide();
    });

    $('#short_reset').click(() => {
        resetShortTimer();
    });

    function resetShortTimer() {
        minutes = 5;
        seconds = 0;
        display_short.textContent = "05:00";
        resetTimer();
        short_start.show();
        short_stop.hide();
    }

    $('#long_start').click(() => {
        if (minutes == 10 && seconds == 60) {
            pomodoroTime = minutes * seconds;
        } else {
            pomodoroTime = minutes * 60 + seconds;
        }

        startTimer(pomodoroTime, display_long);
        long_stop.show();
        long_start.hide();
    })

    $('#long_stop').click(() => {
        stopTimer();
        long_start.show();
        long_stop.hide();
    });

    $('#long_reset').click(() => {
        longResetTimer();
    });

    function longResetTimer() {
        minutes = 10;
        seconds = 60;
        display_long.textContent = "10:00";
        resetTimer();
        long_start.show();
        long_stop.hide();
    }

    function startTimer(duration, display) {
        timer = duration;
        pomodoroIntervalId = setInterval(function () {
            if (--timer < 0) {
                timer = duration;
            }

            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;

            display.textContent = minutes + ":" + seconds;

            if (minutes == 0 && seconds == 0) {
                if (nameActiveTab[1] == 'pomodoro') {
                    defaultResetTimer();
                } else if (nameActiveTab[1] == 'short') {
                    resetShortTimer();
                } else {
                    longResetTimer();
                }

                notifyUser();
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(pomodoroIntervalId);
    }

    function resetTimer() {
        clearInterval(pomodoroIntervalId);
    }

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        clearInterval(pomodoroIntervalId);

        let activeTab = e.target.toString();
        nameActiveTab = activeTab.split('#');

        if (nameActiveTab[1] == 'pomodoro') {
            minutes = 25, seconds = 0;
            document.querySelector('#time').textContent = "25:00";
        } else if (nameActiveTab[1] == 'short') {
            minutes = 5, seconds = 0;
            document.querySelector('#time_short').textContent = "05:00";
        } else {
            minutes = 10, seconds = 0;
            document.querySelector('#time_long').textContent = "10:00";
        }
    })

    const pipButton = document.getElementById('pip');

    // Only show the Picture-in-Picture 
    // button if the browser supports it
    if ('documentPictureInPicture' in window) {
        $('#pipContainer').show();
    }

    pipButton.addEventListener('click', async () => {
        const appTimer = document.getElementById("timerContainer");

        // Open a Picture-in-Picture window.
        const pipWindow = await documentPictureInPicture.requestWindow({
            width: 350,
            height: 450,
        });

        [...document.styleSheets].forEach((styleSheet) => {
            try {
                const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                const style = document.createElement('style');

                style.textContent = cssRules;
                pipWindow.document.head.appendChild(style);
            } catch (e) {
                const link = document.createElement('link');

                link.rel = 'stylesheet';
                link.type = styleSheet.type;
                link.media = styleSheet.media;
                link.href = styleSheet.href;
                pipWindow.document.head.appendChild(link);
            }
        });

        // Move the timer to the Picture-in-Picture window.
        pipWindow.document.body.append(appTimer);

        // Move the timer back when the Picture-in-Picture window closes.
        pipWindow.addEventListener("pagehide", (event) => {
            const mainContainer = document.querySelector("#mainContainer");
            const timerContainer = event.target.querySelector("#timerContainer");
            const overlay = document.querySelector(".overlay");
            mainContainer.append(timerContainer);
            mainContainer.classList.remove("pip");

            overlay.style.display = "none";
            overlay.style.pointerEvents = "none";

            $('.timer-label').hide();
        });
    });

    documentPictureInPicture.addEventListener("enter", (event) => {
        const playerContainer = document.querySelector("#mainContainer");
        const overlay = document.querySelector(".overlay");

        const pipWindow = event.window;
        const pipDocument = pipWindow.document;
        const pipBody = pipDocument.body;

        pipBody.classList.add("pipBody");
        playerContainer.classList.add("pip");
        overlay.style.display = "block";
        overlay.style.pointerEvents = "all";

        $('.timer-label').show();
    });
});