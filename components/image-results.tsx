"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Eye, ArrowDown, Archive, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import JSZip from "jszip"
// Fix the file-saver import
import FileSaver from "file-saver"

interface ImageResultsProps {
  processedImages: Array<{
    original: { name: string; size: number; url: string }
    optimized: { name: string; size: number; url: string }
    compressionRate: number
  }>
}

export function ImageResults({ processedImages }: ImageResultsProps) {
  const [selectedImage, setSelectedImage] = useState<{
    original: string
    optimized: string
    name: string
  } | null>(null)
  const [isCreatingZip, setIsCreatingZip] = useState(false)

  const totalOriginalSize = processedImages.reduce((acc, img) => acc + img.original.size, 0)
  const totalOptimizedSize = processedImages.reduce((acc, img) => acc + img.optimized.size, 0)
  const totalSavings = totalOriginalSize - totalOptimizedSize
  const totalSavingsPercentage = Math.round((totalSavings / totalOriginalSize) * 100)

  const downloadAllAsZip = async () => {
    if (isCreatingZip) return

    setIsCreatingZip(true)

    try {
      const zip = new JSZip()
      const optimizedFolder = zip.folder("optimized-images")

      if (!optimizedFolder) {
        throw new Error("Failed to create folder in zip")
      }

      // Add all images to the zip file
      const fetchPromises = processedImages.map(async (img) => {
        try {
          // Fetch the image as a blob
          const response = await fetch(img.optimized.url)
          const blob = await response.blob()

          // Add to zip with the optimized name
          optimizedFolder.file(img.optimized.name, blob)
        } catch (error) {
          console.error(`Failed to add ${img.optimized.name} to zip:`, error)
        }
      })

      // Wait for all images to be added to the zip
      await Promise.all(fetchPromises)

      // Generate the zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      })

      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19)

      // Save the zip file using FileSaver instead of saveAs
      FileSaver.saveAs(zipBlob, `optimized-images-${timestamp}.zip`)
    } catch (error) {
      console.error("Error creating zip file:", error)
      alert("Failed to create zip file. Please try again.")
    } finally {
      setIsCreatingZip(false)
    }
  }

  const downloadSingleImage = (url: string, filename: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-medium">Total Savings</h3>
          <p className="text-sm text-muted-foreground">
            Reduced from {formatSize(totalOriginalSize)} to {formatSize(totalOptimizedSize)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary font-medium rounded-md px-3 py-1 flex items-center">
            <ArrowDown className="mr-1 h-4 w-4" />
            {totalSavingsPercentage}% ({formatSize(totalSavings)})
          </div>
          <Button onClick={downloadAllAsZip} disabled={isCreatingZip}>
            {isCreatingZip ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating ZIP...
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Original Size</TableHead>
              <TableHead>Optimized Size</TableHead>
              <TableHead>Savings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedImages.map((img, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                      <img
                        src={img.optimized.url || "/placeholder.svg"}
                        alt={img.original.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm truncate max-w-[150px]">{img.original.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatSize(img.original.size)}</TableCell>
                <TableCell>{formatSize(img.optimized.size)}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center text-primary">
                    <ArrowDown className="mr-1 h-3 w-3" />
                    {img.compressionRate}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedImage({
                              original: img.original.url,
                              optimized: img.optimized.url,
                              name: img.original.name,
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Image Comparison</DialogTitle>
                          <DialogDescription>
                            Compare the original and optimized versions of {selectedImage?.name}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedImage && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Original</p>
                              <div className="border rounded-md overflow-hidden">
                                <img
                                  src={selectedImage.original || "/placeholder.svg"}
                                  alt="Original"
                                  className="w-full h-auto"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Optimized (WebP)</p>
                              <div className="border rounded-md overflow-hidden">
                                <img
                                  src={selectedImage.optimized || "/placeholder.svg"}
                                  alt="Optimized"
                                  className="w-full h-auto"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Add this after the image comparison grid */}
                        <div className="mt-4 text-center">
                          <p className="text-xs text-muted-foreground">
                            Anime Jersey BD image optimizer by Antlers Labs
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSingleImage(img.optimized.url, img.optimized.name)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
