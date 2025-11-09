'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [countdown, setCountdown] = useState<number>(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const currentScene = scenes[currentPage]
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === scenes.length - 1
  const allScenesCompleted = sceneCompleted.every(completed => completed)

  // Preload next scene image to prevent glitches
  useEffect(() => {
    if (currentPage < scenes.length - 1) {
      const nextScene = scenes[currentPage + 1]
      if (nextScene?.image_uri) {
        const img = new Image()
        img.src = nextScene.image_uri
      }
    }
  }, [currentPage, scenes])

  const createConfetti = () => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739']
    const confettiCount = 100
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-piece'
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.animationDelay = Math.random() * 0.5 + 's'
      confetti.style.animationDuration = (Math.random() * 3 + 4) + 's'
      
      // Random shapes
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%'
      }
      
      document.body.appendChild(confetti)
      
      // Remove after animation
      setTimeout(() => {
        confetti.remove()
      }, 5000)
    }
  }

  const createTryAgainText = () => {
    const textCount = 8
    
    for (let i = 0; i < textCount; i++) {
      const textElement = document.createElement('div')
      textElement.className = 'try-again-text'
      textElement.textContent = '🙁'
      textElement.style.left = Math.random() * 100 + '%'
      textElement.style.animationDelay = (Math.random() * 0.3) + 's'
      textElement.style.animationDuration = (Math.random() * 1 + 3.5) + 's'
      
      document.body.appendChild(textElement)
      
      // Remove after animation
      setTimeout(() => {
        textElement.remove()
      }, 5000)
    }
  }

  const handleOptionClick = (option: 'a' | 'b') => {
    if (sceneCompleted[currentPage]) return // Already completed this scene
    
    setSelectedOption(option)
    setShowFeedback(true)

    const selectedChoice = option === 'a' ? currentScene.option_a : currentScene.option_b

    if (selectedChoice.is_correct) {
      // Trigger confetti!
      createConfetti()
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
      
      // Correct answer - earn coin and mark scene as completed
      setCoinsEarned(prev => prev + 1)
      const newCompleted = [...sceneCompleted]
      newCompleted[currentPage] = true
      setSceneCompleted(newCompleted)
      
      // Start countdown from 8
      setCountdown(8)
      
      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      // Auto-advance after 8 seconds
      setTimeout(() => {
        clearInterval(countdownInterval)
        if (!isLastPage) {
          goToNextPage()
        } else {
          // Quest complete!
          onQuestComplete(coinsEarned + 1)
        }
      }, 8000)
    } else {
      // Incorrect answer - trigger Try Again text animation
      createTryAgainText()
    }
  }

  const goToNextPage = () => {
    if (!isLastPage) {
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentPage(prev => prev + 1)
        setSelectedOption(null)
        setShowFeedback(false)
        setCountdown(0)
        setTimeout(() => setIsFlipping(false), 100)
      }, 600) // Match animation duration
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
    <div className="min-h-screen flex items-start justify-center pt-8 p-4">
      {/* Picture Book Container */}
      <div className="relative w-full max-w-[1400px]">
        
        {/* Coin Counter */}
        <div className="absolute -top-16 right-0 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold text-xl z-10">
          <span className="text-2xl">⭐️</span>
          <span>{coinsEarned} / 8</span>
        </div>

        {/* Book Page */}
        <div className={`bg-white rounded-3xl shadow-2xl border-8 border-amber-200 overflow-hidden transition-all duration-600 ${
          isFlipping ? 'animate-page-flip' : 'animate-pulse-grow'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}>
          
          {/* Page Header */}
          <div className="bg-yellow-50 text-black px-12 py-4 relative overflow-hidden">
            {/* Light sweep animation - moving across and around */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Main light beam moving diagonally */}
              <div className="absolute w-64 h-64 bg-gradient-radial from-yellow-300/60 via-yellow-200/30 to-transparent rounded-full blur-3xl animate-light-sweep"></div>
              {/* Secondary glow */}
              <div className="absolute w-48 h-48 bg-gradient-radial from-white/50 via-yellow-100/20 to-transparent rounded-full blur-2xl animate-light-sweep" style={{ animationDelay: '0.3s' }}></div>
              {/* Trailing sparkle */}
              <div className="absolute w-32 h-32 bg-gradient-radial from-yellow-400/40 via-yellow-300/15 to-transparent rounded-full blur-xl animate-light-sweep" style={{ animationDelay: '0.6s' }}></div>
            </div>
            <h2 className="text-5xl font-bold text-center relative z-10 text-black">{questTitle}</h2>
            <p className="text-center text-xl opacity-70 mt-1 text-black">
              Page {currentPage + 1} of {scenes.length}
            </p>
          </div>

          {/* Scene Content */}
          <div className="relative">
            
            {/* Scene Image with Text Overlay - Like a real storybook */}
            <div className="relative w-full h-[800px] bg-gradient-to-b from-blue-50 to-purple-50">
              {currentScene.image_uri ? (
                <img 
                  key={`scene-${currentScene.scene_number}-${currentScene.image_uri}`}
                  src={currentScene.image_uri} 
                  alt={`Scene ${currentScene.scene_number}`}
                  className="w-full h-full object-cover transition-opacity duration-300 ease-in-out"
                  loading="eager"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                  style={{ opacity: 0 }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="animate-pulse text-6xl mb-4">🎨</div>
                  <p className="text-lg font-semibold">Generating illustration...</p>
                  <p className="text-sm mt-2">Scene {currentScene.scene_number} image coming soon!</p>
                </div>
              )}
              
              {/* Scene Number Badge - Cute top left corner with subtle float */}
              <div className="absolute top-6 left-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white animate-float-subtle">
                <span className="text-3xl font-bold text-white">{currentScene.scene_number}</span>
              </div>

              {/* Folded Corner - Top Right - LARGE & PROMINENT */}
              <div className="absolute top-0 right-0 z-20">
                {/* Main fold triangle - EXTRA LARGE */}
                <div className="w-0 h-0 border-t-[150px] border-t-amber-200 border-l-[150px] border-l-transparent shadow-2xl drop-shadow-2xl"></div>
                {/* Inner shadow for depth */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[150px] border-t-amber-400/60 border-l-[150px] border-l-transparent"></div>
                {/* Dark shadow edge */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[150px] border-t-black/20 border-l-[150px] border-l-transparent"></div>
                {/* "Flip!" text - ROTATED RIGHT */}
                <div className="absolute top-6 right-6 transform rotate-[35deg]">
                  <span className="text-4xl font-black text-amber-800 animate-pulse drop-shadow-lg">Flip!</span>
                </div>
              </div>

              {/* Completion Badge */}
              {sceneCompleted[currentPage] && (
                <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <span className="text-xl">⭐️</span>
                  <span className="font-bold">+1</span>
                </div>
              )}

              {/* Story Text Overlay - Like a real storybook */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-24 pb-6 px-12">
                <p className="text-white text-5xl leading-relaxed font-bold drop-shadow-lg text-center">
                  {currentScene.scenario}
                </p>
              </div>
            </div>

            {/* Question and Options Below Image */}
            <div className="p-8 space-y-6">

              {/* Question */}
              <div className="text-center">
                <h3 className="text-4xl font-bold text-black mb-8">
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
                      p-4 rounded-2xl border-4 font-semibold text-xl transition-all
                      ${sceneCompleted[currentPage] 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50' 
                        : 'bg-orange-50 border-orange-300 hover:bg-orange-100 hover:border-orange-400 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl font-bold text-orange-600">A</span>
                      <span className="text-gray-800 text-left text-3xl">{currentScene.option_a.text}</span>
                    </div>
                  </button>

                  {/* Option B */}
                  <button
                    onClick={() => handleOptionClick('b')}
                    disabled={sceneCompleted[currentPage]}
                    className={`
                      p-4 rounded-2xl border-4 font-semibold text-xl transition-all
                      ${sceneCompleted[currentPage]
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                        : 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 hover:border-yellow-400 hover:scale-105 cursor-pointer'
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl font-bold text-yellow-600">B</span>
                      <span className="text-gray-800 text-left text-3xl">{currentScene.option_b.text}</span>
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
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-semibold text-gray-800">
                      {getFeedback()}{isCorrectAnswer() ? ' :)' : ' :('}
                    </p>
                    {isCorrectAnswer() && countdown > 0 && (
                      <div className="flex items-center gap-4 text-black">
                        <p className="text-lg font-medium">Next quest:</p>
                        <div className="text-4xl font-bold">{countdown}</div>
                      </div>
                    )}
                  </div>
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

          {/* Progress Indicator */}
          <div className="flex justify-center items-center px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-t-4 border-purple-200">
            {/* Progress Dots */}
            <div className="flex gap-2">
              {scenes.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-3 h-3 rounded-full transition-all
                    ${index === currentPage 
                      ? 'bg-pink-500 w-8' 
                      : sceneCompleted[index]
                      ? 'bg-orange-500'
                      : 'bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quest Complete Message */}
        {allScenesCompleted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-3xl">
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl max-w-md">
              <img src="/star.png" alt="Star" className="w-32 h-32 mb-4 mx-auto" />
              <h2 className="text-4xl font-bold text-purple-700 mb-6">
                Quest Complete!
              </h2>
              <div className="bg-amber-100 rounded-full px-8 py-4 inline-flex items-center gap-3 mb-6">
                <span className="text-5xl">⭐️</span>
                <span className="text-3xl font-bold text-amber-700">{coinsEarned} Stars Earned!</span>
              </div>
              <button
                onClick={() => onQuestComplete(coinsEarned)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                New Story Adventure!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
