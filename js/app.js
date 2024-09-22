$(document).ready(function () {
	const welcomeText = `Welcome! This is an offline-capable Notepad which is a Progressive Web App.

The app serves the following features:

- Write notes which are then saved to the localStorage.
- Installable on supported browsers for offline usage.
- "Add To Home Screen" feature on Android-supported devices to launch the app from the home screen.
- Dark mode.
- Privacy-focused - We'll never collect your precious data.
- Light-weight - Loads almost instantly.
- It's open-source!

CAUTION: Since the app uses the browser's localStorage to store your notes, 
it's recommended that you take a backup of your notes more often using the 
"Download Notes" button or by pressing the "Ctrl/Cmd + S" keys.

** Start writing your notes **`;

	const darkmodeText = 'Enable dark mode [Ctrl/Cmd + M]';
	const lightmodeText = 'Enable light mode [Ctrl/Cmd + M]';
	const darkMetaColor = '#0d1117';
	const lightMetaColor = '#4d4d4d';
	const metaThemeColor = document.querySelector('meta[name=theme-color]');
	const { notepad, state, setState, removeState, get } = selector();
	const optimalLineLengthPadding = '15px 15vw 40px';

	const editorConfig = {
		defaultFontSize: 18,
		defaultLineHeight: 26,
		defaultFontWeight: 'normal',
		defaultShowWordCountPill: 'Yes',
		defaultWriteDirection: 'ltr',
		defaultOptimalLineLength: 'No',
		defaultOptimalLineLengthPadding: '15px 15px 40px'
	};

	const themeConfig = {
		lightmodeText, 
		darkmodeText, 
		lightMetaColor, 
		darkMetaColor, 
		metaThemeColor
	};

	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

	if (SpeechRecognition) {
		$('#micContainer').show();
		console.log("Speech Recognition API is supported in this browser.");
	}

	const noteItem = state.note && state.note != '' ? state.note : welcomeText;
	const characterAndWordCountText = calculateCharactersAndWords(noteItem);
	
	notepad.wordCount.text(characterAndWordCountText);
	notepad.note.val(noteItem);

	if (!state.isUserPreferredTheme) {
		setState('isUserPreferredTheme', 'false');
	}

	if (state.userChosenFontSize) {
		notepad.note.css('font-size', state.userChosenFontSize + 'px');
		notepad.fontSize.val(state.userChosenFontSize);
	} else {
		resetFontSize(editorConfig.defaultFontSize);
	}

	if (state.userChosenFontWeight) {
		notepad.note.css('font-weight', state.userChosenFontWeight);
		notepad.fontWeight.val(state.userChosenFontWeight);
	} else {
		resetFontWeight(editorConfig.defaultFontWeight);
	}

	if (state.userChosenLineHeight) {
		notepad.note.css('line-height', state.userChosenLineHeight + 'px');
		notepad.lineHeight.val(state.userChosenLineHeight);
	} else {
		resetLineHeight(editorConfig.defaultLineHeight);
	}

	const userChosenWordCountPillSelected = state.userChosenWordCountPillSelected

	if (userChosenWordCountPillSelected) {
		userChosenWordCountPillSelected === 'Yes' ? notepad.wordCountContainer.show() : notepad.wordCountContainer.hide();
		notepad.showWordCountPill.val(userChosenWordCountPillSelected);
	} else {
		resetShowWordCountPill(editorConfig.defaultShowWordCountPill);
	}

	if (state.userChosenWriteDirection) {
		notepad.note.css('direction', state.userChosenWriteDirection);
		notepad.writeDirection.val(state.userChosenWriteDirection);
	} else {
		resetWriteDirection(editorConfig.defaultWriteDirection);
	}

	if (state.userChosenOptimalLineLengthSelected) {
		const textArea = document.getElementById('note');

		if (state.userChosenOptimalLineLengthSelected === 'Yes') {
			textArea.style.padding = optimalLineLengthPadding;
		} else {
			textArea.style.padding = editorConfig.defaultOptimalLineLengthPadding;
		}

		notepad.optimalLineLength.val(state.userChosenOptimalLineLengthSelected);
	} else {
		resetOptimalLineLength(editorConfig.defaultOptimalLineLengthPadding, editorConfig.defaultOptimalLineLength);
	}

	if (state.mode && state.mode === 'dark') {
		enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor);
	} else {
		enableLightMode(darkmodeText, lightMetaColor, metaThemeColor);
	}

	notepad.note.keyup(debounce(function () {
		const characterAndWordCountText = calculateCharactersAndWords(get(this).val());
		notepad.wordCount.text(characterAndWordCountText);
		setState('note', get(this).val());
	}, 500));
	
	notepad.clearNotes.on('click', function () {
		deleteNotes();
	});

	notepad.mode.click(function () {
		toggleTheme(themeConfig);
	});

	notepad.copyToClipboard.click(function () {
		copyNotesToClipboard(notepad.note.val());
	})

	notepad.downloadNotes.click(function () {
		saveTextAsFile(note.value, getFileName());
	})

	notepad.fullScreenButton.click(function () {
		toggleFullScreen();
	})

	setTimeout(function () {
		if (!state.hasUserDismissedDonationPopup) {
			notepad.stickyNotice.toggleClass('make-hidden');
		}
	}, 30000);

	notepad.closeDonationPopup.click(function () {
		notepad.stickyNotice.remove();
		setState('hasUserDismissedDonationPopup', 'true');
	});

	notepad.fontSize.on('change', function (e) {
		const fontSizeSelected = this.value;

		notepad.note.css('font-size', fontSizeSelected + 'px');
		setState('userChosenFontSize', fontSizeSelected);
	});

	notepad.lineHeight.on('change', function (e) {
		const lineHeightSelected = this.value;

		notepad.note.css('line-height', lineHeightSelected + 'px');
		setState('userChosenLineHeight', lineHeightSelected);
	});

	notepad.fontWeight.on('change', function (e) {
		const fontWeightSelected = this.value;

		notepad.note.css('font-weight', fontWeightSelected);
		setState('userChosenFontWeight', fontWeightSelected);
	});

	notepad.writeDirection.on('change', function (e) {
		const writeDirectionSelected = this.value;

		notepad.note.css('direction', writeDirectionSelected);
		setState('userChosenWriteDirection', writeDirectionSelected);
	});

	notepad.showWordCountPill.on('change', function (e) {
		const showWordCountPillSelected = this.value;

		showWordCountPillSelected === 'Yes' ? notepad.wordCountContainer.show() : notepad.wordCountContainer.hide();
		setState('userChosenWordCountPillSelected', showWordCountPillSelected);
	});

	notepad.optimalLineLength.on('change', function (e) {
		const optimalLineLengthSelected = this.value;

		const textArea = document.getElementById('note');

		if (optimalLineLengthSelected === 'Yes') {
			textArea.style.padding = optimalLineLengthPadding;
		} else {
			textArea.style.padding = editorConfig.defaultOptimalLineLengthPadding;
		}

		setState('userChosenOptimalLineLengthSelected', optimalLineLengthSelected);
	})

	notepad.resetPreferences.click(function () {
		if (selector().state.userChosenFontSize) {	
			removeState('userChosenFontSize');
			resetFontSize(editorConfig.defaultFontSize);
		}
			
		if (selector().state.userChosenLineHeight) {
			removeState('userChosenLineHeight');
			resetLineHeight(editorConfig.defaultLineHeight);
		}

		if (selector().state.userChosenFontWeight) {
			removeState('userChosenFontWeight');
			resetFontWeight(editorConfig.defaultFontWeight);
		}

		if (selector().state.userChosenWordCountPillSelected) {
			removeState('userChosenWordCountPillSelected');
			resetShowWordCountPill(editorConfig.defaultShowWordCountPill);
		}

		if (selector().state.userChosenWriteDirection) {
			removeState('userChosenWriteDirection');
			resetWriteDirection(editorConfig.defaultWriteDirection);
		}

		if (selector().state.userChosenOptimalLineLengthSelected) {
			removeState('userChosenOptimalLineLengthSelected');
			resetOptimalLineLength(editorConfig.defaultOptimalLineLengthPadding, editorConfig.defaultOptimalLineLength);
		}
	});

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches: isSystemDarkModeEnabled }) => {
		// To override device's theme preference
		// if user sets theme manually in the app
		if (state.isUserPreferredTheme === 'true') {
			return;
		}

		isSystemDarkModeEnabled
			? enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
			: enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
	});

	// This sets the application's theme based on
	// the device's theme preference when it loads
	if (!state.isUserPreferredTheme || state.isUserPreferredTheme === 'false') {
		window.matchMedia('(prefers-color-scheme: dark)').matches
			? enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
			: enableLightMode(darkmodeText, lightMetaColor, metaThemeColor);
	} 

	// This hides the install app button 
	// if the app is already installed
	if (getPWADisplayMode() === 'standalone') {
		notepad.installApp.hide();
	}

	window.matchMedia('(display-mode: standalone)').addEventListener('change', ({ matches }) => {
		if (matches) {
			notepad.installApp.hide();
		} else {
			notepad.installApp.show();
		}
	});

	// This listens for keyboard shortcuts
	document.onkeydown = function (event) {
		event = event || window.event;

		if (event.key === 'Escape') {
			$('.modal').modal('hide');
		} 
		
		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
			saveTextAsFile(note.value, getFileName());
			event.preventDefault();
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'Comma') {
			event.preventDefault();

			if (notepad.preferencesModal.hasClass('in'))
				return;

			$('.modal').modal('hide');
			notepad.preferencesModal.modal('show');
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
			event.preventDefault();

			if (notepad.keyboardShortcutsModal.hasClass('in'))
				return;

			$('.modal').modal('hide');
			notepad.keyboardShortcutsModal.modal('show');
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyM') {
			event.preventDefault();
			toggleTheme(themeConfig);
		}

		if (event.altKey && event.code === 'KeyC') {
			event.preventDefault();
			copyNotesToClipboard(notepad.note.val());
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'Delete') {
			event.preventDefault();
			deleteNotes();
		}

		if (event.altKey && event.code === 'KeyF') {
			event.preventDefault();

			toggleFocusMode(notepad);
		}
	};

	// Dictation of the notes using voice recognition
	if (SpeechRecognition) {
		const recognition = new SpeechRecognition();

		// Set recognition settings
		recognition.continuous = true; // Keep recognizing until stopped
		recognition.interimResults = true; // Show partial results
		recognition.lang = 'en-US'; // Set language

		const startButton = document.getElementById('mic');
		const transcriptTextarea = document.getElementById('note');
		let finalTranscript = '';  // To store the final results

		// Track the last known cursor position
		let cursorPosition = 0;

		// Update cursor position whenever the textarea is clicked or typed into
		transcriptTextarea.addEventListener('click', () => {
			cursorPosition = transcriptTextarea.selectionStart;
		});

		transcriptTextarea.addEventListener('keyup', () => {
			cursorPosition = transcriptTextarea.selectionStart;
		});

		startButton.addEventListener('click', () => {
			transcriptTextarea.focus();
			if (startButton.classList.contains('mic-active')) {
				recognition.stop();  // Stop listening
			} else {
				recognition.start(); // Start listening
			}
		});

		// Show mic as active when speech recognition starts
		recognition.onstart = () => {
			startButton.classList.add('mic-active');
		};

		// Stop showing active mic when recognition stops
		recognition.onend = () => {
			startButton.classList.remove('mic-active');
		};

		// Handle the result event to capture speech
		recognition.onresult = (event) => {
			let interimTranscript = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				const transcriptText = event.results[i][0].transcript;
				if (event.results[i].isFinal) {
					insertAtCursor(transcriptTextarea, transcriptText + ' ');
				} else {
					interimTranscript += transcriptText;
				}
			}
			
			// updating the persistent textarea value
			const characterAndWordCountText = calculateCharactersAndWords(transcriptTextarea.value);
			notepad.wordCount.text(characterAndWordCountText);
			setState('note', transcriptTextarea.value);
		};

		// Function to insert text at the cursor position in the textarea
		function insertAtCursor(textarea, text) {
			const startPos = textarea.selectionStart;
			const endPos = textarea.selectionEnd;
			const textValue = textarea.value;
			
			// Insert text at the cursor position
			textarea.value = textValue.substring(0, startPos) + text + textValue.substring(endPos, textValue.length);
			
			// Move the cursor after the inserted text
			cursorPosition = startPos + text.length;
			textarea.setSelectionRange(cursorPosition, cursorPosition);

			const characterAndWordCountText = calculateCharactersAndWords(textarea.value);
			notepad.wordCount.text(characterAndWordCountText);
			setState('note', textarea.value);
		}

		// Handle any errors
		recognition.onerror = (event) => {
			console.error('Speech recognition error:', event.error);
		};
	} else {
		console.log("Speech Recognition API is not supported in this browser.");
	}
});

