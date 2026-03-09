
import { useEffect, useState } from 'react';
import * as ExpoShareIntent from 'expo-share-intent';

// We use a namespaced import and explicit calls to avoid potential
// conflict if the library exports a default hook that gets auto-called.
// This custom hook manages the share intent state.

export default function useAppShareIntent() {
  const [sharedContent, setSharedContent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Check for initial share intent (app opened via share)
    const checkInitial = async () => {
      try {
        // Safely check if getShareIntent exists (some versions might differ)
        if (ExpoShareIntent && ExpoShareIntent.getShareIntent) {
            const intent = await ExpoShareIntent.getShareIntent();
            if (isMounted && intent && (intent.text || intent.webUrl || intent.content)) {
                const content = intent.text || intent.webUrl || intent.content;
                console.log("Initial Share Intent:", content);
                setSharedContent(content);
            }
        }
      } catch (e) {
        console.log("Error checking initial share intent:", e);
      }
    };
    checkInitial();

    // 2. Listen for new share intents (app already open)
    let subscription;
    try {
        if (ExpoShareIntent && ExpoShareIntent.addShareIntentListener) {
            subscription = ExpoShareIntent.addShareIntentListener((intent) => {
                if (isMounted && intent && (intent.text || intent.webUrl || intent.content)) {
                    const content = intent.text || intent.webUrl || intent.content;
                    console.log("New Share Intent Listener:", content);
                    setSharedContent(content);
                }
            });
        }
    } catch (e) {
         console.log("Error adding listener:", e);
    }

    return () => {
      isMounted = false;
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  return sharedContent;
}
