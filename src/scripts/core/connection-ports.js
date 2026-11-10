const PORT_NORMALS = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};

export function inferConnectionPorts(source, target, nodeWidth, nodeHeight, targetWidth = nodeWidth, targetHeight = nodeHeight) {
  const deltaX = target.x + targetWidth / 2 - (source.x + nodeWidth / 2);
  const deltaY = target.y + targetHeight / 2 - (source.y + nodeHeight / 2);
  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0 ? { fromPort: 'right', toPort: 'left' } : { fromPort: 'left', toPort: 'right' };
  }
  return deltaY >= 0 ? { fromPort: 'bottom', toPort: 'top' } : { fromPort: 'top', toPort: 'bottom' };
}

export function resolveConnectionEndpoint(project, id, kind = 'node') {
  if (kind === 'node') return project.nodes.find((node) => node.id === id);
  if (kind === 'cluster') return project.clusters.find((cluster) => cluster.id === id);
  return undefined;
}

export function connectionEndpointSize(endpoint, kind, nodeWidth, nodeHeight) {
  return kind === 'cluster'
    ? { width: endpoint.width, height: endpoint.height }
    : { width: endpoint.width ?? nodeWidth, height: endpoint.height ?? nodeHeight };
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
