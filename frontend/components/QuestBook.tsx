'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react'

interface QuestScene {
  scene_number: number
  scenario: string
  question: string
  option_a: {
    text: string
    is_correct: boolean
    feedback: string
  }
  option_b: {
    text: string
    is_correct: boolean
    feedback: string
  }
  image_uri: string
}

interface QuestBookProps {
  questTitle: string
  characterName: string
  scenes: QuestScene[]
  onQuestComplete: (coinsEarned: number) => void
}

export default function QuestBook({ questTitle, characterName, scenes, onQuestComplete }: QuestBookProps) {
  const [currentPage, setCurrentPage] = useState(0) // 0-7 for 8 scenes
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [selectedOption, setSelectedOption] = useState<'a' | 'b' | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [sceneCompleted, setSceneCompleted] = useState<boolean[]>(new Array(8).fill(false))

  const currentScene = scenes[currentPage]
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === scenes.length - 1
  const allScenesCompleted = sceneCompleted.every(completed => completed)

  const handleOptionClick = (option: 'a' | 'b') => {
    if (sceneCompleted[currentPage]) return // Already completed this scene
    
    setSelectedOption(option)
    setShowFeedback(true)

    const selectedChoice = option === 'a' ? currentScene.option_a : currentScene.option_b

    if (selectedChoice.is_correct) {
      // Correct answer - earn coin and mark scene as completed
      setCoinsEarned(prev => prev + 1)
      const newCompleted = [...sceneCompleted]
      newCompleted[currentPage] = true
      setSceneCompleted(newCompleted)
      
      // Auto-advance after 2 seconds
      setTimeout(() => {
        if (!isLastPage) {
          goToNextPage()
        } else {
          // Quest complete!
          onQuestComplete(coinsEarned + 1)
        }
      }, 2000)
    }
  }

  const goToNextPage = () => {
    if (!isLastPage) {
      setCurrentPage(prev => prev + 1)
      setSelectedOption(null)
      setShowFeedback(false)
    }
  }

  const goToPreviousPage = () => {
    if (!isFirstPage) {
      setCurrentPage(prev => prev - 1)
      setSelectedOption(null)
      setShowFeedback(false)
    }
  }

  const getFeedback = () => {
    if (!selectedOption) return ''
    return selectedOption === 'a' ? currentScene.option_a.feedback : currentScene.option_b.feedback
  }

  const isCorrectAnswer = () => {
    if (!selectedOption) return false
    return selectedOption === 'a' ? currentScene.option_a.is_correct : currentScene.option_b.is_correct
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      {/* Picture Book Container */}
      <div className="relative w-full max-w-4xl">
        
        {/* Coin Counter */}
        <div className="absolute -top-16 right-0 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold text-xl z-10">
          <Coins className="w-6 h-6" />
          <span>{coinsEarned} / 8</span>
        </div>

        {/* Book Page */}
        <div className="bg-white rounded-3xl shadow-2xl border-8 border-amber-200 overflow-hidden">
          
          {/* Page Header */}
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4">
            <h2 className="text-2xl font-bold text-center">{questTitle}</h2>
            <p className="text-center text-sm opacity-90 mt-1">
              Page {currentPage + 1} of {scenes.length}
            </p>
          </div>

          {/* Scene Content */}
          <div className="relative">
            
            {/* Scene Image - Full width background */}
            <div className="relative w-full h-96 bg-gradient-to-b from-blue-50 to-purple-50">
              {currentScene.image_uri ? (
                <img 
                  src={currentScene.image_uri} 
                  alt={`Scene ${currentScene.scene_number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-pulse text-6xl mb-4">🎨</div>
                  <p className="text-lg font-semibold">Generating illustration...</p>
                  <p className="text-sm mt-2">Scene {currentScene.scene_number} image coming soon!</p>
                </div>
              )}
              
              {/* Scene Number Badge */}
              <div className="absolute top-4 left-4 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-purple-600">{currentScene.scene_number}</span>
              </div>

              {/* Completion Badge */}
              {sceneCompleted[currentPage] && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  <span className="font-bold">+1</span>
                </div>
              )}
            </div>

            {/* Text Content Overlay */}
            <div className="p-8 space-y-6">
              
              {/* Scenario */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
                <p className="text-lg leading-relaxed text-gray-800 font-medium">
                  {currentScene.scenario}
                </p>
              </div>

              {/* Question */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-700 mb-6">
                  {currentScene.question}
                </h3>
              </div>

              {/* Options */}
              {!showFeedback ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A */}
                  <button
                    onClick={() => handleOptionClick('a')}
                    disabled={sceneCompleted[currentPage]}
                    className={`
                      p-6 rounded-2xl border-4 font-semibold text-lg transition-all
                      ${sceneCompleted[currentPage] 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                        : 'bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl font-bold text-green-600">A</span>
                      <span className="text-gray-800 text-left">{currentScene.option_a.text}</span>
                    </div>
                  </button>

                  {/* Option B */}
                  <button
                    onClick={() => handleOptionClick('b')}
                    disabled={sceneCompleted[currentPage]}
                    className={`
                      p-6 rounded-2xl border-4 font-semibold text-lg transition-all
                      ${sceneCompleted[currentPage]
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl font-bold text-red-600">B</span>
                      <span className="text-gray-800 text-left">{currentScene.option_b.text}</span>
                    </div>
                  </button>
                </div>
              ) : (
                /* Feedback */
                <div className={`
                  p-6 rounded-2xl border-4 text-center
                  ${isCorrectAnswer() 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-orange-50 border-orange-400'
                  }
                `}>
                  <div className="text-6xl mb-4">
                    {isCorrectAnswer() ? '🌟' : '💭'}
                  </div>
                  <p className="text-xl font-semibold text-gray-800">
                    {getFeedback()}
                  </p>
                  {!isCorrectAnswer() && (
                    <button
                      onClick={() => {
                        setSelectedOption(null)
                        setShowFeedback(false)
                      }}
                      className="mt-4 bg-orange-500 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-t-4 border-purple-200">
            
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={isFirstPage}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all
                ${isFirstPage
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105 shadow-lg'
                }
              `}
            >
              <ChevronLeft className="w-6 h-6" />
              <span>Previous</span>
            </button>

            {/* Progress Dots */}
            <div className="flex gap-2">
              {scenes.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-3 h-3 rounded-full transition-all
                    ${index === currentPage 
                      ? 'bg-purple-600 w-8' 
                      : sceneCompleted[index]
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={isLastPage || !sceneCompleted[currentPage]}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all
                ${(isLastPage || !sceneCompleted[currentPage])
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105 shadow-lg'
                }
              `}
            >
              <span>Next</span>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quest Complete Message */}
        {allScenesCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-3xl">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-purple-700 mb-4">
                Quest Complete!
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                {characterName} learned so much!
              </p>
              <div className="bg-yellow-100 rounded-full px-8 py-4 inline-flex items-center gap-3 mb-6">
                <Coins className="w-8 h-8 text-yellow-600" />
                <span className="text-3xl font-bold text-yellow-700">{coinsEarned} Coins Earned!</span>
              </div>
              <button
                onClick={() => onQuestComplete(coinsEarned)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
