import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";

export const MobileSearch = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = () => {
    if (input.trim()) navigate("/results?q=" + input);
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-white dark:bg-[#0F0F0F] z-50 fixed inset-0">
      {/* Header */}
      <div className="flex h-12 items-center gap-2 px-2 py-1 w-full bg-white dark:bg-[#0F0F0F]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex items-center bg-[#F0F0F0] dark:bg-[#272727] rounded-full px-4 h-9">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search TubeX"
            className="w-full bg-transparent border-none focus-visible:ring-0 shadow-none px-0 h-full text-sm"
          />
          {input && (
            <button
              className="text-muted-foreground p-1"
              onClick={() => {
                setInput("");
                inputRef.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button className="p-2 rounded-full bg-[#F0F0F0] dark:bg-[#272727] ml-1">
          <Mic size={18} />
        </button>
      </div>

      {/* Suggestions / History (Placeholder) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 flex items-center gap-4 hover:bg-muted cursor-pointer" onClick={() => { setInput("react router dom"); handleSearch(); }}>
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm font-medium">react router dom</span>
        </div>
        <div className="px-4 py-3 flex items-center gap-4 hover:bg-muted cursor-pointer" onClick={() => { setInput("system design full course"); handleSearch(); }}>
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm font-medium">system design full course</span>
        </div>
        {/* More suggestions can go here */}
      </div>
    </div>
  );
};
