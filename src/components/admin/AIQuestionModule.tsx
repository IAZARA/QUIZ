import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, Bot, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GeneratedQuestion {
  id: string;
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_option: string;
  explanation: string;
  approved: boolean | null; // null = pending, true = approved, false = rejected
}

interface DocumentInfo {
  name: string;
  type: string;
  size: number;
  content?: string;
}

const AIQuestionModule: React.FC = () => {
  const { t } = useTranslation();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<'text' | 'document'>('text');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  
  // Estados para documentos
  const [uploadedDocument, setUploadedDocument] = useState<DocumentInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Función para generar preguntas desde texto
  const handleGenerateFromText = async () => {
    if (!topic.trim()) {
      setMessage('Error: El tema/contexto es requerido.');
      return;
    }
    
    await generateQuestions({ type: 'text', content: topic });
  };

  // Función para generar preguntas desde documento
  const handleGenerateFromDocument = async () => {
    if (!uploadedDocument) {
      setMessage('Error: Debe cargar un documento primero.');
      return;
    }
    
    await generateQuestions({ 
      type: 'document', 
      content: uploadedDocument.content || '',
      documentName: uploadedDocument.name 
    });
  };

  // Función principal de generación
  const generateQuestions = async (source: { type: 'text' | 'document', content: string, documentName?: string }) => {
    setIsLoading(true);
    setMessage('');
    setGeneratedQuestions([]);

    try {
      const response = await fetch('/api/ai/generate-questions-anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          numQuestions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error HTTP: ${response.status}`);
      }

      // Convertir las preguntas generadas al formato esperado
      const formattedQuestions: GeneratedQuestion[] = data.questions.map((q: any, index: number) => ({
        id: `generated-${Date.now()}-${index}`,
        content: q.content,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        correct_option: q.correct_option,
        explanation: q.explanation,
        approved: null
      }));

      setGeneratedQuestions(formattedQuestions);
      setMessage(`${formattedQuestions.length} preguntas generadas exitosamente. Revisa y aprueba las que desees agregar al banco de preguntas.`);

    } catch (error: any) {
      console.error('Error generando preguntas:', error);
      setMessage(`Error generando preguntas: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar la carga de archivos
  const handleFileUpload = async (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (file.size > maxSize) {
      setMessage('Error: El archivo es demasiado grande. Máximo 10MB.');
      return;
    }

    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage('Error: Tipo de archivo no soportado. Use .txt, .pdf, .docx o .pptx');
      return;
    }

    setIsLoading(true);
    setMessage('Procesando documento...');

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/ai/process-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error procesando documento');
      }

      setUploadedDocument({
        name: file.name,
        type: file.type,
        size: file.size,
        content: data.content
      });

      setMessage('Documento procesado exitosamente. Ahora puede generar preguntas basadas en su contenido.');

    } catch (error: any) {
      console.error('Error procesando documento:', error);
      setMessage(`Error procesando documento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para aprobar una pregunta
  const approveQuestion = async (questionId: string) => {
    const question = generatedQuestions.find(q => q.id === questionId);
    if (!question) return;

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: question.content,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          correct_option: question.correct_option,
          explanation: question.explanation,
          is_active: false,
          case: '',
          timer: 30
        }),
      });

      if (!response.ok) {
        throw new Error('Error agregando pregunta al banco');
      }

      // Marcar como aprobada
      setGeneratedQuestions(prev => 
        prev.map(q => q.id === questionId ? { ...q, approved: true } : q)
      );

      setMessage('Pregunta agregada al banco exitosamente.');

    } catch (error: any) {
      console.error('Error aprobando pregunta:', error);
      setMessage(`Error aprobando pregunta: ${error.message}`);
    }
  };

  // Función para rechazar una pregunta
  const rejectQuestion = (questionId: string) => {
    setGeneratedQuestions(prev => 
      prev.map(q => q.id === questionId ? { ...q, approved: false } : q)
    );
  };

  // Handlers para drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow-xl rounded-lg max-w-6xl">
      <div className="flex items-center mb-8">
        <Bot className="h-8 w-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Generador de Preguntas con IA</h1>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md text-sm ${
            message.startsWith('Error')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}
        >
          <div className="flex items-center">
            {message.startsWith('Error') ? (
              <AlertCircle className="h-4 w-4 mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {message}
          </div>
        </div>
      )}

      {/* Tabs para seleccionar fuente */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Desde Texto
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'document'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Desde Documento
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="mb-8">
        {activeTab === 'text' ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Tema/Contexto para las Preguntas
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe el tema, nivel de dificultad y cualquier enfoque específico para las preguntas..."
              />
            </div>
            
            <div>
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Preguntas a Generar
              </label>
              <input
                type="number"
                id="numQuestions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateFromText}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                'Generar Preguntas'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Área de carga de documentos */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragOver
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                  <span>Cargar un archivo</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".txt,.pdf,.docx,.pptx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formatos soportados: TXT, PDF, DOCX, PPTX (máx. 10MB)
              </p>
            </div>

            {/* Información del documento cargado */}
            {uploadedDocument && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Documento cargado: {uploadedDocument.name}
                    </p>
                    <p className="text-xs text-green-600">
                      Tamaño: {(uploadedDocument.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="numQuestionsDoc" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Preguntas a Generar
              </label>
              <input
                type="number"
                id="numQuestionsDoc"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleGenerateFromDocument}
              disabled={isLoading || !uploadedDocument}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                'Generar Preguntas del Documento'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Lista de preguntas generadas para aprobación */}
      {generatedQuestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Preguntas Generadas - Revisar y Aprobar
          </h2>
          <div className="space-y-4">
            {generatedQuestions.map((question) => (
              <div
                key={question.id}
                className={`border rounded-lg p-6 ${
                  question.approved === true
                    ? 'bg-green-50 border-green-200'
                    : question.approved === false
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {question.content}
                  </h3>
                  {question.approved === null && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approveQuestion(question.id)}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectQuestion(question.id)}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Rechazar
                      </button>
                    </div>
                  )}
                  {question.approved === true && (
                    <span className="flex items-center text-green-600 font-medium">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobada
                    </span>
                  )}
                  {question.approved === false && (
                    <span className="flex items-center text-red-600 font-medium">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Rechazada
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className={`p-3 rounded-md ${question.correct_option === 'A' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
                    <span className="font-medium">A) </span>{question.option_a}
                  </div>
                  <div className={`p-3 rounded-md ${question.correct_option === 'B' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
                    <span className="font-medium">B) </span>{question.option_b}
                  </div>
                  <div className={`p-3 rounded-md ${question.correct_option === 'C' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}>
                    <span className="font-medium">C) </span>{question.option_c}
                  </div>
                </div>

                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Explicación: </span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIQuestionModule;