const notes = JSON.parse(localStorage.getItem('notes')) || []; // Load notes from localStorage
const gridContainer = document.getElementById('gridContainer');
const noteModal = document.getElementById('noteModal');
const fullscreenNote = document.getElementById('fullscreenNote');
const closeModal = document.getElementsByClassName('close')[0];
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
let currentNoteIndex = null; // To track the index of the current note being edited

// Function to render notes
function renderNotes() {
    gridContainer.innerHTML = '';
    notes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'grid-item';
        noteDiv.innerHTML = '<div>' + note.content + '</div>'; // Use note content
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
        noteModal.style.display = "block";
        fullscreenNote.focus();
    });
    gridContainer.appendChild(addNoteDiv);
}

// Function to open note in fullscreen
function openFullscreen(note, index) {
    fullscreenNote.value = note; // Populate textarea with note
    currentNoteIndex = index; // Set current note index
    deleteNoteBtn.style.display = 'inline-block';
    noteModal.style.display = "block"; // Show modal
    fullscreenNote.focus(); // Focus on the textarea
}

// Save note functionality
saveNoteBtn.addEventListener('click', () => {
    const noteContent = fullscreenNote.value;
    if (currentNoteIndex !== null) {
        // Update existing note
        notes[currentNoteIndex].content = noteContent;
    } else {
        // Add new note
        const newNote = {
            id: Date.now(), // Unique identifier
            content: noteContent,
            created_at: new Date().toISOString() // Timestamp
        };
        notes.push(newNote);
    }
    localStorage.setItem('notes', JSON.stringify(notes)); // Save updated notes to localStorage
    renderNotes(); // Re-render notes
    noteModal.style.display = "none"; // Close modal
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

deleteNoteBtn.addEventListener('click', () => {
    if (currentNoteIndex !== null) {
        // Remove the note from the array
        notes.splice(currentNoteIndex, 1);
        localStorage.setItem('notes', JSON.stringify(notes)); // Save updated notes to localStorage
        renderNotes(); // Re-render notes
        noteModal.style.display = "none"; // Close modal
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
    gridContainer.innerHTML = '';
    filteredNotes.forEach((note, index) => {
        const noteDiv = document.createElement('div');
        noteDiv.className = 'grid-item';
        noteDiv.innerHTML = '<div>' + note.content + '</div>'; // Use note content
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
        noteModal.style.display = "block";
        fullscreenNote.focus();
    });
    gridContainer.appendChild(addNoteDiv);
}

// Initial rendering of notes on page load
renderNotes();