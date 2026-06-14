import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.75)', zIndex: 9999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const modalContent = {
  background: '#1a1a2e', borderRadius: '16px', padding: '24px',
  width: '90%', maxWidth: '480px', position: 'relative',
};

const cropContainer = {
  position: 'relative', width: '100%', height: '320px',
  background: '#333', borderRadius: '12px', overflow: 'hidden',
};

const sliderStyle = {
  width: '100%', margin: '16px 0', accentColor: '#8B5CF6',
};

const btnRow = {
  display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px',
};

const btnBase = {
  padding: '10px 24px', borderRadius: '8px', border: 'none',
  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
};

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (err) {
      alert('Failed to process image: ' + err.message);
      setProcessing(false);
    }
  };

  return (
    <div style={modalOverlay} onClick={onCancel}>
      <div style={modalContent} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '18px' }}>
          Adjust your profile photo
        </h3>
        <div style={cropContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div style={{ padding: '0 4px' }}>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={sliderStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '12px' }}>
            <span>Zoom out</span>
            <span>Zoom in</span>
          </div>
        </div>
        <div style={btnRow}>
          <button
            style={{ ...btnBase, background: '#333', color: '#ccc' }}
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            style={{ ...btnBase, background: '#8B5CF6', color: '#fff' }}
            onClick={handleConfirm}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, size, size,
    0, 0, size, size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/jpeg', 0.9);
  });
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
