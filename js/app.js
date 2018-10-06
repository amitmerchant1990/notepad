$(document).ready(function(){
  $('#note').keyup(debounce(function(){
    localStorage.setItem('note', $(this).val());
  },500));

  let initialText = `This is an offline-capable Notepad which is based on the ServiceWorker.

  The app serves following features:
    
    - Write notes which then saved to the localStorage.
    - Installable on supported browsers for offline usage.
    - "Add To Home Screen" feature on Android supported devices to launch the app from home screen.
    - Dark mode.
    - Privacy focused - We'll never collect your precious data.
    - Light-weight - Loads almost instantly.
  
  ** Start writing your notes **`;
  let darkmodeText = 'Enable dark mode';
  let lightmodeText = 'Enable light mode';

  if(localStorage.getItem('note') && localStorage.getItem('note')!=''){
    var noteItem = localStorage.getItem('note');
    $('#note').val(noteItem);
  } else {
    $('#note').val(initialText);
  }

  if(localStorage.getItem('mode') && localStorage.getItem('mode')!=''){
    if(localStorage.getItem('mode') == 'dark'){
      $(document.body).addClass('dark');
      $('#mode').html('☀️').attr('title', lightmodeText);
    }else{
      $(document.body).removeClass('dark');
      $('#mode').html('🌘').attr('title', darkmodeText);
    }
  }

  $('#clearNotes').on('click', function(){
    $('#note').val('').focus();
    localStorage.setItem("note", '');
  });
	
	
  $('.cookie_box_close').click(function(){
    $('.adFooter').animate({opacity:0 }, "slow");
    return false;
  });

  $('#mode').click(function(){
    $(document.body).toggleClass('dark');
    let bodyClass = $(document.body).attr('class');

    if(bodyClass == 'dark'){
      localStorage.setItem('mode', 'dark');
      $(this).html('☀️').attr('title', lightmodeText);
    } else {
      localStorage.setItem('mode', 'light');
      $(this).html('🌘').attr('title', darkmodeText);
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
};

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
