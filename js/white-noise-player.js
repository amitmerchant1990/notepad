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
            'fireside': {
                url: 'sounds/fireside.mp3',
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
});
