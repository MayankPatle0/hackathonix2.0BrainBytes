// Listen ONLY for special messages from content scripts, like a screenshot request.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "captureScreenshot") {
        
        chrome.tabs.captureVisibleTab(
            sender.tab.windowId,
            { format: "png" },
            (dataUrl) => {
                if (chrome.runtime.lastError || !dataUrl) {
                    console.error("Failed to capture screenshot:", chrome.runtime.lastError?.message);
                    sendResponse({ message: "Screenshot failed." });
                    return;
                }
                
                console.log("Screenshot captured successfully!");
                sendResponse({
                    message: "Screenshot captured!",
                    dataUrl: dataUrl
                });
            }
        );
        
        // Return true to indicate an asynchronous response.
        return true;
    }
});

// The chrome.action.onClicked listener has been REMOVED because
// the popup now handles the click action.