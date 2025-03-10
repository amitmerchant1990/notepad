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
canvas.freeDrawingBrush.width = 3;

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