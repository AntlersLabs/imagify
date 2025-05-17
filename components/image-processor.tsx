"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw } from "lucide-react";

export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
    img.src =
      "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
  });
};

export const processImage = async (
  file: File,
  quality: number
): Promise<{
  original: { name: string; size: number; url: string };
  optimized: { name: string; size: number; url: string };
  compressionRate: number;
  error?: string;
}> => {
  const originalUrl = URL.createObjectURL(file);
  const originalName = file.name;
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("File could not be read."));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const aspectRatio = img.width / img.height;
        
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (img.width > MAX_WIDTH) {
            canvas.width = MAX_WIDTH;
            canvas.height = MAX_WIDTH / aspectRatio;
        } else if (img.height > MAX_HEIGHT) {
            canvas.height = MAX_HEIGHT;
            canvas.width = MAX_HEIGHT * aspectRatio;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas toBlob returned null, WebP conversion failed."));
              return;
            }
            const optimizedUrl = URL.createObjectURL(blob);
            const optimizedSize = blob.size;
            const compressionRate =
              originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0;
            
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const optimizedName = `${baseName}.webp`;

            resolve({
              original: { name: originalName, size: originalSize, url: originalUrl },
              optimized: { name: optimizedName, size: optimizedSize, url: optimizedUrl },
              compressionRate: parseFloat(compressionRate.toFixed(2)),
            });
          },
          "image/webp",
          quality / 100
        );
      };
      img.onerror = () => {
        reject(new Error("Failed to load image for processing. The image file might be corrupt or in an unsupported format."));
      };
      img.src = event.target.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };
    reader.readAsDataURL(file);
  });
};

interface ImageProcessorProps {
  files: File[];
  setProcessedImages: React.Dispatch<
    React.SetStateAction<
      Array<{
        original: { name: string; size: number; url: string };
        optimized: { name: string; size: number; url: string };
        compressionRate: number;
        error?: string; // Added error field to type
      }>
    >
  >;
  isProcessing: boolean;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  quality: number;
}

export function ImageProcessor({
  files,
  setProcessedImages,
  isProcessing,
  setIsProcessing,
  quality,
}: ImageProcessorProps) {
  const [progress, setProgress] = useState(0);

  const handleProcessImages = async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setProgress(0);

    const results = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await processImage(file, quality);
        results.push(result);
      } catch (error) {
        console.error(`Error processing image ${file.name}:`, error);
        results.push({
          original: { name: file.name, size: file.size, url: URL.createObjectURL(file) },
          optimized: { name: "Error", size: 0, url: "" },
          compressionRate: 0,
          error: (error as Error).message || "Unknown error during processing",
        });
      }
      processedCount++;
      setProgress(Math.round((processedCount / files.length) * 100));
    }

    setProcessedImages(results);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div>
          <p className="text-sm">
            Ready to optimize {files.length} image{files.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Images will be converted to WebP format with {quality}% quality
          </p>
        </div>
        <Button
          onClick={handleProcessImages}
          disabled={isProcessing || files.length === 0}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Optimize Images
            </>
          )}
        </Button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Processing image {Math.min(files.length, Math.floor((files.length * progress) / 100) + (progress > 0 && progress < 100 && files.length > 0 ? 1: 0) )} of {files.length}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
