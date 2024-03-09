function getFileName() {
    return 'Notes-' + getCurrentDate() + '.txt';
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
    $('#showWordCountPill').val(defaultShowWordCountPill);
}

function resetWriteDirection(defaultWriteDirection) {
    $('#note').css('direction', defaultWriteDirection);
    $('#writeDirection').val(defaultWriteDirection);
}

function countWords(str) {
    return str.trim().split(/\s+/).length;
}

function calculateCharactersAndWords(str) {
    const characterCount = str.length;
    const wordCount = str !== '' ? countWords(str) : 0;
    const wordCountText = `${characterCount} character(s), ${wordCount} word(s)`;
    
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
        confirmButtonText: 'Delete'
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