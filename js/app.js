$(document).ready(function(){
  $('#note').bind('input propertychange', function(){
    localStorage.setItem("note", $(this).val());
  });

  if(localStorage.getItem("note") && localStorage.getItem("note")!=''){
    var noteItem = localStorage.getItem("note")
    $('#note').val(noteItem);
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(function(registration) {
    // Registration was successful
    console.log('ServiceWorker registration successful with scope: ',    registration.scope);
  }).catch(function(err) {
    // registration failed :(
    console.log('ServiceWorker registration failed: ', err);
  });
}
