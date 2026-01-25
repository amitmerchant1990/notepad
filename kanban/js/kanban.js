document.addEventListener("DOMContentLoaded", loadTasks);

// Handle delete confirmation
$(document).on('click', '#confirmDelete', function() {
    if (window.taskToDelete) {
        const taskList = window.taskToDelete.parentNode;
        taskList.removeChild(window.taskToDelete);
        
        // Show placeholder if no tasks left
        const actualTasks = Array.from(taskList.children).filter(task => !task.classList.contains('placeholder'));
        const placeholder = taskList.querySelector('.placeholder');
        if (actualTasks.length === 0 && placeholder) {
            placeholder.style.display = 'flex';
        }
        
        saveTasks();
        window.taskToDelete = null;
    }
    
    // Hide the modal
    $('#deleteModal').modal('hide');
});

// Global touch handler to hide buttons when tapping outside (only added once)
if (typeof window.globalTouchHandlerAdded === 'undefined') {
    document.addEventListener('touchstart', function(e) {
        // Find all task items and hide their buttons if tap is outside
        const taskItems = document.querySelectorAll('.task-item.active');
        taskItems.forEach(item => {
            if (!item.contains(e.target)) {
                item.classList.remove('active');
            }
        });
    });
    window.globalTouchHandlerAdded = true;
}

function loadTasks() {
    // Register keydown event for each input field using jQuery
    $('#todo-input').on('keydown', function(event) {
        console.log(event);
        if (event.key === 'Enter') {
            event.preventDefault();
            addTask('todo'); 
        }
    });

    $('#in-progress-input').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            addTask('in-progress'); 
        }
    });

    $('#done-input').on('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); 
            addTask('done'); 
        }
    });

    const tasks = JSON.parse(localStorage.getItem("kanban")) || { todo: [], inProgress: [], done: [] }; // Change key to "kanban"
    tasks.todo.forEach(task => addTaskToColumn('todo', task));
    tasks.inProgress.forEach(task => addTaskToColumn('in-progress', task));
    tasks.done.forEach(task => addTaskToColumn('done', task));

    // Initialize Sortable for each task list
    const todoList = document.getElementById('todo').querySelector('.task-list');
    const inProgressList = document.getElementById('in-progress').querySelector('.task-list');
    const doneList = document.getElementById('done').querySelector('.task-list');

    Sortable.create(todoList, {
        group: 'tasks',
        animation: 150,
        filter: '.placeholder, .task-edit-input, .task-actions',
        preventOnFilter: false,
        onStart: function(evt) {
            evt.from.classList.add('drop-target'); // Add class to the list being dragged over
        },
        onEnd: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when dragging ends
            saveTasks(); // Save tasks after dragging
        },
        onLeave: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when leaving
        }
    });

    Sortable.create(inProgressList, {
        group: 'tasks',
        animation: 150,
        filter: '.placeholder, .task-edit-input, .task-actions',
        preventOnFilter: false,
        onStart: function(evt) {
            evt.from.classList.add('drop-target'); // Add class to the list being dragged over
        },
        onEnd: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when dragging ends
            saveTasks(); // Save tasks after dragging
        },
        onLeave: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when leaving
        }
    });

    Sortable.create(doneList, {
        group: 'tasks',
        animation: 150,
        filter: '.placeholder, .task-edit-input, .task-actions',
        preventOnFilter: false,
        onStart: function(evt) {
            evt.from.classList.add('drop-target'); // Add class to the list being dragged over
        },
        onEnd: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when dragging ends
            saveTasks(); // Save tasks after dragging
        },
        onLeave: function(evt) {
            evt.from.classList.remove('drop-target'); // Remove class when leaving
        }
    });
}

function addTask(columnId) {
    const input = document.getElementById(`${columnId}-input`);
    const taskText = input.value;
    if (taskText) {
        addTaskToColumn(columnId, taskText);
        input.value = '';
        saveTasks();
    } else {
        input.focus();
    }
}

