$(document).ready(function() {
    $('#taskInput').focus();
    loadTasks();

    $('#addTask').click(addTask);
    $('#taskInput').on('keydown', function(event) {
        if (event.key === 'Enter') addTask();
    });

    function addTask() {
        let taskText = $('#taskInput').val().trim();
        if (taskText === '') {
            alert('Please enter a task');
            return;
        }

        // Prevent XSS by sanitizing the task text
        taskText = sanitizeInput(taskText);

        addTaskToContainer(taskText, false, true); // Add at the top
        saveTasks();
        $('#taskInput').val('');
        toggleNoTasksMessage(); 
    }

    // Event delegation for marking as complete and deleting
    $('#taskContainer').on('change', '.task-checkbox', function() {
        let $taskCard = $(this).closest('.task-card');
        let isChecked = $(this).is(':checked');
        
        if (isChecked) {
            $taskCard.addClass('task-completed').appendTo('#taskContainer'); // Move to bottom
        } else {
            $taskCard.removeClass('task-completed').prependTo('#taskContainer'); // Move to top
        }
        
        saveTasks();
    }).on('click', '.delete-task', function() {
        $(this).closest('.task-card').remove();
        saveTasks();
        toggleNoTasksMessage();
    });

    $('#taskContainer').on('click', '.task-text', function() {
        let $textElement = $(this);
        let currentText = $textElement.text();
        let $inputField = $('<input type="text" class="form-control task-edit-input">').val(currentText);
        
        $textElement.replaceWith($inputField);
        $inputField.focus();

        $inputField.on('blur keydown', function(event) {
            if (event.type === 'blur' || event.key === 'Enter') {
                let updatedText = $inputField.val().trim() || currentText;
                updatedText = sanitizeInput(updatedText);
                let $newTextElement = $('<span class="task-text">').text(updatedText);
                $inputField.replaceWith($newTextElement);
                saveTasks();
            }
        });
    });

    function addTaskToContainer(taskText, completed, isNew = false) {
        const completedClass = completed ? 'task-completed' : '';
        const checkedAttr = completed ? 'checked' : '';
        let taskHtml = `
            <div class="card task-card ${completedClass}">
                <div class="card-body d-flex align-items-center">
                    <input type="checkbox" class="form-check-input task-checkbox" ${checkedAttr}>
                    <span class="task-text ${completedClass}">${sanitizeInput(taskText)}</span>
                    <button class="btn btn-sm delete-task ml-auto">
                        <img src="img/icons/delete.svg" alt="Delete Icon" />
                    </button>
                </div>
            </div>`;

        // Place new tasks at the top only if they're incomplete and new
        if (isNew && !completed) {
            $('#taskContainer').prepend(taskHtml);
        } else {
            $('#taskContainer').append(taskHtml);
        }
    }

    function saveTasks() {
        let tasks = [];
        $('#taskContainer .task-card').each(function() {
            let taskText = $(this).find('.task-text').text();
            let completed = $(this).find('.task-checkbox').is(':checked');
            tasks.push({ text: taskText, completed: completed });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            addTaskToContainer(task.text, task.completed);
        });

        toggleNoTasksMessage(); // Update message visibility based on loaded tasks
    }

    // Toggle visibility of the "No tasks added" message
    function toggleNoTasksMessage() {
        if ($('#taskContainer .task-card').length === 0) {
            $('#noTasksMessage').show();
        } else {
            $('#noTasksMessage').hide();
        }
    }

    // Sanitization function to prevent XSS
    function sanitizeInput(input) {
        let element = document.createElement('div');
        if (input) {
            element.innerText = input;
            element.textContent = input;
        }
        return element.innerHTML;
    }
});