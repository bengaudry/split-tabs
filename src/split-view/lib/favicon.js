/** Creates the composite favicon for the split view tab */
export function createCompositeFavicon(leftPaneIcon, rightPaneIcon) {
  if (!leftPaneIcon || !rightPaneIcon) return;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");

  // Load both images
  const leftImg = new Image();
  const rightImg = new Image();

  leftImg.crossOrigin = "anonymous";
  rightImg.crossOrigin = "anonymous";

  leftImg.src = leftPaneIcon;
  leftImg.onload = () => {
    rightImg.src = rightPaneIcon;
    rightImg.onload = () => {
      // Draw left icon in top left (20x20)
      ctx.drawImage(leftImg, 0, 0, 20, 20);
      // Draw right icon in bottom right (20x20)
      ctx.drawImage(rightImg, 12, 12, 20, 20);

      // Convert canvas to favicon
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = canvas.toDataURL("image/png");
      document.head.appendChild(link);
    };
  };
}
