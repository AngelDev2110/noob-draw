import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export function GuessChat({
  messages,
  onSend,
  onGuess,
  disabled,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onGuess: (
    text: string,
  ) => Promise<{ correct: boolean; points_awarded: number }>;
  disabled: boolean;
}) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSubmitting) return;

    setInput("");
    setIsSubmitting(true);

    try {
      const result = await onGuess(text);
      if (!result.correct) onSend(text);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-0"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center my-auto">
            No guesses yet — start typing!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-semibold text-primary">
                {m.displayName}:
              </span>{" "}
              <span className="text-foreground">{m.text}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2 p-2 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !isSubmitting && !disabled && handleSend()
          }
          placeholder={
            disabled ? "Ups! Can't guess right now" : "Type your guess…"
          }
          disabled={disabled}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={disabled || isSubmitting || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
