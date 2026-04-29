/**
 * BroadcastEngine
 * ---------------
 * Captures the user's camera + microphone (or audio-only), pipes the video
 * through a canvas so we can apply real-time filters and a text overlay,
 * and exposes the resulting MediaStream as the publish source.
 *
 * publishWHIP() takes that MediaStream and pushes it to a Cloudflare Stream
 * Live WHIP endpoint over WebRTC. Cloudflare then handles the simulcast
 * fan-out to YouTube, Facebook, etc. via RTMP outputs.
 *
 * A local MediaRecorder backup is also captured (webm/vp9) so we never
 * lose the broadcast if the browser tab dies before Cloudflare finalizes
 * its recording.
 */

export interface VideoFilter {
  brightness: number;   // 0–200, 100 = no change
  contrast: number;     // 0–200
  saturation: number;   // 0–200
  blur: number;         // px
  hueRotate: number;    // deg
  preset: 'none' | 'warm' | 'cool' | 'vintage' | 'noir' | 'vivid' | 'soft';
  mirror: boolean;
  overlayText: string;
  overlayPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export const DEFAULT_FILTER: VideoFilter = {
  brightness: 100, contrast: 100, saturation: 100, blur: 0, hueRotate: 0,
  preset: 'none', mirror: false, overlayText: '', overlayPosition: 'bottom-left',
};

const PRESET_FILTER: Record<VideoFilter['preset'], string> = {
  none:    '',
  warm:    'sepia(.2) saturate(1.2) hue-rotate(-10deg)',
  cool:    'saturate(1.1) hue-rotate(15deg) brightness(1.05)',
  vintage: 'sepia(.4) contrast(1.1) saturate(.8)',
  noir:    'grayscale(1) contrast(1.2)',
  vivid:   'saturate(1.6) contrast(1.15)',
  soft:    'blur(.3px) brightness(1.05) contrast(.95)',
};

interface StartOptions {
  audioOnly?: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
  width?: number;
  height?: number;
}

export class BroadcastEngine {
  private rawStream: MediaStream | null = null;
  private outputStream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private rafId = 0;
  private filter: VideoFilter = { ...DEFAULT_FILTER };
  private recorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioOnly = false;

  async start(opts: StartOptions = {}): Promise<MediaStream> {
    const { audioOnly = false, videoDeviceId, audioDeviceId, width = 1280, height = 720 } = opts;
    this.audioOnly = audioOnly;

    const constraints: MediaStreamConstraints = {
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      video: audioOnly ? false : (videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30 } }
        : { width: { ideal: width }, height: { ideal: height }, frameRate: { ideal: 30 } }),
    };

    this.rawStream = await navigator.mediaDevices.getUserMedia(constraints);

    if (audioOnly) {
      this.outputStream = this.rawStream;
      return this.outputStream;
    }

    // Build hidden video + canvas for filter pipeline
    this.videoEl = document.createElement('video');
    this.videoEl.srcObject = this.rawStream;
    this.videoEl.muted = true;
    this.videoEl.playsInline = true;
    await this.videoEl.play();

    this.canvasEl = document.createElement('canvas');
    this.canvasEl.width = width;
    this.canvasEl.height = height;
    const ctx = this.canvasEl.getContext('2d')!;