document.addEventListener("fullscreenchange", function () {
	if (!document.fullscreenElement) {
		$('#arrowPointsIn').hide();
		$('#arrowPointsOut').show();
	}
});

// Registering ServiceWorker
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js').then(function (registration) {
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}).catch(function (err) {
		console.log('ServiceWorker registration failed: ', err);
	});
}

let deferredPrompt;
let installSource;

window.addEventListener('beforeinstallprompt', (e) => {
	selector().notepad.installAppButtonContainer.show();
	deferredPrompt = e;
	installSource = 'nativeInstallCard';

	e.userChoice.then(function (choiceResult) {
		if (choiceResult.outcome === 'accepted') {
			deferredPrompt = null;
		}

		ga('send', {
			hitType: 'event',
			eventCategory: 'pwa-install',
			eventAction: 'native-installation-card-prompted',
			eventLabel: installSource,
			eventValue: choiceResult.outcome === 'accepted' ? 1 : 0
		});
	});
});

const installApp = document.getElementById('installApp');

installApp.addEventListener('click', async () => {
	installSource = 'customInstallationButton';

	if (deferredPrompt !== null) {
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
		}

		ga('send', {
			hitType: 'event',
			eventCategory: 'pwa-install',
			eventAction: 'custom-installation-button-clicked',
			eventLabel: installSource,
			eventValue: outcome === 'accepted' ? 1 : 0
		});
	} else {
		showToast('Notepad is already installed.')
	}
});

window.addEventListener('appinstalled', () => {
	deferredPrompt = null;

	const source = installSource || 'browser';

	ga('send', 'event', 'pwa-install', 'installed', source);
});