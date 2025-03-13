(function () {
    console.log("Grok TypeScript MIME Type Cleaner content script loaded");

    // Store the original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async function (...args) {
        const [resource, options] = args;

        // Check if this is a request to our target URL
        if (typeof resource === 'string' &&
            resource.includes("grok.com/rest/app-chat/upload-file") &&
            options && options.method === "POST" && options.body) {

            try {
                // outputs the body of the fetch request
                console.log("fetch body:", options.body);


                // Clone the body to avoid "Already read" errors
                const bodyClone = options.body.clone();

                // Read as text
                const bodyText = await bodyClone.text();
                const body = JSON.parse(bodyText);

                // Check if the fileName ends with .ts
                if (body.fileName && body.fileName.endsWith(".ts")) {
                    console.log("TypeScript file detected, clearing fileMimeType");

                    // Clear the fileMimeType
                    body.fileMimeType = "";

                    // Create a new request with the modified body
                    const modifiedOptions = {
                        ...options,
                        body: JSON.stringify(body)
                    };

                    // Make the modified request
                    return originalFetch(resource, modifiedOptions);
                }
            } catch (e) {
                console.error("Error processing fetch body:", e);
            }
        }

        // If no modification needed or error occurred, proceed with the original request
        return originalFetch.apply(this, args);
    };

    // Monkey patch XMLHttpRequest to handle cases where fetch isn't used
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;

    XHR.open = function (method, url) {
        this._method = method;
        this._url = url;
        return originalOpen.apply(this, arguments);
    };

    XHR.send = function (body) {
        // Check if this is a POST request to our target URL
        if (this._method === "POST" &&
            this._url && this._url.includes("grok.com/rest/app-chat/upload-file") &&
            body && typeof body === 'string') {

            try {
                // Parse the body
                const bodyObj = JSON.parse(body);

                // Check if the fileName ends with .ts
                if (bodyObj.fileName && bodyObj.fileName.endsWith(".ts")) {
                    console.log("TypeScript file detected in XHR, clearing fileMimeType");

                    // Clear the fileMimeType
                    bodyObj.fileMimeType = "";

                    // Use the modified body
                    arguments[0] = JSON.stringify(bodyObj);
                }
            } catch (e) {
                console.error("Error processing XMLHttpRequest body:", e);
            }
        }

        // Continue with the request
        return originalSend.apply(this, arguments);
    };
})();