    const draw = () => {
      if (!this.videoEl || !this.canvasEl) return;
      const w = this.canvasEl.width, h = this.canvasEl.height;
      ctx.save();
      // build filter string
      const f = this.filter;
      const cssFilter = [
        `brightness(${f.brightness}%)`,
        `contrast(${f.contrast}%)`,
        `saturate(${f.saturation}%)`,
        `blur(${f.blur}px)`,
        `hue-rotate(${f.hueRotate}deg)`,
        PRESET_FILTER[f.preset],
      ].filter(Boolean).join(' ');
      ctx.filter = cssFilter;

      if (f.mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(this.videoEl, 0, 0, w, h);
      ctx.restore();

      // overlay text (no filter, no mirror)
      if (f.overlayText) {
        ctx.save();
        const fontSize = Math.round(h / 22);
        ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        const padX = 18, padY = 12;
        const text = f.overlayText.slice(0, 80);
        const m = ctx.measureText(text);
        let x = padX, y = padY;
        if (f.overlayPosition === 'top-right')    { x = w - m.width - padX; y = padY; }
        if (f.overlayPosition === 'bottom-left')  { x = padX; y = h - fontSize - padY; }
        if (f.overlayPosition === 'bottom-right') { x = w - m.width - padX; y = h - fontSize - padY; }
        if (f.overlayPosition === 'center')       { x = (w - m.width) / 2; y = (h - fontSize) / 2; }
        // shadow box for readability
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(x - 10, y - 6, m.width + 20, fontSize + 12);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, x, y);
        ctx.restore();
      }

      this.rafId = requestAnimationFrame(draw);
    };
    draw();

    // build the publish stream from canvas (video) + raw audio tracks
    const canvasStream = this.canvasEl.captureStream(30);
    const audioTracks = this.rawStream.getAudioTracks();
    audioTracks.forEach(t => canvasStream.addTrack(t));
    this.outputStream = canvasStream;
    return this.outputStream;
  }

  setFilter(patch: Partial<VideoFilter>) {
    this.filter = { ...this.filter, ...patch };
  }

  getFilter(): VideoFilter {
    return { ...this.filter };
  }

  getOutputStream(): MediaStream | null {
    return this.outputStream;
  }

  /** Returns a JPEG data URL snapshot of the current canvas (for thumbnails). */
  snapshot(): string | null {
    if (!this.canvasEl) return null;
    return this.canvasEl.toDataURL('image/jpeg', 0.85);
  }

  /** Begin local MediaRecorder backup (webm/vp9 + opus). */
  startLocalRecording() {
    if (!this.outputStream) return;
    this.recordedChunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    try {
      this.recorder = new MediaRecorder(this.outputStream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      this.recorder.ondataavailable = e => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
      this.recorder.start(2000);
    } catch (err) {
      console.warn('[BroadcastEngine] MediaRecorder unavailable:', err);
    }
  }

  async stopLocalRecording(): Promise<Blob | null> {
    if (!this.recorder) return null;
    return new Promise(resolve => {
      this.recorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        resolve(blob.size > 0 ? blob : null);
      };
      this.recorder!.stop();
    });
  }

  isAudioOnly() {
    return this.audioOnly;
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    if (this.recorder && this.recorder.state !== 'inactive') {
      try { this.recorder.stop(); } catch { /* noop */ }
    }
    this.outputStream?.getTracks().forEach(t => t.stop());
    this.rawStream?.getTracks().forEach(t => t.stop());
    this.outputStream = null;
    this.rawStream = null;
    this.videoEl = null;
    this.canvasEl = null;
  }
}

/**
 * Publish a MediaStream to a Cloudflare Stream Live WHIP endpoint.
 * Cloudflare's WHIP accepts a sendonly SDP offer and replies with the answer.
 * Returns the RTCPeerConnection so the caller can close it on stream end.
 */
export async function publishWHIP(
  stream: MediaStream,
  whipUrl: string,
  authToken?: string,
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
    bundlePolicy: 'max-bundle',
  });

  // Add sendonly transceivers for each track
  stream.getTracks().forEach(track => {
    pc.addTransceiver(track, { direction: 'sendonly', streams: [stream] });
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Wait for ICE gathering to complete (or for a few candidates)
  await new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onChange);
    // safety timeout
    setTimeout(() => resolve(), 4000);
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/sdp' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const resp = await fetch(whipUrl, {
    method: 'POST',
    headers,
    body: pc.localDescription?.sdp || offer.sdp,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    pc.close();
    throw new Error(`WHIP publish failed (${resp.status}): ${text}`);
  }
  const answerSdp = await resp.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  return pc;
}
