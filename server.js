const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');
const Jimp = require('jimp');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;
const TMP_DIR = path.join(__dirname, 'tmp_frames');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);

// Map các monitor đang chạy: monitorId -> Monitor instance
const MONITORS = new Map();

// Helper emit to user room
function emitToUser(userId, event, payload) {
  io.to(userId).emit(event, payload);
}

/**
 * Monitor class: 
 * - Khởi ffmpeg để cập nhật 1 frame/giây vào một file JPEG
 * - Mỗi 1s đọc file, tính motion score (frame diff)
 * - Nếu spike lớn => pending fall; nếu tiếp theo là low motion => confirm fall
 * - Nếu không có motion trong X giờ => motionless detection
 */
class Monitor {
  constructor({ userId, camera, fallEnabled, motionlessHours }) {
    this.id = uuidv4();
    this.userId = userId;
    this.camera = camera;
    this.fallEnabled = !!fallEnabled;
    this.motionlessHours = Number(motionlessHours) || 0;
    this.framePath = path.join(TMP_DIR, `monitor_${this.id}.jpg`);
    this.ffmpeg = null;
    this.running = false;

    this.prevImage = null;
    this.lastMovement = Date.now();
    this.motionWindow = []; // array of recent motion scores
    this.pendingFall = null; // { timestamp, spikeScore }

    this.pollTimer = null;
    this.motionCheckTimer = null; // check motionless hours
  }

  start() {
    if (this.running) return;
    this.running = true;

    // FFmpeg command: update a single file every second with latest frame
    // note: some cameras require -rtsp_transport tcp
    const args = [
      '-rtsp_transport', 'tcp',
      '-i', this.camera.url,
      '-vf', 'fps=1',
      '-qscale:v', '2',
      '-update', '1',
      this.framePath
    ];
    this.ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'ignore'] });
    this.ffmpeg.on('error', (e) => console.error('ffmpeg error', e));
    this.ffmpeg.on('exit', (code, sig) => {
      console.log('ffmpeg exited', code, sig);
    });

    // Poll file every 1s
    this.pollTimer = setInterval(async () => {
      try {
        if (!fs.existsSync(this.framePath)) return;
        const buffer = fs.readFileSync(this.framePath);
        await this._processFrame(buffer);
      } catch (err) {
        console.error('poll error', err.message);
      }
    }, 1000);

    // Motionless checker: every minute check whether elapsed >= motionlessHours
    this.motionCheckTimer = setInterval(() => {
      if (!this.motionlessHours || this.motionlessHours <= 0) return;
      const elapsedMs = Date.now() - this.lastMovement;
      const hours = elapsedMs / (1000 * 60 * 60);
      if (hours >= this.motionlessHours) {
        // emit detection + SOS
        const payload = {
          type: 'motionless',
          camera: this.camera,
          timestamp: new Date().toISOString(),
          monitorId: this.id,
          hours: this.motionlessHours
        };
        console.warn('motionless detected', payload);
        emitToUser(this.userId, 'detection', payload);
        emitToUser(this.userId, 'sos', { reason: `motionless_${this.motionlessHours}h`, camera: this.camera, timestamp: new Date().toISOString() });
        // After triggering, update lastMovement to avoid repeated SOS spam (you can change policy)
        this.lastMovement = Date.now();
      }
    }, 60 * 1000);

    // notify
    emitToUser(this.userId, 'monitor_status', { monitorId: this.id, status: 'started' });
    console.log('Monitor started', this.id, this.camera.url);
  }

  stop() {
    this.running = false;
    if (this.ffmpeg) {
      try { this.ffmpeg.kill('SIGKILL'); } catch (e) {}
      this.ffmpeg = null;
    }
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.motionCheckTimer) clearInterval(this.motionCheckTimer);
    // cleanup file
    try { if (fs.existsSync(this.framePath)) fs.unlinkSync(this.framePath); } catch (e) {}
    emitToUser(this.userId, 'monitor_status', { monitorId: this.id, status: 'stopped' });
    console.log('Monitor stopped', this.id);
  }

  update({ fallEnabled, motionlessHours }) {
    this.fallEnabled = !!fallEnabled;
    this.motionlessHours = Number(motionlessHours) || 0;
  }

  async _processFrame(buffer) {
    // read image via Jimp
    try {
      const img = await Jimp.read(buffer);
      // normalize small size to speed up
      img.resize(64, 36).grayscale();
      const currBitmap = img.bitmap; // { data, width, height }
      if (!this.prevImage) {
        this.prevImage = currBitmap;
        return;
      }

      // compute diff between prevImage and currBitmap
      const diffSum = computeImageAbsDiff(this.prevImage, currBitmap);
      // normalize: max value per pixel = 255, total pixels = w*h
      const norm = diffSum / (currBitmap.width * currBitmap.height * 255);
      const motionScore = norm; // 0..1

      // store window (last 10)
      this.motionWindow.push(motionScore);
      if (this.motionWindow.length > 10) this.motionWindow.shift();

      // movement event if > threshold
      const movementThreshold = 0.02; // tuneable
      if (motionScore > movementThreshold) {
        this.lastMovement = Date.now();
        emitToUser(this.userId, 'movement', { camera: this.camera, timestamp: new Date().toISOString(), motionScore });
      }

      // FALL detection (heuristic):
      // if there is a very large spike (sudden movement) then followed by sustained low motion -> possible fall.
      if (this.fallEnabled) {
        const spikeThreshold = 0.25; // tuneable
        const lowMotionThreshold = 0.02;
        // detect spike
        if (!this.pendingFall && motionScore >= spikeThreshold) {
          this.pendingFall = { timestamp: Date.now(), spikeScore: motionScore };
          // wait for confirmation in following few frames
          this.pendingFall.confirmCount = 0;
        }

        // if pending, check subsequent few frames: if low motion persists -> confirm
        if (this.pendingFall) {
          if (motionScore <= lowMotionThreshold) {
            this.pendingFall.confirmCount += 1;
          } else {
            // movement resumed: cancel pending
            this.pendingFall = null;
          }

          // if we have 3 consecutive low-motion frames after spike -> consider fall
          if (this.pendingFall && this.pendingFall.confirmCount >= 3) {
            // confirm fall
            const payload = {
              type: 'fall',
              camera: this.camera,
              timestamp: new Date().toISOString(),
              monitorId: this.id,
              spikeScore: this.pendingFall.spikeScore
            };
            console.warn('Fall detected (heuristic)', payload);
            emitToUser(this.userId, 'detection', payload);
            emitToUser(this.userId, 'sos', { reason: 'fall', camera: this.camera, timestamp: new Date().toISOString() });

            // reset
            this.pendingFall = null;
            // update lastMovement to now so motionless won't spam
            this.lastMovement = Date.now();
          }

          // if pending too old (e.g., > 10s) cancel
          if (this.pendingFall && (Date.now() - this.pendingFall.timestamp) > 15000) {
            this.pendingFall = null;
          }
        }
      }

      // save prevImage for next diff
      this.prevImage = currBitmap;
    } catch (err) {
      console.error('Error processing frame', err.message);
    }
  }
}

