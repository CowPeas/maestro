'use client';

import { useChat } from 'ai/react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PawaEye AI Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your intelligent threat analysis companion
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => {
                     handleInputChange({ target: { value: 'Analyze threats for a web application with user authentication and payment processing' } } as any);
                   }}>
                <div className="text-2xl mb-2">🛡️</div>
                <div className="font-semibold mb-1">Threat Analysis</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze systems for security threats
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => {
                     handleInputChange({ target: { value: 'Predict future threats based on my historical data' } } as any);
                   }}>
                <div className="text-2xl mb-2">🔮</div>
                <div className="font-semibold mb-1">Predictive Analytics</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Forecast future security risks
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => {
                     handleInputChange({ target: { value: 'Scan my recent threats for anomalies and patterns' } } as any);
                   }}>
                <div className="text-2xl mb-2">🚨</div>
                <div className="font-semibold mb-1">Anomaly Detection</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Detect unusual threat patterns
                </div>
              </div>

              <div className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                   onClick={() => {
                     handleInputChange({ target: { value: 'Analyze this image: https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/800px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg' } } as any);
                   }}>
                <div className="text-2xl mb-2">🌍</div>
                <div className="font-semibold mb-1">Image Intelligence</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Geolocate images with AI
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Custom renderers for tool results
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const inline = !className;
                        return !inline ? (
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code {...props}>{children}</code>
                          </pre>
                        ) : (
                          <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  
                  {/* Render tool calls if present */}
                  {message.toolInvocations?.map((tool, idx) => (
                    <div key={idx} className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-pulse">⚙️</div>
                        <span className="font-semibold text-sm">
                          {tool.toolName === 'analyzeThreat' && '🛡️ Threat Analysis'}
                          {tool.toolName === 'analyzeImage' && '🌍 Image Intelligence'}
                          {tool.toolName === 'predictThreats' && '🔮 Predictive Analytics'}
                          {tool.toolName === 'detectAnomalies' && '🚨 Anomaly Detection'}
                        </span>
                      </div>
                      
                      {'result' in tool && tool.result && (
                        <div className="text-sm">
                          {tool.toolName === 'analyzeThreat' && (
                            <ThreatResultDisplay result={tool.result} />
                          )}
                          {tool.toolName === 'analyzeImage' && (
                            <ImageResultDisplay result={tool.result} />
                          )}
                          {tool.toolName === 'predictThreats' && (
                            <PredictionResultDisplay result={tool.result} />
                          )}
                          {tool.toolName === 'detectAnomalies' && (
                            <AnomalyResultDisplay result={tool.result} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">Error: {error.message}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about threats, analyze images, predict risks..."
            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
        <div className="text-xs text-gray-500 text-center mt-2">
          Powered by Gemini 2.5 Flash • 99% cost reduction vs GPT-4
        </div>
      </div>
    </div>
  );
}

// Tool Result Display Components
function ThreatResultDisplay({ result }: { result: any }) {
  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">Found {result.threatCount} threats:</div>
      {result.threats.slice(0, 3).map((threat: any, idx: number) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              threat.classification === 'High' ? 'bg-red-100 text-red-800' :
              threat.classification === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {threat.classification}
            </span>
            <span className="text-xs text-gray-500">{threat.layer}</span>
          </div>
          <p className="text-sm">{threat.description.substring(0, 150)}...</p>
        </div>
      ))}
      {result.threatCount > 3 && (
        <div className="text-xs text-gray-500">...and {result.threatCount - 3} more</div>
      )}
    </div>
  );
}

function ImageResultDisplay({ result }: { result: any }) {
  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-semibold">📍 {result.location}</span>
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
          {result.confidence}% confident
        </span>
      </div>
      {result.coordinates && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          📍 {result.coordinates}
        </div>
      )}
      {result.landmarks.length > 0 && (
        <div className="text-sm">
          <span className="font-semibold">Landmarks:</span> {result.landmarks.join(', ')}
        </div>
      )}
    </div>
  );
}

function PredictionResultDisplay({ result }: { result: any }) {
  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">{result.predictionCount} predictions generated:</div>
      {result.predictions.slice(0, 3).map((pred: any, idx: number) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="font-semibold text-sm mb-1">{pred.predictedThreat}</div>
          <div className="flex gap-2 text-xs text-gray-500 mb-2">
            <span>Layer: {pred.layer}</span>
            <span>•</span>
            <span>Confidence: {pred.confidence}%</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{pred.reasoning.substring(0, 120)}...</p>
        </div>
      ))}
    </div>
  );
}

function AnomalyResultDisplay({ result }: { result: any }) {
  if (!result.success) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  if (result.anomalyCount === 0) {
    return <div className="text-green-600">✅ No anomalies detected - system looks healthy!</div>;
  }

  return (
    <div className="space-y-3">
      <div className="font-semibold">⚠️ {result.anomalyCount} anomalies detected:</div>
      {result.anomalies.map((anomaly: any, idx: number) => (
        <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              anomaly.severity === 'Critical' ? 'bg-red-100 text-red-800' :
              anomaly.severity === 'High' ? 'bg-orange-100 text-orange-800' :
              anomaly.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {anomaly.severity}
            </span>
            <span className="font-semibold text-sm">{anomaly.title}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{anomaly.description}</p>
        </div>
      ))}
    </div>
  );
}
