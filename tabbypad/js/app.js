const gridContainer = document.getElementById('gridContainer');
const noteModal = document.getElementById('noteModal');
const fullscreenNote = document.getElementById('fullscreenNote');
const closeModal = document.getElementsByClassName('close')[0];
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const copyNoteBtn = document.getElementById('copyNoteBtn');
const downloadNoteBtn = document.getElementById('downloadNoteBtn');
let currentNoteId = null; // To track the index of the current note being edited

let notes = [], db;

function initIndexedDB() {
    const request = indexedDB.open('NotesDB', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('notes', { keyPath: 'id' });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        migrateNotesFromLocalStorage(); // Migrate notes from localStorage
        loadNotesFromIndexedDB(); // Load notes from IndexedDB on success
    };

    request.onerror = function(event) {
        console.error('Database error: ' + event.target.errorCode);
    };
}

function migrateNotesFromLocalStorage() {
    const storedNotes = JSON.parse(localStorage.getItem('notes'));

    if (storedNotes && Array.isArray(storedNotes)) {
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');

        storedNotes.forEach(note => {
            objectStore.add(note); // Add each note to IndexedDB
        });

        transaction.oncomplete = function() {
            console.log('Notes migrated to IndexedDB successfully.');
            localStorage.removeItem('notes'); // Remove notes from localStorage
        };

        transaction.onerror = function(event) {
            console.error('Error migrating notes to IndexedDB:', event.target.errorCode);
        };
    }
}

function loadNotesFromIndexedDB() {
    const transaction = db.transaction(['notes'], 'readonly');
    const objectStore = transaction.objectStore('notes');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const notesFromDB = event.target.result;
        if (notesFromDB.length > 0) {
            notes = notesFromDB; // Use notes from IndexedDB
        }

        renderNotes(); // Render the notes
    };
}

// Function to update the selected color in the UI and apply it to the modal
function updateSelectedColor(color) {
    const modalContent = document.querySelector('.custom-modal-content');
    
    // Remove all color classes from modal
    modalContent.classList.remove(
        'modal-pastel-yellow', 'modal-pastel-blue', 'modal-pastel-green',
        'modal-pastel-pink', 'modal-pastel-purple', 'modal-default-grid-color'
    );
    
    // Add the selected color class to modal
    const modalColorClass = `modal-${color}`;
    modalContent.classList.add(modalColorClass);
    
    // Update the selected color in the color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.color-option[data-color="${color}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// Function to open note in fullscreen
function openFullscreen(note, index) {
    // Handle both string and object notes
    if (typeof note === 'string') {
        fullscreenNote.value = note;
        updateSelectedColor('default-grid-color');
        currentNoteId = null; // New note
    } else {
        fullscreenNote.value = note.content || '';
        const noteColor = note.color || 'default-grid-color';
        updateSelectedColor(noteColor);
        currentNoteId = note.id; // Existing note
    }
    
    deleteNoteBtn.style.display = 'inline-block';
    copyNoteBtn.style.display = 'inline-block';
    downloadNoteBtn.style.display = 'inline-block';
    noteModal.style.display = "flex";
    fullscreenNote.focus();
}

// Color picker functionality
document.addEventListener('DOMContentLoaded', () => {
    // Set up color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const color = option.getAttribute('data-color');
            updateSelectedColor(color);
        });
    });
    
    // Set default color for new notes
    updateSelectedColor('default-grid-color');
});

// Save note functionality
saveNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    const selectedColor = document.querySelector('.color-option.selected')?.getAttribute('data-color') || 'default-grid-color';
    
    const transaction = db.transaction(['notes'], 'readwrite');
    const objectStore = transaction.objectStore('notes');

    if (currentNoteId) {
        // Update existing note
        const existingNote = notes.find(note => note.id === currentNoteId);
        if (existingNote) {
            existingNote.content = noteContent;
            existingNote.color = selectedColor;
            objectStore.put(existingNote); // Update the existing note
        }

        currentNoteId = null;
    } else {
        // Add new note
        const note = {
            id: Date.now(), // Only generate new ID for new notes
            content: noteContent,
            created_at: new Date().toISOString(),
            color: selectedColor
        };
        objectStore.add(note);
        notes.push(note); // Add to beginning of array to show newest first
    }

    transaction.oncomplete = function() {
        renderNotes();
        noteModal.style.display = "none";
    };
});