// small helper: compute absolute diff sum of grayscale buffers (Jimp bitmap.data is RGBA sequence)
function computeImageAbsDiff(b1, b2) {
  // b1.data and b2.data are Uint8Array, length = w*h*4; we used grayscale so R=G=B
  let sum = 0;
  for (let i = 0; i < b1.data.length; i += 4) {
    const v1 = b1.data[i]; // red channel
    const v2 = b2.data[i];
    sum += Math.abs(v1 - v2);
  }
  return sum;
}

// ========== Express endpoints ==========
app.get('/', (req, res) => res.send('Camera monitor demo running'));

// Start monitor
app.post('/api/monitor/start', (req, res) => {
  const { userId, camera, fallEnabled=true, motionlessHours=0 } = req.body || {};
  if (!userId || !camera || !camera.url) return res.status(400).json({ ok:false, message: 'userId and camera.url required' });

  const mon = new Monitor({ userId, camera, fallEnabled, motionlessHours });
  MONITORS.set(mon.id, mon);
  mon.start();
  return res.json({ ok:true, monitorId: mon.id });
});

// Stop monitor
app.post('/api/monitor/stop', (req, res) => {
  const { monitorId } = req.body || {};
  if (!monitorId || !MONITORS.has(monitorId)) return res.status(400).json({ ok:false, message: 'invalid monitorId' });
  const mon = MONITORS.get(monitorId);
  mon.stop();
  MONITORS.delete(monitorId);
  return res.json({ ok:true });
});

// Update monitor settings
app.post('/api/monitor/update', (req, res) => {
  const { monitorId, fallEnabled, motionlessHours } = req.body || {};
  if (!monitorId || !MONITORS.has(monitorId)) return res.status(400).json({ ok:false, message: 'invalid monitorId' });
  const mon = MONITORS.get(monitorId);
  mon.update({ fallEnabled, motionlessHours });
  return res.json({ ok:true });
});

// SOS endpoint (can be called by frontend or monitor)
app.post('/api/sos', (req, res) => {
  const { userId, cameraName, cameraUrl, reason } = req.body || {};
  console.log('SOS received', { userId, cameraName, cameraUrl, reason, time: new Date().toISOString() });
  if (userId) {
    emitToUser(userId, 'sos', { reason, camera: { name: cameraName, url: cameraUrl }, timestamp: new Date().toISOString() });
  }
  // in production: call SMS / push / emergency API here
  return res.json({ ok:true });
});

// List monitors (debug)
app.get('/api/monitors', (req, res) => {
  const list = Array.from(MONITORS.values()).map(m => ({
    monitorId: m.id, userId: m.userId, camera: m.camera, fallEnabled: m.fallEnabled, motionlessHours: m.motionlessHours
  }));
  res.json({ ok:true, monitors: list });
});

// ========== socket.io ==========
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('identify', (data) => {
    const { userId } = data || {};
    if (userId) {
      socket.join(userId);
      console.log('socket joined room', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log('Server listening on', PORT);
});

