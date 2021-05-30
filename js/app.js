$(document).ready(function () {
	const welcomeText = `This is an offline-capable Notepad which is a Progressive Web App.

	The app serves the following features:

	- Write notes which then saved to the localStorage.
	- Installable on supported browsers for offline usage.
	- "Add To Home Screen" feature on Android supported devices to launch the app from the home screen.
	- Dark mode.
	- Privacy-focused - We'll never collect your precious data.
	- Light-weight - Loads almost instantly.
	- It's open-source!

	CAUTION: Since the app uses the browser's localStorage to store your notes, 
	it's recommended that you take backup of your notes more often using the 
	"Download Notes" button or by pressing "Ctrl/Cmd + S" keys.

	** Start writing your notes **`;

	const darkmodeText = 'Enable dark mode';
	const lightmodeText = 'Enable light mode';
	const darkMetaColor = '#0d1117';
	const lightMetaColor = '#795548';
	const metaThemeColor = document.querySelector('meta[name=theme-color]');

	if (localStorage.getItem('note') && localStorage.getItem('note') != '') {
		const noteItem = localStorage.getItem('note');
		$('#note').val(noteItem);
	} else {
		$('#note').val(welcomeText);
	}

	if (!localStorage.getItem('isUserPreferredTheme')) {
		localStorage.setItem('isUserPreferredTheme', 'false');
	}

	if (localStorage.getItem('mode') && localStorage.getItem('mode') != '') {
		if (localStorage.getItem('mode') == 'dark') {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	}

	$('#note').keyup(debounce(function () {
		localStorage.setItem('note', $(this).val());
	}, 500));

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
			enableDarkMode()
		} else {
			enableLightMode()
		}

		localStorage.setItem('isUserPreferredTheme', 'true');
	});

	$('#copyToClipboard').click(function() {
		navigator.clipboard.writeText($('#note').val()).then(function () {
			showToast('Notes copied to clipboard!')
		}, function () {
			alert('Failure to copy. Check permissions for clipboard')
		});
	})

	$('#downloadNotes').click(function() {
		saveTextAsFile(note.value, getFileName());
	})

	function enableDarkMode() {
		$(document.body).addClass('dark');
		$('.navbar').removeClass('navbar-default');
		$('#mode').attr('title', lightmodeText);
		$('#light').show();
		$('#dark').hide();
		metaThemeColor.setAttribute('content', darkMetaColor);
		localStorage.setItem('mode', 'dark');
	}

	function enableLightMode() {
		$(document.body).removeClass('dark');
		$('.navbar').addClass('navbar-default');
		$('#mode').attr('title', darkmodeText);
		$('#light').hide();
		$('#dark').show();
		metaThemeColor.setAttribute('content', lightMetaColor);
		localStorage.setItem('mode', 'light');
	}

	// This changes the application's theme when 
	// user toggles device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
		// To override device's theme preference
		// if user sets theme manually in the app
		if (localStorage.getItem('isUserPreferredTheme') === 'true') {
			return;
		}

		if (matches) {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	});

	// This sets the application's theme based on
	// the device's theme preference when it loads
	if (localStorage.getItem('isUserPreferredTheme') === 'false') {
		if (
			window.matchMedia('(prefers-color-scheme: dark)').matches
		) {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	}

	if (getPWADisplayMode() === 'standalone') {
		$('#installApp').hide();
	}

	window.matchMedia('(display-mode: standalone)').addEventListener('change', ({matches}) => {
		if (matches) {
			$('#installApp').hide();
		} else {
			$('#installApp').show();
		}
	});

	document.onkeydown = function(evt) {
		evt = evt || window.event;
		if (evt.key == 'Escape') {
			$('#myModal').modal('hide');
		} else if (evt.ctrlKey && evt.keyCode == 'S'.charCodeAt(0)) {
			saveTextAsFile(note.value, getFileName());
			evt.preventDefault();
		}
	};

	function getFileName() {
		return 'Notes-' + getCurrentDate() + '.txt';
	}

	function getCurrentDate() {
		const currentDate = new Date();

		return currentDate.getDate() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear();
	}
});

function showToast(message) {
	let toast = document.getElementById('toast');
	toast.className = 'show';
	toast.innerHTML = message;
	setTimeout(function() { 
		toast.className = toast.className.replace('show', ''); 
	}, 2000);
}

function debounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this, args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function saveTextAsFile(textToWrite, fileNameToSaveAs) {
	let textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });
	let downloadLink = document.createElement('a');
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = 'Download File';

	if (window.webkitURL != null) {
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	} else {
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = 'none';
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

function getPWADisplayMode() {
	const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
	if (document.referrer.startsWith('android-app://')) {
		return 'twa';
	} else if (navigator.standalone || isStandalone) {
		return 'standalone';
	}
	return 'browser';
}

// Registering ServiceWorker
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js').then(function (registration) {
		// Registration was successful
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}).catch(function (err) {
		// registration failed :(
		console.log('ServiceWorker registration failed: ', err);
	});
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
	deferredPrompt = e;
	e.userChoice.then(function(choiceResult) {
		if (choiceResult.outcome === 'accepted') {
			deferredPrompt = null;
		}
	});
});

const installApp = document.getElementById('installApp');

installApp.addEventListener('click', async () => {
	if (deferredPrompt !== null) {
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			deferredPrompt = null;
		}
	} else {
		showToast('Notepad is already installed.')
	}
});