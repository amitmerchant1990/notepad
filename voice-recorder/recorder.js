class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.stream = null;

        this.recordButton = document.getElementById('recordButton');
        this.stopButton = document.getElementById('stopButton');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingTime = document.getElementById('recordingTime');
        this.recordingsList = document.getElementById('recordings');

        this.setupEventListeners();
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
            this.recordingStatus.textContent = 'Error: Microphone access denied';
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
        this.recordingStatus.textContent = 'Recording...';
        
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
        this.recordingStatus.textContent = '';
        
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

    async saveRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const mp3Blob = await this.convertToMp3(audioBlob);
        const audioUrl = URL.createObjectURL(mp3Blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const recordingItem = document.createElement('div');
        recordingItem.className = 'recording-item';
        
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = audioUrl;
        
        const downloadButton = document.createElement('button');
        downloadButton.className = 'download-button';
        downloadButton.textContent = 'Download';
        downloadButton.addEventListener('click', () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            downloadLink.download = `recording-${timestamp}.mp3`;
            downloadLink.click();
        });
        
        recordingItem.appendChild(audio);
        recordingItem.appendChild(downloadButton);
        this.recordingsList.insertBefore(recordingItem, this.recordingsList.firstChild);
    }
}

// Initialize the voice recorder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceRecorder();
});
