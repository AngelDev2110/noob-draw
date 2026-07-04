type Point = { x: number; y: number };
type Tool = "pen" | "eraser";
type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
};
