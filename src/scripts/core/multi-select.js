export function clampGroupDelta(positions, deltaX, deltaY, canvasWidth, canvasHeight, nodeWidth, nodeHeight, minCanvasX = 0, minCanvasY = 0) {
  const minX = Math.min(...positions.map((position) => position.x));
  const minY = Math.min(...positions.map((position) => position.y));
  const maxX = Math.max(...positions.map((position) => position.x));
  const maxY = Math.max(...positions.map((position) => position.y));
  const minDeltaX = minCanvasX - minX;
  const minDeltaY = minCanvasY - minY;
  const maxDeltaX = canvasWidth - nodeWidth - maxX;
  const maxDeltaY = canvasHeight - nodeHeight - maxY;

  const clampDelta = (minimum, maximum, delta) => {
    const value = maximum < minimum ? minimum : Math.min(maximum, Math.max(minimum, delta));
    return value === 0 ? 0 : value;
  };

  return {
    x: clampDelta(minDeltaX, maxDeltaX, deltaX),
    y: clampDelta(minDeltaY, maxDeltaY, deltaY)
  };
}
