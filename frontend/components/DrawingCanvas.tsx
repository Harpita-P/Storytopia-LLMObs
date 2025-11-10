'use client'

import { useRef, useState, useEffect } from 'react'
import { Undo, Eraser, Trash2, Upload } from 'lucide-react'

interface DrawingCanvasProps {
  onImageGenerated?: (imageData: string, characterName: string) => void
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
  const [characterName, setCharacterName] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size - larger dimensions
    canvas.width = 900
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
    setHistory([...newHistory, imageData])
    setHistoryStep(newHistory.length)
    
    // Notify parent of drawing change
    if (onImageGenerated) {
      const dataUrl = canvas.toDataURL('image/png')
      onImageGenerated(dataUrl, '')
    }
  }

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX: number, clientY: number

    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent scrolling on touch
    const canvas = canvasRef.current
    if (!canvas) return

    const coords = getCoordinates(e)
    if (!coords) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault() // Prevent scrolling on touch

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const coords = getCoordinates(e)
    if (!coords) return

    ctx.lineTo(coords.x, coords.y)
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
    if (!characterName.trim()) {
      alert('Please give your character a name!')
      return
    }
    const imageData = getCanvasData()
    if (onImageGenerated) {
      onImageGenerated(imageData, characterName.trim())
    }
  }

  return (
    <div className="space-y-2 h-full flex flex-col">
      {title && <h2 className="text-2xl font-bold text-purple-700 text-center">{title}</h2>}

      {/* Canvas - iPad-like rounded rectangle */}
      <div className="flex-1 relative flex items-center justify-center mb-2">
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-300">
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            className="block cursor-crosshair"
            style={{ 
              touchAction: 'none', 
              width: '900px', 
              height: '600px'
            }}
          />
        </div>
      </div>

      {/* Color Palette */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-xl font-semibold mb-3">Colors:</p>
        <div className="grid grid-cols-10 gap-1">
          {COLORS.map((color, index) => (
            <button
              key={color}
              onClick={() => {
                setCurrentColor(color)
                setIsEraser(false)
              }}
              className={`w-24 h-24 transition-all ${
                currentColor === color
                  ? 'scale-110 ring-4 ring-purple-500'
                  : 'hover:scale-105'
              }`}
              title={color}
            >
              <img 
                src={`/pencils/${index + 1}.png`} 
                alt={`Pencil ${index + 1}`}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Brush Size Slider */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-xl font-semibold mb-3">
          Size: {brushSize}px
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full h-3"
        />
      </div>

      {/* Tools */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg text-xl font-semibold transition-colors ${
            isEraser
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Eraser size={28} />
          Eraser
        </button>

        <button
          onClick={undo}
          disabled={historyStep <= 0}
          className="flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Undo size={28} />
          Undo
        </button>

        <button
          onClick={clearCanvas}
          className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-lg text-xl font-semibold hover:bg-red-600 transition-colors"
        >
          <Trash2 size={28} />
          Clear
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-lg text-xl font-semibold hover:bg-green-600 transition-colors"
        >
          <Upload size={28} />
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

    </div>
  )
}
