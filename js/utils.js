function getFileName() {
    return 'Notes-' + getCurrentDate() + '.txt';
}

function getPdfFileName() {
    return 'Notes-' + getCurrentDate() + '.pdf';
}

function getDocxFileName() {
    return 'Notes-' + getCurrentDate() + '.docx';
}

function getHtmlFileName() {
    return 'Notes-' + getCurrentDate() + '.html';
}

function getCurrentDate() {
    const currentDate = new Date();

    return currentDate.getDate() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear();
}

function showToast(message) {
    let toast = document.getElementById('toast');
    toast.className = 'show';
    toast.innerHTML = message;
    
    setTimeout(function () {
        toast.className = toast.className.replace('show', '');
    }, 2000);
}

function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        let context = this;
        let args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };

        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
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

function enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor) {
    $(document.body).addClass('dark');
    $('.navbar').removeClass('navbar-default');
    $('#mode').attr('title', lightmodeText);
    $('#themeIcon').attr('src', 'img/navbar/light-theme.svg')
    metaThemeColor.setAttribute('content', darkMetaColor);
    localStorage.setItem('mode', 'dark');
}

function enableLightMode(darkmodeText, lightMetaColor, metaThemeColor) {
    $(document.body).removeClass('dark');
    $('.navbar').addClass('navbar-default');
    $('#mode').attr('title', darkmodeText);
    $('#themeIcon').attr('src', 'img/navbar/dark-theme.svg')
    metaThemeColor.setAttribute('content', lightMetaColor);
    localStorage.setItem('mode', 'light');
}

function enableDeviceTheme(themeConfig) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        enableDarkMode(themeConfig.lightmodeText, themeConfig.darkMetaColor, themeConfig.metaThemeColor)
    } else {
        enableLightMode(themeConfig.darkmodeText, themeConfig.lightMetaColor, themeConfig.metaThemeColor)
    }

    localStorage.setItem('mode', 'device');
}

function resetFontSize(defaultFontSize) {
    $('#note').css('font-size', defaultFontSize + "px");
    $('#fontSize').val(defaultFontSize);
}

function resetLineHeight(defaultLineHeight) {
    $('#note').css('line-height', defaultLineHeight + "px");
    $('#lineHeight').val(defaultLineHeight);
}

function resetFontWeight(defaultFontWeight) {
    $('#note').css('font-weight', defaultFontWeight);
    $('#fontWeight').val(defaultFontWeight);
}

function resetShowWordCountPill(defaultShowWordCountPill) {
    defaultShowWordCountPill === 'Yes' ? $('.word-count-container').show() : $('.word-count-container').hide();
    $('#showWordCountPill').prop('checked', defaultShowWordCountPill === 'Yes');
}

function resetWriteDirection(defaultWriteDirection) {
    $('#note').css('direction', defaultWriteDirection);
    $('#writeDirection').val(defaultWriteDirection);
}

function resetOptimalLineLength(defaultEditorPadding, defaultOption) {
    const textArea = document.getElementById('note');
    textArea.style.padding = defaultEditorPadding;
    $('#optimalLineLength').prop('checked', defaultOption);
}

function countWords(str) {
    return str.trim().split(/\s+/).length;
}

function calculateCharactersAndWords(str) {
    const characterCount = str.length;
    const wordCount = str !== '' ? countWords(str) : 0;
    const characterString = characterCount > 1 ? 'characters' : 'character';
    const wordString = wordCount > 1 ? 'words' : 'word';
    const wordCountText = `${characterCount} ${characterString}, ${wordCount} ${wordString}`;
    
    return wordCountText;
}

function copyNotesToClipboard(note) {
    navigator.clipboard.writeText(note).then(function () {
        showToast('Notes copied to clipboard!')
    }, function () {
        showToast('Failure to copy. Check permissions for clipboard.')
    });
}

function toggleTheme({
    lightmodeText, 
    darkmodeText, 
    lightMetaColor, 
    darkMetaColor, 
    metaThemeColor
}) {
    get(document.body).toggleClass('dark');
    let bodyClass = get(document.body).attr('class');

    if (bodyClass === 'dark') {
        enableDarkMode(lightmodeText, darkMetaColor, metaThemeColor)
    } else {
        enableLightMode(darkmodeText, lightMetaColor, metaThemeColor)
    }

    setState('isUserPreferredTheme', 'true');
}

function deleteNotes() {
    const { notepad } = selector();
    
    Swal.fire({
        title: 'Want to delete notes?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Delete!',
        cancelButtonText: 'No, keep it.'
    }).then((result) => {
        if (result.value) {
            notepad.note.val('').focus();
            setState('note', '');

            Swal.fire(
                'Deleted!',
                'Your notes has been deleted.',
                'success'
            )
        }
    })
}

function toggleFocusMode(notepad) {
    const navbar = document.querySelector('.navbar');

    if (!navbar.hasAttribute('style')) {
        navbar.style.display = 'none';
    } else {
        navbar.removeAttribute('style');
    }

    const bodyElement = document.body;

    if (!bodyElement.hasAttribute('style')) {
        bodyElement.style.paddingTop = '0px';
    } else {
        bodyElement.removeAttribute('style');
    }

    const textArea = document.getElementById('note');
    
    if (!textArea.style.borderRight) {
        textArea.style.borderRight = 'none';
        textArea.style.borderLeft = 'none';
    } else {
        textArea.style.borderRight = '';
        textArea.style.borderLeft = '';
    }

    if (localStorage.getItem('userChosenWordCountPillSelected') == 'Yes') {
        notepad.wordCountContainer.toggle();
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        $('#arrowPointsOut').hide();
        $('#arrowPointsIn').show();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            $('#arrowPointsIn').hide();
            $('#arrowPointsOut').show();
        }
    }
}

function exportNotesAsPDF(textToWrite, fileNameToSaveAs) {
    const pdf = new window.jspdf.jsPDF();
    const marginLeft = 10;
    const marginTop = 10;

    // Width of text area
    const maxWidth = 180; 
    
    const lineHeight = 10;

    // Height of a single page
    const pageHeight = pdf.internal.pageSize.height; 

    // Initial Y position for text
    let yPosition = marginTop; 

    // Split content into lines that fit within maxWidth
    const lines = pdf.splitTextToSize(textToWrite, maxWidth);

    lines.forEach(line => {
        if (yPosition + lineHeight > pageHeight) {
            pdf.addPage();  // Add a new page if content exceeds page height
            yPosition = marginTop; // Reset Y position for new page
        }
        pdf.text(line, marginLeft, yPosition);
        yPosition += lineHeight;
    });
    
    pdf.save(fileNameToSaveAs);
}

function exportNotesAsDocx(textToWrite, fileNameToSaveAs) {
    const doc = new docx.Document({
        sections: [{
            properties: {},
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            text: textToWrite,
                        }),
                    ],
                }),
            ],
        }]
    });

    docx.Packer.toBlob(doc).then(blob => {
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(blob);
        downloadLink.download = fileNameToSaveAs;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });
}

function shareNotes(textToShare) {
    if (navigator.share) {
        navigator.share({
            text: textToShare,
            url: 'https://notepad.js.org',
        })
        .then( () => console.log("Successful share"))
        .catch(e => console.log("Error sharing:", e))
    }
}

function downloadHTML(textToWrite, fileNameToSaveAs) {
    const htmlContent = `<html>
        <head><title>Downloaded HTML</title></head>
        <body>
            <pre style="white-space: pre-wrap; word-wrap: break-word;">${textToWrite}</pre>
        </body>
    </html>`;
    
    const blob = new Blob([htmlContent], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileNameToSaveAs;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}