function getState(state) {
    return localStorage.getItem(state);
}

function setState(state, value) {
    localStorage.setItem(state, value);
}

function removeState(state) {
    localStorage.removeItem(state);
}

function selectById(id) {
    return $(`#${id}`);
}

function selectByClassName(className) {
    return $(`.${className}`);
}

function get(context) {
    return $(context);
}

function selector() {
    return {
        notepad: {
            aboutModal: selectById('aboutModal'),
            clearNotes: selectById('clearNotes'),
            closeDonationPopup: selectById('closeDonationPopup'),
            copyToClipboard: selectById('copyToClipboard'),
            downloadNotes: selectById('downloadNotes'),
            moreTools: selectById('moreTools'),
            downloadNotesPlain: selectById('downloadNotesPlain'),
            downloadNotesPdf: selectById('downloadNotesPdf'),
            downloadNotesDocx: selectById('downloadNotesDocx'),
            downloadNotesHtml: selectById('downloadNotesHtml'),
            fontSize: selectById('fontSize'),
            fontWeight: selectById('fontWeight'),
            installApp: selectById('installApp'),
            lineHeight: selectById('lineHeight'),
            writeDirection: selectById('writeDirection'),
            note: selectById('note'),
            preferencesModal: selectById('preferencesModal'),
            resetPreferences: selectById('resetPreferences'),
            showWordCountPill: selectById('showWordCountPill'),
            transparentWordCountPill: selectById('transparentWordCountPill'),
            wordCount: selectById('wordCount'),
            installAppButtonContainer: selectByClassName('install-app-btn-container'),
            stickyNotice: selectByClassName('sticky-notice'),
            wordCountContainer: selectByClassName('word-count-container'),
            keyboardShortcutsModal: selectById('keyboardShortcutsModal'),
            fullScreenButton: selectById('fullScreenButton'),
            optimalLineLength: selectById('optimalLineLength'),
            monospaced: selectById('monospaced'),
            shareNotes: selectById('shareNotes'),
            dyslexic: selectById('dyslexic'),
            spellCheck: selectById('spellCheck'),
            tabIndentation: selectById('tabIndentation'),
            bottomLine: selectByClassName('bottom-line'),
            focusModeButton: selectById('focusModeButton'),
            focusModeCloseButton: selectById('focusModeCloseButton'),
            statisticsModal: selectById('statisticsModal'),
        },
        state: {
            note: getState('note'),
            mode: getState('mode'),
            isUserPreferredTheme: getState('isUserPreferredTheme'),
            userChosenFontSize: getState('userChosenFontSize'),
            userChosenFontWeight: getState('userChosenFontWeight'),
            userChosenLineHeight: getState('userChosenLineHeight'),
            hasUserDismissedDonationPopup: getState('hasUserDismissedDonationPopup'),
            userChosenWordCountPillSelected: getState('userChosenWordCountPillSelected'),
            userChosenWriteDirection: getState('userChosenWriteDirection'),
            userChosenOptimalLineLengthSelected: getState('userChosenOptimalLineLengthSelected'),
            isMonospaced: getState('monospaced'),
            isDyslexic: getState('dyslexicFont'),
            userChosenSpellCheck: getState('userChosenSpellCheck'),
            userChosenTabIndentation: getState('userChosenTabIndentation'),
            userChosenTransparentWordCountPillSelected: getState('userChosenTransparentWordCountPillSelected'),
        },
        defaultConfig: {
            defaultFontSize: 18,
            defaultLineHeight: 26,
            defaultFontWeight: 'normal',
            defaultShowWordCountPill: 'Yes',
            defaultWriteDirection: 'ltr',
            defaultOptimalLineLength: false,
            defaultOptimalLineLengthPadding: '15px 24px 40px',
            defaultSpellCheck: true,
            defaultTabIndentation: false,
            defaultTransparentWordCountPillSelected: false
        },
        get,
        getState,
        setState,
        removeState,
        selectById,
        selectByClassName
    }
}