// Listen for messages from the parent window
window.addEventListener('message', (event) => {
  // Verify the message is from our extension
  if (event.data && event.data.type === 'getUrl') {
    // Get the computed background color
    const bodyStyle = window.getComputedStyle(document.body);
    const backgroundColor = bodyStyle.backgroundColor;
    
    // Get the favicon URL
    const favicon = document.querySelector("link[rel*='icon']")?.href || 
                    document.querySelector("link[rel='shortcut icon']")?.href;
    
    // Send the URL and background color back to the parent window
    window.parent.postMessage({
      type: 'url',
      url: window.location.href,
      title: document.title,
      backgroundColor: backgroundColor,
      icon: favicon
    }, '*');
  }
}); 
