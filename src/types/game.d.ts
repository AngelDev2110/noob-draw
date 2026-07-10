type Point = { x: number; y: number };
type Tool = "pen" | "eraser";
type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
};

type ChatMessage = {
  id: string;
  userId: string;
  displayName: string;
  text: string;
};
