$(document).ready(function(){
	$('#note').keyup(debounce(function(){
		localStorage.setItem('note', $(this).val());
	},500));

	const initialText = `This is an offline-capable Notepad which is a Progressive Web App.

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

	if (localStorage.getItem('note') && localStorage.getItem('note')!='') {
		const noteItem = localStorage.getItem('note');
		$('#note').val(noteItem);
	} else {
		$('#note').val(initialText);
	}

	if (localStorage.getItem('mode') && localStorage.getItem('mode')!='') {
		if (localStorage.getItem('mode') == 'dark') {
			$('.navbar').removeClass('navbar-default');
			$(document.body).addClass('dark');
			$('#mode').html('☀️').attr('title', lightmodeText);
		} else {
			$('.navbar').addClass('navbar-default');
			$(document.body).removeClass('dark');
			$('#mode').html('🌙').attr('title', darkmodeText);
		}
	}

	$('#clearNotes').on('click', function(){
		Swal.fire({
			title: 'Want to delete notes?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!'
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

	$('.cookie_box_close').click(function(){
		$('.adFooter').animate({opacity:0 }, "slow");
		return false;
	});

	$('#mode').click(function(){
		$(document.body).toggleClass('dark');
		let bodyClass = $(document.body).attr('class');

		if (bodyClass == 'dark') {
			$('.navbar').removeClass('navbar-default');
			localStorage.setItem('mode', 'dark');
			$(this).html('☀️').attr('title', lightmodeText);
		} else {
			$('.navbar').addClass('navbar-default');
			localStorage.setItem('mode', 'light');
			$(this).html('🌙').attr('title', darkmodeText);
		}
	});
	
	window.matchMedia('(prefers-color-scheme: dark)').addListener(({ matches }) => {
		if (matches) {
			$(document.body).addClass('dark');
			localStorage.setItem('mode', 'dark');
		} else {
			$(document.body).removeClass('dark');
			localStorage.setItem('mode', 'light');
		}
	});

});

function debounce(func, wait, immediate) 
{
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

function saveTextAsFile(textToWrite, fileNameToSaveAs)
{
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'}); 
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
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
		console.log('ServiceWorker registration successful with scope: ',    registration.scope);
	}).catch(function(err) {
		// registration failed :(
		console.log('ServiceWorker registration failed: ', err);
	});
}
