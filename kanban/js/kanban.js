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
        onMove: function(evt) {
            const target = evt.related; // The element being dragged over
            if (target && target.classList.contains('task-list')) {
                target.classList.add('drop-target'); // Add class to the target list
            }
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
        onMove: function(evt) {
            const target = evt.related; // The element being dragged over
            if (target && target.classList.contains('task-list')) {
                target.classList.add('drop-target'); // Add class to the target list
            }
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
        onMove: function(evt) {
            const target = evt.related; // The element being dragged over
            if (target && target.classList.contains('task-list')) {
                target.classList.add('drop-target'); // Add class to the target list
            }
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

document.addEventListener("fullscreenchange", function () {
	if (!document.fullscreenElement) {
		$('#arrowPointsIn').hide();
		$('#arrowPointsOut').show();
	}
});

$(document).ready(function() {
    $('#fullScreenButton').click(function() {
        toggleFullScreen();
    });
});
