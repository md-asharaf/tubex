import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Laugh, Send } from "lucide-react";
import { AvatarImg } from "./avatar-image";

interface TextAreaProps {
  userAvatar: string;
  fullname: string;
  initialValue?: string;
  placeholder?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  submitLabel: string;
  hideAvatar?: boolean;
  autoFocus?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  userAvatar,
  fullname,
  initialValue = "",
  placeholder = "",
  onSubmit,
  onCancel,
  submitLabel,
  hideAvatar = false,
  autoFocus = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isInputFocused, setIsInputFocused] = useState(
    initialValue ? true : false
  );

  useEffect(() => {
    const handleSetReply = (e: any) => {
      if (submitLabel === "Reply" && hideAvatar) {
        if (e.detail) {
          setContent(`@${e.detail} `);
        }
        setTimeout(() => textareaRef.current?.focus(), 10);
      }
    };
    window.addEventListener("setReplyUsername", handleSetReply);
    return () => window.removeEventListener("setReplyUsername", handleSetReply);
  }, [submitLabel, hideAvatar]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useSelector((state: RootState) => state.theme.mode);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prevContent) => prevContent + emojiData.emoji);
  };

  const handleSubmit = () => {
    onSubmit(content.trim());
    setContent("");
    setIsInputFocused(false);
  };

  const handleCancel = () => {
    setContent("");
    setIsInputFocused(false);
    if (onCancel) onCancel();
  };

  return (
    <div className="flex gap-y-1 flex-col justify-start w-full">
      <div className="flex items-start gap-3 w-full">
        {!hideAvatar && (
          <AvatarImg
            className={`mt-0.5 ${submitLabel == "Comment"
              ? "h-[32px] w-[32px] sm:h-[40px] sm:w-[40px]"
              : "h-[24px] w-[24px] sm:h-[32px] sm:w-[32px]"
              }`}
            fullname={fullname}
            avatar={userAvatar}
          />
        )}
        <div className="flex-1 bg-gray-200 dark:bg-[#272727] sm:bg-transparent sm:dark:bg-transparent rounded-[18px] sm:rounded-none px-4 py-1.5 sm:px-0 sm:py-0 sm:border-b sm:border-gray-500 sm:focus-within:border-gray-400 transition-all flex items-center min-h-[36px] w-full">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="outline-none shadow-none w-full bg-transparent resize-none overflow-hidden text-[14px] sm:text-base pt-1"
            rows={1}
            style={{ lineHeight: "1.2" }}
            onFocus={() => setIsInputFocused(true)}
            maxLength={500}
            autoFocus={autoFocus}
          />
          <div className="sm:hidden flex items-center ml-2 shrink-0">
            {content ? (
              <button onClick={handleSubmit} className="text-blue-500 p-1.5 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Send size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 rounded-full">
                      <Laugh size={20} strokeWidth={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent collisionPadding={20} side="bottom" align="end" className="p-0">
                    <EmojiPicker onEmojiClick={handleEmojiClick} theme={theme == "dark" ? Theme.DARK : Theme.LIGHT} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
      {(isInputFocused || content) && (
        <div className={`hidden sm:flex space-x-2 justify-between items-start mt-2 w-full ${!hideAvatar ? 'pl-[52px]' : ''}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="focus:outline-none">
              <Button
                variant="ghost"
                className="rounded-full h-7 sm:h-9 p-2"
              >
                <Laugh />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              collisionPadding={100}
              className="p-0 overflow-y-auto"
              side="bottom"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme={
                  theme == "dark" ? Theme.DARK : Theme.LIGHT
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex space-x-2 items-center">
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="h-7 sm:h-9 rounded-full"
            >
              Cancel
            </Button>
            <Button
              disabled={!content}
              onClick={handleSubmit}
              variant="outline"
              className="bg-blue-500 hover:bg-blue-400 h-7 sm:h-9 p-1 sm:p-3 rounded-full"
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
