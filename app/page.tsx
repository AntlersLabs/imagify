"use client"

import { useState, useEffect } from "react"
import { ImageUploader } from "@/components/image-uploader"
import { ImageProcessor } from "@/components/image-processor"
import { ImageResults } from "@/components/image-results"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileImage, Settings, AlertTriangle, Archive } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { checkWebPSupport } from "@/components/image-processor"

export default function ImageOptimizer() {
  const [files, setFiles] = useState<File[]>([])
  const [processedImages, setProcessedImages] = useState<
    Array<{
      original: { name: string; size: number; url: string }
      optimized: { name: string; size: number; url: string }
      compressionRate: number
    }>
  >([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null)

  useEffect(() => {
    // Check WebP support when component mounts
    const checkSupport = async () => {
      const isSupported = await checkWebPSupport()
      setWebpSupported(isSupported)
    }

    checkSupport()
  }, [])

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Anime Jersey BD Image Optimizer</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Compress multiple images at once and convert them to WebP format for optimal web performance.
          <span className="block mt-1 text-sm">System designed by Antlers Labs</span>
        </p>
      </div>

      {webpSupported === false && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Browser Compatibility Issue</AlertTitle>
          <AlertDescription>
            Your browser {"doesn't"} support WebP format. The optimizer will still work, but you may not be able to preview
            the optimized images.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upload">
            <FileImage className="mr-2 h-4 w-4" />
            Upload & Optimize
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>Select multiple images to optimize. Supported formats: JPG, PNG, GIF.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader files={files} setFiles={setFiles} isProcessing={isProcessing} />
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Process Images</CardTitle>
                <CardDescription>Convert your images to WebP format and compress them.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageProcessor
                  files={files}
                  setProcessedImages={setProcessedImages}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  quality={quality}
                />
              </CardContent>
            </Card>
          )}

          {processedImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Compare original and optimized images. Download all as a ZIP file.</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageResults processedImages={processedImages} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>Configure how your images will be optimized.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="quality" className="text-sm font-medium">
                    WebP Quality: {quality}%
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {quality < 50 ? "Higher Compression" : quality > 80 ? "Higher Quality" : "Balanced"}
                  </span>
                </div>
                <input
                  id="quality"
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number.parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower quality = smaller file size, but may affect image appearance.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">About WebP Format</h3>
                <p className="text-sm text-muted-foreground">
                  WebP is a modern image format that provides superior lossless and lossy compression for images on the
                  web. WebP images are typically 25-35% smaller than comparable JPEG or PNG images.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="font-medium mb-2">Browser-Based Processing</h3>
                <p className="text-sm text-muted-foreground">
                  This tool uses your {"browser's"} Canvas API to process images. All processing happens locally in your
                  browser - no images are uploaded to any server.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="font-medium mb-2 flex items-center">
                  <Archive className="mr-2 h-4 w-4" />
                  Batch Download
                </h3>
                <p className="text-sm text-muted-foreground">
                  After processing, you can download all optimized images as a single ZIP file. The ZIP file includes
                  all your optimized WebP images in a folder structure.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <footer className="mt-12 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground">
          Anime Jersey BD image optimizer, System designed by Antlers Labs
        </p>
        <p className="text-xs text-muted-foreground mt-1">&copy; {new Date().getFullYear()} All rights reserved</p>
      </footer>
    </div>
  )
}
