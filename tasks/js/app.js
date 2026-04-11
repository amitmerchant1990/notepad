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
    initializeTaskSorting();
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
        const completedClass = completed ? 'task-completed' : '';
        const dragHandle = completed ? '' : `
            <button class="task-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">
                <span></span><span></span><span></span>
            </button>
        `;

        return $(`
            <div class="card task-card ${completedClass}">
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
        toggleActiveEmptyMessage();
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
        toggleActiveEmptyMessage();
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

    function toggleActiveEmptyMessage() {
        const hasActiveTasks = $activeTaskList.find('.task-card').length > 0;
        const hasCompletedTasks = $doneTaskList.find('.task-card').length > 0;
        $('#activeEmptyMessage').toggle(!hasActiveTasks && hasCompletedTasks);
    }

    function initializeTaskSorting() {
        if (!window.Sortable) {
            return;
        }

        new Sortable($activeTaskList[0], {
            animation: 180,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            handle: '.task-drag-handle',
            draggable: '.task-card',
            ghostClass: 'task-sort-ghost',
            chosenClass: 'task-sort-chosen',
            dragClass: 'task-dragging',
            onEnd: function() {
                saveTasks();
            }
        });
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

    function sanitizeInput(input) {
        const element = document.createElement('div');
        if (input) {
            element.innerText = input;
            element.textContent = input;
        }
        return element.innerHTML;
    }
});