import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { X, Search } from "lucide-react";

export const SearchBar = () => {
    const navigate = useNavigate();
    const [input, setInput] = useState<string>("");

    const handleSearch = () => {
        if (input.trim()) navigate("/results?q=" + input);
    };

    return (
        <div className="flex items-center justify-center w-full sm:w-[40vw] mx-auto max-w-lg">
            <div className="flex-1 relative">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search"
                    className="w-full h-8 sm:h-10 pl-4 pr-12 rounded-l-full border text-sm sm:text-base"
                />
                {input && (
                    <button
                        className="absolute top-1/2 right-3 -translate-y-1/2 hover:bg-muted rounded p-1"
                        onClick={() => setInput("")}
                        aria-label="Clear search"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
            <button
                onClick={handleSearch}
                disabled={!input.trim()}
                className="flex items-center justify-center w-8 sm:w-16 h-8 sm:h-10 dark:bg-[#3C3C3C] bg-[#F0F0F0] border
                dark:border-[#3C3C3C] border-[#F0F0F0] rounded-r-full hover:opacity-80 disabled:opacity-50"
                aria-label="Search"
            >
                <Search size={18} />
            </button>
        </div>
    );
};
