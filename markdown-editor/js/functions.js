var clkPref = function (opt) {
  currentValue = opt.value;
  if ( currentValue=='preview' ) {
    document.getElementById("htmlPreview").style.display = "none";
    document.getElementById("markdown").style.display = "block";
  } else if ( currentValue=='html' ) {
    document.getElementById("markdown").style.display = "none";
    document.getElementById("htmlPreview").style.display = "block";
  }
}

var changeTheme = function (opt) {
  currentValueTheme = opt.value;
  if ( currentValueTheme=='light' ) {
    cm.setOption("theme", "default");
    document.body.className = "";
  } else if ( currentValueTheme=='dark' ) {
    cm.setOption("theme", "base16-dark");
    document.body.className = "dark";
  }
  // Save theme preference to localStorage
  localStorage.setItem('theme', currentValueTheme);
  updateThemeToggle(currentValueTheme);
}

var updateThemeToggle = function (theme) {
  var toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  if (theme == 'dark') {
    toggle.innerHTML = '<span class="theme-toggle-icon theme-toggle-icon-light" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#fff" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"></path></svg></span>';
    toggle.setAttribute("aria-label", "Switch to light mode");
    toggle.setAttribute("title", "Switch to light mode");
  } else {
    toggle.innerHTML = '<span class="theme-toggle-icon theme-toggle-icon-dark" aria-hidden="true"><i class="fa fa-moon-o" aria-hidden="true"></i></span>';
    toggle.setAttribute("aria-label", "Switch to dark mode");
    toggle.setAttribute("title", "Switch to dark mode");
  }
}

var toggleTheme = function () {
  var nextTheme = document.body.className == "dark" ? "light" : "dark";
  changeTheme({ value: nextTheme });
}

var showToolBar = function () {
  if(document.getElementById("toolbarArea").style.display == "flex"){
    document.getElementById("angleToolBar").className = "";
    document.getElementById("angleToolBar").className = "fa fa-angle-double-right";
    document.getElementById("toolbarArea").style.display = "none";
    document.getElementById("editArea").style.paddingTop = "34px";
  }else{
    document.getElementById("angleToolBar").className = "";
    document.getElementById("angleToolBar").className = "fa fa-angle-double-down";
    document.getElementById("toolbarArea").style.display = "flex";
    document.getElementById("editArea").style.paddingTop = "66px";
  }
}

// Generations and clean state of CodeMirror
var getGeneration = function () {
  return this.cm.doc.changeGeneration();
}

var setClean = function () {
  this.latestGeneration = this.getGeneration();
}

var isClean = function () {
  return this.cm.doc.isClean(this.latestGeneration);
}
