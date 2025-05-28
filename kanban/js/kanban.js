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

function addTaskToColumn(columnId, taskText) {
    const taskList = document.getElementById(columnId).querySelector('.task-list');
    const taskItem = document.createElement('div');

    // Only create a new task if the taskText is not empty
    if (taskText.trim() === "") return;

    const placeholder = taskList.querySelector('.placeholder');
    taskItem.textContent = taskText;

    taskItem.ondblclick = function() {
        const newTaskText = prompt("Edit task:", taskText);
        if (newTaskText) {
            taskItem.textContent = newTaskText;
            saveTasks();
        }
    };

    taskItem.onclick = function() {
        if (confirm("Delete this task?")) {
            const taskList = taskItem.parentNode; // Get the parent task list
            taskList.removeChild(taskItem);
    
            // Check if the task list has any actual tasks left
            const actualTasks = Array.from(taskList.children).filter(task => task.textContent !== "Start adding tasks");
            if (actualTasks.length === 0) {
                placeholder.style.display = 'flex'; // Show the placeholder
            }
    
            saveTasks();
        }
    };

    taskList.appendChild(taskItem);

    // Check if there are tasks and update the placeholder visibility
    updatePlaceholderVisibility(taskList, placeholder);
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
            .filter(task => task.textContent !== "Start adding tasks") // Exclude placeholder
            .map(task => task.textContent),
        inProgress: Array.from(document.getElementById('in-progress').querySelector('.task-list').children)
            .filter(task => task.textContent !== "Start adding tasks") // Exclude placeholder
            .map(task => task.textContent),
        done: Array.from(document.getElementById('done').querySelector('.task-list').children)
            .filter(task => task.textContent !== "Start adding tasks") // Exclude placeholder
            .map(task => task.textContent)
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
