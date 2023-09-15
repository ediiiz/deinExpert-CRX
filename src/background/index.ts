import { storage } from "../storage";

// Background service workers
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

chrome.runtime.onInstalled.addListener(() => {
    storage.get().then(console.log);
});

function getExtensionUrl(filename: string) {
    const url = chrome.runtime.getURL(filename);
    return url;
}

function handleMessage(request: { message: string; payload: { url: string; }; }, sender: any, sendResponse: (arg0: {
    response: {
        url: string;
    };
}) => void) {
    console.log(`A content script sent a message: ${request.message}`);
    if (request.message === "getExtensionUrl") {
        const url = getExtensionUrl(request.payload.url);
        sendResponse({ response: { url } });
    }
    return true;  // This is crucial. This keeps the message channel open for asynchronous operations.
}

chrome.runtime.onMessage.addListener(handleMessage);

// NOTE: If you want to toggle the side panel from the extension's action button,
// you can use the following code:
// chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
//    .catch((error) => console.error(error));
