document.addEventListener("DOMContentLoaded", loadTasks);

function loadTasks() {
    const mobileMessage = document.getElementById('mobile-message');

    // Check if the device is mobile
    if (window.innerWidth < 768) {
        // Show the message
        mobileMessage.style.display = 'flex';
        // Optionally, disable drag-and-drop listeners
        return; // Exit the function to prevent further initialization
    }

    const tasks = JSON.parse(localStorage.getItem("kanban")) || { todo: [], inProgress: [], done: [] }; // Change key to "kanban"
    tasks.todo.forEach(task => addTaskToColumn('todo', task));
    tasks.inProgress.forEach(task => addTaskToColumn('in-progress', task));
    tasks.done.forEach(task => addTaskToColumn('done', task));

    // Add resize event listener
    window.addEventListener('resize', () => checkMobileViewport(mobileMessage));
    //addDragAndDropListeners();
}

function checkMobileViewport(mobileMessage) {
    // Check if the device is mobile
    if (window.innerWidth < 768) {
        mobileMessage.style.display = 'flex'; // Show the message
    } else {
        mobileMessage.style.display = 'none'; // Hide the message
    }
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
    taskItem.draggable = true;

    taskItem.ondragstart = function(event) {
        event.dataTransfer.setData("text/plain", taskText);
        event.dataTransfer.setData("columnId", columnId);
        event.dataTransfer.setData("index", Array.from(taskList.children).indexOf(taskItem)); // Store index
    };

    taskItem.ondblclick = function() {
        const newTaskText = prompt("Edit task:", taskText);
        if (newTaskText) {
            taskItem.textContent = newTaskText;
            saveTasks();
        }
    };

    taskItem.onclick = function() {
        if (confirm("Delete this task?")) {
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
    
    taskItem.ondragover = function(event) {
        event.preventDefault();
        taskItem.classList.add('drop-target'); // Add a class to indicate it's a drop target
    };
    
    taskItem.ondragleave = function(event) {
        taskItem.classList.remove('drop-target'); // Remove the class when dragging leaves
    };
    
    taskItem.ondrop = function(event) {
        event.preventDefault();
        console.log('Task dropped');
        taskItem.classList.remove('drop-target'); // Remove the class on drop
        const sourceColumnId = event.dataTransfer.getData("columnId");
        const taskText = event.dataTransfer.getData("text/plain");
    
        if (sourceColumnId === columnId) {
            // Handle reordering within the same column
            const targetIndex = Array.from(taskList.children).indexOf(taskItem);
            const sourceIndex = event.dataTransfer.getData("index");
            if (sourceIndex !== targetIndex) {
                const sourceTaskList = document.getElementById(sourceColumnId).querySelector('.task-list');
                const taskToMove = Array.from(sourceTaskList.children).find(task => task.textContent === taskText);
                if (taskToMove) {
                    taskList.insertBefore(taskToMove, taskItem);
                }
                saveTasks();
            }
        } else {
            // Move the task to the new column
            const sourceTaskList = document.getElementById(sourceColumnId).querySelector('.task-list');
            const sourceTasks = Array.from(sourceTaskList.children);
            const taskToRemove = sourceTasks.find(task => task.textContent === taskText);
            if (taskToRemove) {
                sourceTaskList.removeChild(taskToRemove); // Remove the task from the source column
            }
            taskList.appendChild(taskToMove); // Add the task to the target column
            saveTasks();
        }
    
        // Check if the task list has any actual tasks left
        const actualTasks = Array.from(taskList.children).filter(task => task.textContent !== "Start adding tasks");
        if (actualTasks.length === 0) {
            const placeholder = taskList.querySelector('.placeholder');
            placeholder.style.display = 'flex'; // Show the placeholder
        } else {
            const placeholder = taskList.querySelector('.placeholder');
            placeholder.style.display = 'none'; // Hide the placeholder if there are tasks
        }
    };

    // Hide placeholder if there are tasks
    if (taskList.children.length > 0) {
        placeholder.style.display = 'none';
    }

    //addDragAndDropListeners();
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
}

function drop(event, columnId) {
    event.preventDefault();
    const sourceColumnId = event.dataTransfer.getData("columnId");
    const taskText = event.dataTransfer.getData("text/plain");
    console.log(`Dropped task: ${taskText} from ${sourceColumnId} to ${columnId}`);

    if (sourceColumnId !== columnId) {
        addTaskToColumn(columnId, taskText);
        const sourceTaskList = document.getElementById(sourceColumnId).querySelector('.task-list');
        const sourceTasks = Array.from(sourceTaskList.children);
        const taskToRemove = sourceTasks.find(task => task.textContent === taskText);
        if (taskToRemove) {
            sourceTaskList.removeChild(taskToRemove);
        }
        saveTasks();
    }
}

function handleKeyDown(event, columnId) {
    if (event.key === 'Enter') {
        addTask(columnId);
    }
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

let currentDragItem = null;

function handleTouchStart(event) {
    console.log('Touch Start:', event.target);
    currentDragItem = event.target; // Store the currently dragged item
    event.target.classList.add('dragging'); // Add a class for styling
}

function handleTouchMove(event) {
    if (!currentDragItem) return;

    const touch = event.touches[0]; // Get the touch coordinates
    currentDragItem.style.position = 'absolute'; // Make the item absolute
    currentDragItem.style.left = `${touch.clientX}px`; // Move item with touch
    currentDragItem.style.top = `${touch.clientY}px`;
}

function handleTouchEnd(event) {
    if (!currentDragItem) return;

    console.log('Touch End');
    const targetColumn = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    console.log({ targetColumn });

    // Check if the target is a valid column
    if (targetColumn && targetColumn.classList.contains('column')) {
        // Append the dragged item to the target column's task list
        const taskList = targetColumn.querySelector('.task-list');
        if (taskList) {
            taskList.appendChild(currentDragItem);
        }

        // Optionally, save the tasks after moving
        saveTasks();
    }

    currentDragItem.classList.remove('dragging'); // Remove the dragging class
    currentDragItem = null; // Clear the current drag item
}

function addDragAndDropListeners() {
    const taskItems = document.querySelectorAll('.task-list > div'); // Adjust selector as needed
    console.log('Adding drag and drop listeners to:', taskItems); // Log selected items
    taskItems.forEach(item => {
        item.addEventListener('touchstart', handleTouchStart);
        item.addEventListener('touchmove', handleTouchMove);
        item.addEventListener('touchend', handleTouchEnd);
    });
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
