import { Textarea } from "@/components/ui/textarea";
interface Data {
  text: string;
}
interface TextPostProps {
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  autoFocus?: boolean;
}

export const TextPost = ({ data, setData, autoFocus }: TextPostProps) => {
  return (
    <Textarea
      autoFocus={autoFocus}
      value={data.text}
      placeholder="What's on your mind?"
      onChange={(e) => {
        setData({ text: e.target.value });
      }}
    />
  );
};
