$(document).ready(function () {
	const toastLinks = [
		{
			text: "Support Notepad's sustainable development — Buy me a coffee! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "I work on this app in my spare time. Buy me a coffee for your support!",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "🎉 Happy New Year! If this app made your year a little easier, you can buy me a coffee ☕️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "This app is intentionally kept ad-free. If you appreciate that, buy me a coffee. Thank you! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "I strive to craft this app to perfection. If you admire the effort, consider buying me a coffee!",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "Thank you for using this app. If you’d like to support the development, buy me a coffee.",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "If you enjoy using this app, consider buying me a coffee to support it! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: true
		},
		{
			text: "Your support keeps this app going — leave a tip if you can! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "Love the ad-free experience? Buy me a coffee to keep it that way!",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "I hate ads on my Notepad. If you feel the same, consider buying me a coffee! ❤️",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "Send anonymous feature suggestions",
			url: "https://docs.google.com/forms/d/1NuSl4FzUXRR6maOaGNfUmBdNJ-l9neBzzp_JwDm3xZI",
			active: false
		},
		{
			text: "We rely on the supporters like you to keep Notepad thriving!",
			url: "https://buymeacoffee.com/amitmerchant",
			active: false
		},
		{
			text: "🚀 New tool → Case Converter",
			url: "/case-converter",
			active: false
		},
		{
			isFeature: true,
			isActive: true,
			text: "New → Mimic typewriter sound when typing. Enable it from the Preferences popup.",
			url: "#preferencesModal",
			dataTarget: "#preferencesModal",
			active: false
		}
	];

	// Function to show a random link
	function showRandomToastLink() {
		const activeLinks = toastLinks.filter(link => link.active);
		const randomIndex = Math.floor(Math.random() * activeLinks.length);
		const link = activeLinks[randomIndex];

		if (!link) {
			return;
		}

		$('#toastText').text(link.text);
		$('#toastLink').attr('href', link.url);
		$('#toastPopup').addClass('show');

		if (link.isFeature && link.isActive) {
			$('#toastLink').attr('data-target', link.dataTarget);
			$('#toastLink').attr('data-toggle', 'modal');
			$('#toastLink').removeAttr('target');
		}
	}

	// Function to close toast with animation
	function closeToastPopup() {
		const $toast = $('#toastPopup');
		$toast.addClass('hide');
		setTimeout(function () {
			$toast.removeClass('show hide');
		}, 500);
	}

	// Close toast popup
	$('#closeToastPopup').on('click', function () {
		closeToastPopup();
	});
	
	// Close toast popup when link is clicked
	$('#toastLink').on('click', function () {
		closeToastPopup();
	});
	
	// Show toast popup after a delay
	setTimeout(showRandomToastLink, 5000);
	
	// Setup coffee icon hover animation
	setupCoffeeIconAnimation();

	const welcomeText = `Welcome! This is an offline-capable Notepad which is a Progressive Web App.

The app serves the following features:

- Your notes are saved in real-time as you type.
- Installable on supported browsers for offline usage.
- "Add To Home Screen" feature on Android-supported devices to launch the app from the home screen.
- Dark mode.
- Privacy-focused - Never collects your precious data.
- Light-weight - Loads almost instantly.
- Writing timer.
- View Note Statistics.
- Snapshots.
- Ability to mimic typewriter sound when typing.
- Keyboard shortcuts for common actions.
- Focus mode to leave you with a barebones and pristine editor.
- Full-screen mode for a distraction-free writing experience.
- Floating window (in supported browsers) to effectively take notes across other apps.
- Download notes as plain text, PDF, HTML, and DOCX file.
- Ability to play ambient noise to help you focus.
- It's proudly open-source!

CAUTION: Since the app uses the browser's localStorage to store your notes, 
it's recommended that you take a backup of your notes more often using the 
"Download Notes" button or by pressing the "Ctrl/Cmd + S" keys.

Lastly, if you're using Notepad, and want to support the development, 
you can buy me a coffee — the link of which is available in the About section.

** Delete this text and start writing your notes **`;

	const darkmodeText = 'Enable dark mode [Ctrl/Cmd + M]';
	const lightmodeText = 'Enable light mode [Ctrl/Cmd + M]';
	const darkMetaColor = '#0d1117';
	const lightMetaColor = '#4d4d4d';
	const metaThemeColor = document.querySelector('meta[name=theme-color]');
	const { notepad, state, setState, removeState, get } = selector();
	const optimalLineLengthPadding = '15px 15vw 40px';

	const editorConfig = selector().defaultConfig;

	const themeConfig = {
		lightmodeText,
		darkmodeText,
		lightMetaColor,
		darkMetaColor,
		metaThemeColor
	};

	const noteItem = state.note && state.note != '' ? state.note : welcomeText;
	const characterAndWordCountText = calculateCharactersAndWords(noteItem);

	let typewriterSoundEnabled;
	const typeSound = new Audio('/sounds/typewriter/typewriter-key-press-02.mp3');
	const carriageReturnSound = new Audio('/sounds/typewriter/typewriter-carriage-return-01.mp3');
	const spacebarSound = new Audio('/sounds/typewriter/space.mp3');

	typeSound.volume = 0.2; // keep it subtle
	const userChosenTypewriterSound = state.userChosenTypewriterSound;
	const userChosenTypewriterVolume = state.userChosenTypewriterVolume;

	// Initialize typewriter sound preference
	if (!userChosenTypewriterSound) {
		typewriterSoundEnabled = editorConfig.defaultTypewriterSound;
		$('#typewriterSound').prop('checked', typewriterSoundEnabled);
	} else {
		typewriterSoundEnabled = userChosenTypewriterSound == 'Yes';
		$('#typewriterSound').prop('checked', typewriterSoundEnabled);
	}

	if (typewriterSoundEnabled) {
		$('.typewriter-switch-volume').show();
	} else {
		$('.typewriter-switch-volume').hide();
	}

	if (!userChosenTypewriterVolume) {
		$('#typewriterVolume').val(editorConfig.defaultTypewriterVolume);
		$('#typewriterVolumeValue').text(editorConfig.defaultTypewriterVolume + '%');
	}else {
		$('#typewriterVolume').val(userChosenTypewriterVolume);
		$('#typewriterVolumeValue').text(userChosenTypewriterVolume + '%');
	}
	
	function playTypeSound() {
		if (!typewriterSoundEnabled) return;
		
		// Clone so rapid typing doesn't cut the previous sound
		const s = typeSound.cloneNode();

		// Add random pitch for realism (±5% variation)
		s.playbackRate = 0.95 + Math.random() * 0.1;
		const currentVolume = localStorage.getItem('userChosenTypewriterVolume');
		s.volume = currentVolume ? (currentVolume / 100) : (editorConfig.defaultTypewriterVolume / 100);
		s.play();
	}

	notepad.note.on('keydown', (e) => {
		if (e.key === 'Enter') {
			if (typewriterSoundEnabled) {
				const s = carriageReturnSound.cloneNode();
				const currentVolume = localStorage.getItem('userChosenTypewriterVolume');
				s.volume = currentVolume ? (currentVolume / 100) : (editorConfig.defaultTypewriterVolume / 100);
				s.play();
			}

			return;
		} else if (e.key === ' ') {
			if (typewriterSoundEnabled) {
				const s = spacebarSound.cloneNode();
				const currentVolume = localStorage.getItem('userChosenTypewriterVolume');
				s.volume = currentVolume ? (currentVolume / 100) : (editorConfig.defaultTypewriterVolume / 100);
				s.play();
			}

			return;
		}

		const isPrintable = (
			// Single character keys (letters, numbers, symbols)
			e.key.length === 1 || 
			// Common editing keys
			[
				'Delete', 'Backspace', 'Enter', ' ', 'Space', 
				'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
				'Home', 'End', 'PageUp', 'PageDown'
			].includes(e.key) ||
			// Mobile-specific keys and special cases
			e.key === 'Unidentified' ||  // Some mobile keyboards
			e.key === 'Process' ||       // Some IME inputs
			e.key === 'Dead' ||          // Dead keys (for accents)
			e.key === 'Compose'          // Compose key
		);

		if (isPrintable) {
			playTypeSound();
		}
	});

	// Handle typewriter sound toggle
	$('#typewriterSound').on('change', function() {
		const isEnabled = $(this).is(':checked');
		localStorage.setItem('userChosenTypewriterSound', isEnabled ? 'Yes' : 'No');
		typewriterSoundEnabled = isEnabled;

		if (isEnabled) {
			$('.typewriter-switch-volume').show();
		} else {
			$('.typewriter-switch-volume').hide();
		}
	});

	// Handle typewriter volume change
	let volumePreviewTimer = null;
	$('#typewriterVolume').on('input', function() {
		const volume = $(this).val();
		localStorage.setItem('userChosenTypewriterVolume', volume);

		if (typewriterSoundEnabled) {
			typeSound.volume = volume / 100;
			carriageReturnSound.volume = volume / 100;
			$('#typewriterVolumeValue').text(volume + '%');
		}

		// Clear previous preview timer
		clearTimeout(volumePreviewTimer);

		// Set new preview timer (user stopped sliding for 500ms)
		volumePreviewTimer = setTimeout(() => {
			playTypeSound();
		}, 500);
	});

	notepad.wordCount.text(characterAndWordCountText);
	notepad.note.val(noteItem);

	$('[data-toggle="tooltip"]').tooltip();

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
		if (userChosenWordCountPillSelected === 'Yes') {
			notepad.wordCountContainer.show();
			notepad.frostedGlassPillPref.show();
		} else {
			notepad.wordCountContainer.hide();
			notepad.frostedGlassPillPref.hide();
		}
		notepad.showWordCountPill.prop('checked', userChosenWordCountPillSelected === 'Yes');
	} else {
		notepad.wordCountContainer.show();
		notepad.frostedGlassPillPref.show();
		notepad.showWordCountPill.prop('checked', true);
	}

	const userChosenTransparentWordCountPillSelected = state.userChosenTransparentWordCountPillSelected;

	if (userChosenTransparentWordCountPillSelected) {
		userChosenTransparentWordCountPillSelected === 'Yes' ? notepad.wordCountContainer.addClass('transparency') : notepad.wordCountContainer.removeClass('transparency');
		notepad.transparentWordCountPill.prop('checked', userChosenTransparentWordCountPillSelected === 'Yes');
	} else {
		notepad.wordCountContainer.removeClass('transparency');
		notepad.transparentWordCountPill.prop('checked', false);
	}

	if (state.userChosenWriteDirection) {
		notepad.note.css('direction', state.userChosenWriteDirection);
		notepad.writeDirection.val(state.userChosenWriteDirection);
	} else {
		resetWriteDirection(editorConfig.defaultWriteDirection);
	}

	if (state.userChosenTexture) {
		if (state.userChosenTexture == 'dotted') {
			$(document.body).addClass('dotted-paper');
		} else if (state.userChosenTexture == 'graph') {
			$(document.body).addClass('graph-paper');
		}

		notepad.texture.val(state.userChosenTexture);
	}

	if (state.userChosenOptimalLineLengthSelected) {
		const textArea = document.getElementById('note');

		if (state.userChosenOptimalLineLengthSelected === 'Yes') {
			textArea.style.padding = optimalLineLengthPadding;
		} else {
			textArea.style.padding = editorConfig.defaultOptimalLineLengthPadding;
		}

		notepad.optimalLineLength.prop('checked', state.userChosenOptimalLineLengthSelected === 'Yes');
	} else {
		notepad.optimalLineLength.prop('checked', false);
	}

	if (state.userChosenSpellCheck) {
		if (state.userChosenSpellCheck === 'Yes') {
			notepad.note.attr('spellcheck', true);
		} else {
			notepad.note.attr('spellcheck', false);
		}

		notepad.spellCheck.prop('checked', state.userChosenSpellCheck === 'Yes');
	} else {
		notepad.spellCheck.prop('checked', true);
	}

	if (state.userChosenTabIndentation) {
		notepad.tabIndentation.prop('checked', state.userChosenTabIndentation === 'Yes');
	} else {
		notepad.tabIndentation.prop('checked', false);
	}

	if (state.mode && state.mode === 'dark') {
		enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor);

		$('input[name="themes"][value="dark"]').prop('checked', true);
	} else if (state.mode && state.mode === 'light') {
		enableLightMode(darkmodeText, lightMetaColor, metaThemeColor);

		$('input[name="themes"][value="light"]').prop('checked', true);	
	} else {
		enableDeviceTheme(themeConfig);

		$('input[name="themes"][value="device"]').prop('checked', true);
	}

	const themeRadios = document.querySelectorAll('input[name="themes"]');

    themeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            switch (event.target.value) {
				case 'dark':
					enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor);
					break;
				case 'light':
					enableLightMode(darkmodeText, lightMetaColor, metaThemeColor);
					break;
				case 'device':
					enableDeviceTheme(themeConfig);
					break;
			}
        });
    });

	notepad.note.on('input', debounce(function () {
		setState('note', get(this).val());
		updateWordCountPill(get(this).val());
	}, 500));

	notepad.note.keydown(function (e) {
		const tabIndentation = notepad.tabIndentation.prop('checked');

		if (e.key === "Tab" && tabIndentation) {
			e.preventDefault(); 
	
			let textarea = e.target;
			let start = textarea.selectionStart;
			let end = textarea.selectionEnd;
			let tabCharacter = "\t";
	
			if (start === end) {
				// Single cursor position: Insert tab
				document.execCommand("insertText", false, tabCharacter);
				textarea.selectionStart = textarea.selectionEnd = start + tabCharacter.length;
			} else {
				// Multi-line selection: Add tab to each line
				let value = textarea.value;
				let selectedText = value.substring(start, end);
				let lines = selectedText.split("\n");
	
				if (e.shiftKey) {
					// Shift+Tab: Remove leading tab if present
					let unindentedLines = lines.map(line =>
						line.startsWith(tabCharacter) ? line.substring(tabCharacter.length) : line
					);
					document.execCommand("insertText", false, unindentedLines.join("\n"));
				} else {
					// Tab: Indent each line
					let indentedLines = lines.map(line => tabCharacter + line);
					document.execCommand("insertText", false, indentedLines.join("\n"));
				}
			}
		}
	});

	notepad.clearNotes.on('click', function () {
		deleteNotes();
	});

	notepad.copyToClipboard.click(function () {
		copyNotesToClipboard(notepad.note.val());
	})

	notepad.downloadNotes.click(function (e) {
		e.stopPropagation(); // Stop click event from bubbling
		$('#iconDropdown').toggleClass('show');
		$('#moreToolsDropdown').removeClass('show');
	})

	notepad.moreTools.click(function (e) {
		e.stopPropagation(); // Stop click event from bubbling
		$('#moreToolsDropdown').toggleClass('show');
		$('#iconDropdown').removeClass('show');
	})

	notepad.downloadNotesPlain.click(function (e) {
		saveTextAsFile(note.value, getFileName());
	});

	notepad.downloadNotesPdf.click(function (e) {
		exportNotesAsPDF(note.value, getPdfFileName());
	});

	notepad.downloadNotesDocx.click(function (e) {
		const textToWrite = note.value;
		const fileNameToSaveAs = getDocxFileName();

		exportNotesAsDocx(textToWrite, fileNameToSaveAs);
	});

	notepad.downloadNotesHtml.click(function (e) {
		const textToWrite = note.value;
		const fileNameToSaveAs = getHtmlFileName();

		downloadHTML(textToWrite, fileNameToSaveAs);
	});

	// Close dropdown if clicked outside
	$(document).on('click', function () {
		$('#iconDropdown').removeClass('show');
		$('#moreToolsDropdown').removeClass('show');
	});

	notepad.fullScreenButton.click(function () {
		toggleFullScreen();
	})

	notepad.focusModeButton.click(function () {
		toggleFocusMode(notepad);
	})

	notepad.focusModeCloseButton.click(function () {
		turnOffFocusMode(notepad);
	})

	// Update statistics when modal is shown
	notepad.statisticsModal.on('show.bs.modal', function () {
		const noteText = notepad.note.val();
		const stats = calculateNoteStatistics(noteText);

		$('#statWords').text(stats.words);
		$('#statCharacters').text(stats.characters);
		$('#statSentences').text(stats.sentences);
		$('#statParagraphs').text(stats.paragraphs);
		$('#statAvgWordLength').text(stats.averageWordLength);
		$('#statReadingTime').text(stats.readingTime);
		$('#statUniqueWords').text(stats.uniqueWords);
		$('#statMostCommonWord').text(stats.mostCommonWord);
	});

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

	notepad.texture.on('change', function (e) {
		const textureSelected = this.value;

		if (textureSelected == 'dotted') {
			$(document.body).addClass('dotted-paper');
			$(document.body).removeClass('graph-paper');
		} else if (textureSelected == 'graph') {
			$(document.body).addClass('graph-paper');
			$(document.body).removeClass('dotted-paper');
		} else {
			$(document.body).removeClass('dotted-paper');
			$(document.body).removeClass('graph-paper');
		}

		setState('userChosenTexture', textureSelected);
	});

	notepad.showWordCountPill.on('change', function (e) {
		if ($(this).is(':checked')) {
			notepad.wordCountContainer.show();
			notepad.frostedGlassPillPref.show();
			setState('userChosenWordCountPillSelected', 'Yes');
		} else {
			notepad.wordCountContainer.hide();
			notepad.frostedGlassPillPref.hide();
			setState('userChosenWordCountPillSelected', 'No');
		}
	});

	notepad.transparentWordCountPill.on('change', function (e) {
		if ($(this).is(':checked')) {
			notepad.wordCountContainer.addClass('transparency');
			setState('userChosenTransparentWordCountPillSelected', 'Yes');
		} else {
			notepad.wordCountContainer.removeClass('transparency');
			setState('userChosenTransparentWordCountPillSelected', 'No');
		}
	});

	notepad.optimalLineLength.on('change', function (e) {
		const textArea = document.getElementById('note');

		if ($(this).is(':checked')) {
			textArea.style.padding = optimalLineLengthPadding;
			setState('userChosenOptimalLineLengthSelected', 'Yes');
		} else {
			textArea.style.padding = editorConfig.defaultOptimalLineLengthPadding;
			setState('userChosenOptimalLineLengthSelected', 'No');
		}
	})

	notepad.spellCheck.on('change', function (e) {
		if ($(this).is(':checked')) {
			notepad.note.attr('spellcheck', true);
			setState('userChosenSpellCheck', 'Yes');
		} else {
			notepad.note.attr('spellcheck', false);
			setState('userChosenSpellCheck', 'No');
		}
	})

	notepad.tabIndentation.on('change', function (e) {
		if ($(this).is(':checked')) {
			setState('userChosenTabIndentation', 'Yes');
		} else {
			setState('userChosenTabIndentation', 'No');
		}
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

		if (selector().state.userChosenTexture) {
			removeState('userChosenTexture');
			resetTexture(editorConfig.defaultTexture);
		}

		if (selector().state.userChosenOptimalLineLengthSelected) {
			removeState('userChosenOptimalLineLengthSelected');
			resetOptimalLineLength(editorConfig.defaultOptimalLineLengthPadding, editorConfig.defaultOptimalLineLength);
		}

		if (selector().state.selectedFont) {
			removeState('selectedFont');
			resetFont(editorConfig.defaultFont);
		}

		if (selector().state.userChosenSpellCheck) {
			removeState('userChosenSpellCheck');
			notepad.note.attr('spellcheck', false);
			notepad.spellCheck.prop('checked', editorConfig.defaultSpellCheck);
		}

		if (selector().state.userChosenTabIndentation) {
			removeState('userChosenTabIndentation');
			notepad.tabIndentation.prop('checked', editorConfig.defaultTabIndentation);
		}

		if (selector().state.userChosenTransparentWordCountPillSelected) {
			removeState('userChosenTransparentWordCountPillSelected');
			notepad.wordCountContainer.removeClass('transparency')
			notepad.transparentWordCountPill.prop('checked', editorConfig.defaultTransparentWordCountPillSelected);
		}

		if (selector().state.userChosenTypewriterSound) {
			removeState('userChosenTypewriterSound');
			typewriterSoundEnabled = editorConfig.defaultTypewriterSound;
			$('#typewriterSound').prop('checked', typewriterSoundEnabled);
			$('.typewriter-switch-volume').hide();
		}

		if (selector().state.userChosenTypewriterVolume) {
			removeState('userChosenTypewriterVolume');
			$('#typewriterVolume').val(editorConfig.defaultTypewriterVolume);
			$('#typewriterVolumeValue').text(editorConfig.defaultTypewriterVolume + '%');
		}

		// Reset to device theme as default
		$('input[name="themes"][value="device"]').prop('checked', true);
		enableDeviceTheme(themeConfig);
	});

	if (navigator.share && window.self === window.top) {
		$('#shareNotesContainer').show();
	}

	notepad.shareNotes.click(function (e) {
		e.stopPropagation();
		const textToShare = note.value;
		shareNotes(textToShare);
	});

	const pipButton = document.getElementById('pip');

	// Only show the Picture-in-Picture 
	// button if the browser supports it
	if ('documentPictureInPicture' in window) {
		$('#pipContainer').show();

		pipButton.addEventListener('click', async () => {
			const appTextarea = document.getElementById("textareaContainer");

			// Open a Picture-in-Picture window.
			const pipWindow = await documentPictureInPicture.requestWindow({
				width: 350,
				height: 500,
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

			// Move the textarea to the Picture-in-Picture window.
			pipWindow.document.body.append(appTextarea);

			// Move the textarea back when the Picture-in-Picture window closes.
			pipWindow.addEventListener("pagehide", (event) => {
				const mainContainer = document.querySelector("#mainContainer");
				const textareaContainer = event.target.querySelector("#textareaContainer");
				const overlay = document.querySelector(".overlay");
				mainContainer.append(textareaContainer);
				mainContainer.classList.remove("pip");

				overlay.style.display = "none";
				overlay.style.pointerEvents = "none";

				textareaContainer.classList.remove("dark");
			});
		});

		documentPictureInPicture.addEventListener("enter", (event) => {
			const playerContainer = document.querySelector("#mainContainer");
			const textareaContainer = document.querySelector("#textareaContainer");
			const overlay = document.querySelector(".overlay");

			playerContainer.classList.add("pip");
			overlay.style.display = "block";
			overlay.style.pointerEvents = "all";
			
			// Stop the writing timer 
			// if it is running (js/timer.js)
			if (timerConfig.timer) {
				stopTimer();
			}

			if (localStorage.getItem('mode') && localStorage.getItem('mode') == 'dark') {
				textareaContainer.classList.add("dark");
			}

			if (localStorage.getItem('mode') && localStorage.getItem('mode') == 'device' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				textareaContainer.classList.add("dark");
			}
		});
	}

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (state.mode && state.mode === 'device') {
			enableDeviceTheme(themeConfig);
		}
	});

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
			$('#iconDropdown').removeClass('show');
			$('#moreToolsDropdown').removeClass('show');
			turnOffFocusMode(notepad);
		}

		if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
			saveTextAsFile(note.value, getFileName());
			event.preventDefault();
		}

		if (event.altKey && event.code === 'KeyS') {
			exportNotesAsPDF(note.value, getPdfFileName());
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

	// Font selection handler
	const fontSelect = document.getElementById('font');
	
	// Check for legacy font preferences and migrate them to the new system
	function migrateLegacyFontPrefs() {
		const dyslexicFont = localStorage.getItem('dyslexicFont') === 'true';
		const monospacedFont = localStorage.getItem('monospaced') === 'true';
		const serifFont = localStorage.getItem('serifFont') === 'true';
		
		if (dyslexicFont) {
			localStorage.setItem('selectedFont', 'dyslexic');
		} else if (monospacedFont) {
			localStorage.setItem('selectedFont', 'monospaced');
		} else if (serifFont) {
			localStorage.setItem('selectedFont', 'serif');
		} else {
			localStorage.setItem('selectedFont', 'default');
		}
		
		// Clear old preferences
		localStorage.removeItem('dyslexicFont');
		localStorage.removeItem('monospaced');
		localStorage.removeItem('serifFont');
	}
	
	// Apply font based on selection
	function applyFont(fontType) {
		// Remove all font classes first
		notepad.note.removeClass('dyslexic monospaced serif');
		
		// Add the selected font class
		switch(fontType) {
			case 'dyslexic':
				notepad.note.addClass('dyslexic');
				break;
			case 'monospaced':
				notepad.note.addClass('monospaced');
				break;
			case 'serif':
				notepad.note.addClass('serif');
				break;
			// 'default' case doesn't need any class
		}
	}
	
	// Initialize font selection
	function initFontSelection() {
		// Migrate legacy preferences if needed
		if (localStorage.getItem('dyslexicFont') !== null || 
			localStorage.getItem('monospaced') !== null || 
			localStorage.getItem('serifFont') !== null) {
			migrateLegacyFontPrefs();
		}
		
		// Get the selected font or default to 'default'
		const selectedFont = localStorage.getItem('selectedFont') || 'default';
		
		// Set the dropdown value
		fontSelect.value = selectedFont;
		
		// Apply the font
		applyFont(selectedFont);
	}
	
	// Handle font selection change
	fontSelect.addEventListener('change', (e) => {
		const selectedFont = e.target.value;
		localStorage.setItem('selectedFont', selectedFont);
		applyFont(selectedFont);
	});
	
	// Initialize font selection on page load
	initFontSelection();
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