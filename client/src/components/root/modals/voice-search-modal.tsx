import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mic, X } from "lucide-react";
import { RootState } from "@/store/store";
import { setVoiceSearchModal } from "@/store/reducers/ui";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceSearchModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state: RootState) => state.ui.isVoiceSearchModalOpen);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript("");
      };

      recog.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          setTimeout(() => {
            handleClose();
            navigate(`/results?q=${encodeURIComponent(finalTranscript.trim())}`);
          }, 500);
        }
      };

      recog.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          setError("Didn't hear that. Try again.");
        } else if (event.error === 'audio-capture') {
          setError("No microphone was found.");
        } else if (event.error === 'not-allowed') {
          setError("Microphone permission denied.");
        } else {
          setError("Something went wrong. Try again.");
        }
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    } else {
      setError("Speech recognition is not supported in this browser.");
    }
  }, [navigate]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
      } catch (e) {
      }
    }
  }, [recognition, isListening]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTranscript("");
      startListening();
    } else {
      if (recognition && isListening) {
        recognition.stop();
      }
    }
  }, [isOpen, startListening, recognition, isListening]);

  const handleClose = () => {
    dispatch(setVoiceSearchModal(false));
    if (recognition) {
      recognition.stop();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#0F0F0F] rounded-xl border-none p-0 overflow-hidden shadow-2xl">
        <DialogTitle className="sr-only">Voice Search</DialogTitle>
        <DialogDescription className="sr-only">Search using your voice</DialogDescription>

        <div className="relative p-6 pt-12 pb-16 flex flex-col items-center min-h-[300px]">
          {/* <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button> */}

          <div className="flex-1 w-full flex flex-col justify-center items-center">
            {error ? (
              <h2 className="text-2xl font-normal text-gray-800 dark:text-gray-200 mb-12 text-center">
                {error}
              </h2>
            ) : (
              <h2 className="text-2xl font-normal text-gray-800 dark:text-gray-200 mb-12 text-center h-8">
                {transcript || (isListening ? "Listening..." : "Speak now")}
              </h2>
            )}

            <div className="relative flex justify-center items-center mt-4">
              {isListening && !error && (
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150" />
              )}
              <button
                onClick={startListening}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening && !error
                  ? "bg-red-600 text-white shadow-[0_0_0_12px_rgba(220,38,38,0.2)]"
                  : "bg-gray-100 dark:bg-[#272727] hover:bg-gray-200 dark:hover:bg-[#3f3f3f] text-gray-800 dark:text-gray-200"
                  }`}
                aria-label="Microphone"
              >
                <Mic size={32} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
