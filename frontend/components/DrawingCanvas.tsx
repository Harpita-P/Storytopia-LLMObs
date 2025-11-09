'use client'

import { useRef, useState, useEffect } from 'react'
import { Undo, Eraser, Trash2, Upload } from 'lucide-react'

interface DrawingCanvasProps {
  onImageGenerated?: (imageData: string) => void
  title: string
}

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
  '#FFC0CB', '#A52A2A', '#808080', '#FFD700', '#00CED1',
  '#FF69B4', '#32CD32', '#FF4500', '#9370DB', '#20B2AA'
]

export default function DrawingCanvas({ onImageGenerated, title }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 600
    canvas.height = 600

    // Fill with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    saveToHistory()
  }, [])

  const saveToHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(imageData)
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = isEraser ? '#FFFFFF' : currentColor
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const prevStep = historyStep - 1
      ctx.putImageData(history[prevStep], 0, 0)
      setHistoryStep(prevStep)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
  }

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas first
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Calculate scaling to fit image in canvas while maintaining aspect ratio
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        )
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2

        // Draw image centered and scaled
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        saveToHistory()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getCanvasData = () => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    return canvas.toDataURL('image/png')
  }

  const handleGenerateImage = () => {
    const imageData = getCanvasData()
    if (onImageGenerated) {
      onImageGenerated(imageData)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-purple-700">{title}</h2>

      {/* Canvas */}
      <div className="border-4 border-purple-300 rounded-lg bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair w-full h-auto"
          style={{ touchAction: 'none' }}
        />
      </div>

      {/* Color Palette */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm font-semibold mb-2">Colors:</p>
        <div className="grid grid-cols-10 gap-2">
          {COLORS.map((color) => {
            // Test: Show crayon for pink color
            if (color === '#FFC0CB') {
              return (
                <button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color)
                    setIsEraser(false)
                  }}
                  className={`w-12 h-12 transition-transform hover:scale-110 ${
                    currentColor === color && !isEraser ? 'scale-110' : ''
                  }`}
                  title="Pink"
                >
                  <img 
                    src="/crayons/pink.png" 
                    alt="Pink crayon"
                    className="w-full h-full object-contain"
                  />
                </button>
              )
            }
            
            return (
              <button
                key={color}
                onClick={() => {
                  setCurrentColor(color)
                  setIsEraser(false)
                }}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor === color && !isEraser
                    ? 'border-blue-500 scale-110'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          })}
        </div>
      </div>

      {/* Brush Size */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-sm font-semibold mb-2">Brush Size: {brushSize}px</p>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Tools */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isEraser
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Eraser size={20} />
          Eraser
        </button>

        <button
          onClick={undo}
          disabled={historyStep <= 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Undo size={20} />
          Undo
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          <Trash2 size={20} />
          Clear
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          <Upload size={20} />
          Upload Image
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadImage}
          className="hidden"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateImage}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-bold py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
      >
        ✨ Generate Character ✨
      </button>
    </div>
  )
}
