class WhiteNoisePlayer {
    constructor() {
        this.sounds = {
            'coffee-shop': {
                url: 'sounds/coffee-shop.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'rain': {
                url: 'sounds/rain.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'thunder': {
                url: 'sounds/thunder.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'waves': {
                url: 'sounds/waves.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'fireside': {
                url: 'sounds/fireside.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'crickets': {
                url: 'sounds/crickets.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'singing-bowl': {
                url: 'sounds/singing-bowl.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'train': {
                url: 'sounds/train.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'white-noise': {
                url: 'sounds/white-noise.mp3',
                audio: null,
                playing: false,
                loading: false
            }
        };
        
        this.init();
    }

    init() {
        // Add click event listeners to sound buttons
        document.querySelectorAll('.sound-button').forEach(button => {
            const soundKey = button.dataset.sound;
            
            // Play/pause on button click
            button.addEventListener('click', () => {
                if (this.sounds[soundKey].playing) {
                    this.pauseSound(soundKey);
                } else {
                    this.playSound(soundKey);
                }
            });

            // Volume control
            const volumeSlider = button.querySelector('.volume-slider');
            volumeSlider.addEventListener('input', (e) => {
                e.stopPropagation(); // Prevent button click
                this.setVolume(soundKey, e.target.value / 100);
            });

            // Prevent button click when adjusting volume
            volumeSlider.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Handle modal close
        $('#whiteNoiseModal').on('hidden.bs.modal', () => {
            // Optional: pause all sounds when modal is closed
            // this.pauseAll();
        });
    }

    async loadSound(soundKey) {
        const sound = this.sounds[soundKey];
        if (!sound || sound.audio || sound.loading) return;

        sound.loading = true;
        const button = document.querySelector(`.sound-button[data-sound="${soundKey}"]`);
        button.classList.add('loading');

        try {
            const audio = new Audio(sound.url);
            await new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', resolve, { once: true });
                audio.addEventListener('error', reject, { once: true });
                audio.load();
            });

            audio.loop = true;
            sound.audio = audio;
        } catch (error) {
            console.error(`Error loading sound ${soundKey}:`, error);
        } finally {
            sound.loading = false;
            button.classList.remove('loading');
        }
    }

    async playSound(soundKey) {
        const sound = this.sounds[soundKey];
        if (!sound) return;

        const button = document.querySelector(`.sound-button[data-sound="${soundKey}"]`);

        // If the sound is not loaded yet, load it
        if (!sound.audio) {
            try {
                await this.loadSound(soundKey);
            } catch (error) {
                console.error(`Failed to load sound ${soundKey}`);
                return;
            }
        }

        if (sound.audio) {
            sound.audio.play();
            sound.playing = true;
            button.classList.add('playing');
        }
    }

    pauseSound(soundKey) {
        const sound = this.sounds[soundKey];
        if (!sound || !sound.audio) return;

        sound.audio.pause();
        sound.playing = false;

        // Update UI
        const button = document.querySelector(`.sound-button[data-sound="${soundKey}"]`);
        button.classList.remove('playing');
    }

    pauseAll() {
        Object.keys(this.sounds).forEach(soundKey => {
            this.pauseSound(soundKey);
        });
    }

    setVolume(soundKey, volume) {
        const sound = this.sounds[soundKey];
        if (!sound || !sound.audio) return;

        sound.audio.volume = volume;
    }
}

// Initialize the player when the document is ready
$(document).ready(() => {
    window.whiteNoisePlayer = new WhiteNoisePlayer();

    // Global mute state
	let isGlobalMuted = false;

	// Function to check if any sounds are playing
	function isAnySoundPlaying() {
		const player = window.whiteNoisePlayer;
		return Object.values(player.sounds).some(sound => sound.playing);
	}

	// Function to update mute button visibility
	function updateMuteButtonVisibility() {
		const muteButton = document.getElementById('globalMuteButton');
		muteButton.style.display = isAnySoundPlaying() ? 'block' : 'none';
	}

	// Function to toggle global mute
	function toggleGlobalMute() {
		console.log('Toggling global mute');
		isGlobalMuted = !isGlobalMuted;
		const playingIcon = document.getElementById('globalPlayingIcon');
        const globalMuteIcon = document.getElementById('globalMuteIcon');

		const player = window.whiteNoisePlayer;
		
		// Mute/unmute all sounds
		Object.values(player.sounds).forEach(sound => {
			if (sound.audio) {
				sound.audio.muted = isGlobalMuted;
			}
		});
		
		if (isGlobalMuted) {
            playingIcon.style.display = 'none';
            globalMuteIcon.style.display = 'block';
        } else {
            playingIcon.style.display = 'block';
            globalMuteIcon.style.display = 'none';
        }
	}

	// Add event listener for global mute button
	const muteButton = document.getElementById('globalMuteButton');
	if (muteButton) {
		muteButton.addEventListener('click', toggleGlobalMute);
		// Initially hide the mute button
		muteButton.style.display = 'none';
	}

	// Add event listeners to sound buttons to update mute button visibility
	document.querySelectorAll('.sound-button').forEach(button => {
		button.addEventListener('click', () => {
			// Wait a short moment for the sound state to update
			setTimeout(updateMuteButtonVisibility, 100);
		});
	});
});
