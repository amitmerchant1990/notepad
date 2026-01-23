document.addEventListener("DOMContentLoaded", loadTasks);

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
        filter: '.placeholder',
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
        filter: '.placeholder',
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
        filter: '.placeholder',
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
    editBtn.innerHTML = `<svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#000000" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>`;
    editBtn.title = 'Edit task';
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.innerHTML = `<svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#000000" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>`;
    deleteBtn.title = 'Delete task';
    
    // Add buttons to actions container
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    
    // Add elements to task item
    taskItem.appendChild(taskTextElement);
    taskItem.appendChild(actionsDiv);
    
    // Add event listeners
    editBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const newText = prompt('Edit task:', taskTextElement.textContent);
        if (newText !== null && newText.trim() !== '') {
            taskTextElement.textContent = newText.trim();
            saveTasks();
        }
    });
    
    deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this task?')) {
            const taskList = taskItem.parentNode;
            taskList.removeChild(taskItem);
            
            // Show placeholder if no tasks left
            const actualTasks = Array.from(taskList.children).filter(task => !task.classList.contains('placeholder'));
            const placeholder = taskList.querySelector('.placeholder');
            if (actualTasks.length === 0 && placeholder) {
                placeholder.style.display = 'flex';
            }
            
            saveTasks();
        }
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
