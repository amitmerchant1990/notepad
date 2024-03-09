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
            fontSize: selectById('fontSize'),
            fontWeight: selectById('fontWeight'),
            installApp: selectById('installApp'),
            lineHeight: selectById('lineHeight'),
            writeDirection: selectById('writeDirection'),
            mode: selectById('mode'),
            note: selectById('note'),
            preferencesModal: selectById('preferencesModal'),
            resetPreferences: selectById('resetPreferences'),
            showWordCountPill: selectById('showWordCountPill'),
            wordCount: selectById('wordCount'),
            installAppButtonContainer: selectByClassName('install-app-btn-container'),
            stickyNotice: selectByClassName('sticky-notice'),
            wordCountContainer: selectByClassName('word-count-container'),
            keyboardShortcutsModal: selectById('keyboardShortcutsModal'),
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
        },
        get,
        getState,
        setState,
        removeState,
        selectById,
        selectByClassName
    }
}