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

	if (localStorage.getItem('note') && localStorage.getItem('note') != '') {
		const noteItem = localStorage.getItem('note');

		const characterAndWordCountText = calculateCharactersAndWords(noteItem);

		$('#wordCount').text(characterAndWordCountText);

		$('#note').val(noteItem);
	} else {
		const characterAndWordCountText = calculateCharactersAndWords(welcomeText);

		$('#wordCount').text(characterAndWordCountText);

		$('#note').val(welcomeText);
	}

	if (!localStorage.getItem('isUserPreferredTheme')) {
		localStorage.setItem('isUserPreferredTheme', 'false');
	}

	if (localStorage.getItem('userChosenFontSize')) {
		$('#note').css('font-size', localStorage.getItem('userChosenFontSize') + "px");
		$('#fontSize').val(localStorage.getItem('userChosenFontSize'));
	} else {
		resetFontSize(defaultFontSize);
	}

	if (localStorage.getItem('userChosenFontWeight')) {
		$('#note').css('font-weight', localStorage.getItem('userChosenFontWeight'));
		$('#fontWeight').val(localStorage.getItem('userChosenFontWeight'));
	} else {
		resetFontWeight(defaultFontWeight);
	}

	if (localStorage.getItem('userChosenLineHeight')) {
		$('#note').css('line-height', localStorage.getItem('userChosenLineHeight') + "px");
		$('#lineHeight').val(localStorage.getItem('userChosenLineHeight'));
	} else {
		resetLineHeight(defaultLineHeight);
	}

	const userChosenWordCountPillSelected = localStorage.getItem('userChosenWordCountPillSelected')

	if (userChosenWordCountPillSelected) {
		userChosenWordCountPillSelected === 'Yes' ? $('.word-count-container').show() : $('.word-count-container').hide();
		$('#showWordCountPill').val(localStorage.getItem('userChosenWordCountPillSelected'));
	} else {
		resetShowWordCountPill(defaultShowWordCountPill);
	}

	if (localStorage.getItem('mode') && localStorage.getItem('mode') !== '') {
		if (localStorage.getItem('mode') === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	$('#note').keyup(debounce(function () {
		const characterAndWordCountText = calculateCharactersAndWords($(this).val());

		$('#wordCount').text(characterAndWordCountText);
			
		localStorage.setItem('note', $(this).val());
	}, 500));

	$('#note').keydown(function (e) {
		if (e.key == 'Tab') {
			e.preventDefault();
			let start = this.selectionStart;
			let end = this.selectionEnd;	  
			this.value = this.value.substring(0, start) +
				'\t' + this.value.substring(end);
			this.selectionStart =
				this.selectionEnd = start + 1;
		}
	});
	
	$('#clearNotes').on('click', function () {
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
				$('#note').val('').focus();
				localStorage.setItem('note', '');

				Swal.fire(
					'Deleted!',
					'Your notes has been deleted.',
					'success'
				)
			}
		})
	});

	$('#mode').click(function () {
		$(document.body).toggleClass('dark');
		let bodyClass = $(document.body).attr('class');

		if (bodyClass === 'dark') {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}

		localStorage.setItem('isUserPreferredTheme', 'true');
	});

	$('#copyToClipboard').click(function () {
		navigator.clipboard.writeText($('#note').val()).then(function () {
			showToast('Notes copied to clipboard!')
		}, function () {
			showToast('Failure to copy. Check permissions for clipboard.')
		});
	})

	$('#downloadNotes').click(function () {
		saveTextAsFile(note.value, getFileName());
	})

	setTimeout(function () {
		if (!localStorage.getItem('hasUserDismissedDonationPopup')) {
			$('.sticky-notice').toggleClass('make-hidden');
		}
	}, 30000);

	$('#closeDonationPopup').click(function () {
		$('.sticky-notice').remove();
		localStorage.setItem('hasUserDismissedDonationPopup', 'true');
	});

	$('#fontSize').on('change', function (e) {
		const fontSizeSelected = this.value;

		$('#note').css('font-size', fontSizeSelected + "px");
		localStorage.setItem('userChosenFontSize', fontSizeSelected);
	});

	$('#lineHeight').on('change', function (e) {
		const lineHeightSelected = this.value;

		$('#note').css('line-height', lineHeightSelected + "px");
		localStorage.setItem('userChosenLineHeight', lineHeightSelected);
	});

	$('#fontWeight').on('change', function (e) {
		const fontWeightSelected = this.value;

		$('#note').css('font-weight', fontWeightSelected);
		localStorage.setItem('userChosenFontWeight', fontWeightSelected);
	});

	$('#showWordCountPill').on('change', function (e) {
		const showWordCountPillSelected = this.value;

		showWordCountPillSelected === 'Yes' ? $('.word-count-container').show() : $('.word-count-container').hide();
		localStorage.setItem('userChosenWordCountPillSelected', showWordCountPillSelected);
	});

	$('#resetPreferences').click(function () {
		if (localStorage.getItem('userChosenFontSize')) {	
			localStorage.removeItem('userChosenFontSize');
			resetFontSize(defaultFontSize);
		}
			
		if (localStorage.getItem('userChosenLineHeight')) {
			localStorage.removeItem('userChosenLineHeight');
			resetLineHeight(defaultLineHeight);
		}

		if (localStorage.getItem('userChosenFontWeight')) {
			localStorage.removeItem('userChosenFontWeight');
			resetFontWeight(defaultFontWeight);
		}

		if (localStorage.getItem('userChosenWordCountPillSelected')) {
			localStorage.removeItem('userChosenWordCountPillSelected');
			resetShowWordCountPill(defaultShowWordCountPill);
		}
	});

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
		// To override device's theme preference
		// if user sets theme manually in the app
		if (localStorage.getItem('isUserPreferredTheme') === 'true') {
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
	if (localStorage.getItem('isUserPreferredTheme') === 'false') {
		if (
			window.matchMedia('(prefers-color-scheme: dark)').matches
		) {
			enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
		} else {
			enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
		}
	}

	if (getPWADisplayMode() === 'standalone') {
		$('#installApp').hide();
	}

	window.matchMedia('(display-mode: standalone)').addEventListener('change', ({ matches }) => {
		if (matches) {
			$('#installApp').hide();
		} else {
			$('#installApp').show();
		}
	});

	document.onkeydown = function (event) {
		event = event || window.event;

		if (event.key === 'Escape') {
			$('#aboutModal').modal('hide');
			$('#preferencesModal').modal('hide');
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
	$('.install-app-btn-container').show();
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