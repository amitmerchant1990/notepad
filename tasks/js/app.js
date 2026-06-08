$(document).ready(function() {
    const darkmodeText = 'Enable dark mode [Ctrl/Cmd + M]';
    const lightmodeText = 'Enable light mode [Ctrl/Cmd + M]';
    const darkMetaColor = '#0d1117';
    const lightMetaColor = '#4d4d4d';
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const $taskInput = $('#taskInput');
    const $taskDueDate = $('#taskDueDate');
    const $taskReminderAt = $('#taskReminderAt');
    const $activeTaskList = $('#activeTaskList');
    const $doneTaskList = $('#doneTaskList');
    const $doneSeparator = $('#doneSeparator');
    const $editTaskModal = $('#editTaskModal');
    const $editTaskId = $('#editTaskId');
    const $editTaskDueDate = $('#editTaskDueDate');
    const $editTaskReminderAt = $('#editTaskReminderAt');
    const $reminderStack = $('#reminderStack');

    let reminderSweepInProgress = false;

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

    $('#mode').on('click', function() {
        toggleTheme();
    });

    $(document).on('keydown', function(event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm') {
            event.preventDefault();
            toggleTheme();
        }
    });

    const affiliateLinks = [
        {
            text: "Support Notepad's development — Buy me a coffee! ❤️",
            url: 'https://buymeacoffee.com/amitmerchant'
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
    startReminderChecks();

    $('#clearAllTasks').on('click', function() {
        $('#clearAllModal').modal('show');
    });

    $('#saveTaskDetails').on('click', function() {
        const taskId = $editTaskId.val();
        const $taskCard = findTaskCardById(taskId);

        if (!$taskCard.length) {
            $editTaskModal.modal('hide');
            return;
        }

        const task = normalizeTask(readTaskCard($taskCard));
        const nextDueDate = $editTaskDueDate.val().trim();
        const nextReminderAt = $editTaskReminderAt.val().trim();
        const reminderChanged = task.reminderAt !== nextReminderAt;

        task.dueDate = nextDueDate || '';
        task.reminderAt = nextReminderAt || '';

        if (reminderChanged) {
            task.reminderNotifiedAt = '';
            removeReminderToast(task.id);
        }

        applyTaskCardState($taskCard, task);
        saveTasks();
        $editTaskModal.modal('hide');
    });

    $('#confirmClearAll').on('click', function() {
        $activeTaskList.empty();
        $doneTaskList.empty();
        $reminderStack.empty();
        saveTasks({ skipReminderSweep: true });
        toggleNoTasksMessage();
        $('#clearAllModal').modal('hide');
    });

    $('#addTask').on('click', addTask);
    $taskInput.on('keydown', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    $('#taskContainer')
        .on('change', '.task-checkbox', function() {
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
        })
        .on('click', '.delete-task', function() {
            const $taskCard = $(this).closest('.task-card');
            removeReminderToast($taskCard.attr('data-task-id'));
            $taskCard.remove();
            saveTasks({ skipReminderSweep: true });
            toggleNoTasksMessage();
        })
        .on('click', '.edit-task', function() {
            const $taskCard = $(this).closest('.task-card');
            openTaskEditor($taskCard);
        })
        .on('click', '.task-text', function() {
            const $textElement = $(this);
            const $taskCard = $textElement.closest('.task-card');
            const currentText = $textElement.text();
            const $inputField = $('<input type="text" class="form-control task-edit-input">').val(currentText);

            $taskCard.addClass('is-editing');
            $textElement.replaceWith($inputField);
            $inputField.focus();

            $inputField.on('blur keydown', function(event) {
                if (event.type === 'blur' || event.key === 'Enter') {
                    const updatedText = $inputField.val().trim() || currentText;
                    const $newTextElement = $('<span class="task-text">').text(updatedText);
                    $inputField.replaceWith($newTextElement);
                    $taskCard.removeClass('is-editing');
                    saveTasks();
                }
            });
        });

    function addTask() {
        const taskText = $taskInput.val().trim();
        if (taskText === '') {
            $taskInput.focus();
            return;
        }

        const dueDate = $taskDueDate.val().trim();
        const reminderAt = $taskReminderAt.val().trim();
        const task = normalizeTask({
            id: createTaskId(),
            text: taskText,
            completed: false,
            dueDate: dueDate || '',
            reminderAt: reminderAt || '',
            reminderNotifiedAt: ''
        });

        addTaskToContainer(task, true);
        saveTasks();
        resetTaskInputs();
        toggleNoTasksMessage();
        $taskInput.focus();
    }

    function resetTaskInputs() {
        $taskInput.val('');
        $taskDueDate.val('');
        $taskReminderAt.val('');
    }

    function addTaskToContainer(task, isNew = false) {
        const normalizedTask = normalizeTask(task);
        const $taskCard = createTaskCard(normalizedTask);

        if (normalizedTask.completed) {
            $doneTaskList.append($taskCard);
        } else if (isNew) {
            $activeTaskList.prepend($taskCard);
        } else {
            $activeTaskList.append($taskCard);
        }

        applyTaskCardState($taskCard, normalizedTask);
    }

    function createTaskCard(task) {
        const displayText = task.text || '';
        const dragHandle = task.completed ? '' : `
            <button class="task-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">
                <span></span><span></span><span></span>
            </button>
        `;

        const $taskCard = $(`
            <div class="card task-card" data-task-id="${task.id}" data-due-date="${escapeAttribute(task.dueDate)}" data-reminder-at="${escapeAttribute(task.reminderAt)}" data-reminder-notified-at="${escapeAttribute(task.reminderNotifiedAt)}">
                <div class="card-body d-flex align-items-center">
                    ${dragHandle}
                    <div>
                        <input type="checkbox" class="form-check-input task-checkbox" ${task.completed ? 'checked' : ''}>
                    </div>
                    <div class="task-content">
                        <span class="task-text"></span>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm task-action-button edit-task" title="Edit due date or reminder" aria-label="Edit due date or reminder">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M7 2V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M17 2V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M3 9H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                                <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"></rect>
                            </svg>
                        </button>
                        <button class="btn btn-sm task-action-button delete-task" title="Delete this task">
                            <img src="img/icons/delete.svg" alt="Delete Icon" />
                        </button>
                    </div>
                </div>
            </div>
        `);

        $taskCard.find('.task-text').text(displayText);
        return $taskCard;
    }

    function applyTaskCardState($taskCard, task) {
        const normalizedTask = normalizeTask(task || readTaskCard($taskCard));
        const overdue = isTaskOverdue(normalizedTask);
        const metaHtml = buildTaskMetaHtml(normalizedTask, overdue);

        $taskCard
            .attr('data-task-id', normalizedTask.id)
            .attr('data-due-date', normalizedTask.dueDate || '')
            .attr('data-reminder-at', normalizedTask.reminderAt || '')
            .attr('data-reminder-notified-at', normalizedTask.reminderNotifiedAt || '')
            .toggleClass('task-completed', normalizedTask.completed)
            .toggleClass('task-overdue', overdue);

        const $checkbox = $taskCard.find('.task-checkbox');
        $checkbox.prop('checked', normalizedTask.completed);

        const $dragHandle = $taskCard.find('.task-drag-handle');
        if (normalizedTask.completed) {
            $dragHandle.remove();
        } else if ($dragHandle.length === 0) {
            $taskCard.find('.card-body').prepend(`
                <button class="task-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">
                    <span></span><span></span><span></span>
                </button>
            `);
        }

        let $taskMeta = $taskCard.find('.task-meta');
        if (metaHtml) {
            if (!$taskMeta.length) {
                $taskCard.find('.task-content').append('<div class="task-meta"></div>');
                $taskMeta = $taskCard.find('.task-meta').last();
            }

            $taskMeta.html(metaHtml);
        } else {
            $taskMeta.remove();
        }
    }

    function setTaskCompletedState($taskCard, completed) {
        const task = normalizeTask(readTaskCard($taskCard));
        task.completed = completed;
        applyTaskCardState($taskCard, task);
    }

    function readTaskCard($taskCard) {
        return {
            id: $taskCard.attr('data-task-id') || '',
            text: $taskCard.find('.task-text').text(),
            completed: $taskCard.find('.task-checkbox').is(':checked'),
            dueDate: $taskCard.attr('data-due-date') || '',
            reminderAt: $taskCard.attr('data-reminder-at') || '',
            reminderNotifiedAt: $taskCard.attr('data-reminder-notified-at') || ''
        };
    }

    function openTaskEditor($taskCard) {
        const task = normalizeTask(readTaskCard($taskCard));

        $editTaskId.val(task.id);
        $editTaskDueDate.val(task.dueDate || '');
        $editTaskReminderAt.val(task.reminderAt || '');
        $editTaskModal.modal('show');
        $editTaskDueDate.trigger('focus');
    }

    function findTaskCardById(taskId) {
        return taskId ? $(`.task-card[data-task-id="${taskId}"]`).first() : $();
    }

    function normalizeTask(task) {
        const normalizedTask = task || {};

        return {
            id: normalizedTask.id || createTaskId(),
            text: normalizedTask.text || '',
            completed: Boolean(normalizedTask.completed),
            dueDate: normalizedTask.dueDate || '',
            reminderAt: normalizedTask.reminderAt || '',
            reminderNotifiedAt: normalizedTask.reminderNotifiedAt || ''
        };
    }

    function createTaskId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function buildTaskMetaHtml(task, overdue) {
        const metaParts = [];

        if (task.dueDate) {
            metaParts.push(`
                <span class="task-meta-chip task-meta-chip--due ${overdue ? 'task-meta-chip--overdue' : ''}">
                    ${overdue ? 'Overdue' : 'Due'} ${formatDateTime(task.dueDate)}
                </span>
            `);
        }

        if (task.reminderAt) {
            metaParts.push(`
                <span class="task-meta-chip task-meta-chip--reminder">
                    Reminder ${formatDateTime(task.reminderAt)}
                </span>
            `);
        }

        return metaParts.join('');
    }

    function formatDateTime(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    }

    function isTaskOverdue(task) {
        if (!task.dueDate || task.completed) {
            return false;
        }

        const dueDateTime = new Date(task.dueDate).getTime();
        return !Number.isNaN(dueDateTime) && dueDateTime < Date.now();
    }

    function saveTasks(options = {}) {
        const tasks = [];

        $activeTaskList.find('.task-card').each(function() {
            tasks.push(readTaskCard($(this)));
        });

        $doneTaskList.find('.task-card').each(function() {
            tasks.push(readTaskCard($(this)));
        });

        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskCount();
        updateDoneSeparator();
        toggleActiveEmptyMessage();
        toggleNoTasksMessage();

        if (!options.skipReminderSweep) {
            checkTaskReminders();
        }
    }

    function loadTasks() {
        let tasks = [];

        try {
            const storedTasks = JSON.parse(localStorage.getItem('tasks'));
            if (Array.isArray(storedTasks)) {
                tasks = storedTasks;
            }
        } catch (error) {
            tasks = [];
        }

        $activeTaskList.empty();
        $doneTaskList.empty();

        tasks.forEach(function(task) {
            addTaskToContainer(normalizeTask(task));
        });

        toggleNoTasksMessage();
        updateTaskCount();
        updateDoneSeparator();
        toggleActiveEmptyMessage();
        checkTaskReminders();
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

    function checkTaskReminders() {
        if (reminderSweepInProgress) {
            return;
        }

        reminderSweepInProgress = true;
        try {
            let reminderUpdated = false;

            $activeTaskList.find('.task-card').each(function() {
                const $taskCard = $(this);
                const task = normalizeTask(readTaskCard($taskCard));

                if (!task.reminderAt || task.completed) {
                    return;
                }

                const reminderTime = new Date(task.reminderAt).getTime();
                if (Number.isNaN(reminderTime) || reminderTime > Date.now()) {
                    return;
                }

                if (task.reminderNotifiedAt === task.reminderAt) {
                    return;
                }

                task.reminderNotifiedAt = task.reminderAt;
                applyTaskCardState($taskCard, task);
                showReminderToast(task);
                reminderUpdated = true;
            });

            if (reminderUpdated) {
                saveTasks({ skipReminderSweep: true });
            }
        } finally {
            reminderSweepInProgress = false;
        }
    }

    function startReminderChecks() {
        window.setInterval(checkTaskReminders, 30000);
        window.addEventListener('focus', checkTaskReminders);
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                checkTaskReminders();
            }
        });
    }

    function showReminderToast(task) {
        const reminderMessage = task.dueDate
            ? `${task.text} is due ${formatDateTime(task.dueDate)}.`
            : `${task.text} is ready for attention.`;

        const $toast = $(`
            <div class="reminder-toast" data-task-id="${task.id}">
                <div>
                    <p class="reminder-toast__title">Task reminder</p>
                    <p class="reminder-toast__body"></p>
                </div>
                <button type="button" class="reminder-toast__dismiss" aria-label="Dismiss reminder">&times;</button>
            </div>
        `);

        $toast.find('.reminder-toast__body').text(reminderMessage);
        $toast.find('.reminder-toast__dismiss').on('click', function() {
            dismissReminderToast($toast);
        });

        $reminderStack.append($toast);

        window.setTimeout(function() {
            dismissReminderToast($toast);
        }, 10000);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task reminder', {
                body: reminderMessage
            });
        }
    }

    function dismissReminderToast($toast) {
        if (!$toast || !$toast.length) {
            return;
        }

        $toast.stop(true, true).fadeOut(180, function() {
            $(this).remove();
        });
    }

    function removeReminderToast(taskId) {
        if (!taskId) {
            return;
        }

        $reminderStack.find(`[data-task-id="${taskId}"]`).remove();
    }

    function escapeAttribute(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

});
