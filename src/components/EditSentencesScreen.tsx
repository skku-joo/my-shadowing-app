import React, { useState, useRef } from 'react';
import { Sentence } from '../types';
import { MOVIE_SETTINGS } from '../constants';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { 
  ArrowLeft, Plus, Play, Trash2, Edit3, ArrowUp, ArrowDown, 
  Copy, Download, Upload, Check, AlertCircle, RefreshCw, X
} from 'lucide-react';

interface Props {
  sentences: Sentence[];
  onSaveSentences: (sentences: Sentence[]) => void;
  onResetToDefault: () => void;
  onBack: () => void;
}

export const EditSentencesScreen: React.FC<Props> = ({
  sentences,
  onSaveSentences,
  onResetToDefault,
  onBack,
}) => {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(MOVIE_SETTINGS.startSeconds);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speaker, setSpeaker] = useState('Judy');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stressInput, setStressInput] = useState('');
  const [startSec, setStartSec] = useState<number>(MOVIE_SETTINGS.startSeconds);
  const [endSec, setEndSec] = useState<number>(MOVIE_SETTINGS.startSeconds + 2.0);

  // Form modal visibility
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formWarning, setFormWarning] = useState<string | null>(null);

  // JSON modal state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Validate form in real time
  const validateForm = (start: number, end: number, textVal: string) => {
    let error: string | null = null;
    let warning: string | null = null;

    if (!textVal.trim()) {
      error = "English sentence text cannot be empty. / 영어 문장을 입력하세요.";
    } else if (start < MOVIE_SETTINGS.startSeconds || end > MOVIE_SETTINGS.endSeconds) {
      error = `Time must be within movie clip range (${MOVIE_SETTINGS.startSeconds}s – ${MOVIE_SETTINGS.endSeconds}s / 0:49–1:34).`;
    } else if (end <= start) {
      error = "End time must be greater than start time. / 종료 시간은 시작 시간보다 커야 합니다.";
    }

    const duration = end - start;
    const wordCount = textVal.trim().split(/\s+/).filter(Boolean).length;

    if (duration > 4.0) {
      warning = `Gentle reminder: This sentence is ${duration.toFixed(1)}s long (recommended: under 4.0s for shadowing).`;
    } else if (wordCount > 12) {
      warning = `Gentle reminder: This sentence has ${wordCount} words (recommended: 3–12 words for shadowing).`;
    }

    setFormError(error);
    setFormWarning(warning);
    return !error;
  };

  // Open Form to Add
  const handleOpenAddForm = () => {
    setEditingId(null);
    setSpeaker('Judy');
    setText('');
    setKorean('');
    setStressInput('');
    const now = Math.round(currentVideoTime * 10) / 10;
    const safeStart = Math.min(Math.max(now, MOVIE_SETTINGS.startSeconds), MOVIE_SETTINGS.endSeconds - 2.0);
    setStartSec(safeStart);
    setEndSec(safeStart + 2.0);
    setFormError(null);
    setFormWarning(null);
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditForm = (item: Sentence) => {
    setEditingId(item.id);
    setSpeaker(item.speaker);
    setText(item.text);
    setKorean(item.korean);
    setStressInput((item.stress || []).join(', '));
    setStartSec(item.start);
    setEndSec(item.end);
    setFormError(null);
    validateForm(item.start, item.end, item.text);
    setIsFormOpen(true);
  };

  // Capture current playback time for Start
  const handleSetStartNow = () => {
    const now = playerRef.current ? playerRef.current.getCurrentTime() : currentVideoTime;
    const rounded = Math.round(now * 10) / 10;
    setStartSec(rounded);
    validateForm(rounded, endSec, text);
  };

  // Capture current playback time for End
  const handleSetEndNow = () => {
    const now = playerRef.current ? playerRef.current.getCurrentTime() : currentVideoTime;
    const rounded = Math.round(now * 10) / 10;
    setEndSec(rounded);
    validateForm(startSec, rounded, text);
  };

  // Test play the segment
  const handleTestSegment = () => {
    playerRef.current?.playSegment(startSec, endSec, false);
  };

  // Submit Add or Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(startSec, endSec, text)) return;

    const stressWords = stressInput
      .split(/[,;\s]+/)
      .map(w => w.trim().toUpperCase())
      .filter(Boolean);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map(s => 
        s.id === editingId 
          ? { ...s, speaker, text: text.trim(), korean: korean.trim(), stress: stressWords, start: startSec, end: endSec }
          : s
      );
      onSaveSentences(updated);
    } else {
      // Add new
      const newSentence: Sentence = {
        id: Date.now(),
        speaker,
        text: text.trim(),
        korean: korean.trim(),
        stress: stressWords,
        start: startSec,
        end: endSec,
      };
      onSaveSentences([...sentences, newSentence]);
    }

    setIsFormOpen(false);
  };

  // Delete sentence
  const handleDeleteSentence = (id: number) => {
    if (confirm('Delete this sentence? / 이 문장을 삭제하시겠습니까?')) {
      const filtered = sentences.filter(s => s.id !== id);
      onSaveSentences(filtered);
    }
  };

  // Move sentence up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const nextList = [...sentences];
    const temp = nextList[index];
    nextList[index] = nextList[index - 1];
    nextList[index - 1] = temp;
    onSaveSentences(nextList);
  };

  // Move sentence down
  const handleMoveDown = (index: number) => {
    if (index === sentences.length - 1) return;
    const nextList = [...sentences];
    const temp = nextList[index];
    nextList[index] = nextList[index + 1];
    nextList[index + 1] = temp;
    onSaveSentences(nextList);
  };

  // Open Export Modal
  const handleOpenExport = () => {
    setJsonText(JSON.stringify(sentences, null, 2));
    setJsonError(null);
    setCopySuccess(false);
    setIsJsonModalOpen(true);
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback
    }
  };

  // Import JSON
  const handleApplyJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of sentences.');
      }
      // Basic validation
      for (const item of parsed) {
        if (!item.text || typeof item.start !== 'number' || typeof item.end !== 'number') {
          throw new Error('Each sentence item must have text, start, and end fields.');
        }
      }
      onSaveSentences(parsed);
      setIsJsonModalOpen(false);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON format');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 -ml-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 inline-flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
          <span className="text-xs text-stone-400">/ 뒤로</span>
        </button>

        <h2 className="font-bold text-stone-800 text-base">
          Edit Sentences / 문장 편집
        </h2>

        <div className="w-12" />
      </div>

      {/* Video Player (Screen 4: Video player and the current list + one-line credit) */}
      <YouTubePlayer 
        ref={playerRef} 
        showCredit={true}
        onTimeUpdate={setCurrentVideoTime}
      />

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <button
          onClick={handleOpenAddForm}
          className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sentence / 문장 추가</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenExport}
            className="min-h-[44px] px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            title="Export or Import JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export / Import</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset all sentences to default Zootopia clip? / 주토피아 기본 문장으로 초기화할까요?')) {
                onResetToDefault();
              }
            }}
            className="min-h-[44px] px-2.5 py-1.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-xl text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
            title="Reset to default"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Current Sentences List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span>{sentences.length} sentences configured</span>
          <span>Click play icon to test segment</span>
        </div>

        {sentences.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-stone-300 text-center space-y-2">
            <p className="text-stone-600 font-medium">No sentences yet. Tap Edit Sentences to add some.</p>
            <button
              onClick={handleOpenAddForm}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Add your first sentence
            </button>
          </div>
        ) : (
          sentences.map((item, index) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                    {item.speaker}
                  </span>
                  <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                    {item.start.toFixed(1)}s – {item.end.toFixed(1)}s ({(item.end - item.start).toFixed(1)}s)
                  </span>
                </div>

                {/* Row actions */}
                <div className="flex items-center gap-1">
                  {/* Test play button */}
                  <button
                    onClick={() => playerRef.current?.playSegment(item.start, item.end, false)}
                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Test segment"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>

                  {/* Move up */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move down */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sentences.length - 1}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditForm(item)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteSentence(item.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text */}
              <p className="text-sm font-semibold text-stone-800 leading-snug">
                {item.text}
              </p>
              {item.korean && (
                <p className="text-xs text-stone-500">{item.korean}</p>
              )}
              {item.stress && item.stress.length > 0 && (
                <p className="text-[11px] text-amber-700 font-mono">
                  Stress: {item.stress.join(', ')}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-stone-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingId !== null ? 'Edit Sentence / 문장 수정' : 'Add New Sentence / 새 문장 추가'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs sm:text-sm">
              {/* Speaker */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Speaker / 화자
                </label>
                <div className="flex gap-2">
                  {['Judy', 'Mum', 'Dad'].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSpeaker(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                        speaker === s ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="Other speaker..."
                    className="flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* English Text */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  English Sentence / 영어 문장 (3–12 words)
                </label>
                <textarea
                  rows={2}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    validateForm(startSec, endSec, e.target.value);
                  }}
                  placeholder="e.g. Oh hey its my parents"
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Korean Meaning */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Korean Meaning / 한국어 뜻
                </label>
                <input
                  type="text"
                  value={korean}
                  onChange={(e) => setKorean(e.target.value)}
                  placeholder="e.g. 아 우리 부모님이네"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Stress Words */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Stress Words / 강조할 단어 (comma separated)
                </label>
                <input
                  type="text"
                  value={stressInput}
                  onChange={(e) => setStressInput(e.target.value)}
                  placeholder="e.g. HEY, PARENTS"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm"
                />
                <p className="text-[10px] text-stone-400 mt-0.5">
                  입력된 단어는 쉐도잉 화면에서 굵은 글씨로 강조 표시됩니다.
                </p>
              </div>

              {/* Timing Controls (PRD: While video plays, Set Start = now and Set End = now) */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-800">Timing / 재생 구간 (초 단위)</span>
                  <span className="font-mono text-stone-500">
                    Video at: {currentVideoTime.toFixed(1)}s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">
                      Start Time (s)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={MOVIE_SETTINGS.startSeconds}
                      max={MOVIE_SETTINGS.endSeconds}
                      value={startSec}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setStartSec(val);
                        validateForm(val, endSec, text);
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleSetStartNow}
                      className="mt-1.5 w-full py-1 px-2 bg-stone-200 hover:bg-stone-300 rounded text-[11px] font-semibold text-stone-800 cursor-pointer"
                    >
                      Set Start = now ({currentVideoTime.toFixed(1)}s)
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-stone-600 font-medium mb-1">
                      End Time (s)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={MOVIE_SETTINGS.startSeconds}
                      max={MOVIE_SETTINGS.endSeconds}
                      value={endSec}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setEndSec(val);
                        validateForm(startSec, val, text);
                      }}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleSetEndNow}
                      className="mt-1.5 w-full py-1 px-2 bg-stone-200 hover:bg-stone-300 rounded text-[11px] font-semibold text-stone-800 cursor-pointer"
                    >
                      Set End = now ({currentVideoTime.toFixed(1)}s)
                    </button>
                  </div>
                </div>

                {/* Test Segment Button */}
                <button
                  type="button"
                  onClick={handleTestSegment}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Segment ({startSec.toFixed(1)}s – {endSec.toFixed(1)}s)</span>
                </button>
              </div>

              {/* Errors & Gentle Warnings per PRD */}
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {formWarning && !formError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{formWarning}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 min-h-[46px] rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs cursor-pointer hover:bg-stone-50"
                >
                  Cancel / 취소
                </button>
                <button
                  type="submit"
                  disabled={!!formError}
                  className="flex-1 min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Save Sentence / 저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON Export / Import Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-stone-200 space-y-3.5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="font-bold text-stone-900 text-base">
                Export / Import JSON Data
              </h3>
              <button 
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Copy to export sentence list, or paste your own JSON and click Apply Import.
            </p>

            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full flex-1 p-3 font-mono text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden"
            />

            {jsonError && (
              <p className="text-xs text-red-600 font-medium">{jsonError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copySuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={handleApplyJsonImport}
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Apply Import / 가져오기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
