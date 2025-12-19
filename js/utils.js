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
    const wordCountText = `${characterCount} ${characterString} • ${wordCount} ${wordString}`;
    
    return wordCountText;
}

function calculateNoteStatistics(str) {
    if (!str || str.trim() === '') {
        return {
            characters: 0,
            words: 0,
            sentences: 0,
            paragraphs: 0,
            averageWordLength: 0,
            readingTime: '0 min',
            uniqueWords: 0,
            lexicalDensity: '0%',
            mostCommonWord: 'N/A'
        };
    }

    const characters = str.length;
    const words = countWords(str);
    
    // Count sentences (split by . ! ?)
    const sentences = str.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Count paragraphs (split by double newlines or multiple line breaks)
    const paragraphs = str.split(/\n\n+/).filter(p => p.trim().length > 0).length;
    
    // Calculate average word length
    const averageWordLength = words > 0 ? (characters / words).toFixed(2) : 0;
    
    // Calculate reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200);
    const readingTime = readingTimeMinutes === 1 ? '1 min' : `${readingTimeMinutes} mins`;
    
    // Calculate unique words and most common word
    const wordList = str.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const wordFrequency = {};
    let maxCount = 0;
    let mostCommonWord = 'N/A';
    
    wordList.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        if (wordFrequency[word] > maxCount) {
            maxCount = wordFrequency[word];
            mostCommonWord = word;
        }
    });
    
    const uniqueWords = Object.keys(wordFrequency).length;
    const lexicalDensity = words > 0 ? ((uniqueWords / words) * 100).toFixed(1) : 0;
    
    return {
        characters,
        words,
        sentences,
        paragraphs,
        averageWordLength,
        readingTime,
        uniqueWords,
        lexicalDensity: `${lexicalDensity}%`,
        mostCommonWord: mostCommonWord.charAt(0).toUpperCase() + mostCommonWord.slice(1)
    };
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

let focusModeHoverTimer = null;

function toggleFocusMode(notepad) {
    const navbar = document.querySelector('.navbar');
    const bodyElement = document.body;
    const textArea = document.getElementById('note');
    const closeButton = document.getElementById('focusModeCloseButton');
    
    // Check if focus mode is currently active
    const isFocusMode = document.documentElement.hasAttribute('data-focus-mode');
    
    if (!isFocusMode) {
        // Entering focus mode
        document.documentElement.setAttribute('data-focus-mode', 'true');
        navbar.style.display = 'none';
        bodyElement.style.paddingTop = '0';
        textArea.style.borderRight = 'none';
        textArea.style.borderLeft = 'none';
        
        // Show close button
        closeButton.style.display = 'block';

        // Hide toast popup
        const toastPopup = document.querySelector('.toast-popup');
        if (toastPopup) {
            toastPopup.classList.remove('show');
        }
        
        notepad.bottomLine.hide();

        // Keep focus on textarea
        textArea.focus();
    } else {
        // Exiting focus mode
        turnOffFocusMode(notepad);
    }
}

// a function for turning off focus mode
function turnOffFocusMode(notepad) {
    const navbar = document.querySelector('.navbar');
    const bodyElement = document.body;
    const textArea = document.getElementById('note');
    const closeButton = document.getElementById('focusModeCloseButton');
    
    // Remove focus mode
    document.documentElement.removeAttribute('data-focus-mode');
    
    // Hide close button
    closeButton.style.display = 'none';
    
    // Reset styles
    navbar.style.display = '';
    bodyElement.style.paddingTop = '';
    textArea.style.borderRight = '';
    textArea.style.borderLeft = '';
    
    if (localStorage.getItem('userChosenWordCountPillSelected') === 'Yes' || selector().defaultConfig.defaultShowWordCountPill === 'Yes') {
        notepad.bottomLine.show();
    }

    // Keep focus on textarea
    textArea.focus();
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

function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart-float';
  heart.innerHTML = '❤';
  
  // Random position around the coffee icon
  const size = Math.random() * 10 + 8; // Size between 10-20px
  const posX = Math.random() * 20 - 15; // Random X position (-10 to 10)
  const rotation = Math.random() * 40 - 20; // Random rotation (-20 to 20 degrees)
  
  heart.style.left = `calc(50% + ${posX}px)`;
  heart.style.fontSize = `${size}px`;
  heart.style.transform = `rotate(${rotation}deg)`;
  
  // Random animation duration (0.8s to 1.5s)
  const duration = Math.random() * 0.7 + 0.8;
  heart.style.animationDuration = `${duration}s`;
  
  // Remove the heart after animation completes
  heart.addEventListener('animationend', function() {
    this.remove();
  });
  
  return heart;
}

function setupCoffeeIconAnimation() {
  const coffeeIcon = document.querySelector('.coffee-icon');
  let hoverInterval;
  
  coffeeIcon.addEventListener('mouseenter', function() {
    // Create a heart every 200ms while hovering
    hoverInterval = setInterval(() => {
      const heart = createHeart();
      this.appendChild(heart);
    }, 350);
  });
  
  coffeeIcon.addEventListener('mouseleave', function() {
    // Clear the interval when mouse leaves
    clearInterval(hoverInterval);
  });
}