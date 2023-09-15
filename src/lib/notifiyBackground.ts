type input = "getExtensionUrl"

export async function notifyBackgroundPage(input: input, payload: { url: string; }) {
  try {
    const sending = await chrome.runtime.sendMessage({
      message: input,
      payload: payload,
    });
    return sending.response;
  } catch (error) {
    console.log(`Error: ${error}`);
  }
}