function createTaskElement(taskText) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    
    // Create task text element
    const taskTextElement = document.createElement('span');
    taskTextElement.className = 'task-text';
    taskTextElement.textContent = taskText;
    
    // Create action buttons container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';
    
    // Create edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit-btn';
    editBtn.innerHTML = `<svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="pencil" class="svg-inline--fa fa-pencil fa-fw " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="13" height="13"><path fill="#000000" d="M491.609 73.625l-53.861-53.839c-26.378-26.379-69.075-26.383-95.46-.001L24.91 335.089.329 484.085c-2.675 16.215 11.368 30.261 27.587 27.587l148.995-24.582 315.326-317.378c26.33-26.331 26.581-68.879-.628-96.087zM200.443 311.557C204.739 315.853 210.37 318 216 318s11.261-2.147 15.557-6.443l119.029-119.03 28.569 28.569L210 391.355V350h-48v-48h-41.356l170.259-169.155 28.569 28.569-119.03 119.029c-8.589 8.592-8.589 22.522.001 31.114zM82.132 458.132l-28.263-28.263 12.14-73.587L84.409 338H126v48h48v41.59l-18.282 18.401-73.586 12.141zm378.985-319.533l-.051.051-.051.051-48.03 48.344-88.03-88.03 48.344-48.03.05-.05.05-.05c9.147-9.146 23.978-9.259 33.236-.001l53.854 53.854c9.878 9.877 9.939 24.549.628 33.861z"></path></svg>`;
    editBtn.title = 'Edit task';
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.innerHTML = `<svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#ff1212" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>`;
    deleteBtn.title = 'Delete task';
    
    // Add buttons to actions container
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Add elements to task item
    taskItem.appendChild(taskTextElement);
    taskItem.appendChild(actionsDiv);
    
    // Prevent drag events on action buttons
    actionsDiv.addEventListener('touchstart', function(e) {
        e.stopPropagation();
    });
    
    actionsDiv.addEventListener('touchmove', function(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevent any drag behavior
    });
    
    actionsDiv.addEventListener('touchend', function(e) {
        e.stopPropagation();
    });
    
    // Mobile touch handling for showing/hiding action buttons
    let touchTimeout;
    
    taskItem.addEventListener('touchstart', function(e) {
        // Clear any existing timeout
        if (touchTimeout) {
            clearTimeout(touchTimeout);
        }
        
        // Add active class to show buttons
        taskItem.classList.add('active');
    });
    
    taskItem.addEventListener('touchend', function(e) {
        e.preventDefault(); // Prevent click event from firing
        
        // Hide buttons after a delay
        touchTimeout = setTimeout(() => {
            taskItem.classList.remove('active');
        }, 2000);
    });
    
    // Hide buttons when touching elsewhere on this task item
    taskItem.addEventListener('touchstart', function(e) {
        if (e.target === taskItem || e.target === taskTextElement) {
            // Clear any existing timeout
            if (touchTimeout) {
                clearTimeout(touchTimeout);
            }
            // Add active class to show buttons
            taskItem.classList.add('active');
        }
    });
    
    // Add event listeners
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevent any default touch behavior
        
        // Hide the action buttons immediately
        taskItem.classList.remove('active');
        
        // Create input element for inline editing
        const input = document.createElement('input');
        input.type = 'text';
        input.value = taskTextElement.textContent;
        input.className = 'task-edit-input';
        
        // Replace text element with input
        taskTextElement.style.display = 'none';
        taskItem.insertBefore(input, taskTextElement);
        
        // Disable drag functionality while editing
        taskItem.draggable = false;
        taskItem.style.cursor = 'text';
        
        // Flag to track if editing is still active
        let isEditing = true;
        let cleanupCalled = false;
        
        // Focus and select the input
        input.focus();
        input.select();

        // Function to clean up after editing
        function cleanupEdit() {
            if (cleanupCalled) return; // Prevent multiple cleanup calls
            cleanupCalled = true;
            
            // Check if the input is still in the DOM before attempting to remove it
            if (input.parentNode) {
                input.remove();
            }
            taskTextElement.style.display = '';
            taskItem.draggable = true;
            taskItem.style.cursor = 'move';
            isEditing = false;
            // Ensure the blur event listener is removed during cleanup
            input.removeEventListener('blur', saveEdit);
        }
        
        // Save on Enter key
        function saveEdit() {
            if (!isEditing) return; // Exit if already cancelled
            
            const newText = input.value.trim();
            if (newText !== '') {
                taskTextElement.textContent = newText;
            }
            cleanupEdit();
            saveTasks();
        }
        
        // Cancel on Escape key
        function cancelEdit() {
            if (!isEditing) return; // Exit if already saved
            
            // Remove blur event listener immediately to prevent saveEdit from being called
            input.removeEventListener('blur', saveEdit);
            
            // Use setTimeout to ensure blur event doesn't fire after this
            setTimeout(() => {
                cleanupEdit();
            }, 0);
        }
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        // Save when clicking outside
        input.addEventListener('blur', saveEdit);
        
        // Prevent drag events on the input
        input.addEventListener('mousedown', function(e) {
            e.stopPropagation();
        });
        
        input.addEventListener('dragstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevent any default touch behavior
        
        // Hide the action buttons immediately
        taskItem.classList.remove('active');
        
        // Store reference to the task item for deletion
        window.taskToDelete = taskItem;
        
        // Show the custom delete modal
        $('#deleteModal').modal('show');
    });
    
    return taskItem;
}

