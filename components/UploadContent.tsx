import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadContentProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  mode: 'file' | 'images';
}

export function UploadContent({ onFileSelect, selectedFiles, mode }: UploadContentProps) {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      // Check file extensions manually as a backup
      const validFiles = rejectedFiles
        .map(rejected => rejected.file)
        .filter(file => {
          const extension = file.name.toLowerCase().split('.').pop();
          return mode === 'file' 
            ? ['doc', 'docx', 'pdf'].includes(extension)
            : ['jpg', 'jpeg', 'png'].includes(extension);
        });

      if (validFiles.length > 0) {
        // If some files have correct extensions but were rejected, accept them
        // Filter out duplicates based on file name
        const newFiles = [...validFiles].filter(
          newFile => !selectedFiles.some(existing => existing.name === newFile.name)
        );
        onFileSelect([...selectedFiles, ...newFiles]);
        setError('');
        return;
      }
      setError(mode === 'file' 
        ? 'Please upload only .doc, .docx, or .pdf files'
        : 'Please upload only .jpg, .jpeg, or .png files'
      );
      return;
    }
    
    // Filter out duplicates based on file name
    const newFiles = [...acceptedFiles].filter(
      newFile => !selectedFiles.some(existing => existing.name === newFile.name)
    );
    onFileSelect([...selectedFiles, ...newFiles]);
    setError('');
  }, [onFileSelect, selectedFiles, mode]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: mode === 'file' ? {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      // Adding additional MIME types that browsers might use
      'application/x-pdf': ['.pdf'],
      'application/vnd.ms-word': ['.doc'],
      'application/x-msword': ['.doc']
    } : {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    noClick: true, // This prevents double-click events when using the Browse button
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFileSelect(newFiles);
  };

  return (
    <div 
      {...getRootProps()}
      className={`flex flex-col items-center justify-center w-full h-[380px] p-10 border-2 border-dashed rounded-lg 
        ${isDragActive ? 'border-[#0C8CE9] bg-[#DFE8FF]/60' : 'border-black/20 bg-[#DFE8FF]/40'} 
        gap-5 cursor-pointer transition-all duration-200`}
    >
      <input {...getInputProps()} />
      {selectedFiles.length > 0 ? (
        <>
          <h1 className="text-2xl font-semibold text-black">Selected Files:</h1>
          <div className="max-h-[200px] overflow-y-auto w-full">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white p-3 rounded-lg mb-2 shadow-sm">
                <p className="text-md text-black/70">{file.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="px-4 py-2 text-white bg-[#0C8CE9] rounded-lg cursor-pointer ease transition-all duration-150 hover:bg-[#0A70BA] mt-2"
          >
            Add More Files
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-black">
            {isDragActive ? 'Drop your files here' : 'Drag & Drop your files here'}
          </h1>
          <p className="text-md text-black/40">or</p>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="px-4 py-2 text-white bg-[#0C8CE9] rounded-lg cursor-pointer ease transition-all duration-150 hover:bg-[#0A70BA]"
          >
            Browse Files
          </button>
          <p className="text-sm text-black/40">
            Supported files: {mode === 'file' ? '.doc, .docx, .pdf' : '.jpg, .jpeg, .png'}
          </p>
        </>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}