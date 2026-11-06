import React, { useState, useEffect, useRef } from 'react';
import { Sentence, SentenceProgress, ShadowingStepId, SelfCheckRating } from '../types';
import { SHADOWING_STEPS } from '../constants';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { 
  Play, Pause, Repeat, Mic, Square, Volume2, ArrowLeft, 
  ChevronLeft, ChevronRight, Eye, EyeOff, Check, Sparkles, AlertCircle 
} from 'lucide-react';

interface Props {
  sentences: Sentence[];
  currentIndex: number;
  progressMap: Record<number, SentenceProgress>;
  onUpdateProgress: (progress: SentenceProgress) => void;
  onNavigateSentence: (index: number) => void;
  onBackToList: () => void;
  onFinish: () => void;
}

export const PracticeScreen: React.FC<Props> = ({
  sentences,
  currentIndex,
  progressMap,
  onUpdateProgress,
  onNavigateSentence,
  onBackToList,
  onFinish,
}) => {
  const currentSentence = sentences[currentIndex];
  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Practice state
  const [currentStep, setCurrentStep] = useState<ShadowingStepId>(1);
  const [isTextHidden, setIsTextHidden] = useState<boolean>(true);
  const [isKoreanHidden, setIsKoreanHidden] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [micDenied, setMicDenied] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingMyVoice, setIsPlayingMyVoice] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordStopTimerRef = useRef<any>(null);

  // Speech Recognition (Word Check) state
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedWords, setRecognizedWords] = useState<string[] | null>(null);
  const recognitionRef = useRef<any>(null);

  // Current sentence progress
  const currentProgress = progressMap[currentSentence?.id] || {
    id: currentSentence?.id,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };

  // Sync step change with text hidden/shown rules
  const handleSelectStep = (stepId: ShadowingStepId) => {
    setCurrentStep(stepId);
    const stepInfo = SHADOWING_STEPS.find(s => s.id === stepId);
    if (stepInfo) {
      setIsTextHidden(stepInfo.defaultTextHidden);
    }
  };

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
    }
  }, []);

  // Reset audio & state on sentence change
  useEffect(() => {
    // Stop any ongoing recording or playback
    if (isRecording) {
      handleStopRecording();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingMyVoice(false);
    }
    setRecognizedWords(null);

    // Initial step setup
    const stepInfo = SHADOWING_STEPS.find(s => s.id === currentStep);
    setIsTextHidden(stepInfo ? stepInfo.defaultTextHidden : true);
  }, [currentIndex]);

  // Clean up audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (recordStopTimerRef.current) clearTimeout(recordStopTimerRef.current);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  if (!currentSentence) {
    return (
      <div className="text-center p-8">
        <p className="text-stone-600 font-medium">No sentence selected.</p>
        <button onClick={onBackToList} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl">
          Return to list
        </button>
      </div>
    );
  }

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playerRef.current?.playSegment(
        currentSentence.start, 
        currentSentence.end, 
        isLooping,
        () => setIsPlaying(false)
      );
      setIsPlaying(true);

      // Increment play count
      onUpdateProgress({
        ...currentProgress,
        plays: (currentProgress.plays || 0) + 1,
      });
    }
  };

  // Handle Speed Change
  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setSpeed(speed);
  };

  // Toggle Loop
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    // If currently playing, update segment playback loop param
    if (isPlaying) {
      playerRef.current?.playSegment(
        currentSentence.start,
        currentSentence.end,
        nextLoop,
        () => setIsPlaying(false)
      );
    }
  };

  // Start Voice Recording
  // PRD: plays the sentence once and records the learner's voice at the same time.
  // Recording stops 1 second after the sentence ends. (Loop is ignored while recording.)
  const handleStartRecording = async () => {
    try {
      setMicDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        if (recordedAudioUrl) {
          URL.revokeObjectURL(recordedAudioUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        setIsRecording(false);

        // Update progress
        const nextRecordings = (currentProgress.recordings || 0) + 1;
        // PRD: "Status becomes 'practiced' after one recording and 'done' after a recording in Step 4"
        const nextStatus = currentStep === 4 ? 'done' : (currentProgress.status === 'done' ? 'done' : 'practiced');

        onUpdateProgress({
          ...currentProgress,
          recordings: nextRecordings,
          status: nextStatus,
          lastRecordedAt: Date.now(),
        });

        // Release mic tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Play video once (loop is ignored while recording)
      // Duration of sentence in milliseconds
      const sentenceDurationMs = ((currentSentence.end - currentSentence.start) / playbackSpeed) * 1000;
      // Recording stops 1 second after sentence ends
      const stopDelayMs = sentenceDurationMs + 1000;

      playerRef.current?.playSegment(
        currentSentence.start, 
        currentSentence.end, 
        false, // Loop ignored during recording
        () => {
          // Sentence ended on video
        }
      );
      setIsPlaying(true);

      if (recordStopTimerRef.current) clearTimeout(recordStopTimerRef.current);
      recordStopTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        setIsPlaying(false);
      }, stopDelayMs);

    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setMicDenied(true);
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (recordStopTimerRef.current) {
      clearTimeout(recordStopTimerRef.current);
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    playerRef.current?.pause();
    setIsRecording(false);
    setIsPlaying(false);
  };

  // Play learner's recorded voice
  const handlePlayMyVoice = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingMyVoice && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingMyVoice(false);
      return;
    }

    const audio = new Audio(recordedAudioUrl);
    audioPlayerRef.current = audio;
    audio.onended = () => {
      setIsPlayingMyVoice(false);
    };
    audio.onerror = () => {
      setIsPlayingMyVoice(false);
    };
    audio.play();
    setIsPlayingMyVoice(true);
  };

  // Play Original sentence clip right after
  const handlePlayOriginal = () => {
    if (isPlayingMyVoice && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingMyVoice(false);
    }
    playerRef.current?.playSegment(
      currentSentence.start, 
      currentSentence.end, 
      false, 
      () => setIsPlaying(false)
    );
    setIsPlaying(true);
  };

  // Self Check Rating Update
  const handleSetSelfCheck = (questionIndex: 0 | 1 | 2, rating: SelfCheckRating) => {
    const newSelfCheck = [...currentProgress.selfCheck] as [SelfCheckRating, SelfCheckRating, SelfCheckRating];
    newSelfCheck[questionIndex] = rating;

    // Check if status should update
    const allChecked = newSelfCheck.every(r => r !== null);
    const nextStatus = (currentStep === 4 && allChecked) ? 'done' : currentProgress.status;

    onUpdateProgress({
      ...currentProgress,
      selfCheck: newSelfCheck,
      status: nextStatus,
    });
  };

  // Word Check via Web Speech API
  const handleStartWordCheck = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecognizing && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecognizing(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecognizing(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const cleanWords = transcript
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
          .split(/\s+/)
          .filter(Boolean);
        setRecognizedWords(cleanWords);
        setIsRecognizing(false);
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecognizing(false);
      };

      recognition.onend = () => {
        setIsRecognizing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsRecognizing(false);
    }
  };

  // Helper to render sentence words with stress highlighting
  const renderSentenceText = () => {
    if (isTextHidden) {
      return (
        <div className="py-5 px-4 text-center select-none bg-stone-100/70 rounded-2xl border border-stone-200/60">
          <p className="text-stone-400 font-medium text-lg">
            •••• •••••••• •••• ••••••••
          </p>
          <p className="text-xs text-stone-500 mt-1 font-normal">
            자막이 가려져 있습니다 (소리에 집중하세요)
          </p>
          <button
            onClick={() => setIsTextHidden(false)}
            className="mt-2.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Text / 문장 보기</span>
          </button>
        </div>
      );
    }

    const words = currentSentence.text.split(/\s+/);
    const upperStress = (currentSentence.stress || []).map(w => w.toUpperCase().replace(/[^A-Z0-9]/g, ''));

    return (
      <div className="text-stone-900 leading-relaxed font-sans text-2xl sm:text-3xl font-semibold tracking-tight transition-all text-center">
        {words.map((word, idx) => {
          const clean = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const isStressed = upperStress.includes(clean);
          return (
            <span
              key={idx}
              className={
                isStressed 
                  ? 'font-extrabold text-stone-950 underline decoration-amber-400 decoration-4 underline-offset-4' 
                  : 'font-normal text-stone-800'
              }
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  // Word Check comparison calculation
  const targetWords = currentSentence.text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const matchedWordCount = recognizedWords 
    ? targetWords.filter(tw => recognizedWords.includes(tw)).length 
    : 0;

  const isLastSentence = currentIndex === sentences.length - 1;

  return (
    <div className="w-full flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Top Video Player + One-line credit under it (PRD requirement) */}
      <YouTubePlayer 
        ref={playerRef} 
        showCredit={true} 
        onPlaybackStateChange={setIsPlaying}
      />

      {/* 2. Top Navigation Bar: Back, Sentence Counter with ◀ ▶ */}
      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-2xl border border-stone-200/80 shadow-2xs">
        <button
          onClick={onBackToList}
          className="min-h-[44px] px-2.5 py-1.5 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>List</span>
          <span className="text-stone-400">/ 목록</span>
        </button>

        {/* Counter: Sentence 3 / 6 with arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSentence(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Previous sentence"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-1">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block">Sentence</span>
            <span className="text-sm font-bold text-stone-900 font-mono">
              {currentIndex + 1} / {sentences.length}
            </span>
          </div>

          <button
            onClick={() => onNavigateSentence(Math.min(sentences.length - 1, currentIndex + 1))}
            disabled={currentIndex === sentences.length - 1}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            aria-label="Next sentence"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Status tag */}
        <div className="text-right">
          {currentProgress.status === 'done' ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ★ Done
            </span>
          ) : currentProgress.status === 'practiced' ? (
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              ◐ Practiced
            </span>
          ) : (
            <span className="text-xs font-normal text-stone-400 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
              ☆ New
            </span>
          )}
        </div>
      </div>

      {/* 6. Step Guide Tabs (4 tabs in order) */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl">
          {SHADOWING_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step.id)}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-white text-emerald-800 font-bold shadow-xs border border-stone-200/50'
                    : 'text-stone-500 hover:text-stone-900 font-medium'
                }`}
              >
                <span className="text-[11px] sm:text-xs leading-tight whitespace-nowrap">
                  {step.id === 1 && '1. Listen'}
                  {step.id === 2 && '2. Mumble'}
                  {step.id === 3 && '3. Read'}
                  {step.id === 4 && '4. Shadow'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-stone-400 leading-tight">
                  {step.id === 1 && '듣기'}
                  {step.id === 2 && '웅얼거리기'}
                  {step.id === 3 && '보며따라'}
                  {step.id === 4 && '안보고'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step instruction line in English + Korean */}
        {(() => {
          const step = SHADOWING_STEPS.find(s => s.id === currentStep);
          if (!step) return null;
          return (
            <div className="px-2 pt-0.5 text-center">
              <p className="text-xs font-semibold text-stone-800">
                {step.shortDescEn}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {step.shortDescKo}
              </p>
            </div>
          );
        })()}
      </div>

      {/* 3 & 4. Sentence Text Box (Large font >= 22px, bold stress words) + Hide Text Toggle */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          {/* Speaker label */}
          <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-lg">
            {currentSentence.speaker}
          </span>

          {/* Hide Text Toggle button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTextHidden(!isTextHidden)}
              className="text-xs text-stone-600 hover:text-stone-900 py-1 px-2 rounded-lg hover:bg-stone-100 transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              {isTextHidden ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Show Text / 문장 보기</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-stone-500" />
                  <span>Hide Text / 문장 숨기기</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sentence Body (Min 22px) */}
        <div className="py-2 min-h-[70px] flex items-center justify-center">
          {renderSentenceText()}
        </div>

        {/* 4. Korean Meaning (small, gray, toggleable) */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          {isKoreanHidden ? (
            <span className="text-stone-400 italic">Korean translation hidden / 한국어 뜻 숨김</span>
          ) : (
            <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed">
              {currentSentence.korean}
            </p>
          )}

          <button
            onClick={() => setIsKoreanHidden(!isKoreanHidden)}
            className="text-[11px] text-stone-400 hover:text-stone-700 shrink-0 ml-2 underline cursor-pointer"
          >
            {isKoreanHidden ? 'Show Ko / 뜻 보기' : 'Hide Ko / 뜻 숨기기'}
          </button>
        </div>
      </div>

      {/* 5. Playback Control Row: Play/Pause, Loop, Speed (0.5x, 0.75x, 1.0x) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
          {/* Main Play / Pause Button (at least 48px) */}
          <button
            onClick={handleTogglePlay}
            className={`min-h-[50px] py-2.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs active:scale-[0.98] ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <div className="text-left">
                  <span>Pause</span>
                  <span className="block text-[10px] font-normal opacity-90 -mt-0.5">일시정지</span>
                </div>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <div className="text-left">
                  <span>Play Clip</span>
                  <span className="block text-[10px] font-normal opacity-90 -mt-0.5">문장 듣기</span>
                </div>
              </>
            )}
          </button>

          {/* Loop on/off Button */}
          <button
            onClick={handleToggleLoop}
            className={`min-h-[50px] px-3.5 py-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center cursor-pointer transition-colors border ${
              isLooping
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              <span>Loop {isLooping ? 'ON' : 'OFF'}</span>
            </div>
            <span className="text-[10px] font-normal text-stone-500">1.5초 반복</span>
          </button>

          {/* Speed 0.5x / 0.75x / 1.0x */}
          <div className="flex bg-stone-100 p-1 rounded-xl h-[50px] items-center">
            {[0.5, 0.75, 1.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleChangeSpeed(rate)}
                className={`h-full px-2 sm:px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  playbackSpeed === rate
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {rate}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Record Area: Record button, My Voice, Original */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-stone-800 text-sm sm:text-base">
              Voice Shadowing / 녹음 & 비교
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            {currentProgress.recordings || 0} recorded
          </span>
        </div>

        {/* Mic denied warning notice per PRD */}
        {micDenied && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Mic is off. You can still listen and shadow out loud.</p>
              <p className="text-amber-700 mt-0.5">
                마이크 권한이 꺼져 있어도 소리를 듣고 직접 큰 소리로 쉐도잉 연습을 할 수 있습니다!
              </p>
            </div>
          </div>
        )}

        {/* Big Record Button (at least 48px) */}
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="w-full min-h-[52px] py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-bold text-base shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Mic className="w-5 h-5" />
            <div className="text-center">
              <span>Record & Shadow</span>
              <span className="block text-[11px] font-normal text-orange-100 -mt-0.5">
                영상을 들으며 동시에 녹음 (문장 끝나고 1초 뒤 자동 정지)
              </span>
            </div>
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-6">
                <span className="w-1.5 h-4 bg-red-600 rounded-full animate-audio-bar-1" />
                <span className="w-1.5 h-6 bg-red-600 rounded-full animate-audio-bar-2" />
                <span className="w-1.5 h-3 bg-red-600 rounded-full animate-audio-bar-3" />
                <span className="w-1.5 h-5 bg-red-600 rounded-full animate-audio-bar-4" />
                <span className="w-1.5 h-4 bg-red-600 rounded-full animate-audio-bar-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">Recording & Playing...</p>
                <p className="text-[11px] text-red-600">배우와 동시에 말해보세요!</p>
              </div>
            </div>

            <button
              onClick={handleStopRecording}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        )}

        {/* Playback comparison buttons: ▶ My Voice & ▶ Original */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* My Voice */}
          <button
            onClick={handlePlayMyVoice}
            disabled={!recordedAudioUrl}
            className={`min-h-[48px] py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              recordedAudioUrl
                ? isPlayingMyVoice
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-50'
                : 'bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left">
              <span>{isPlayingMyVoice ? 'Playing...' : '▶ My Voice'}</span>
              <span className="block text-[10px] font-normal text-stone-500 -mt-0.5">내 목소리 듣기</span>
            </div>
          </button>

          {/* Original Video Clip */}
          <button
            onClick={handlePlayOriginal}
            className="min-h-[48px] py-2 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 text-amber-600 fill-current shrink-0" />
            <div className="text-left">
              <span>▶ Original</span>
              <span className="block text-[10px] font-normal text-stone-500 -mt-0.5">배우 원본 듣기</span>
            </div>
          </button>
        </div>
      </div>

      {/* 8. Self-Check (after recording), each with 😀 / 🙂 / 😐 buttons */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="border-b border-stone-100 pb-2 flex items-center justify-between">
          <h3 className="font-bold text-stone-800 text-sm sm:text-base">
            Self-Check / 스스로 점검하기
          </h3>
          <span className="text-[11px] text-stone-400">
            각 항목을 솔직하게 평가해보세요
          </span>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Question 1: Speed */}
          <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium text-stone-800">
                1. Did I keep up with the speed?
              </p>
              <p className="text-[11px] text-stone-500">배우의 말하기 속도를 놓치지 않고 따라갔나요?</p>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-center">
              {[
                { key: 'great', label: '😀', text: 'Great' },
                { key: 'good', label: '🙂', text: 'Good' },
                { key: 'needs_work', label: '😐', text: 'Practice' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleSetSelfCheck(0, opt.key as SelfCheckRating)}
                  className={`min-w-[40px] h-9 px-2.5 rounded-lg border text-sm font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    currentProgress.selfCheck[0] === opt.key
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900 scale-105 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                  title={opt.text}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Bold Stress Words */}
          <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium text-stone-800">
                2. Did I stress the bold words?
              </p>
              <p className="text-[11px] text-stone-500">굵은 글씨의 핵심 단어에 힘을 주어 말했나요?</p>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-center">
              {[
                { key: 'great', label: '😀', text: 'Great' },
                { key: 'good', label: '🙂', text: 'Good' },
                { key: 'needs_work', label: '😐', text: 'Practice' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleSetSelfCheck(1, opt.key as SelfCheckRating)}
                  className={`min-w-[40px] h-9 px-2.5 rounded-lg border text-sm font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    currentProgress.selfCheck[1] === opt.key
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900 scale-105 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                  title={opt.text}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: Intonation pitch */}
          <div className="p-2.5 rounded-xl bg-stone-50/70 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-medium text-stone-800">
                3. Did my voice go up and down like the actor?
              </p>
              <p className="text-[11px] text-stone-500">배우처럼 감정을 담아 음의 높낮이(억양)를 살렸나요?</p>
            </div>
            <div className="flex items-center gap-1 self-end sm:self-center">
              {[
                { key: 'great', label: '😀', text: 'Great' },
                { key: 'good', label: '🙂', text: 'Good' },
                { key: 'needs_work', label: '😐', text: 'Practice' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleSetSelfCheck(2, opt.key as SelfCheckRating)}
                  className={`min-w-[40px] h-9 px-2.5 rounded-lg border text-sm font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                    currentProgress.selfCheck[2] === opt.key
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-900 scale-105 shadow-2xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                  title={opt.text}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Word check (Optional via Web Speech API) */}
      {isSpeechSupported && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-stone-800 text-sm sm:text-base flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Check My Words / 발음 단어 체크</span>
              </h3>
              <p className="text-xs text-stone-500">
                마이크로 문장을 읽으면 빠뜨린 단어를 찾아줍니다 (B1-B2 친화적 지원)
              </p>
            </div>
          </div>

          <button
            onClick={handleStartWordCheck}
            className={`min-h-[46px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isRecognizing
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isRecognizing ? 'Listening in English... (말씀하세요)' : 'Check My Words / 단어 인식 시작'}</span>
          </button>

          {/* Recognition Results */}
          {recognizedWords && (
            <div className="pt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-700">Recognition Analysis:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                  You said {matchedWordCount} of {targetWords.length} words!
                </span>
              </div>

              {/* Color each word: matched words green, missed words gray with underline */}
              <div className="leading-relaxed flex flex-wrap gap-1 text-sm sm:text-base pt-1">
                {targetWords.map((word, i) => {
                  const isMatched = recognizedWords.includes(word);
                  return (
                    <span
                      key={i}
                      className={
                        isMatched
                          ? 'text-emerald-700 font-bold bg-emerald-50 px-1 rounded'
                          : 'text-stone-400 underline decoration-stone-400 decoration-1 px-1'
                      }
                    >
                      {word}
                    </span>
                  );
                })}
              </div>

              <p className="text-[11px] text-stone-500 pt-1">
                {matchedWordCount === targetWords.length 
                  ? "🎉 Fantastic job! You spoke every word clearly!" 
                  : "💡 Keep going! Stressed words carry the main meaning."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 10. Next Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (isLastSentence) {
              onFinish();
            } else {
              onNavigateSentence(currentIndex + 1);
            }
          }}
          className="w-full min-h-[54px] py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-base shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>{isLastSentence ? 'Finish Practice / 연습 완료하기' : 'Next Sentence / 다음 문장으로'}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
