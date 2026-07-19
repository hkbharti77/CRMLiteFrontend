/**
 * Utility to load the Facebook SDK asynchronously for Meta Embedded Signup.
 */

// Define the global window.FB type if needed to avoid TS errors
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const initFacebookSdk = (appId: string): Promise<void> => {
  return new Promise((resolve) => {
    // If already loaded
    if (window.FB) {
      resolve();
      return;
    }

    // Assign the callback that the SDK will call when loaded
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      resolve();
    };

    // Dynamically insert the script
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else {
        d.head.appendChild(js);
      }
    }(document, 'script', 'facebook-jssdk'));
  });
};
