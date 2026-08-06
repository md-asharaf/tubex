import { onTimestampClick } from "./utils";
import { Link } from "react-router-dom";

export const processText = (comment: string, playerRef: any) => {
    const tokenRegex = /(\b\d{1,2}:\d{2}\b|@\w+)/g;
    const parts = comment.split(tokenRegex);
    return parts.map((part, index) => {
        if (/\b\d{1,2}:\d{2}\b/.test(part)) {
            const [minutes, seconds] = part.split(":").map(Number);
            const timeInSeconds = minutes * 60 + seconds;
            return (
                <a
                    key={index}
                    href="#"
                    className="text-blue-600 dark:text-[#3EA6FF]"
                    onClick={(e) => {
                        e.preventDefault();
                        onTimestampClick(timeInSeconds, playerRef);
                    }}
                >
                    {part}
                </a>
            );
        } else if (/^@\w+$/.test(part)) {
            return (
                <Link
                    key={index}
                    to={`/channel/${part.slice(1)}`}
                    className="text-blue-600 dark:text-[#3EA6FF]"
                >
                    {part}
                </Link>
            );
        }

        return <span key={index}>{part}</span>;
    });
};
