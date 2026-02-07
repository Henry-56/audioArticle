
import React, { useState } from 'react';
import { Upload, FileText, Loader2, Sparkles, Music, PlayCircle, Download } from 'lucide-react';
import { extractTextFromPDF } from './lib/pdf';
import { generateScript, type ArticleSections } from './lib/gemini';
import { generateAudio } from './lib/elevenlabs';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'extracting' | 'generating_script' | 'ready' | 'error'>('idle');

  // Data State
  const [sections, setSections] = useState<ArticleSections | null>(null);

  // Audio State per section
  const [audioUrls, setAudioUrls] = useState<Record<keyof ArticleSections, string | null>>({
    metodologia: null,
    resultados: null,
    introduccion: null,
    discusion: null,
    conclusion: null,
    abstract: null
  });

  const [generatingAudioFor, setGeneratingAudioFor] = useState<keyof ArticleSections | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(import.meta.env.VITE_ELEVENLABS_API_KEY || '');
  const [showSettings, setShowSettings] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setSections(null);
      setAudioUrls({
        metodologia: null,
        resultados: null,
        introduccion: null,
        discusion: null,
        conclusion: null,
        abstract: null
      });
      setErrorMessage('');
    }
  };

  const processPDF = async () => {
    if (!file) return;

    if (!elevenLabsKey) {
      setErrorMessage("Please enter your ElevenLabs API Key in settings.");
      setStatus('error');
      setShowSettings(true);
      return;
    }

    try {
      // 1. Extract Text
      setStatus('extracting');
      const text = await extractTextFromPDF(file);
      console.log('Extracted text length:', text.length);

      // 2. Generate Structured Script with Gemini
      setStatus('generating_script');
      const generatedSections = await generateScript(text);
      setSections(generatedSections);

      setStatus('ready');

    } catch (error: any) {
      console.error('Error processing:', error);
      setStatus('error');
      setErrorMessage(error.message || 'An error occurred');
      if (error?.body?.detail?.message) {
        setErrorMessage("ElevenLabs Error: " + error.body.detail.message);
      }
    }
  };

  const handleGenerateAudio = async (sectionKey: keyof ArticleSections) => {
    if (!sections || !elevenLabsKey) return;

    try {
      setGeneratingAudioFor(sectionKey);
      const text = sections[sectionKey];
      const url = await generateAudio(text, elevenLabsKey);

      setAudioUrls(prev => ({
        ...prev,
        [sectionKey]: url
      }));
    } catch (error: any) {
      console.error('Error generating audio for section:', sectionKey, error);
      setErrorMessage("Audio Error: " + (error?.body?.detail?.message || error.message));
    } finally {
      setGeneratingAudioFor(null);
    }
  };

  // Order of display
  const sectionOrder: (keyof ArticleSections)[] = [
    'metodologia',
    'resultados',
    'introduccion',
    'discusion',
    'conclusion',
    'abstract'
  ];

  const sectionLabels: Record<keyof ArticleSections, string> = {
    metodologia: 'Metodología',
    resultados: 'Resultados',
    introduccion: 'Introducción',
    discusion: 'Discusión',
    conclusion: 'Conclusión',
    abstract: 'Abstract'
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 -z-10 h-full w-full bg-neutral-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-5"></div>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 ring-1 ring-indigo-500/20">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            PDF to Podcast
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Transform scientific articles into structured audio summaries using Gemini AI and ElevenLabs Turbo.
          </p>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-neutral-500 hover:text-indigo-400 transition underline underline-offset-4"
          >
            {showSettings ? 'Hide Settings' : 'Configure API Keys'}
          </button>

          {showSettings && (
            <div className="max-w-md mx-auto mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-left">
              <label className="block text-xs font-medium text-neutral-400 mb-1">ElevenLabs API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  placeholder="sk_..."
                />
                <button
                  onClick={async () => {
                    if (!elevenLabsKey) return;
                    try {
                      setErrorMessage('');
                      // Small hack to use the same generating status or just local
                      const testUrl = await generateAudio("Prueba de audio conexión exitosa.", elevenLabsKey);
                      const audio = new Audio(testUrl);
                      audio.play();
                    } catch (e: any) {
                      setErrorMessage("Test failed: " + (e?.body?.detail?.message || e.message));
                    }
                  }}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs rounded-lg transition"
                >
                  Test
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-2">
                Using <b>Flash/Turbo</b> model for efficiency.
              </p>
            </div>
          )}
        </header>

        <div className="grid gap-8">
          {/* Upload Section */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 backdrop-blur-xl transition hover:border-neutral-700/50">
            <div className={`flex flex-col items-center justify-center border-2 border-dashed border-neutral-800 rounded-2xl p-12 hover:bg-neutral-800/50 hover:border-neutral-600 transition group cursor-pointer relative ${status === 'extracting' || status === 'generating_script' ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={status === 'extracting' || status === 'generating_script'}
              />
              <div className="p-4 bg-neutral-800 rounded-full mb-4 group-hover:scale-110 transition duration-300">
                <Upload className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-lg font-medium text-neutral-200 mb-2">
                {file ? file.name : "Drop your PDF here"}
              </p>
              <p className="text-sm text-neutral-500">
                {file ? "Click to change file" : "or click to browse"}
              </p>
            </div>

            {file && !sections && status !== 'extracting' && status !== 'generating_script' && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={processPDF}
                  className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <Sparkles className="w-5 h-5" />
                  Analyze Article
                </button>
              </div>
            )}
            {/* Global Loading Indicators */}
            {(status === 'extracting' || status === 'generating_script') && (
              <div className="mt-8 flex flex-col items-center gap-3 text-neutral-300 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p>{status === 'extracting' ? 'Extracting text from PDF...' : 'Analyzing structure with Gemini...'}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-200">
              Error: {errorMessage}
            </div>
          )}

          {/* Sections List */}
          {sections && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                Article Analysis
              </h2>

              {sectionOrder.map((key) => (
                <div key={key} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-neutral-500" />
                        {sectionLabels[key]}
                      </h3>
                      <p className="text-neutral-300 text-sm leading-relaxed font-serif">
                        {sections[key]}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                      {audioUrls[key] ? (
                        <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20">
                          <div className="flex items-center gap-2 mb-3 text-indigo-300 text-sm font-medium">
                            <Music className="w-4 h-4" />
                            Generated Audio
                          </div>
                          <audio controls src={audioUrls[key]!} className="w-full h-8 mb-2 opacity-90 hover:opacity-100 transition" />
                          <a href={audioUrls[key]!} download={`${key}.mp3`} className="flex items-center justify-center gap-2 w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs transition text-neutral-300">
                            <Download className="w-3 h-3" />
                            Download MP3
                          </a>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateAudio(key)}
                          disabled={generatingAudioFor === key}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-xl transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generatingAudioFor === key ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4" />
                              Generate Audio
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
