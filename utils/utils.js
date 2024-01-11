export default function extractImageNameFromUrl (url) {
    const match = url.match(/([^\/]+\.png)$/);
    return match ? match[0] : "No image name found in URL.";
  };
  