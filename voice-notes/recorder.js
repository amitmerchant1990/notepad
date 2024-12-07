class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.stream = null;
        this.db = null;

        this.recordButton = document.getElementById('recordButton');
        this.stopButton = document.getElementById('stopButton');
        this.recordingTime = document.getElementById('recordingTime');
        this.recordingDot = document.querySelector('.recording-dot');
        this.recordingsList = document.getElementById('recordings');
        this.emptyState = document.getElementById('emptyState');

        this.initializeDB();
        this.setupEventListeners();
    }

    async initializeDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('VoiceNotesDB', 1);

            request.onerror = () => {
                console.error('Failed to open database');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.loadSavedRecordings();
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('recordings')) {
                    const store = db.createObjectStore('recordings', { keyPath: 'timestamp' });
                    store.createIndex('timestamp', 'timestamp', { unique: true });
                }
            };
        });
    }

    async loadSavedRecordings() {
        const transaction = this.db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const request = store.getAll();

        request.onsuccess = () => {
            const recordings = request.result;
            
            // Sort recordings by timestamp in descending order (newest first)
            recordings.sort((a, b) => a.timestamp - b.timestamp);
            
            if (recordings.length > 0) {
                this.emptyState.classList.add('hidden');
                // Clear existing recordings from UI
                //this.recordingsList.innerHTML = '';
                // Add recordings in sorted order
                recordings.forEach(recording => {
                    this.createRecordingElement(recording.blob, recording.timestamp);
                });
            } else {
                this.emptyState.classList.remove('hidden');
            }
        };

        request.onerror = () => {
            console.error('Error loading recordings:', request.error);
            this.emptyState.classList.remove('hidden');
        };
    }

    setupEventListeners() {
        this.recordButton.addEventListener('click', () => this.startRecording());
        this.stopButton.addEventListener('click', () => this.stopRecording());
    }

    async initializeRecorder() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.recordingDot.classList.remove('active');
            return false;
        }
    }

    async startRecording() {
        if (!this.mediaRecorder) {
            const initialized = await this.initializeRecorder();
            if (!initialized) return;
        }

        this.audioChunks = [];
        this.mediaRecorder.start();
        this.isRecording = true;
        
        this.recordButton.disabled = true;
        this.stopButton.disabled = false;
        this.recordingDot.classList.add('active');
        
        this.startTime = Date.now();
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.stream.getTracks().forEach(track => track.stop());
            this.mediaRecorder = null;
            this.stream = null;
        }
        
        this.isRecording = false;
        this.recordButton.disabled = false;
        this.stopButton.disabled = true;
        this.recordingDot.classList.remove('active');
        
        clearInterval(this.timerInterval);
        this.recordingTime.textContent = '00:00';
    }

    updateTimer() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        this.recordingTime.textContent = `${minutes}:${seconds}`;
    }

    async convertToMp3(audioData) {
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(await audioData.arrayBuffer());
        
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const samples = audioBuffer.length;
        
        const left = audioBuffer.getChannelData(0);
        const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
        
        const convert = (float) => Math.max(-32768, Math.min(32768, Math.round(float * 32768)));
        const leftData = new Int16Array(left.map(convert));
        const rightData = new Int16Array(right.map(convert));
        
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
        const mp3Data = [];
        
        const sampleBlockSize = 1152;
        for (let i = 0; i < samples; i += sampleBlockSize) {
            const leftChunk = leftData.subarray(i, i + sampleBlockSize);
            const rightChunk = rightData.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        
        const final = mp3encoder.flush();
        if (final.length > 0) {
            mp3Data.push(final);
        }
        
        const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
        const mp3Output = new Uint8Array(totalLength);
        let offset = 0;
        for (const data of mp3Data) {
            mp3Output.set(data, offset);
            offset += data.length;
        }
        
        return new Blob([mp3Output], { type: 'audio/mp3' });
    }

    createRecordingElement(blob, timestamp) {
        const audioUrl = URL.createObjectURL(blob);
        const formattedDate = new Date(timestamp).toLocaleString();
        
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        
        const recordingInfo = document.createElement('div');
        recordingInfo.className = 'recording-info';
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'recording-date';
        dateLabel.textContent = formattedDate;
        
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = audioUrl;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button';
        downloadButton.textContent = 'Download';
        downloadButton.addEventListener('click', () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            downloadLink.download = `recording-${timestamp}.mp3`;
            downloadLink.click();
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => this.deleteRecording(timestamp, recordingItem));
        
        buttonContainer.appendChild(downloadButton);
        buttonContainer.appendChild(deleteButton);
        recordingInfo.appendChild(dateLabel);
        recordingInfo.appendChild(audio);
        recordingItem.appendChild(recordingInfo);
        recordingItem.appendChild(buttonContainer);
        
        // Add with fade in animation
        recordingItem.style.opacity = '0';
        this.recordingsList.insertBefore(recordingItem, this.recordingsList.firstChild);
        
        // Trigger reflow
        recordingItem.offsetHeight;
        recordingItem.style.transition = 'opacity 0.3s ease-in-out';
        recordingItem.style.opacity = '1';
        
        // Hide empty state when adding a recording
        this.emptyState.classList.add('hidden');
    }

    async saveRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const mp3Blob = await this.convertToMp3(audioBlob);
        const timestamp = Date.now();

        // Save to IndexedDB
        const transaction = this.db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        store.add({
            timestamp: timestamp,
            blob: mp3Blob
        });

        this.createRecordingElement(mp3Blob, timestamp);
    }

    deleteRecording(timestamp, element) {
        const transaction = this.db.transaction(['recordings'], 'readwrite');
        const store = transaction.objectStore('recordings');
        const request = store.delete(timestamp);

        request.onsuccess = () => {
            // Fade out animation
            element.style.transition = 'opacity 0.3s ease-in-out';
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.remove();
                
                // Create a new transaction for counting
                const countTransaction = this.db.transaction(['recordings'], 'readonly');
                const countStore = countTransaction.objectStore('recordings');
                const countRequest = countStore.count();
                
                countRequest.onsuccess = () => {
                    console.log('Recordings count:', countRequest.result);
                    if (countRequest.result === 0) {
                        // Show empty state with fade in
                        this.emptyState.style.display = '';
                        this.emptyState.style.opacity = '0';
                        this.emptyState.classList.remove('hidden');
                        
                        // Trigger reflow
                        this.emptyState.offsetHeight;
                        this.emptyState.style.transition = 'opacity 0.3s ease-in-out';
                        this.emptyState.style.opacity = '1';
                    }
                };
            }, 300);
        };
    }
}

// Initialize the voice recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceRecorder();
});
