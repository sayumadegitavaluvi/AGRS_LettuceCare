let connectionHandler:
  | (() => void)
  | null = null;

export function setConnectionHandler(
  handler: () => void
) {
  connectionHandler = handler;
}

export function showConnectionError() {
  if (connectionHandler) {
    connectionHandler();
  }
}