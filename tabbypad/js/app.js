const gridContainer = document.getElementById('gridContainer');
const noteModal = document.getElementById('noteModal');
const fullscreenNote = document.getElementById('fullscreenNote');
const closeModal = document.getElementsByClassName('close')[0];
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const copyNoteBtn = document.getElementById('copyNoteBtn');
const downloadNoteBtn = document.getElementById('downloadNoteBtn');
let currentNoteIndex = null; // To track the index of the current note being edited

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
    } else {
        fullscreenNote.value = note.content || '';
        const noteColor = note.color || 'default-grid-color';
        updateSelectedColor(noteColor);
    }
    
    currentNoteIndex = index;
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
    
    const note = {
        id: Date.now(), // Unique identifier
        content: noteContent,
        created_at: new Date().toISOString(), // Timestamp
        color: selectedColor
    };

    const transaction = db.transaction(['notes'], 'readwrite');
    const objectStore = transaction.objectStore('notes');

    if (currentNoteIndex !== null) {
        // Update existing note
        notes[currentNoteIndex].content = noteContent;
        notes[currentNoteIndex].color = selectedColor;
        objectStore.put(notes[currentNoteIndex]); // Update note in IndexedDB
    } else {
        // Add new note
        objectStore.add(note); // Add new note to IndexedDB
        notes.push(note); // Add to local notes array for rendering
    }

    transaction.oncomplete = function() {
        renderNotes(); // Re-render notes
        noteModal.style.display = "none"; // Close modal
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
    if (currentNoteIndex !== null) {
        const noteToDelete = notes[currentNoteIndex]; // Get the note to delete
        const noteId = noteToDelete.id; // Get the ID of the note to delete

        // Delete from IndexedDB
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');
        objectStore.delete(noteId); // Delete note from IndexedDB

        transaction.oncomplete = function() {
            notes.splice(currentNoteIndex, 1); // Remove from notes array
            renderNotes(); // Re-render notes
            noteModal.style.display = "none"; // Close modal
            $('#confirmDeleteModal').modal('hide'); // Hide confirmation modal
        };

        transaction.onerror = function(event) {
            console.error('Error deleting note from IndexedDB:', event.target.errorCode);
        };
    }
});

// Close the modal when the Escape key is pressed
document.addEventListener('keydown', (event) => {
    if (event.key === "Escape") {
        noteModal.style.display = "none"; // Close the modal
    }
});

const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredNotes = notes.filter(note => 
        note.content.toLowerCase().includes(searchTerm)
    );
    renderNotes(filteredNotes); // Pass the filtered notes to render function
});

// Modify renderNotes function to accept an optional parameter
function renderNotes(filteredNotes = notes) {
    gridContainer.innerHTML = ''; // Clear the grid container

    // Render all notes without pinning logic
    filteredNotes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = `grid-item ${note.color || 'default-grid-color'}`;

        // Create a div for note content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.textContent = note.content; 

        noteDiv.appendChild(contentDiv); 
        noteDiv.addEventListener('click', () => {
            openFullscreen(note, index); 
        });
        gridContainer.appendChild(noteDiv);
    });

    // Add Note grid item
    const addNoteDiv = document.createElement('div');
    addNoteDiv.className = 'grid-item add-note';
    addNoteDiv.title = 'Add Note (Alt/Option + N)';
    addNoteDiv.innerHTML = '<div>+ New Note</div><div class="keyboard-shortcut-container">[ Alt / Option + N ]</div>';
    addNoteDiv.addEventListener('click', () => {
        createNewNote();
    });
    gridContainer.appendChild(addNoteDiv);
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
    const noteId = currentNoteIndex !== null ? notes[currentNoteIndex].id : Date.now(); 
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
    currentNoteIndex = null;
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

// Initialize IndexedDB
initIndexedDB();

// Initial rendering of notes on page load
renderNotes();