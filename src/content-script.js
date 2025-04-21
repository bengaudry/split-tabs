// Listen for messages from the parent window
window.addEventListener("message", (event) => {
  // Verify the message is from our extension
  if (event.data && event.data.type === "getUrl") {
    // Get the favicon URL
    const favicon =
      document.querySelector("link[rel*='icon']")?.href ||
      document.querySelector("link[rel='shortcut icon']")?.href;

    // Get the computed background color
    const bodyStyle = window.getComputedStyle(document.body);

    console.info("w:", window.innerWidth - 1);
    const topElement = document.elementFromPoint(window.innerWidth / 2, 2);
    console.log(topElement);
    const topElementStyle = window.getComputedStyle(topElement);

    console.log(
      topElementStyle.backgroundColor,
      topElementStyle.background,
      bodyStyle.backgroundColor
    );

    const choosePreferredBgColor = () => {
      const topBg = topElementStyle?.backgroundColor?.toLowerCase();
      const bodyBg = bodyStyle?.backgroundColor?.toLowerCase();
      if (
        topBg === "rgba(0,0,0,0)" ||
        topBg === "rgb(0,0,0)" ||
        topBg === "black"
      ) {
        return bodyBg ?? topBg;
      }
      return topBg ?? bodyBg;
    };

    // Send the URL and background color back to the parent window
    window.parent.postMessage(
      {
        type: "url",
        url: window.location.href,
        title: document.title,
        backgroundColor:
          topElementStyle?.backgroundColor === "rgba(0, 0, 0, 0)"
            ? bodyStyle?.backgroundColor
            : topElementStyle?.backgroundColor || bodyStyle?.backgroundColor,
        icon: favicon,
      },
      "*"
    );
  }
});