function addTaskToColumn(columnId, taskText) {
    const taskList = document.getElementById(columnId).querySelector('.task-list');
    const placeholder = taskList.querySelector('.placeholder');
    
    // Only create a new task if the taskText is not empty
    if (taskText.trim() === "") return;
    
    // Create and append the task element
    const taskItem = createTaskElement(taskText);
    taskList.appendChild(taskItem);
    
    // Hide placeholder if it's visible
    if (placeholder && placeholder.style.display !== 'none') {
        placeholder.style.display = 'none';
    }
    
    // Save the updated tasks
    saveTasks();
}

function updatePlaceholderVisibility(taskList, placeholder) {
    if (taskList.children.length > 0) {
        placeholder.style.display = 'none'; // Hide the placeholder if there are tasks
    } else {
        placeholder.style.display = 'flex'; // Show the placeholder if there are no tasks
    }
}

function saveTasks() {
    const tasks = {
        todo: Array.from(document.getElementById('todo').querySelector('.task-list').children)
            .filter(task => task.classList.contains('task-item'))
            .map(task => task.querySelector('.task-text').textContent),
        inProgress: Array.from(document.getElementById('in-progress').querySelector('.task-list').children)
            .filter(task => task.classList.contains('task-item'))
            .map(task => task.querySelector('.task-text').textContent),
        done: Array.from(document.getElementById('done').querySelector('.task-list').children)
            .filter(task => task.classList.contains('task-item'))
            .map(task => task.querySelector('.task-text').textContent)
    };
    
    localStorage.setItem("kanban", JSON.stringify(tasks)); // Change key to "kanban"

    // Update placeholders after saving
    updatePlaceholderVisibility(document.getElementById('todo').querySelector('.task-list'), 
                                document.getElementById('todo').querySelector('.placeholder'));
    updatePlaceholderVisibility(document.getElementById('in-progress').querySelector('.task-list'), 
                                document.getElementById('in-progress').querySelector('.placeholder'));
    updatePlaceholderVisibility(document.getElementById('done').querySelector('.task-list'), 
                                document.getElementById('done').querySelector('.placeholder'));
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

function getTasks(status) {
    const kanbanData = localStorage.getItem("kanban");
    if (!kanbanData) return []; // Return empty array if no data found

    const kanbanTasks = JSON.parse(kanbanData); // Parse the JSON data
    const tasks = kanbanTasks[status] || []; // Return the tasks for the specified status, or an empty array if not found

    console.log(`Tasks for ${status}:`, tasks); // Debugging line
    return tasks;
}

document.addEventListener("fullscreenchange", function () {
	if (!document.fullscreenElement) {
		$('#arrowPointsIn').hide();
		$('#arrowPointsOut').show();
	}
});

function escapeCSV(value) {
    // Escape double quotes by replacing them with two double quotes
    if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value; // Return the value as is if it's not a string
}

document.getElementById('download-tasks').addEventListener('click', function() {
    const todoTasks = getTasks('todo'); // Function to get 'To Do' tasks
    const inProgressTasks = getTasks('inProgress'); // Function to get 'In Progress' tasks
    const doneTasks = getTasks('done'); // Function to get 'Done' tasks

    const maxLength = Math.max(todoTasks.length, inProgressTasks.length, doneTasks.length);
    let csvContent = "To Do,In Progress,Done\n";

    // Create rows for the CSV
    for (let i = 0; i < maxLength; i++) {
        const todo = todoTasks[i] !== undefined ? `"${todoTasks[i]}"` : '""'; // Wrap in quotes
        const inProgress = inProgressTasks[i] !== undefined ? `"${inProgressTasks[i]}"` : '""'; // Wrap in quotes
        const done = doneTasks[i] !== undefined ? `"${doneTasks[i]}"` : '""'; // Wrap in quotes

        csvContent += `${todo},${inProgress},${done}\n`; // Add row to CSV
    }

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "kanban.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
});

$(document).ready(function() {
    $('#fullScreenButton').click(function() {
        toggleFullScreen();
    });
});
