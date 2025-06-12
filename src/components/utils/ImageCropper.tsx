import React, { useState, useRef, useCallback, useEffect } from 'react';

import { X } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  aspectRatio?: number; // width/height ratio
  outputWidth?: number;
  outputHeight?: number;
  onCropComplete: (croppedFile: File) => void;
  onCancel: () => void;
  cropType: 'avatar' | 'background';
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  aspectRatio,
  outputWidth = 400,
  outputHeight = 400,
  onCropComplete,
  onCancel,
  cropType
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  // Set default aspect ratio based on crop type
  const defaultAspectRatio = cropType === 'avatar' ? 1 : (16 / 9); // Avatar: square, Background: 16:9
  const finalAspectRatio = aspectRatio || defaultAspectRatio;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      initializeCropArea(img);
    };
    img.src = URL.createObjectURL(imageFile);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile]);

  const initializeCropArea = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate initial scale to fit image in canvas
    const scaleX = canvasWidth / img.width;
    const scaleY = canvasHeight / img.height;
    const scale = Math.min(scaleX, scaleY) * 0.8; // 80% of available space

    setImageScale(scale);

    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    // Center the image
    const offsetX = (canvasWidth - scaledWidth) / 2;
    const offsetY = (canvasHeight - scaledHeight) / 2;
    setImageOffset({ x: offsetX, y: offsetY });

    // Initialize crop area in the center
    const cropSize = Math.min(scaledWidth, scaledHeight) * 0.6;
    const cropWidth = cropType === 'avatar' ? cropSize : Math.min(scaledWidth * 0.8, cropSize * finalAspectRatio);
    const cropHeight = cropType === 'avatar' ? cropSize : cropWidth / finalAspectRatio;

    setCropArea({
      x: offsetX + (scaledWidth - cropWidth) / 2,
      y: offsetY + (scaledHeight - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight
    });
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    const scaledWidth = image.width * imageScale;
    const scaledHeight = image.height * imageScale;
    
    ctx.drawImage(
      image,
      imageOffset.x,
      imageOffset.y,
      scaledWidth,
      scaledHeight
    );

    // Draw overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    if (cropType === 'avatar') {
      // Draw circular crop for avatar
      ctx.beginPath();
      ctx.arc(
        cropArea.x + cropArea.width / 2,
        cropArea.y + cropArea.height / 2,
        cropArea.width / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    } else {
      // Draw rectangular crop for background
      ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }

    ctx.globalCompositeOperation = 'source-over';

    // Draw crop area border
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    if (cropType === 'avatar') {
      ctx.beginPath();
      ctx.arc(
        cropArea.x + cropArea.width / 2,
        cropArea.y + cropArea.height / 2,
        cropArea.width / 2,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    } else {
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    }

    // Draw resize handles for background
    if (cropType === 'background') {
      const handleSize = 8;
      ctx.fillStyle = '#3B82F6';
      
      // Corner handles
      const handles = [
        { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2 },
        { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y - handleSize/2 },
        { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 },
        { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 }
      ];

      handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      });
    }
  }, [image, imageScale, imageOffset, cropArea, cropType]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const isPointInCropArea = (x: number, y: number) => {
    if (cropType === 'avatar') {
      const centerX = cropArea.x + cropArea.width / 2;
      const centerY = cropArea.y + cropArea.height / 2;
      const radius = cropArea.width / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      return distance <= radius;
    } else {
      return x >= cropArea.x && x <= cropArea.x + cropArea.width &&
             y >= cropArea.y && y <= cropArea.y + cropArea.height;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking inside crop area
    if (isPointInCropArea(x, y)) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const constrainCropArea = (newX: number, newY: number, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: newX, y: newY };

    // Constrain to image bounds
    const scaledWidth = image!.width * imageScale;
    const scaledHeight = image!.height * imageScale;
    const imageLeft = imageOffset.x;
    const imageTop = imageOffset.y;
    const imageRight = imageLeft + scaledWidth;
    const imageBottom = imageTop + scaledHeight;

    const constrainedX = Math.max(imageLeft, Math.min(imageRight - width, newX));
    const constrainedY = Math.max(imageTop, Math.min(imageBottom - height, newY));

    return { x: constrainedX, y: constrainedY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = x - dragStart.x;
    const newY = y - dragStart.y;

    const constrained = constrainCropArea(newX, newY, cropArea.width, cropArea.height);

    setCropArea(prev => ({
      ...prev,
      x: constrained.x,
      y: constrained.y
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSizeChange = (newSize: number) => {
    const newWidth = newSize;
    const newHeight = cropType === 'avatar' ? newSize : newSize / finalAspectRatio;
    
    // Center the new crop area
    const centerX = cropArea.x + cropArea.width / 2;
    const centerY = cropArea.y + cropArea.height / 2;
    
    const newX = centerX - newWidth / 2;
    const newY = centerY - newHeight / 2;
    
    const constrained = constrainCropArea(newX, newY, newWidth, newHeight);
    
    setCropArea({
      x: constrained.x,
      y: constrained.y,
      width: newWidth,
      height: newHeight
    });
  };

  const handleCrop = async () => {
    if (!image) return;

    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return;

    // Set output dimensions
    const finalWidth = cropType === 'avatar' ? outputWidth : outputWidth;
    const finalHeight = cropType === 'avatar' ? outputHeight : Math.round(outputWidth / finalAspectRatio);
    
    cropCanvas.width = finalWidth;
    cropCanvas.height = finalHeight;

    // Calculate source coordinates on original image
    const scaleRatio = 1 / imageScale;
    const sourceX = (cropArea.x - imageOffset.x) * scaleRatio;
    const sourceY = (cropArea.y - imageOffset.y) * scaleRatio;
    const sourceWidth = cropArea.width * scaleRatio;
    const sourceHeight = cropArea.height * scaleRatio;

    if (cropType === 'avatar') {
      // Create circular crop for avatar
      cropCtx.beginPath();
      cropCtx.arc(finalWidth / 2, finalHeight / 2, finalWidth / 2, 0, 2 * Math.PI);
      cropCtx.clip();
    }

    // Draw cropped image
    cropCtx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      finalWidth,
      finalHeight
    );

    // Convert to blob and create file
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], `cropped_${imageFile.name}`, {
          type: 'image/png',
          lastModified: Date.now()
        });
        onCropComplete(croppedFile);
      }
    }, 'image/png', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Cắt ảnh {cropType === 'avatar' ? 'đại diện' : 'nền'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {cropType === 'avatar' 
              ? 'Kéo vùng cắt hình tròn để chọn phần ảnh làm đại diện' 
              : 'Kéo vùng cắt hình chữ nhật để chọn phần ảnh làm nền (tỷ lệ 16:9)'
            }
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="border border-gray-300 rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kích thước vùng cắt
              </label>
              <input
                type="range"
                min="100"
                max="350"
                value={cropArea.width}
                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                className="w-32"
              />
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(cropArea.width)} x {Math.round(cropArea.height)} px
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCrop}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Áp dụng cắt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 