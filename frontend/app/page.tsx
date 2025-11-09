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
  const [characterName, setCharacterName] = useState<string>('')
  const [customLesson, setCustomLesson] = useState<string>('')

  const handleCharacterDrawn = async (imageData: string, characterName: string) => {
    setIsGenerating(true)
    setError('')
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      
      const formData = new FormData()
      formData.append('drawing_data', imageData)
      formData.append('user_id', 'demo_user_' + Date.now())
      formData.append('character_name', characterName)

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
      setCharacterAnalysis({
        ...data.analysis,
        character_name: characterName  // Store the user-provided name
      })
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate character. Please try again.'
      setError(errorMessage)
      console.error('Error generating character:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCustomLessonSubmit = async () => {
    if (!customLesson.trim()) return
    await handleLessonSelect(customLesson)
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
          character_name: characterAnalysis?.character_name || characterAnalysis?.character_type || 'Character',
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
    // Reset to start - no alert
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
    <main className="min-h-screen p-4" style={{ 
      backgroundImage: 'url(/storytopia-bg.png)', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-[1800px] mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-6xl font-bold text-black mb-3">
            Storytopia
          </h1>
          <p className="text-2xl text-gray-800">
            Create your character, choose a lesson, and go on an adventure!
          </p>
        </header>

        {/* Progress Steps - Colorful Bubble Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-full shadow-2xl px-10 py-5 flex gap-4 items-center">
            <button
              onClick={() => setActiveStep('character')}
              className={`px-10 py-5 rounded-full font-bold text-2xl transition-all transform hover:scale-105 ${
                activeStep === 'character'
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg scale-110'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              Character Studio
            </button>
            <button
              onClick={() => setActiveStep('lesson')}
              disabled={!generatedCharacter}
              className={`px-10 py-5 rounded-full font-bold text-2xl transition-all transform hover:scale-105 ${
                activeStep === 'lesson'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg scale-110'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              Lessons to Explore
            </button>
            <button
              disabled={!questData}
              className={`px-10 py-5 rounded-full font-bold text-2xl transition-all transform hover:scale-105 ${
                activeStep === 'quest'
                  ? 'bg-black text-white shadow-lg scale-110'
                  : 'bg-white text-black border-2 border-black hover:bg-gray-50'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              My Story Adventure!
            </button>
          </div>
        </div>

        {/* Step 1: Character Creation */}
        {activeStep === 'character' && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 animate-pulse-grow" style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="grid grid-cols-2 gap-8 h-[calc(100vh-240px)]">
              {/* Left: Drawing Canvas */}
              <div className="flex flex-col">
                <div className="flex items-center justify-start mb-4 mt-6 gap-4 pl-8">
                  <img src="/sparkle.png" alt="Sparkle" className="w-32 h-32" />
                  <h2 className="text-4xl font-bold text-black">
                    Draw Your Favorite Character!
                  </h2>
                </div>
                <div className="flex-1">
                  <DrawingCanvas
                    title=""
                    onImageGenerated={(imageData, name) => {
                      setCharacterDrawing(imageData)
                    }}
                  />
                </div>
              </div>

              {/* Right: Generated Character */}
              <div className="flex flex-col">
                {/* Character Name Input */}
                <div className="space-y-2 mb-4">
                  <label htmlFor="character-name" className="block text-2xl font-semibold text-black">
                    Give your character a name
                  </label>
                  <input
                    id="character-name"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter character name (e.g., Sparkle, Max, Luna)"
                    className="w-full px-4 py-3 border-4 border-orange-300 rounded-lg text-xl font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    maxLength={20}
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => {
                    if (characterName.trim() && characterDrawing) {
                      handleCharacterDrawn(characterDrawing, characterName)
                    }
                  }}
                  disabled={!characterName.trim() || !characterDrawing}
                  className={`w-full text-3xl font-bold py-5 rounded-full transition-all shadow-lg mb-6 ${
                    characterName.trim() && characterDrawing
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Generate Character
                </button>

                <h2 className="text-4xl font-bold text-black text-center mb-6 mt-4">
                  Watch them come to life!
                </h2>
                <div className="flex-1 relative" style={{ maxHeight: '600px' }}>
                  <div className="bg-white rounded-3xl border border-gray-300 overflow-hidden shadow-xl h-full">
                    <div className="flex items-center justify-center h-full p-6">
                  {isGenerating ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                      <p className="text-2xl font-semibold text-black">
                        Creating your character...
                      </p>
                    </div>
                  ) : generatedCharacter ? (
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                      <div className="flex-1 flex items-center justify-center w-full">
                        <img
                          src={generatedCharacter}
                          alt="Generated character"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      {characterAnalysis && (
                        <div className="mt-6">
                          <p className="text-5xl font-bold text-black text-center">
                            Hi {characterAnalysis.character_name || characterAnalysis.character_type}!
                          </p>
                        </div>
                      )}
                    </div>
                  ) : error ? (
                    <div className="text-center p-8 max-w-md mx-auto">
                      <div className="text-6xl mb-4">❌</div>
                      <p className="text-orange-600 font-bold mb-6 text-3xl leading-relaxed">
                        {error}
                      </p>
                      <button
                        onClick={handleTryAgain}
                        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full text-xl font-bold hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg"
                      >
                        Try Again ✨
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-gray-500 text-2xl">
                        Draw your character and click<br />
                        "Generate Character" to see the magic!
                      </p>
                    </div>
                  )}
                    </div>
                  </div>
                </div>

                {generatedCharacter && !isGenerating && (
                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={handleTryAgain}
                      className="flex-1 px-8 py-4 bg-black text-white rounded-full text-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => setActiveStep('lesson')}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-full text-xl font-bold hover:from-orange-600 hover:to-yellow-600 transition-all shadow-lg"
                    >
                      Choose Lesson
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Lesson Selection */}
        {activeStep === 'lesson' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 animate-pulse-grow" style={{ boxShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            {isGenerating ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
                <p className="text-3xl font-semibold text-orange-600">
                  Creating your quest...
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-6xl font-bold text-orange-600 mb-10 text-center">
                  Choose a Lesson
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LESSONS.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonSelect(lesson.id)}
                    className="bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 border-4 border-orange-300 rounded-2xl p-8 hover:border-yellow-500 hover:scale-105 transition-all text-left shadow-lg"
                  >
                    <div className="text-8xl mb-6">{lesson.emoji}</div>
                    <h3 className="text-4xl font-bold text-amber-700 mb-4">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-800 text-2xl font-medium">
                      {lesson.description}
                    </p>
                  </button>
                ))}
                </div>

                {/* Custom Lesson Input */}
                <div className="mt-12 max-w-3xl mx-auto">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-yellow-400 rounded-3xl p-8 shadow-lg">
                    <h3 className="text-4xl font-bold text-orange-600 mb-4 text-center">
                      Or Create Your Own Lesson! ✨
                    </h3>
                    <p className="text-3xl text-gray-700 mb-6 text-center">
                      Type a custom lesson for your child
                    </p>
                    <div className="flex gap-4">
                      <textarea
                        value={customLesson}
                        onChange={(e) => setCustomLesson(e.target.value)}
                        placeholder="e.g., Learning to be brave when trying new things"
                        className="flex-1 px-6 py-4 border-4 border-orange-300 rounded-2xl text-2xl font-medium focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-200 resize-none"
                        rows={3}
                        maxLength={200}
                      />
                      <button
                        onClick={handleCustomLessonSubmit}
                        disabled={!customLesson.trim()}
                        className={`px-10 py-4 rounded-2xl text-3xl font-bold transition-all shadow-lg ${
                          customLesson.trim()
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600 hover:scale-105'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Go!
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="mt-8 text-center">
                <p className="text-red-600 font-semibold text-2xl">❌ {error}</p>
              </div>
            )}

            <div className="mt-10 text-center">
              <button
                onClick={() => setActiveStep('character')}
                className="px-8 py-4 bg-black text-white rounded-full text-xl font-bold hover:bg-gray-800 transition-all shadow-lg"
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
