let mediaRecorder;
let recordedChunks = [];
let startTime;
let timerInterval;

// DOM elementleri
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const preview = document.getElementById('preview');
const recordedVideo = document.getElementById('recordedVideo');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelect = document.getElementById('formatSelect');
const timer = document.getElementById('timer');
const includeAudio = document.getElementById('includeAudio');
const includeMic = document.getElementById('includeMic');

// Event listeners
startBtn.addEventListener('click', startRecording);
pauseBtn.addEventListener('click', pauseRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', downloadRecording);

// Ekran paylaşımı için gerekli ayarlar
async function getDisplayMediaOptions() {
    const audioOptions = {
        systemAudio: includeAudio.checked ? "include" : "exclude",
        echoCancellation: true,
        noiseSuppression: true,
    };

    // Mikrofon ses kaynağı için getUserMedia kullanılacak
    let micStream = null;
    if (includeMic.checked) {
        try {
            micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
        } catch (err) {
            console.error('Mikrofon erişimi hatası:', err);
        }
    }

    return {
        video: {
            cursor: "always",
            displaySurface: "monitor",
        },
        audio: audioOptions,
        micStream: micStream
    };
}

// Kayıt başlatma fonksiyonu
async function startRecording() {
    try {
        const options = await getDisplayMediaOptions();
        const screenStream = await navigator.mediaDevices.getDisplayMedia(options);
        
        // Mikrofon sesini ekran paylaşımı ile birleştirme
        if (options.micStream) {
            const tracks = [...screenStream.getTracks(), ...options.micStream.getTracks()];
            const combinedStream = new MediaStream(tracks);
            preview.srcObject = combinedStream;
            
            mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });
        } else {
            preview.srcObject = screenStream;
            mediaRecorder = new MediaRecorder(screenStream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });
        }

        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;

        mediaRecorder.start();
        startTime = Date.now();
        startTimer();

        // Buton durumlarını güncelle
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        stopBtn.disabled = false;

    } catch (err) {
        console.error("Hata:", err);
    }
}

// Kaydı duraklatma fonksiyonu
function pauseRecording() {
    if (mediaRecorder.state === "recording") {
        mediaRecorder.pause();
        pauseBtn.textContent = "Devam Et";
        clearInterval(timerInterval);
    } else if (mediaRecorder.state === "paused") {
        mediaRecorder.resume();
        pauseBtn.textContent = "Duraklat";
        startTimer();
    }
}

// Kaydı durdurma fonksiyonu
function stopRecording() {
    mediaRecorder.stop();
    preview.srcObject.getTracks().forEach(track => track.stop());
    clearInterval(timerInterval);
    
    // Buton durumlarını güncelle
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
}

// Kayıt verilerini işleme
function handleDataAvailable(event) {
    if (event.data.size > 0) {
        recordedChunks.push(event.data);
    }
}

// Kayıt durduğunda
function handleStop() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    recordedVideo.src = URL.createObjectURL(blob);
    document.querySelector('.recorded-video-container').style.display = 'block';
}

// Kaydı indirme
function downloadRecording() {
    const blob = new Blob(recordedChunks, {
        type: 'video/webm'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    a.download = `ekran-kaydi-${new Date().toISOString()}.${formatSelect.value}`;
    a.click();
    URL.revokeObjectURL(url);
}

// Zamanlayıcı fonksiyonu
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const seconds = Math.floor((elapsed / 1000) % 60);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const hours = Math.floor(elapsed / (1000 * 60 * 60));

        timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
} 