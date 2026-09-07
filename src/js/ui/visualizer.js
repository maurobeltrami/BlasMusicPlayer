// visualizer.js
let coverImage = new Image();
let lastUrl = "";

export function renderVisualizer(ctx, canvas, type, isPlaying, frame, analyser, coverUrl) {
    if (canvas.width !== canvas.clientWidth) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = 'rgb(20, 20, 20)';
    ctx.fillRect(0, 0, W, H);

    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    if (type === 'cover') {
        if (coverUrl && coverUrl !== lastUrl) {
            coverImage = new Image();
            coverImage.crossOrigin = "anonymous";
            coverImage.src = coverUrl;
            lastUrl = coverUrl;
        }

        const isOk = coverUrl && coverImage.complete && coverImage.naturalWidth > 0;
        if (isOk) {
            const aspect = coverImage.naturalWidth / coverImage.naturalHeight;
            let dw = W, dh = W / aspect;
            if (dh > H) { dh = H; dw = H * aspect; }
            ctx.drawImage(coverImage, (W - dw) / 2, (H - dh) / 2, dw, dh);
            if (isPlaying && analyser && dataArray) {
                analyser.getByteTimeDomainData(dataArray);
                drawWave(ctx, dataArray, W, H, frame, true);
            }
        } else {
            drawVinylPlaceholder(ctx, W, H, frame, isPlaying);
            if (isPlaying && analyser && dataArray) {
                analyser.getByteTimeDomainData(dataArray);
                drawWave(ctx, dataArray, W, H, frame, true);
            }
        }
        return;
    }

    if (!isPlaying || !analyser || !dataArray) {
        ctx.font = "bold 16px Inter";
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.textAlign = "center";
        ctx.fillText("BLAS MUSIC PLAYER", W / 2, H / 2);
        return;
    }

    if (type === 'waveform') {
        analyser.getByteTimeDomainData(dataArray);
        drawWave(ctx, dataArray, W, H, frame, false);
    } else if (type === 'bars') {
        analyser.getByteFrequencyData(dataArray);
        drawBars(ctx, dataArray, W, H);
    } else if (type === 'circles') {
        analyser.getByteFrequencyData(dataArray);
        drawCircles(ctx, dataArray, W, H, frame);
    }
}

function drawVinylPlaceholder(ctx, W, H, frame, isPlaying) {
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#282828';
    ctx.stroke();

    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * (0.35 + i * 0.13), 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.stroke();
    }

    const angle = isPlaying ? (frame * 0.02) : 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#D00';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
}

function drawWave(ctx, data, W, H, frame, onCover) {
    ctx.lineWidth = onCover ? 1.5 : 3;
    const hue = (frame * 2) % 360;
    ctx.strokeStyle = onCover ? "rgba(255,255,255,0.7)" : `hsl(${hue}, 90%, 65%)`;
    if (!onCover) { ctx.shadowBlur = 15; ctx.shadowColor = `hsl(${hue}, 90%, 65%)`; }

    ctx.beginPath();
    let sliceWidth = W / data.length;
    let x = 0;
    for (let i = 0; i < data.length; i++) {
        let y = (data[i] / 128.0) * (H / 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawBars(ctx, data, W, H) {
    let barWidth = (W / data.length) * 2.5;
    let x = 0;
    for (let i = 0; i < data.length; i++) {
        let barHeight = (data[i] / 255) * H;
        ctx.fillStyle = `hsl(${(i / data.length) * 360}, 80%, 60%)`;
        ctx.fillRect(x, H - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

function drawCircles(ctx, data, W, H, frame) {
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        const radius = (i / 12) * (Math.min(W, H) / 2.5) + (data[i * 10] / 255) * 50;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsl(${(i * 30 + frame) % 360}, 80%, 60%)`;
        ctx.stroke();
    }
}