// Close modal functionality
closeModal.onclick = function() {
    noteModal.style.display = "none";
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target == noteModal) {
        noteModal.style.display = "none";
    }
}

const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');

fullscreenToggleBtn.addEventListener('click', () => {
    const modalContent = document.querySelector('.custom-modal-content');
    modalContent.classList.toggle('fullscreen');
    fullscreenNote.focus();
});

// Show the confirmation modal without animation
deleteNoteBtn.addEventListener('click', () => {
    $('#confirmDeleteModal').modal({ backdrop: 'static', keyboard: false });
    $('#confirmDeleteModal').modal('show');
});

// Handle confirmation of deletion
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (currentNoteId !== null) {
        const noteId = currentNoteId; // Get the ID of the note to delete

        // Delete from IndexedDB
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');
        objectStore.delete(noteId); // Delete note from IndexedDB

        transaction.oncomplete = function() {
            const noteIndex = notes.findIndex(note => note.id === currentNoteId);
            if (noteIndex > -1) {
                notes.splice(noteIndex, 1); // Remove from notes array using the found index
            }
            renderNotes(); // Re-render notes
            noteModal.style.display = "none"; // Close modal
            $('#confirmDeleteModal').modal('hide'); // Hide confirmation modal
        };

        transaction.onerror = function(event) {
            console.error('Error deleting note from IndexedDB:', event.target.errorCode);
        };
    }
});

const searchInput = document.getElementById('searchInput');
const escToCancel = document.querySelector('.esc-to-cancel');

document.addEventListener('mousedown', function(e) {
  clickedElementOnMouseDown = e.target;

  if (clickedElementOnMouseDown.closest('.esc-to-cancel')) {
    searchInput.value = '';
    escToCancel.style.display = 'none';
    renderNotes();
  }
})

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => 
        note.content.toLowerCase().includes(searchTerm)
    );
    renderNotes(filteredNotes); // Pass the filtered notes to render function

    // show esc-to-cancel text when search input is focused
    if (searchInput.value !== '') {
        escToCancel.style.display = 'block';
    } else {
        escToCancel.style.display = 'none';
    }
});

// Close the modal when the Escape key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        // if the delete confirmation modal is open, don't close it
        if (!$('#confirmDeleteModal').is(':visible')) {
            noteModal.style.display = "none"; // Close the modal
        }

        // if searchInput has focus
        if (searchInput === document.activeElement) {
            searchInput.value = '';
            escToCancel.style.display = 'none';
            renderNotes();
        }
    }
});

// show esc-to-cancel text when search input is focused
searchInput.addEventListener('focus', () => {
    if (searchInput.value !== '') {
        escToCancel.style.display = 'block';
    }
});

searchInput.addEventListener('blur', () => {
    escToCancel.style.display = 'none';
});

