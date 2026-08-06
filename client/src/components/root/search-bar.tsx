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
        <div className="flex items-center justify-center w-full sm:w-[40vw] mx-auto max-w-lg px-1">
            <div className="flex-1 relative">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search"
                    className="w-full h-9 sm:h-10 pl-4 pr-12 rounded-l-full border text-sm sm:text-base focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-400"
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
                className="flex h-9 w-9 items-center justify-center rounded-r-full border bg-[#F0F0F0] hover:opacity-80 disabled:opacity-50 dark:border-[#3C3C3C] dark:bg-[#3C3C3C] sm:h-10 sm:w-12"
                aria-label="Search"
            >
                <Search size={18} />
            </button>
        </div>
    );
};
