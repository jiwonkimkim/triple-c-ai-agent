'use client';

import { useState } from 'react';

type ModelType = 'sd35-medium' | 'sdxl-base';

const MODEL_PRESETS = {
  'sd35-medium': { steps: 20, cfg: 4.5, name: 'SD 3.5 Medium', time: '~4-5분', minSteps: 10, maxSteps: 50 },
  'sdxl-base': { steps: 25, cfg: 7.0, name: 'SDXL Base', time: '~1-2분', minSteps: 15, maxSteps: 40 },
};

export default function SDTestPage() {
  const [model, setModel] = useState<ModelType>('sdxl-base');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('ugly, blurry, low quality');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(MODEL_PRESETS['sdxl-base'].steps);
  const [cfg, setCfg] = useState(MODEL_PRESETS['sdxl-base'].cfg);

  const handleModelChange = (newModel: ModelType) => {
    setModel(newModel);
    setSteps(MODEL_PRESETS[newModel].steps);
    setCfg(MODEL_PRESETS[newModel].cfg);
  };

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const [serverStatus, setServerStatus] = useState<{
    available: boolean;
    queue: { running: number; pending: number };
  } | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/generate/sd');
      const data = await res.json();
      setServerStatus(data);
    } catch {
      setServerStatus({ available: false, queue: { running: 0, pending: 0 } });
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);
    setProgress(`이미지 생성 중... (${MODEL_PRESETS[model].time} 예상)`);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate/sd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          width,
          height,
          steps,
          cfg,
          model,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.data.imageUrl);
        setExecutionTime(data.data.executionTime || (Date.now() - startTime));
        setProgress('완료!');
      } else {
        setError(data.error || '이미지 생성에 실패했습니다.');
        setProgress('');
      }
    } catch (err) {
      setError('요청 중 오류가 발생했습니다: ' + String(err));
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const preset = MODEL_PRESETS[model];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI 이미지 생성 테스트</h1>
        <p className="text-gray-400 mb-6">ComfyUI를 통한 로컬 이미지 생성</p>

        {/* Server Status */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={checkStatus}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            서버 상태 확인
          </button>
          {serverStatus && (
            <span className={`text-sm ${serverStatus.available ? 'text-green-400' : 'text-red-400'}`}>
              {serverStatus.available
                ? `✓ 서버 연결됨 (대기열: ${serverStatus.queue.running} 실행 중, ${serverStatus.queue.pending} 대기)`
                : '✗ 서버 연결 안됨'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">모델 선택</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleModelChange('sdxl-base')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    model === 'sdxl-base'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">SDXL Base</div>
                  <div className="text-xs text-gray-400">~1-2분, 25 steps</div>
                </button>
                <button
                  onClick={() => handleModelChange('sd35-medium')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    model === 'sd35-medium'
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">SD 3.5 Medium</div>
                  <div className="text-xs text-gray-400">~4-5분, 20 steps</div>
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">프롬프트 *</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="a beautiful sunset over the ocean, golden hour, dramatic clouds, photorealistic"
                className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">네거티브 프롬프트</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="ugly, blurry, low quality"
                className="w-full h-20 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">너비</label>
                <select
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <option value={512}>512</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">높이</label>
                <select
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <option value={512}>512</option>
                  <option value={768}>768</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
            </div>

            {/* Steps & CFG */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Steps: {steps}</label>
                <input
                  type="range"
                  min={preset.minSteps}
                  max={preset.maxSteps}
                  value={steps}
                  onChange={(e) => setSteps(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CFG: {cfg}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={cfg}
                  onChange={(e) => setCfg(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                loading || !prompt.trim()
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : model === 'sdxl-base'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {loading ? '생성 중...' : `${preset.name}으로 생성`}
            </button>

            {/* Progress */}
            {progress && (
              <div className="flex items-center gap-3 text-blue-400">
                {loading && (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
                <span>{progress}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {/* Execution Time */}
            {executionTime && (
              <div className="text-sm text-gray-400">
                생성 시간: {(executionTime / 1000).toFixed(1)}초
              </div>
            )}
          </div>

          {/* Right: Result */}
          <div>
            <label className="block text-sm font-medium mb-2">생성 결과</label>
            <div className="aspect-square bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-gray-500 text-center p-8">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p>이미지가 여기에 표시됩니다</p>
                </div>
              )}
            </div>

            {/* Download */}
            {imageUrl && (
              <a
                href={imageUrl}
                download={`${model}-generated.png`}
                className="mt-4 block w-full py-3 text-center bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                이미지 다운로드
              </a>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg text-sm text-gray-400">
          <p><strong>현재 모델:</strong> {preset.name}</p>
          <p><strong>예상 시간:</strong> {preset.time} (M1 Mac 기준)</p>
        </div>
      </div>
    </div>
  );
}
