const canvas = new fabric.Canvas('canvas', {
    isDrawingMode: true
});

let undoStack = [canvas.toJSON()]; // Initialize with the empty state
const MAX_UNDO_STACK_SIZE = 20; // Set a maximum size for the undo stack

// Function to compare relevant properties of the canvas state
function isStateDifferent(lastState, currentState) {
    const lastObjects = lastState.objects.length;
    const currentObjects = currentState.objects.length;
    
    return lastObjects !== currentObjects; // Compare number of objects
}

// Capture the current state of the canvas after each drawing action
canvas.on('object:added', () => {
    const currentState = canvas.toJSON();

    // Only push if the current state is different from the last state
    if (isStateDifferent(undoStack[undoStack.length - 1], currentState)) {
        undoStack.push(currentState);

        // Remove the oldest state if the stack exceeds the maximum size
        if (undoStack.length > MAX_UNDO_STACK_SIZE) {
            undoStack.shift(); // Remove the first item
        }
    }
});

// Undo functionality
document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault(); // Prevent default behavior

        if (undoStack.length > 1) { // Ensure there's a previous state to go back to
            undoStack.pop(); // Remove the current state
            const lastState = undoStack[undoStack.length - 1]; // Get the last state

            canvas.off('object:added'); // Temporarily disable the event

            canvas.loadFromJSON(lastState, function () {
                canvas.renderAll();
                
                // Re-enable the event after loading
                canvas.on('object:added', function (e) {
                    const currentState = canvas.toJSON();

                    // Only push if the current state is different from the last state
                    if (isStateDifferent(undoStack[undoStack.length - 1], currentState)) {
                        undoStack.push(currentState);

                        // Remove the oldest state if the stack exceeds the maximum size
                        if (undoStack.length > MAX_UNDO_STACK_SIZE) {
                            undoStack.shift(); // Remove the first item
                        }
                    }
                });
            });
        }
    }
});

// Set canvas size to fill the container
// Function to resize canvas
function resizeCanvas() {
    const drawingpadContainer = document.getElementById('drawingpad');
    const width = drawingpadContainer.offsetWidth;
    const height = drawingpadContainer.offsetHeight;
    
    // Save the scale before resizing
    const scaleX = width / canvas.width;
    const scaleY = height / canvas.height;
    
    // Resize canvas
    canvas.setWidth(width);
    canvas.setHeight(height);
    
    // Scale all objects proportionally
    canvas.getObjects().forEach(obj => {
        obj.scaleX *= scaleX;
        obj.scaleY *= scaleY;
        obj.left *= scaleX;
        obj.top *= scaleY;
        obj.setCoords();
    });

    canvas.renderAll();
}

// Set drawing options
canvas.freeDrawingBrush.color = 'black';
canvas.freeDrawingBrush.width = 2; // Default to smallest size

function createCursorDataUrl(svg) {
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

function getPenCursor(size) {
    const penRadiusMap = {
        2: 1,
        5: 2,
        10: 3,
        20: 4
    };
    const radius = penRadiusMap[size] || 1;
    const dimension = 20;
    const center = 10;
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}" viewBox="0 0 24 24" fill="#000000" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="${radius}" />
        </svg>
    `;

    return `${createCursorDataUrl(svg)} ${center} ${center}, crosshair`;
}

function getEraserCursor() {
    const svg = `
        <svg viewBox="0 0 15 15" width="15" height="15" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <rect x="2.3" y="2.3" width="10.4" height="10.4" fill="#FFFFFF"/>
            <path fill="#000000" d="M12.7,2.3v10.4H2.3V2.3H12.7 M13,1H2C1.4477,1,1,1.4477,1,2v11c0,0.5523,0.4477,1,1,1h11c0.5523,0,1-0.4477,1-1V2 C14,1.4477,13.5523,1,13,1L13,1z"></path>
        </svg>
    `;

    return `${createCursorDataUrl(svg)} 4 20, auto`;
}

function updateCanvasCursor() {
    const cursor = currentToolMode === 'eraser'
        ? getEraserCursor()
        : getPenCursor(currentPenSize);

    canvas.freeDrawingCursor = cursor;

    if (canvas.upperCanvasEl) {
        canvas.upperCanvasEl.style.cursor = cursor;
    }
}

// Tool mode functionality
const toolModeButtons = document.querySelectorAll('.tool-mode');
const penSizeButtons = document.querySelectorAll('.pen-size');
let currentToolMode = 'pen';
let currentPenSize = 2;

// Tool mode switching
toolModeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tool mode buttons
        toolModeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update tool mode
        currentToolMode = button.dataset.mode;
        
        // Apply tool mode settings
        if (currentToolMode === 'eraser') {
            canvas.freeDrawingBrush.color = 'white'; // Eraser draws in white
        } else {
            canvas.freeDrawingBrush.color = 'black'; // Pen draws in black
        }
        
        // Apply current size to the new tool mode
        canvas.freeDrawingBrush.width = currentPenSize;
        updateCanvasCursor();
    });
});

// Pen size functionality
penSizeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all size buttons
        penSizeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update pen size
        currentPenSize = parseInt(button.dataset.size);
        canvas.freeDrawingBrush.width = currentPenSize;
        updateCanvasCursor();
    });
});

// Download canvas as image with white background
document.getElementById('download').addEventListener('click', () => {
    const originalDataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
    });

    const imgElement = new Image();
    imgElement.src = originalDataURL;
    imgElement.onload = () => {
        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        ctx.drawImage(imgElement, 0, 0);

        const newDataURL = newCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = newDataURL;
        link.download = 'drawingpad-' + Date.now() + '.png';
        link.click();
    };
});

// Clear canvas functionality
document.getElementById('clear').addEventListener('click', () => {
    canvas.clear(); // Clear the canvas
    canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas)); // Set background to white
});

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial resize
updateCanvasCursor();