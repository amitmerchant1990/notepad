$(document).ready(function() {
    const darkmodeText = 'Enable dark mode [Ctrl/Cmd + M]';
    const lightmodeText = 'Enable light mode [Ctrl/Cmd + M]';
    const darkMetaColor = '#0d1117';
    const lightMetaColor = '#4d4d4d';
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const $taskInput = $('#taskInput');
    const $activeTaskList = $('#activeTaskList');
    const $doneTaskList = $('#doneTaskList');
    const $doneSeparator = $('#doneSeparator');
    let draggedTask = null;
    let dragArmedTask = null;

    function enableDarkMode() {
        $('body').addClass('dark');
        $('#mode').attr('title', lightmodeText);
        $('#themeIcon').attr('src', '../img/navbar/light-theme.svg');
        metaThemeColor.setAttribute('content', darkMetaColor);
        localStorage.setItem('tasksMode', 'dark');
    }

    function enableLightMode() {
        $('body').removeClass('dark');
        $('#mode').attr('title', darkmodeText);
        $('#themeIcon').attr('src', '../img/navbar/dark-theme.svg');
        metaThemeColor.setAttribute('content', lightMetaColor);
        localStorage.setItem('tasksMode', 'light');
    }

    function enableDeviceTheme() {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            enableDarkMode();
        } else {
            enableLightMode();
        }
        localStorage.setItem('tasksMode', 'device');
    }

    function toggleTheme() {
        if ($('body').hasClass('dark')) {
            enableLightMode();
        } else {
            enableDarkMode();
        }
    }

    const savedMode = localStorage.getItem('tasksMode');
    if (savedMode === 'dark') {
        enableDarkMode();
    } else if (savedMode === 'light') {
        enableLightMode();
    } else {
        enableDeviceTheme();
    }

    $('#mode').click(function() {
        toggleTheme();
    });

    $(document).keydown(function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
            e.preventDefault();
            toggleTheme();
        }
    });

    const affiliateLinks = [
        {
            text: "Support Notepad's development — Buy me a coffee! ❤️",
            url: "https://buymeacoffee.com/amitmerchant"
        }
    ];

    function showRandomAffiliateLink() {
        const randomIndex = Math.floor(Math.random() * affiliateLinks.length);
        const affiliate = affiliateLinks[randomIndex];

        $('#affiliateText').text(affiliate.text);
        $('#affiliateLink').attr('href', affiliate.url);
        $('#affiliatePopup').addClass('show');
    }

    $('#closeAffiliatePopup').on('click', function() {
        $('#affiliatePopup').removeClass('show');
    });

    setTimeout(showRandomAffiliateLink, 5000);

    $taskInput.focus();
    loadTasks();

    $('#clearAllTasks').click(function() {
        $('#clearAllModal').modal('show');
    });

    $('#confirmClearAll').click(function() {
        $activeTaskList.empty();
        $doneTaskList.empty();
        saveTasks();
        toggleNoTasksMessage();
        $('#clearAllModal').modal('hide');
    });

    $('#addTask').click(addTask);
    $taskInput.on('keydown', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    $activeTaskList.on('mousedown touchstart', '.task-drag-handle', function() {
        dragArmedTask = $(this).closest('.task-card')[0];
    });

    $(document).on('mouseup touchend touchcancel', function() {
        if (!draggedTask) {
            dragArmedTask = null;
        }
    });

    $activeTaskList.on('dragstart', '.task-card[draggable="true"]', function(event) {
        if (dragArmedTask !== this) {
            event.preventDefault();
            return;
        }

        draggedTask = this;
        event.originalEvent.dataTransfer.effectAllowed = 'move';
        event.originalEvent.dataTransfer.setData('text/plain', 'active-task');
        $(this).addClass('task-dragging');
    });

    $activeTaskList.on('dragend', '.task-card[draggable="true"]', function() {
        $(this).removeClass('task-dragging');
        draggedTask = null;
        dragArmedTask = null;
        saveTasks();
    });

    $activeTaskList.on('dragover', function(event) {
        if (!draggedTask) {
            return;
        }

        event.preventDefault();
        const afterElement = getDragAfterElement(this, event.originalEvent.clientY);

        if (!afterElement) {
            this.appendChild(draggedTask);
        } else if (afterElement !== draggedTask) {
            this.insertBefore(draggedTask, afterElement);
        }
    });

    $activeTaskList.on('drop', function(event) {
        if (draggedTask) {
            event.preventDefault();
        }
    });

    $('#taskContainer').on('change', '.task-checkbox', function() {
        const $taskCard = $(this).closest('.task-card');
        const isChecked = $(this).is(':checked');

        setTaskCompletedState($taskCard, isChecked);

        if (isChecked) {
            $doneTaskList.append($taskCard);

            const totalTasks = $('.task-card').length;
            const completedTasks = $doneTaskList.find('.task-card').length;

            if (totalTasks > 0 && totalTasks === completedTasks) {
                confetti({
                    origin: { x: 0, y: 1 },
                    particleCount: 100,
                    spread: 70,
                    angle: 60
                });

                confetti({
                    origin: { x: 1, y: 1 },
                    particleCount: 100,
                    spread: 70,
                    angle: 120
                });
            }
        } else {
            $activeTaskList.prepend($taskCard);
        }

        saveTasks();
    }).on('click', '.delete-task', function() {
        $(this).closest('.task-card').remove();
        saveTasks();
        toggleNoTasksMessage();
    });

    $('#taskContainer').on('click', '.task-text', function() {
        const $textElement = $(this);
        const currentText = $textElement.text();
        const $inputField = $('<input type="text" class="form-control task-edit-input">').val(currentText);

        $textElement.replaceWith($inputField);
        $inputField.focus();

        $inputField.on('blur keydown', function(event) {
            if (event.type === 'blur' || event.key === 'Enter') {
                let updatedText = $inputField.val().trim() || currentText;
                updatedText = sanitizeInput(updatedText);
                const $newTextElement = $('<span class="task-text">').text(updatedText);
                $inputField.replaceWith($newTextElement);
                saveTasks();
            }
        });
    });

    function addTask() {
        let taskText = $taskInput.val().trim();
        if (taskText === '') {
            $taskInput.focus();
            return;
        }

        taskText = sanitizeInput(taskText);

        addTaskToContainer(taskText, false, true);
        saveTasks();
        $taskInput.val('');
        toggleNoTasksMessage();
        $taskInput.focus();
    }

    function addTaskToContainer(taskText, completed, isNew = false) {
        const $taskCard = createTaskCard(taskText, completed);

        if (completed) {
            $doneTaskList.append($taskCard);
        } else if (isNew) {
            $activeTaskList.prepend($taskCard);
        } else {
            $activeTaskList.append($taskCard);
        }
    }

    function createTaskCard(taskText, completed) {
        const checkedAttr = completed ? 'checked' : '';
        const draggableAttr = completed ? 'false' : 'true';
        const completedClass = completed ? 'task-completed' : '';
        const dragHandle = completed ? '' : `
            <button class="task-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">
                <span></span><span></span><span></span>
            </button>
        `;

        return $(`
            <div class="card task-card ${completedClass}" draggable="${draggableAttr}">
                <div class="card-body d-flex align-items-center">
                    ${dragHandle}
                    <div>
                        <input type="checkbox" class="form-check-input task-checkbox" ${checkedAttr}>
                    </div>
                    <span class="task-text">${sanitizeInput(taskText)}</span>
                    <button class="btn btn-sm delete-task ml-auto" title="Delete this task">
                        <img src="img/icons/delete.svg" alt="Delete Icon" />
                    </button>
                </div>
            </div>
        `);
    }

    function setTaskCompletedState($taskCard, completed) {
        $taskCard.toggleClass('task-completed', completed);
        $taskCard.attr('draggable', completed ? 'false' : 'true');
        $taskCard.find('.task-drag-handle').remove();

        if (!completed) {
            $taskCard.find('.card-body').prepend(`
                <button class="task-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">
                    <span></span><span></span><span></span>
                </button>
            `);
        }
    }

    function saveTasks() {
        const tasks = [];

        $activeTaskList.find('.task-card').each(function() {
            tasks.push({
                text: $(this).find('.task-text').text(),
                completed: false
            });
        });

        $doneTaskList.find('.task-card').each(function() {
            tasks.push({
                text: $(this).find('.task-text').text(),
                completed: true
            });
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskCount();
        updateDoneSeparator();
    }

    function loadTasks() {
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

        $activeTaskList.empty();
        $doneTaskList.empty();

        tasks.forEach(function(task) {
            addTaskToContainer(task.text, task.completed);
        });

        toggleNoTasksMessage();
        updateTaskCount();
        updateDoneSeparator();
    }

    function updateTaskCount() {
        const totalTasks = $('.task-card').length;
        const completedTasks = $doneTaskList.find('.task-card').length;
        $('#taskCounter').text(`${completedTasks} / ${totalTasks}`);
    }

    function updateDoneSeparator() {
        const hasCompletedTasks = $doneTaskList.find('.task-card').length > 0;
        $doneSeparator.toggle(hasCompletedTasks);
    }

    function toggleNoTasksMessage() {
        const hasTasks = $('.task-card').length > 0;

        if (hasTasks) {
            $('#noTasksMessage').hide();
            $('#clearAllContainer').show();
        } else {
            $('#noTasksMessage').show();
            $('#clearAllContainer').hide();
        }
    }

    function getDragAfterElement(container, pointerY) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.task-dragging)')];

        return draggableElements.reduce(function(closest, child) {
            const box = child.getBoundingClientRect();
            const offset = pointerY - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }

            return closest;
        }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
    }

    function sanitizeInput(input) {
        const element = document.createElement('div');
        if (input) {
            element.innerText = input;
            element.textContent = input;
        }
        return element.innerHTML;
    }
});