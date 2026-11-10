const PORT_NORMALS = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};

export function inferConnectionPorts(source, target, nodeWidth, nodeHeight) {
  const deltaX = target.x + nodeWidth / 2 - (source.x + nodeWidth / 2);
  const deltaY = target.y + nodeHeight / 2 - (source.y + nodeHeight / 2);
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? { fromPort: 'right', toPort: 'left' } : { fromPort: 'left', toPort: 'right' };
  }
  return deltaY >= 0 ? { fromPort: 'bottom', toPort: 'top' } : { fromPort: 'top', toPort: 'bottom' };
}

export function connectionPortPoint(node, port, nodeWidth, nodeHeight) {
  switch (port) {
    case 'top': return { x: node.x + nodeWidth / 2, y: node.y };
    case 'bottom': return { x: node.x + nodeWidth / 2, y: node.y + nodeHeight };
    case 'left': return { x: node.x, y: node.y + nodeHeight / 2 };
    default: return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
  }
}

export function connectionPortNormal(port) {
  return PORT_NORMALS[port] || PORT_NORMALS.right;
}
