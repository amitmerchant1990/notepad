/*!
* The MIT License (MIT)
* Copyright (c) 2016 Amit Merchant <bullredeyes@gmail.com>
 */
var cm = CodeMirror.fromTextArea(document.getElementById("plainText"), {
  lineNumbers: true,
  mode: "markdown",
  viewportMargin: 100000000000,
  lineWrapping: true,
  autoCloseBrackets: true
});

window.onload = function () {
  var plainText = document.getElementById('plainText');
  var markdownArea = document.getElementById('markdown');

  const markdownText = localStorage.getItem('markdown');
  const converter = new showdown.Converter();

  if (markdownText) {
    cm.setValue(markdownText);
    
    html = converter.makeHtml(processMarkdownWithKaTeX(markdownText));
    markdownArea.innerHTML = replaceWithEmojis(html);
    document.getElementById("htmlPreview").value = html;
  }

  cm.on('change', function (cMirror) {
    // get value right from instance
    //yourTextarea.value = cMirror.getValue();
    var markdownText = cMirror.getValue();
    //Md -> Preview
    html = marked(processMarkdownWithKaTeX(markdownText), { gfm: true });
    markdownArea.innerHTML = replaceWithEmojis(html);

    //Md -> HTML
    html = converter.makeHtml(processMarkdownWithKaTeX(markdownText));
    document.getElementById("htmlPreview").value = html;

    localStorage.setItem('markdown', markdownText);
  });
}

function processMarkdownWithKaTeX(markdown) {
  // Render Markdown to HTML
  const rawHtml = marked.parse(markdown);

  // Create a temporary container to hold the HTML
  const container = document.createElement('div');
  container.innerHTML = rawHtml;

  // Render KaTeX in the container
  renderMathInElement(container, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false },
      { left: '$', right: '$', display: false } 
    ],
    throwOnError: false,
  });

  // Return the processed Markdown with KaTeX rendered
  return container.innerHTML;
}

var $prev = $('#previewPanel'),
  $markdown = $('#markdown'),
  $syncScroll = $('#syncScroll'),
  canScroll = true;

// Retaining state in boolean since this will be more CPU friendly instead of constantly selecting on each event.
var toggleSyncScroll = () => {
  canScroll = true;

  config.set('isSyncScroll', canScroll);
  // If scrolling was just enabled, ensure we're back in sync by triggering window resize.
  if (canScroll) $(window).trigger('resize');
}

$syncScroll.on('change', toggleSyncScroll);

const isSyncScroll = true;
if (isSyncScroll === true) {
  $syncScroll.attr('checked', true);
} else {
  $syncScroll.attr('checked', false);
}

/**
 * Scrollable height.
 */
var codeScrollable = () => {
  var info = cm.getScrollInfo(),
    fullHeight = info.height,
    viewHeight = info.clientHeight;

  return fullHeight - viewHeight;
}

var prevScrollable = () => {
  var fullHeight = $markdown.height(),
    viewHeight = $prev.height();

  return fullHeight - viewHeight;
}

/**
 * Temporarily swaps out a scroll handler.
 */
var muteScroll = (obj, listener) => {
  obj.off('scroll', listener);
  obj.on('scroll', tempHandler);

  var tempHandler = () => {
    obj.off('scroll', tempHandler);
    obj.on('scroll', listener);
  }
}

/**
 * Scroll Event Listeners
 */
var codeScroll = () => {
  var scrollable = codeScrollable();
  if (scrollable > 0 && canScroll) {
    var percent = cm.getScrollInfo().top / scrollable;

    // Since we'll be triggering scroll events.
    muteScroll($prev, prevScroll);
    $prev.scrollTop(percent * prevScrollable());
  }
}

cm.on('scroll', codeScroll);
$(window).on('resize', codeScroll);

var prevScroll = () => {
  var scrollable = prevScrollable();
  if (scrollable > 0 && canScroll) {
    var percent = $(this).scrollTop() / scrollable;

    // Since we'll be triggering scroll events.
    muteScroll(cm, codeScroll);
    cm.scrollTo(null, codeScrollable() * percent);
  }
}

$prev.on('scroll', prevScroll);