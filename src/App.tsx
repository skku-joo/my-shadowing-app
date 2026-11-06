import React, { useState, useEffect } from 'react';
import { Sentence, SentenceProgress, AppScreen } from './types';
import { loadSentences, saveSentences, loadAllProgress, saveSentenceProgress, resetSentencesToDefault, resetAllProgress } from './utils/storage';
import { StartScreen } from './components/StartScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { PracticeScreen } from './components/PracticeScreen';
import { EditSentencesScreen } from './components/EditSentencesScreen';
import { FinishScreen } from './components/FinishScreen';
import { MOVIE_SETTINGS } from './constants';
import { Sparkles, Film } from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, SentenceProgress>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize data from localStorage
  useEffect(() => {
    const loadedSentences = loadSentences();
    const loadedProgress = loadAllProgress();
    setSentences(loadedSentences);
    setProgressMap(loadedProgress);
    setIsLoaded(true);
  }, []);

  // Update sentences
  const handleSaveSentences = (newSentences: Sentence[]) => {
    setSentences(newSentences);
    saveSentences(newSentences);
  };

  // Reset sentences to default
  const handleResetToDefault = () => {
    const defaults = resetSentencesToDefault();
    setSentences(defaults);
    setCurrentIndex(0);
  };

  // Update single sentence progress
  const handleUpdateProgress = (progress: SentenceProgress) => {
    const nextMap = { ...progressMap, [progress.id]: progress };
    setProgressMap(nextMap);
    saveSentenceProgress(progress);
  };

  // Navigation handlers
  const handleStartPractice = () => {
    if (sentences.length === 0) {
      setScreen('edit');
    } else {
      setScreen('list');
    }
  };

  const handleSelectSentence = (index: number) => {
    setCurrentIndex(index);
    setScreen('practice');
  };

  const handleFinishSession = () => {
    setScreen('finish');
  };

  const handleRestartAll = () => {
    setCurrentIndex(0);
    setScreen('practice');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50/40 text-stone-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Starting Shadowpop! ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-start sm:py-6">
      {/* Mobile-first centered frame (Max-width 480px per PRD 8) */}
      <div className="w-full max-w-[480px] min-h-screen sm:min-h-0 bg-stone-50 sm:rounded-3xl sm:shadow-xl sm:border sm:border-stone-200/90 flex flex-col overflow-hidden relative">
        {/* Subtle top header strip for navigation context */}
        <header className="px-4 py-3 bg-white/95 border-b border-stone-200/80 sticky top-0 z-30 flex items-center justify-between backdrop-blur-xs select-none">
          <button
            onClick={() => setScreen('start')}
            className="flex items-center gap-1.5 font-display font-extrabold text-stone-900 text-lg tracking-tight hover:opacity-85 transition-opacity cursor-pointer"
          >
            <span className="text-emerald-700">Shadowpop</span>
            <span className="text-orange-500 text-xl leading-none">!</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-stone-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70 inline-flex items-center gap-1">
              <Film className="w-3 h-3 text-amber-600" />
              <span>{MOVIE_SETTINGS.movieTitleEn}</span>
            </span>

            {screen !== 'start' && (
              <button
                onClick={() => setScreen('start')}
                className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded-md hover:bg-stone-100 font-medium cursor-pointer"
              >
                Start
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 p-4 sm:p-5 overflow-y-auto">
          {screen === 'start' && (
            <StartScreen
              onStartPractice={handleStartPractice}
              onOpenEdit={() => setScreen('edit')}
              sentenceCount={sentences.length}
            />
          )}

          {screen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progressMap={progressMap}
              onSelectSentence={handleSelectSentence}
              onBackToStart={() => setScreen('start')}
              onOpenEdit={() => setScreen('edit')}
            />
          )}

          {screen === 'practice' && (
            <PracticeScreen
              sentences={sentences}
              currentIndex={currentIndex}
              progressMap={progressMap}
              onUpdateProgress={handleUpdateProgress}
              onNavigateSentence={(idx) => setCurrentIndex(idx)}
              onBackToList={() => setScreen('list')}
              onFinish={handleFinishSession}
            />
          )}

          {screen === 'edit' && (
            <EditSentencesScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onResetToDefault={handleResetToDefault}
              onBack={() => setScreen(sentences.length > 0 ? 'list' : 'start')}
            />
          )}

          {screen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progressMap={progressMap}
              onPracticeAgainSentence={(idx) => {
                setCurrentIndex(idx);
                setScreen('practice');
              }}
              onRestartAll={handleRestartAll}
              onViewList={() => setScreen('list')}
              onGoHome={() => setScreen('start')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
