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
}

var showToolBar = function () {
  if(document.getElementById("toolbarArea").style.display == "flex"){
    document.getElementById("angleToolBar").className = "";
    document.getElementById("angleToolBar").className = "fa fa-angle-double-right";
    document.getElementById("toolbarArea").style.display = "none";
    document.getElementById("editArea").style.paddingTop = "63px";
  }else{
    document.getElementById("angleToolBar").className = "";
    document.getElementById("angleToolBar").className = "fa fa-angle-double-down";
    document.getElementById("toolbarArea").style.display = "flex";
    document.getElementById("editArea").style.paddingTop = "92px";
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
