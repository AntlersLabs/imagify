"use client"

/**
 * Browser-based image processor using Canvas API instead of Sharp
 */
export async function processImage(file: File, quality = 0.8) {
  return new Promise<{
    original: { name: string; size: number; url: string }
    optimized: { name: string; size: number; url: string }
    compressionRate: number
  }>(async (resolve, reject) => {
    try {
      // Create original file URL
      const originalUrl = URL.createObjectURL(file)

      // Load the image
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0)

        // Convert to WebP with specified quality
        const webpQuality = quality / 100 // Convert 0-100 scale to 0-1 for canvas
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"))
              return
            }

            // Create optimized file name
            const originalName = file.name
            const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName
            const optimizedName = `${baseName}.webp`

            // Create URL for optimized image
            const optimizedUrl = URL.createObjectURL(blob)

            // Calculate compression rate
            const compressionRate = Math.round(((file.size - blob.size) / file.size) * 100)

            resolve({
              original: {
                name: originalName,
                size: file.size,
                url: originalUrl,
              },
              optimized: {
                name: optimizedName,
                size: blob.size,
                url: optimizedUrl,
              },
              compressionRate,
            })
          },
          "image/webp",
          webpQuality,
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = originalUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Check if WebP is supported in the current browser
 */
export function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = () => {
      const result = webP.width > 0 && webP.height > 0
      resolve(result)
    }
    webP.onerror = () => {
      resolve(false)
    }
    webP.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
  })
}
