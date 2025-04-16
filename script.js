const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const thresholdSlider = document.getElementById('threshold');
const thresholdValueLabel = document.getElementById('threshold-value');

let threshold = parseInt(thresholdSlider.value);

thresholdSlider.addEventListener('input', () => {
  threshold = parseInt(thresholdSlider.value);
  thresholdValueLabel.textContent = threshold;
});

video.addEventListener('loadedmetadata', () => {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  canvas.width = videoWidth;
  canvas.height = videoHeight;

  video.style.width = videoWidth + 'px';
  video.style.height = videoHeight + 'px';
});

function getEdgeImage(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Chuyển sang grayscale
  const grayscale = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    grayscale[i / 4] = avg;
  }

  // Làm mượt bằng lọc trung bình 3x3 (basic blur)
  const blurred = new Uint8ClampedArray(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += grayscale[(y + ky) * width + (x + kx)];
        }
      }
      blurred[y * width + x] = sum / 9;
    }
  }

  // Áp dụng Sobel
  const sobelData = new Uint8ClampedArray(width * height);
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0, sumY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = blurred[(y + ky) * width + (x + kx)];
          const idx = (ky + 1) * 3 + (kx + 1);
          sumX += pixel * gx[idx];
          sumY += pixel * gy[idx];
        }
      }

      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      sobelData[y * width + x] = magnitude > threshold ? 255 : 0;
    }
  }

  // Tạo ảnh đầu ra
  const output = ctx.createImageData(width, height);
  for (let i = 0; i < sobelData.length; i++) {
    const val = sobelData[i];
    output.data[i * 4] = val;
    output.data[i * 4 + 1] = val;
    output.data[i * 4 + 2] = val;
    output.data[i * 4 + 3] = 255;
  }

  return output;
}

function drawFrame() {
  if (!video.paused && !video.ended) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const edgeFrame = getEdgeImage(frame);
    ctx.putImageData(edgeFrame, 0, 0);
    requestAnimationFrame(drawFrame);
  }
}

video.addEventListener('play', () => {
  drawFrame();
});

const videoButtons = document.querySelectorAll('.video-buttons button');

videoButtons.forEach(button => {
  button.addEventListener('click', () => {
    const src = button.getAttribute('data-src');
    video.src = src;
    video.load();
    video.play();
  });
});
