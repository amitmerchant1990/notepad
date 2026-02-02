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

// Resizable divider functionality
const resizer = document.getElementById('resizer');
const textPanel = document.getElementById('textPanel');
const previewPanel = document.getElementById('previewPanel');
const editArea = document.getElementById('editArea');

let isResizing = false;

// Save initial panel widths to localStorage
const savedTextWidth = localStorage.getItem('textPanelWidth');
const savedPreviewWidth = localStorage.getItem('previewPanelWidth');

if (savedTextWidth && savedPreviewWidth) {
  textPanel.style.width = savedTextWidth;
  previewPanel.style.width = savedPreviewWidth;
}

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  
  const editAreaRect = editArea.getBoundingClientRect();
  const mouseX = e.clientX - editAreaRect.left;
  
  // Calculate new widths (minimum 20% for each panel)
  const minPanelWidth = editAreaRect.width * 0.2;
  const maxPanelWidth = editAreaRect.width * 0.8;
  
  let newTextWidth = mouseX;
  
  // Constrain the width
  if (newTextWidth < minPanelWidth) newTextWidth = minPanelWidth;
  if (newTextWidth > maxPanelWidth) newTextWidth = maxPanelWidth;
  
  const newPreviewWidth = editAreaRect.width - newTextWidth - 5; // 5px for resizer
  
  // Apply new widths
  textPanel.style.width = newTextWidth + 'px';
  previewPanel.style.width = newPreviewWidth + 'px';
  
  // Refresh CodeMirror to handle resize
  cm.refresh();
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Save panel widths to localStorage
    localStorage.setItem('textPanelWidth', textPanel.style.width);
    localStorage.setItem('previewPanelWidth', previewPanel.style.width);
  }
});

// Handle window resize to maintain proportions
window.addEventListener('resize', () => {
  const editAreaRect = editArea.getBoundingClientRect();
  const textWidth = parseFloat(textPanel.style.width) || (editAreaRect.width * 0.5);
  const previewWidth = editAreaRect.width - textWidth - 5;
  
  // Ensure panels don't become too small on window resize
  const minPanelWidth = editAreaRect.width * 0.2;
  
  if (textWidth < minPanelWidth) {
    textPanel.style.width = minPanelWidth + 'px';
    previewPanel.style.width = (editAreaRect.width - minPanelWidth - 5) + 'px';
  } else if (previewWidth < minPanelWidth) {
    previewPanel.style.width = minPanelWidth + 'px';
    textPanel.style.width = (editAreaRect.width - minPanelWidth - 5) + 'px';
  }
  
  // Refresh CodeMirror
  cm.refresh();
});

function downloadMarkdown() {
  const markdownText = cm.getValue();
  
  // Create a blob and download
  const blob = new Blob([markdownText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'markdown-document.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadHTML() {
  const markdownText = cm.getValue();
  const converter = new showdown.Converter();
  const html = converter.makeHtml(processMarkdownWithKaTeX(markdownText));
  
  // Create a complete HTML document
  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Document</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { color: #333; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
</head>
<body>
  ${html}
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    });
  </script>
</body>
</html>`;
  
  // Create a blob and download
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'markdown-document.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const markdownText = cm.getValue();
  const converter = new showdown.Converter();
  const html = converter.makeHtml(markdownText); // Remove KaTeX processing for PDF
  
  // Create a completely isolated iframe for PDF generation
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '800px';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  
  // Create the HTML content for the iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 16px;
          line-height: 1.5;
          word-wrap: break-word;
          color: #24292f;
          background-color: #ffffff;
          margin: 0;
          padding: 45px;
          box-sizing: border-box;
        }
        
        .markdown-body {
          box-sizing: border-box;
          min-width: 200px;
          max-width: 980px;
          margin: 0 auto;
          padding: 0;
        }
        
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .markdown-body h1 {
          font-size: 2em;
          border-bottom: 1px solid #d1d9da;
          padding-bottom: 0.3em;
        }
        
        .markdown-body h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #d1d9da;
          padding-bottom: 0.3em;
        }
        
        .markdown-body h3 {
          font-size: 1.25em;
        }
        
        .markdown-body h4 {
          font-size: 1em;
        }
        
        .markdown-body h5 {
          font-size: 0.875em;
        }
        
        .markdown-body h6 {
          font-size: 0.85em;
          color: #57606a;
        }
        
        .markdown-body p {
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .markdown-body ul, .markdown-body ol {
          padding-left: 2em;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        .markdown-body li {
          word-wrap: break-word;
        }
        
        .markdown-body li > p {
          margin-top: 16px;
        }
        
        .markdown-body li + li {
          margin-top: 0.25em;
        }
        
        .markdown-body blockquote {
          padding: 0 1em;
          color: #57606a;
          border-left: 0.25em solid #d1d9da;
          margin: 0 0 16px 0;
        }
        
        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(175, 184, 193, 0.2);
          border-radius: 6px;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        }
        
        .markdown-body pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .markdown-body pre code {
          display: inline;
          max-width: auto;
          padding: 0;
          margin: 0;
          overflow: visible;
          line-height: inherit;
          word-wrap: normal;
          background-color: transparent;
          border: 0;
        }
        
        .markdown-body table {
          border-spacing: 0;
          border-collapse: collapse;
          margin-bottom: 16px;
          width: 100%;
        }
        
        .markdown-body table th, .markdown-body table td {
          padding: 6px 13px;
          border: 1px solid #d1d9da;
        }
        
        .markdown-body table th {
          font-weight: 600;
          background-color: #f6f8fa;
        }
        
        .markdown-body table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        
        .markdown-body a {
          color: #0969da;
          text-decoration: none;
        }
        
        .markdown-body a:hover {
          text-decoration: underline;
        }
        
        .markdown-body strong {
          font-weight: 600;
        }
        
        .markdown-body em {
          font-style: italic;
        }
        
        .markdown-body hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #d1d9da;
          border: 0;
        }
        
        .markdown-body img {
          max-width: 100%;
          box-sizing: content-box;
        }
      </style>
    </head>
    <body>
      <div class="markdown-body">${html}</div>
    </body>
    </html>
  `;
  
  document.body.appendChild(iframe);
  
  // Wait for iframe to load, then convert to PDF
  iframe.onload = function() {
    setTimeout(() => {
      html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: iframe.contentDocument.body.scrollHeight
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('markdown-document.pdf');
        
        // Clean up
        document.body.removeChild(iframe);
      }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      });
    }, 1000);
  };
  
  iframe.srcdoc = iframeContent;
}