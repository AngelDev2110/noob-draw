import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "./ui/tooltip";
import { useState } from "react";

export function RoomSlug({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-foreground">Share this code with your friends!</p>
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/40 bg-primary/5">
        <span className="flex-1 text-sm font-mono text-primary tracking-widest truncate">
          {slug}
        </span>
        <TooltipProvider>
          <Tooltip open={copied}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copied!</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
