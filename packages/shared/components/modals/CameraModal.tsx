import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (dataUrl: string, type: 'IMAGE' | 'VIDEO') => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onUpload }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mode, setMode] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS'>('IDLE');
  
  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedMedia(null);
      setUploadState('IDLE');
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: mode === 'VIDEO' 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleCapture = () => {
    if (mode === 'PHOTO') {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg');
          setCapturedMedia(dataUrl);
          stopCamera();
        }
      }
    } else {
      if (isRecording) {
        // Stop Recording
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      } else {
        // Start Recording
        if (!stream) return;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          setCapturedMedia(url);
          stopCamera();
        };
        recorder.start();
        setIsRecording(true);
        mediaRecorderRef.current = recorder;
      }
    }
  };

  const handleUpload = () => {
    setUploadState('UPLOADING');
    // Simulate upload delay
    setTimeout(() => {
      if (onUpload && capturedMedia) {
        // Fix: Map internal 'PHOTO' mode to expected 'IMAGE' type for the callback
        onUpload(capturedMedia, mode === 'PHOTO' ? 'IMAGE' : 'VIDEO');
      }
      setUploadState('SUCCESS');
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[300] flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
           <span className="text-xs font-black text-white uppercase tracking-widest">Media Center Live</span>
        </div>
        <button onClick={onClose} className="text-white bg-white/20 hover:bg-white/30 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md">✕</button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {capturedMedia ? (
          mode === 'PHOTO' ? (
            <img src={capturedMedia} alt="Capture" className="w-full h-full object-contain" />
          ) : (
            <video src={capturedMedia} controls className="w-full h-full object-contain" />
          )
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Upload Overlay */}
        {uploadState !== 'IDLE' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
             {uploadState === 'UPLOADING' ? (
               <>
                 <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p className="text-white font-black uppercase tracking-widest text-xs">Uploading to Media Center...</p>
               </>
             ) : (
               <>
                 <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl mb-4 animate-in zoom-in shadow-[0_0_30px_#10b981]">✓</div>
                 <p className="text-white font-black uppercase tracking-widest text-xs">Asset Secured</p>
               </>
             )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!capturedMedia && uploadState === 'IDLE' && (
        <div className="bg-black/80 backdrop-blur-md p-8 pb-12 flex flex-col gap-6">
           <div className="flex justify-center gap-8">
              <button 
                onClick={() => setMode('PHOTO')} 
                className={`text-xs font-black uppercase tracking-widest transition-all ${mode === 'PHOTO' ? 'text-yellow-400 scale-110' : 'text-slate-500'}`}
              >
                Photo
              </button>
              <button 
                onClick={() => setMode('VIDEO')} 
                className={`text-xs font-black uppercase tracking-widest transition-all ${mode === 'VIDEO' ? 'text-red-500 scale-110' : 'text-slate-500'}`}
              >
                Video
              </button>
           </div>

           <div className="flex justify-center items-center">
              <button 
                onClick={handleCapture}
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 ${
                  mode === 'VIDEO' && isRecording 
                    ? 'border-red-500 bg-red-500/20' 
                    : 'border-white bg-white/20 hover:bg-white/30'
                }`}
              >
                 <div className={`transition-all duration-300 ${
                   mode === 'VIDEO' && isRecording 
                     ? 'w-8 h-8 bg-red-500 rounded-sm' 
                     : 'w-16 h-16 bg-white rounded-full'
                 }`} />
              </button>
           </div>
        </div>
      )}

      {/* Review Controls */}
      {capturedMedia && uploadState === 'IDLE' && (
        <div className="bg-black/90 p-6 flex gap-4">
           <button 
             onClick={() => { setCapturedMedia(null); startCamera(); }}
             className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest"
           >
             Discard
           </button>
           <button 
             onClick={handleUpload}
             className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/30"
           >
             Upload Asset
           </button>
        </div>
      )}
    </div>
  );
};
