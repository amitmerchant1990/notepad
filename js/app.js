$(document).ready(function(){
  $('#note').on('keyup', function(){
    console.log($(this).val());
    localStorage.setItem("note", $(this).val());
  })
});