// Modify renderNotes function to accept an optional parameter
function renderNotes(filteredNotes = notes) {
    const existing = new Map(
        [...gridContainer.querySelectorAll('.grid-item')]
            .map(el => [el.dataset.id, el])
    );

    // Empty state handling
    const emptyState = gridContainer.querySelector('.empty-state');
    if (filteredNotes.length === 0) {
        if (!emptyState) {
            const emptyStateDiv = document.createElement('div');
            emptyStateDiv.className = 'empty-state';
            emptyStateDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p>No notes added yet</p>
                <p class="empty-state-subtitle">Click the + button to create your first note</p>
            `;
            gridContainer.appendChild(emptyStateDiv);
        }
        // Remove any existing grid-items
        existing.forEach(el => el.remove());
        return;
    } else if (emptyState) {
        emptyState.remove();
    }

    // Helper to build a note node
    function createNoteElement(note, index) {
        const noteDiv = document.createElement('div');
        noteDiv.className = `grid-item ${note.color || 'default-grid-color'}`;
        noteDiv.dataset.id = String(note.id);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.textContent = note.content;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'note-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn';
        copyBtn.title = 'Copy note';
        copyBtn.innerHTML = `
            <svg class="action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
            <svg class="checkmark-icon" style="display:none" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
        `;
        copyBtn.addEventListener('click', e => {
            e.stopPropagation();
            navigator.clipboard.writeText(note.content).then(() => {
                copyBtn.classList.add('copied');
                setTimeout(() => copyBtn.classList.remove('copied'), 800);
            });
        });

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn';
        downloadBtn.title = 'Download note';
        downloadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
        `;
        downloadBtn.addEventListener('click', e => {
            e.stopPropagation();
            const a = document.createElement('a');
            const file = new Blob([note.content], { type: 'text/plain' });
            a.href = URL.createObjectURL(file);
            a.download = `note-${new Date(note.created_at).toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

        actionsDiv.append(copyBtn, downloadBtn);
        noteDiv.append(contentDiv, actionsDiv);

        contentDiv.addEventListener('click', () => openFullscreen(note, index));

        return noteDiv;
    }

    // Remove nodes that no longer exist
    const incomingIds = new Set(filteredNotes.map(n => String(n.id)));
    existing.forEach((el, id) => {
        if (!incomingIds.has(id)) el.remove();
    });

    // Insert/update in correct order
    filteredNotes.forEach((note, index) => {
        const id = String(note.id);
        let el = existing.get(id);

        if (!el) {
            el = createNoteElement(note, index);
        } else {
            // Update mutable parts
            el.className = `grid-item ${note.color || 'default-grid-color'}`;
            el.querySelector('.note-content').textContent = note.content;
        }

        const ref = gridContainer.children[index];
        if (ref !== el) {
            gridContainer.insertBefore(el, ref || null);
        }
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.toast-body').textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

copyNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    navigator.clipboard.writeText(noteContent).then(() => {
        // Add 'copied' class to show checkmark
        copyNoteBtn.classList.add('copied');
        
        // Remove the class after animation completes
        setTimeout(() => {
            copyNoteBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
});

downloadNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    const noteId = currentNoteId !== null ? currentNoteId : Date.now(); 
    const blob = new Blob([noteContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `note-${noteId}.txt`; 
    link.click();
    URL.revokeObjectURL(link.href); 
});

function getCurrentDate() {
    const currentDate = new Date();

    return currentDate.getDate() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getFullYear();
}

function downloadAllNotes() {
    if (notes.length === 0) {
        showToast('No notes to download!');
        return;
    }

    const folderName = "tabbypad-notes-bundle-"+ getCurrentDate();
    const zip = new JSZip();
    const folder = zip.folder(folderName); // Create a folder in the ZIP

    notes.forEach(note => {
        // Create a text file for each note
        folder.file(`note_${note.id}.txt`, note.content);
    });

    // Generate the ZIP file and trigger download
    zip.generateAsync({ type: "blob" }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = folderName +".zip"; // Name of the ZIP file
        link.click();
        URL.revokeObjectURL(link.href); // Clean up
    });
}

let lastUsedColor = null;

function getRandomPastelColor() {
    const pastelColors = ['pastel-yellow', 'pastel-blue', 'pastel-green', 'pastel-pink', 'pastel-purple'];
    
    // If there's only one color, return it
    if (pastelColors.length === 1) return pastelColors[0];
    
    // Filter out the last used color
    const availableColors = pastelColors.filter(color => color !== lastUsedColor);
    
    // Select a random color from the remaining options
    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    
    // Update the last used color
    lastUsedColor = randomColor;
    
    return randomColor;
}

function createNewNote() {
    fullscreenNote.value = '';
    currentNoteId = null;
    deleteNoteBtn.style.display = 'none';
    copyNoteBtn.style.display = 'none';
    downloadNoteBtn.style.display = 'none';
    noteModal.style.display = "flex";
    // Set default color for new note
    updateSelectedColor('default-grid-color');
    fullscreenNote.focus();
}

document.onkeydown = function (event) {
    event = event || window.event;
    
    if (event.altKey && event.code === 'KeyN') {
        createNewNote();
        event.preventDefault();
    }
};

document.getElementById('downloadAllNotesBtn').addEventListener('click', downloadAllNotes);

// Floating Add Note Button
document.getElementById('floatingAddBtn').addEventListener('click', () => {
    createNewNote();
});

// Initialize IndexedDB
initIndexedDB();

// Initial rendering of notes on page load
renderNotes();