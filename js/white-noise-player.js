class WhiteNoisePlayer {
    constructor() {
        this.presetsStorageKey = 'ambient-noise-presets';
        this.sounds = {
            'coffee-shop': {
                url: 'sounds/coffee-shop.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'airport': {
                url: 'sounds/airport.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'winter-morning': {
                url: 'sounds/winter-morning.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'suburban-street': {
                url: 'sounds/suburban-street.mp3',
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
            'rain-on-leaves': {
                url: 'sounds/rain-on-leaves.mp3',
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
            },
            'keyboard': {
                url: 'sounds/keyboard.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'wind-chimes': {
                url: 'sounds/wind-chimes.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'clock': {
                url: 'sounds/clock.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'ceiling-fan': {
                url: 'sounds/ceiling-fan.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'tuning-radio': {
                url: 'sounds/tuning-radio.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'fireworks': {
                url: 'sounds/fireworks.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'owl': {
                url: 'sounds/owl.mp3',
                audio: null,
                playing: false,
                loading: false
            },
            'underwater': {
                url: 'sounds/underwater.mp3',
                audio: null,
                playing: false,
                loading: false
            }
        };

        this.notesContainer = document.querySelector('.floating-notes');
        this.noteInterval = null;
        this.presetToggleButton = document.getElementById('ambientNoisePresetToggle');
        this.presetLabel = document.getElementById('ambientNoisePresetLabel');
        this.presetMenu = document.getElementById('ambientNoisePresetMenu');
        this.presetList = document.getElementById('ambientNoisePresetList');
        this.presetEmptyState = document.getElementById('ambientNoisePresetEmpty');
        this.createPresetButton = document.getElementById('createAmbientNoisePreset');
        this.presets = this.loadPresets();
        this.activePresetName = '';
        this.isApplyingPreset = false;
        this.isPresetDialogOpen = false;
        this.handlePresetMenuDocumentClick = this.handlePresetMenuDocumentClick.bind(this);
        this.handlePresetMenuEscape = this.handlePresetMenuEscape.bind(this);
        
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

                this.handleMixUpdated();
            });

            // Volume control
            const volumeSlider = button.querySelector('.volume-slider');
            volumeSlider.addEventListener('input', (e) => {
                e.stopPropagation(); // Prevent button click
                this.setVolume(soundKey, e.target.value / 100);
                this.handleMixUpdated();
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

        this.initializePresetsUI();
    }

    loadPresets() {
        try {
            const rawPresets = localStorage.getItem(this.presetsStorageKey);
            const parsedPresets = JSON.parse(rawPresets || '{}');
            return parsedPresets && typeof parsedPresets === 'object' ? parsedPresets : {};
        } catch (error) {
            console.error('Error loading ambient noise presets:', error);
            return {};
        }
    }

    persistPresets() {
        try {
            localStorage.setItem(this.presetsStorageKey, JSON.stringify(this.presets));
        } catch (error) {
            console.error('Error saving ambient noise presets:', error);
        }
    }

    initializePresetsUI() {
        if (!this.presetToggleButton || !this.presetMenu || !this.presetList || !this.createPresetButton) {
            return;
        }

        this.renderPresetMenu();
        this.updatePresetTriggerLabel();

        this.presetToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.togglePresetMenu();
        });

        this.createPresetButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.createPreset();
        });

        this.presetMenu.addEventListener('click', (event) => {
            const renameButton = event.target.closest('[data-preset-rename]');
            if (renameButton) {
                event.stopPropagation();
                this.renamePreset(renameButton.getAttribute('data-preset-rename'));
                return;
            }

            const deleteButton = event.target.closest('[data-preset-delete]');
            if (deleteButton) {
                event.stopPropagation();
                this.deletePreset(deleteButton.getAttribute('data-preset-delete'));
                return;
            }

            const presetRow = event.target.closest('[data-preset-name]');
            if (presetRow) {
                event.stopPropagation();
                this.applyPreset(presetRow.getAttribute('data-preset-name'));
            }
        });

        this.presetMenu.addEventListener('keydown', (event) => {
            const presetRow = event.target.closest('[data-preset-name]');
            if (!presetRow) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.applyPreset(presetRow.getAttribute('data-preset-name'));
            }
        });

        document.addEventListener('click', this.handlePresetMenuDocumentClick);
        document.addEventListener('keydown', this.handlePresetMenuEscape);
    }

    togglePresetMenu(forceState) {
        if (!this.presetMenu || !this.presetToggleButton) {
            return;
        }

        const presetNames = Object.keys(this.presets).sort((left, right) => left.localeCompare(right));
        const shouldOpen = typeof forceState === 'boolean' ? forceState : this.presetMenu.hidden;

        if (presetNames.length === 0 && shouldOpen) {
            this.activePresetName = '';
            this.updatePresetTriggerLabel();
        }

        this.presetMenu.hidden = !shouldOpen;
        this.presetToggleButton.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        this.presetToggleButton.classList.toggle('open', shouldOpen);
    }

    handlePresetMenuDocumentClick(event) {
        if (!this.presetMenu || !this.presetToggleButton || this.isPresetDialogOpen) {
            return;
        }

        const clickedInsideMenu = this.presetMenu.contains(event.target);
        const clickedToggle = this.presetToggleButton.contains(event.target);

        if (!clickedInsideMenu && !clickedToggle) {
            this.togglePresetMenu(false);
        }
    }

    handlePresetMenuEscape(event) {
        if (this.isPresetDialogOpen || Swal.isVisible()) {
            return;
        }

        if (event.key === 'Escape') {
            this.togglePresetMenu(false);
        }
    }

    handleMixUpdated() {
        if (this.isApplyingPreset) {
            return;
        }

        this.activePresetName = '';
        this.updatePresetTriggerLabel();
        this.renderPresetMenu();
    }

    getCurrentMixState() {
        const mix = {};

        Object.keys(this.sounds).forEach((soundKey) => {
            const slider = document.getElementById(`${soundKey}-volume`);
            mix[soundKey] = {
                volume: slider ? Number(slider.value) : 0,
                playing: Boolean(this.sounds[soundKey].playing)
            };
        });

        return mix;
    }

    updatePresetTriggerLabel() {
        if (this.presetLabel) {
            this.presetLabel.textContent = this.activePresetName || 'Custom';
        }
    }

    renderPresetMenu() {
        if (!this.presetList || !this.presetEmptyState) {
            return;
        }

        const presetNames = Object.keys(this.presets).sort((left, right) => left.localeCompare(right));
        this.presetList.innerHTML = '';

        presetNames.forEach((presetName) => {
            const row = document.createElement('div');
            row.className = 'ambient-noise-preset-row';
            row.setAttribute('data-preset-name', presetName);
            row.setAttribute('role', 'button');
            row.setAttribute('tabindex', '0');

            const isActivePreset = presetName === this.activePresetName;
            row.classList.toggle('active', isActivePreset);

            row.innerHTML = `
                <span class="ambient-noise-preset-row-name">${presetName}</span>
                <span class="ambient-noise-preset-row-actions">
                    <span class="ambient-noise-preset-check ${isActivePreset ? 'visible' : ''}" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path d="m4 9 3 3 7-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </span>
                    <button type="button" class="ambient-noise-preset-icon-button" data-preset-rename="${presetName}" title="Rename preset" aria-label="Rename ${presetName}">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path d="M12.95 2.95a1.5 1.5 0 1 1 2.12 2.12L6 14.14 2.5 15.5 3.86 12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                    <button type="button" class="ambient-noise-preset-icon-button delete" data-preset-delete="${presetName}" title="Delete preset" aria-label="Delete ${presetName}">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path d="M3.5 5.5h11M7 2.75h4M6 5.5v8.25M9 5.5v8.25M12 5.5v8.25M4.75 5.5l.5 9.25a1 1 0 0 0 1 .95h5.5a1 1 0 0 0 1-.95l.5-9.25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    </button>
                </span>
            `;

            this.presetList.appendChild(row);
        });

        this.presetEmptyState.hidden = presetNames.length > 0;
    }

    isDialogConfirmed(result) {
        if (!result) {
            return false;
        }

        if (typeof result.isConfirmed === 'boolean') {
            return result.isConfirmed;
        }

        return !result.dismiss;
    }

    async promptPresetName({ title, value = '', confirmButtonText }) {
        this.isPresetDialogOpen = true;

        const result = await Swal.fire({
            title,
            target: document.getElementById('whiteNoiseModal'),
            input: 'text',
            inputValue: value,
            inputPlaceholder: 'Preset name',
            showCancelButton: true,
            confirmButtonText,
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3085d6',
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: true,
            inputAutoTrim: true,
            didOpen: () => {
                const input = Swal.getInput();
                if (input) {
                    input.focus();
                    input.select();
                }
            },
            inputValidator: (inputValue) => {
                if (!inputValue || !inputValue.trim()) {
                    return 'Please enter a preset name.';
                }

                return undefined;
            }
        });

        this.isPresetDialogOpen = false;

        if (!this.isDialogConfirmed(result)) {
            return null;
        }

        return String(result.value || '').trim();
    }

    async confirmPresetOverwrite(presetName) {
        this.isPresetDialogOpen = true;

        const result = await Swal.fire({
            title: 'Overwrite preset?',
            target: document.getElementById('whiteNoiseModal'),
            text: `"${presetName}" already exists.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Overwrite',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#7f8c8d',
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: true
        });

        this.isPresetDialogOpen = false;

        return this.isDialogConfirmed(result);
    }

    async confirmPresetDeletion(presetName) {
        this.isPresetDialogOpen = true;

        const result = await Swal.fire({
            title: 'Delete preset?',
            target: document.getElementById('whiteNoiseModal'),
            text: `"${presetName}" will be removed from your saved mixes.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: true
        });

        this.isPresetDialogOpen = false;

        return this.isDialogConfirmed(result);
    }

    async applyPreset(presetName) {
        const preset = this.presets[presetName];

        if (!preset) {
            this.activePresetName = '';
            this.updatePresetTriggerLabel();
            this.renderPresetMenu();
            return;
        }

        this.isApplyingPreset = true;

        try {
            for (const soundKey of Object.keys(this.sounds)) {
                const soundState = preset[soundKey] || { volume: 0, playing: false };
                const slider = document.getElementById(`${soundKey}-volume`);

                if (slider) {
                    slider.value = soundState.volume;
                }

                this.setVolume(soundKey, soundState.volume / 100);

                if (soundState.playing) {
                    await this.playSound(soundKey);
                } else {
                    this.pauseSound(soundKey);
                }
            }

            this.activePresetName = presetName;
        } finally {
            this.isApplyingPreset = false;
            this.updatePresetTriggerLabel();
            this.renderPresetMenu();
            this.togglePresetMenu(false);
        }
    }

    async createPreset() {
        const presetName = await this.promptPresetName({
            title: 'Create preset',
            value: this.activePresetName || '',
            confirmButtonText: 'Save'
        });

        if (!presetName) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(this.presets, presetName) && presetName !== this.activePresetName) {
            const shouldOverwrite = await this.confirmPresetOverwrite(presetName);

            if (!shouldOverwrite) {
                return;
            }
        }

        this.presets[presetName] = this.getCurrentMixState();
        this.persistPresets();
        this.activePresetName = presetName;
        this.updatePresetTriggerLabel();
        this.renderPresetMenu();
        this.togglePresetMenu(true);
    }

    async renamePreset(presetName) {
        if (!presetName || !Object.prototype.hasOwnProperty.call(this.presets, presetName)) {
            return;
        }

        const trimmedName = await this.promptPresetName({
            title: 'Rename preset',
            value: presetName,
            confirmButtonText: 'Save'
        });

        if (!trimmedName) {
            return;
        }

        if (trimmedName === presetName) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(this.presets, trimmedName)) {
            const shouldOverwrite = await this.confirmPresetOverwrite(trimmedName);

            if (!shouldOverwrite) {
                return;
            }
        }

        this.presets[trimmedName] = this.presets[presetName];
        delete this.presets[presetName];
        this.persistPresets();

        if (this.activePresetName === presetName) {
            this.activePresetName = trimmedName;
        }

        this.updatePresetTriggerLabel();
        this.renderPresetMenu();
        this.togglePresetMenu(true);
    }

    async deletePreset(presetName) {
        if (!presetName || !Object.prototype.hasOwnProperty.call(this.presets, presetName)) {
            return;
        }

        const shouldDelete = await this.confirmPresetDeletion(presetName);

        if (!shouldDelete) {
            return;
        }

        delete this.presets[presetName];
        this.persistPresets();

        if (this.activePresetName === presetName) {
            this.activePresetName = '';
        }

        this.updatePresetTriggerLabel();
        this.renderPresetMenu();
        this.togglePresetMenu(Object.keys(this.presets).length > 0 || this.presetMenu.hidden === false);
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

        const defaultVolume = document.getElementById(soundKey + '-volume').value / 100;

        if (sound.audio) {
            sound.audio.play();
            sound.playing = true;
            sound.audio.volume = defaultVolume;
            button.classList.add('playing');
        }

        this.updateMuteButtonVisibility();
    }

    pauseSound(soundKey) {
        const sound = this.sounds[soundKey];
        if (!sound) return;

        if (sound.audio) {
            sound.audio.pause();
        }

        sound.playing = false;

        // Update UI
        const button = document.querySelector(`.sound-button[data-sound="${soundKey}"]`);
        button.classList.remove('playing');

        this.updateMuteButtonVisibility();
    }

    pauseAll() {
        Object.keys(this.sounds).forEach(soundKey => {
            this.pauseSound(soundKey);
        });
    }

    setVolume(soundKey, volume) {
        const sound = this.sounds[soundKey];
        if (!sound) return;

        if (sound.audio) {
            sound.audio.volume = volume;
        }
    }

    isAnySoundPlaying() {
		return Object.values(this.sounds).some(sound => sound.playing);
	}

    updateMuteButtonVisibility() {
		const muteButton = document.getElementById('globalMuteButton');
		muteButton.style.display = this.isAnySoundPlaying() ? 'block' : 'none';

        if (this.isAnySoundPlaying()) {
            this.startFloatingNotes();
        } else {
            this.stopFloatingNotes();
        }
	}

    createNote() {
        const note = document.createElement('div');
        note.textContent = '♪';
        note.style.position = 'absolute';
        note.style.left = `${Math.random() * 50}%`;
        note.style.color = `hsl(0, 0%, 100%)`;
        note.style.animation = `floatNote 4s linear forwards`;
        note.style.fontSize = '8px';

        document.querySelector('.floating-notes').appendChild(note);

        // Remove the note after animation ends
        setTimeout(() => note.remove(), 3000);
    }

    startFloatingNotes() {
        if (!this.noteInterval) {
            this.noteInterval = setInterval(this.createNote, 1000);
        }
    }

    stopFloatingNotes() {
        clearInterval(this.noteInterval);
        this.noteInterval = null;
    }
}

// Initialize the player when the document is ready
$(document).ready(() => {
    window.whiteNoisePlayer = new WhiteNoisePlayer();

    // Global mute state
	let isGlobalMuted = false;

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
});
