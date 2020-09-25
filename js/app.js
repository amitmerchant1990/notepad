$(document).ready(function(){
	const welcomeText = `This is an offline-capable Notepad which is a Progressive Web App.

	The app serves the following features:

	- Write notes which then saved to the localStorage.
	- Installable on supported browsers for offline usage.
	- "Add To Home Screen" feature on Android supported devices to launch the app from the home screen.
	- Dark mode.
	- Privacy-focused - We'll never collect your precious data.
	- Light-weight - Loads almost instantly.
	- It's open-source!

	** Start writing your notes **`;
	
	const darkmodeText = 'Enable dark mode';
	const lightmodeText = 'Enable light mode';
	const darkMetaColor = '#000000';
	const lightMetaColor = '#795548';
	const metaThemeColor = document.querySelector("meta[name=theme-color]");

	if (localStorage.getItem('note') && localStorage.getItem('note') != '') {
		const noteItem = localStorage.getItem('note');
		$('#note').val(noteItem);
	} else {
		$('#note').val(welcomeText);
	}

	if (localStorage.getItem('mode') && localStorage.getItem('mode') != '') {
		if (localStorage.getItem('mode') == 'dark') {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	}

	$('#note').keyup(debounce(function() {
		localStorage.setItem('note', $(this).val());
	}, 500));

	$('#clearNotes').on('click', function() {
		Swal.fire({
			title: 'Want to delete notes?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#d33 ',
			cancelButtonColor: '#3085d6',
			confirmButtonText: 'Delete'
		}).then((result) => {
			if (result.value) {
				$('#note').val('').focus();
				localStorage.setItem("note", '');
				
				Swal.fire(
					'Deleted!',
					'Your notes has been deleted.',
					'success'
				)
			}
		})
	});

	$('#mode').click(function() {
		$(document.body).toggleClass('dark');
		let bodyClass = $(document.body).attr('class');

		if (bodyClass === 'dark') {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	});

	function enableDarkMode() {
		$(document.body).addClass('dark');
		$('.navbar').removeClass('navbar-default');
		$('#mode').html('☀️').attr('title', lightmodeText);
		metaThemeColor.setAttribute('content', darkMetaColor);
		localStorage.setItem('mode', 'dark');
	}

	function enableLightMode() {
		$(document.body).removeClass('dark');
		$('.navbar').addClass('navbar-default');
		$('#mode').html('🌙').attr('title', darkmodeText);
		metaThemeColor.setAttribute('content', lightMetaColor);
		localStorage.setItem('mode', 'light');
	}
	
	// This sets the editor's theme based 
	// on the device's theme preference
	window.matchMedia('(prefers-color-scheme: dark)').addListener(({ matches }) => {
		if (matches) {
			enableDarkMode()
		} else {
			enableLightMode()
		}
	});
});

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
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
	let textFileAsBlob = new Blob([textToWrite], {type:'text/plain'}); 
	let downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";

	if (window.webkitURL != null) {
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	} else {
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}

	downloadLink.click();
}

// Registering ServiceWorker
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('sw.js').then(function(registration) {
		// Registration was successful
		console.log('ServiceWorker registration successful with scope: ', registration.scope);
	}).catch(function(err) {
		// registration failed :(
		console.log('ServiceWorker registration failed: ', err);
	});
}
