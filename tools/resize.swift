// Usage: swift resize.swift <input.jpg> <output.jpg> <maxEdge> <quality 0-1>
// Re-encodes the image with no metadata (no EXIF, no GPS), applying the orientation first.
import Foundation
import ImageIO
import CoreGraphics
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 5, let maxEdge = Int(args[3]), let quality = Double(args[4]) else {
  FileHandle.standardError.write("usage: resize in out maxEdge quality\n".data(using: .utf8)!)
  exit(1)
}
let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil)!
let opts: [CFString: Any] = [
  kCGImageSourceCreateThumbnailFromImageAlways: true,
  kCGImageSourceCreateThumbnailWithTransform: true, // bake in rotation
  kCGImageSourceThumbnailMaxPixelSize: maxEdge,
  kCGImageSourceShouldCacheImmediately: true,
]
let img = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)!
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.jpeg.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, img, [kCGImageDestinationLossyCompressionQuality: quality] as CFDictionary)
CGImageDestinationFinalize(dest)
print("\(img.width) \(img.height)")
