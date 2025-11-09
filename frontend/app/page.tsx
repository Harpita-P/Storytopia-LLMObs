'use client'

import { useState } from 'react'
import DrawingCanvas from '@/components/DrawingCanvas'
import QuestBook from '@/components/QuestBook'

type AppStep = 'character' | 'lesson' | 'quest'

// Available lessons
const LESSONS = [
  { id: 'sharing', title: 'Sharing My Toys', emoji: '🤝', description: 'Learn why sharing makes everyone happy' },
  { id: 'kindness', title: 'Being Kind with Words', emoji: '💝', description: 'Discover the power of kind words' },
  { id: 'honesty', title: 'Telling the Truth', emoji: '✨', description: 'Learn why being honest is important' },
  { id: 'inclusion', title: 'Including Others', emoji: '🌈', description: 'Make sure everyone feels welcome' },
  { id: 'patience', title: 'Being Patient', emoji: '⏰', description: 'Learn to wait calmly' },
  { id: 'helping', title: 'Helping Others', emoji: '🤲', description: 'Discover the joy of helping' },
]

export default function Home() {
  const [activeStep, setActiveStep] = useState<AppStep>('character')
  const [characterDrawing, setCharacterDrawing] = useState<string>('')
  const [generatedCharacter, setGeneratedCharacter] = useState<string>('')
  const [characterAnalysis, setCharacterAnalysis] = useState<any>(null)
  const [selectedLesson, setSelectedLesson] = useState<string>('')
  const [questData, setQuestData] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string>('')

  const handleCharacterDrawn = async (imageData: string) => {
    setIsGenerating(true)
    setError('')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      
      const formData = new FormData()
      formData.append('drawing_data', imageData)
      formData.append('user_id', 'demo_user_' + Date.now())

      const response = await fetch(`${apiUrl}/generate-character`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to generate character')
      }

      const data = await response.json()
      
      if (data.status !== 'success') {
        throw new Error(data.detail || data.error || 'Failed to generate character')
      }
      
      setCharacterDrawing(data.drawing_uri)
      setGeneratedCharacter(data.generated_character_uri)
      setCharacterAnalysis(data.analysis)
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate character. Please try again.'
      setError(errorMessage)
      console.error('Error generating character:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLessonSelect = async (lessonId: string) => {
    setSelectedLesson(lessonId)
    setIsGenerating(true)
    setError('')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      
      // Call API to create quest
      const response = await fetch(`${apiUrl}/create-quest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_description: characterAnalysis?.character_description || '',
          character_name: characterAnalysis?.character_type || 'Character',
          lesson: lessonId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create quest')
      }

      const data = await response.json()
      setQuestData(data)
      setActiveStep('quest')
      
    } catch (err: any) {
      setError(err.message || 'Failed to create quest')
      console.error('Error creating quest:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleQuestComplete = (coinsEarned: number) => {
    // Reset to start
    setActiveStep('character')
    setCharacterDrawing('')
    setGeneratedCharacter('')
    setCharacterAnalysis(null)
    setSelectedLesson('')
    setQuestData(null)
  }

  const handleTryAgain = () => {
    setGeneratedCharacter('')
    setCharacterAnalysis(null)
    setError('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-800 mb-4">
            🌈 Storytopia
          </h1>
          <p className="text-xl text-gray-700">
            Create your character, choose a lesson, and go on an adventure!
          </p>
        </header>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
            <button
              onClick={() => setActiveStep('character')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeStep === 'character'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1. Create Character
            </button>
            <button
              onClick={() => setActiveStep('lesson')}
              disabled={!generatedCharacter}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeStep === 'lesson'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              2. Choose Lesson
            </button>
            <button
              disabled={!questData}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeStep === 'quest'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              3. Play Quest
            </button>
          </div>
        </div>

        {/* Step 1: Character Creation */}
        {activeStep === 'character' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: Drawing Canvas */}
              <div>
                <DrawingCanvas
                  title="Draw Your Character"
                  onImageGenerated={handleCharacterDrawn}
                />
              </div>

              {/* Right: Generated Character */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-pink-700">
                  Your Animated Character
                </h2>
                
                <div className="border-4 border-pink-300 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 h-[600px] flex items-center justify-center overflow-hidden">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                      <p className="text-lg font-semibold text-purple-700">
                        Creating your character...
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        This may take 30-60 seconds
                      </p>
                    </div>
                  ) : generatedCharacter ? (
                    <div className="w-full h-full p-4 flex flex-col">
                      <div className="flex-1 relative">
                        <img
                          src={generatedCharacter}
                          alt="Generated character"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {characterAnalysis && (
                        <div className="mt-4 bg-white p-4 rounded-lg shadow">
                          <p className="font-semibold text-purple-700">
                            {characterAnalysis.character_type}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {characterAnalysis.character_description}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : error ? (
                    <div className="text-center p-8">
                      <p className="text-red-600 font-semibold mb-4">❌ {error}</p>
                      <button
                        onClick={handleTryAgain}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-gray-400 text-lg">
                        Draw your character and click<br />
                        "Generate Character" to see the magic! ✨
                      </p>
                    </div>
                  )}
                </div>

                {generatedCharacter && !isGenerating && (
                  <div className="flex gap-4">
                    <button
                      onClick={handleTryAgain}
                      className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setActiveStep('lesson')}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Choose Lesson →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Lesson Selection */}
        {activeStep === 'lesson' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-purple-700 mb-2 text-center">
              Choose a Lesson
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              What would you like {characterAnalysis?.character_type} to learn today?
            </p>

            {isGenerating ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-purple-700">
                  Creating your quest...
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LESSONS.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson.id)}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 border-4 border-purple-200 rounded-2xl p-6 hover:border-purple-400 hover:scale-105 transition-all text-left"
                  >
                    <div className="text-6xl mb-4">{lesson.emoji}</div>
                    <h3 className="text-xl font-bold text-purple-700 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {lesson.description}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-8 text-center">
                <p className="text-red-600 font-semibold">❌ {error}</p>
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => setActiveStep('character')}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
              >
                ← Back to Character
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quest Book */}
        {activeStep === 'quest' && questData && (
          <QuestBook
            questTitle={questData.quest_title || 'Your Adventure'}
            characterName={characterAnalysis?.character_type || 'Character'}
            scenes={questData.scenes || []}
            onQuestComplete={handleQuestComplete}
          />
        )}
      </div>
    </main>
  )
}
