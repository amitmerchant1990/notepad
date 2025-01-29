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

// Function to open note in fullscreen
function openFullscreen(note, index) {
    fullscreenNote.value = note; // Populate textarea with note
    currentNoteIndex = index; // Set current note index
    deleteNoteBtn.style.display = 'inline-block';
    copyNoteBtn.style.display = 'inline-block';
    downloadNoteBtn.style.display = 'inline-block';
    noteModal.style.display = "flex"; // Show modal
    fullscreenNote.focus(); // Focus on the textarea
}

// Save note functionality
saveNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    const note = {
        id: Date.now(), // Unique identifier
        content: noteContent,
        created_at: new Date().toISOString() // Timestamp
    };

    const transaction = db.transaction(['notes'], 'readwrite');
    const objectStore = transaction.objectStore('notes');

    if (currentNoteIndex !== null) {
        // Update existing note
        notes[currentNoteIndex].content = noteContent;
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
    modalContent.classList.toggle('fullscreen'); // Toggle the fullscreen class
    fullscreenNote.focus();
});

// Show the confirmation modal without animation
deleteNoteBtn.addEventListener('click', () => {
    $('#confirmDeleteModal').modal({ backdrop: 'static', keyboard: false }); // Show modal without backdrop click
    $('#confirmDeleteModal').modal('show'); // Show the modal
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
function renderNotes() {
    gridContainer.innerHTML = ''; // Clear the grid container

    // Render all notes without pinning logic
    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'grid-item';

        // Create a div for note content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'note-content';
        contentDiv.textContent = note.content; // Use note content

        noteDiv.appendChild(contentDiv); // Append note content
        noteDiv.addEventListener('click', () => {
            openFullscreen(note.content, index); // Pass note content and index
        });
        gridContainer.appendChild(noteDiv);
    });

    // Add Note grid item
    const addNoteDiv = document.createElement('div');
    addNoteDiv.className = 'grid-item add-note';
    addNoteDiv.innerHTML = '<span style="font-size: 2em;">+</span>';
    addNoteDiv.addEventListener('click', () => {
        fullscreenNote.value = '';
        currentNoteIndex = null;
        deleteNoteBtn.style.display = 'none';
        copyNoteBtn.style.display = 'none';
        downloadNoteBtn.style.display = 'none';
        noteModal.style.display = "flex";
        fullscreenNote.focus();
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
        showToast('Note copied to clipboard!'); // Optional: Notify the user
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
});

downloadNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    const noteId = currentNoteIndex !== null ? notes[currentNoteIndex].id : Date.now(); // Use existing note ID or generate a new one
    const blob = new Blob([noteContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `note-${noteId}.txt`; // Append note ID to the file name
    link.click();
    URL.revokeObjectURL(link.href); // Clean up
});

// Initialize IndexedDB
initIndexedDB();

// Initial rendering of notes on page load
renderNotes();