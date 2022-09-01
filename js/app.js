$(document).ready(function () {
	const welcomeText = `This is an offline-capable Notepad which is a Progressive Web App.

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

	const darkmodeText = 'Enable dark mode';
	const lightmodeText = 'Enable light mode';
	const darkMetaColor = '#0d1117';
	const lightMetaColor = '#795548';
	const metaThemeColor = document.querySelector('meta[name=theme-color]');
	const defaultFontSize = 18;
	const defaultLineHeight = 26;
	const defaultFontWeight = 'normal';
	const defaultShowWordCountPill = 'Yes';
	const { notepad: _, state, setState, removeState, get } = selector();

	if (state.note && state.note != '') {
		const noteItem = state.note;
		const characterAndWordCountText = calculateCharactersAndWords(noteItem);
		_.wordCount.text(characterAndWordCountText);
		_.note.val(noteItem);
	} else {
		const characterAndWordCountText = calculateCharactersAndWords(welcomeText);
		_.wordCount.text(characterAndWordCountText);
		_.note.val(welcomeText);
	}

	if (!state.isUserPreferredTheme) {
		setState('isUserPreferredTheme', 'false');
	}

	if (state.userChosenFontSize) {
		_.note.css('font-size', state.userChosenFontSize + 'px');
		_.fontSize.val(state.userChosenFontSize);
	} else {
		resetFontSize(defaultFontSize);
	}

	if (state.userChosenFontWeight) {
		_.note.css('font-weight', state.userChosenFontWeight);
		_.fontWeight.val(state.userChosenFontWeight);
	} else {
		resetFontWeight(defaultFontWeight);
	}

	if (state.userChosenLineHeight) {
		_.note.css('line-height', state.userChosenLineHeight + 'px');
		_.lineHeight.val(state.userChosenLineHeight);
	} else {
		resetLineHeight(defaultLineHeight);
	}

	const userChosenWordCountPillSelected = state.userChosenWordCountPillSelected

	if (userChosenWordCountPillSelected) {
		userChosenWordCountPillSelected === 'Yes' ? _.wordCountContainer.show() : _.wordCountContainer.hide();
		_.showWordCountPill.val(userChosenWordCountPillSelected);
	} else {
		resetShowWordCountPill(defaultShowWordCountPill);
	}

	if (state.mode && state.mode !== '') {
		if (state.mode === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	_.note.keyup(debounce(function () {
		const characterAndWordCountText = calculateCharactersAndWords(get(this).val());
		_.wordCount.text(characterAndWordCountText);
		setState('note', get(this).val());
	}, 500));
	
	_.clearNotes.on('click', function () {
		Swal.fire({
			title: 'Want to delete notes?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Delete'
		}).then((result) => {
			if (result.value) {
				_.note.val('').focus();
				setState('note', '');

				Swal.fire(
					'Deleted!',
					'Your notes has been deleted.',
					'success'
				)
			}
		})
	});

	_.mode.click(function () {
		get(document.body).toggleClass('dark');
		let bodyClass = get(document.body).attr('class');

		if (bodyClass === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}

		setState('isUserPreferredTheme', 'true');
	});

	_.copyToClipboard.click(function () {
		navigator.clipboard.writeText(_.note.val()).then(function () {
			showToast('Notes copied to clipboard!')
		}, function () {
			showToast('Failure to copy. Check permissions for clipboard.')
		});
	})

	_.downloadNotes.click(function () {
		saveTextAsFile(note.value, getFileName());
	})

	setTimeout(function () {
		if (!state.hasUserDismissedDonationPopup) {
			_.stickyNotice.toggleClass('make-hidden');
		}
	}, 30000);

	_.closeDonationPopup.click(function () {
		_.stickyNotice.remove();
		setState('hasUserDismissedDonationPopup', 'true');
	});

	_.fontSize.on('change', function (e) {
		const fontSizeSelected = this.value;

		_.note.css('font-size', fontSizeSelected + 'px');
		setState('userChosenFontSize', fontSizeSelected);
	});

	_.lineHeight.on('change', function (e) {
		const lineHeightSelected = this.value;

		_.note.css('line-height', lineHeightSelected + 'px');
		setState('userChosenLineHeight', lineHeightSelected);
	});

	_.fontWeight.on('change', function (e) {
		const fontWeightSelected = this.value;

		_.note.css('font-weight', fontWeightSelected);
		setState('userChosenFontWeight', fontWeightSelected);
	});

	_.showWordCountPill.on('change', function (e) {
		const showWordCountPillSelected = this.value;

		showWordCountPillSelected === 'Yes' ? _.wordCountContainer.show() : _.wordCountContainer.hide();
		setState('userChosenWordCountPillSelected', showWordCountPillSelected);
	});

	_.resetPreferences.click(function () {
		if (state.userChosenFontSize) {	
			removeState('userChosenFontSize');
			resetFontSize(defaultFontSize);
		}
			
		if (state.userChosenLineHeight) {
			removeState('userChosenLineHeight');
			resetLineHeight(defaultLineHeight);
		}

		if (state.userChosenFontWeight) {
			removeState('userChosenFontWeight');
			resetFontWeight(defaultFontWeight);
		}

		if (state.userChosenWordCountPillSelected) {
			removeState('userChosenWordCountPillSelected');
			resetShowWordCountPill(defaultShowWordCountPill);
		}
	});

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
		// To override device's theme preference
		// if user sets theme manually in the app
		if (state.isUserPreferredTheme === 'true') {
			return;
		}

		if (matches) {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	});

	// This sets the application's theme based on
	// the device's theme preference when it loads
	if (state.isUserPreferredTheme === 'false') {
		if (
			window.matchMedia('(prefers-color-scheme: dark)').matches
		) {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	if (getPWADisplayMode() === 'standalone') {
		_.installApp.hide();
	}

	window.matchMedia('(display-mode: standalone)').addEventListener('change', ({ matches }) => {
		if (matches) {
			_.installApp.hide();
		} else {
			_.installApp.show();
		}
	});

	document.onkeydown = function (event) {
		event = event || window.event;

		if (event.key === 'Escape') {
			_.aboutModal.modal('hide');
			_.preferencesModal.modal('hide');
		} else if (event.ctrlKey && event.code === 'KeyS') {
			saveTextAsFile(note.value, getFileName());
			event.preventDefault();
		}
	};
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