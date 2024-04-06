import AWS from 'aws-sdk';

//=============== AWS IDs ===============
var userPoolId = 'us-east-2_0cV1pXRAu';
var clientId = '7uck4ke8tv6tmlbgnktlcd521v';
var region = 'us-east-2';
var identityPoolId = 'us-east-2:d1807790-6713-47b5-8e18-f45270fd9686';


export const poolData = { 
    UserPoolId: userPoolId, 
    ClientId: clientId 
};

export const getCognitoIdentityCredentials = (idToken) => {
    AWS.config.region = region;

    var loginMap = {};
    loginMap['cognito-idp.' + region + '.amazonaws.com/' + userPoolId] = idToken;
  
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,
      Logins: loginMap
    });
  
    AWS.config.credentials.clearCachedId();
  
    AWS.config.credentials.get(function(err) {
        if (err){
          console.log("There was an error getting credentials")
          console.log(err.message);
        }
        else {
          console.log('AWS Access Key: '+ AWS.config.credentials.accessKeyId);
          console.log('AWS Secret Key: '+ AWS.config.credentials.secretAccessKey);
          console.log('AWS Session Token: '+ AWS.config.credentials.sessionToken);
        }
    });
};

export const setMediaFromS3 = (setMedia, bucketName_fingerprint) => {
// Assume `signedUrlCache` is a module-level variable that does not require state updates
  let signedUrlCache = {};

  const getSignedUrl = (s3, bucketName, key, isJson = false) => {
    const currentTime = Date.now();
    const cacheKey = `${bucketName}/${key}${isJson ? '_json' : ''}`;

    if (signedUrlCache[cacheKey] && signedUrlCache[cacheKey].expiry > currentTime) {
      // Cache hit, return the cached URL
      return signedUrlCache[cacheKey].url;
    } else {
      // Cache miss, generate a new signed URL
      const url = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: key,
        Expires: 60 // URL validity in seconds
      });

      // Update the cache with the new URL and expiry time
      signedUrlCache[cacheKey] = {
        url: url,
        expiry: currentTime + (60 * 1000) // Add 60 seconds to the current time
      };

      return url;
    }
  };

  var bucketName = bucketName_fingerprint;

  var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: bucketName }
  });

  s3.listObjects({ Bucket: bucketName }, function(err, data) {
    if (err) {
        console.log("There was an error viewing your album: " + err.message);
        return;
    }

    data.Contents.sort((a, b) => b.LastModified - a.LastModified);

    var mediaItems = data.Contents.reduce((acc, file) => {
      if (file.Key.endsWith('.png') || file.Key.endsWith('.mp4')) {
        const jsonKey = file.Key.endsWith('.png') ? file.Key.replace('.png', '.json') : file.Key.replace('.mp4', '.json');
        acc.push({
          mediaKey: file.Key,
          jsonKey: jsonKey,
          isVideo: file.Key.endsWith('.mp4') // Add isVideo property
        });
      }
      return acc;
    }, []);

    var media = mediaItems.map(({ mediaKey, jsonKey, isVideo }) => {
      const mediaUrl = getSignedUrl(s3, bucketName, mediaKey);
      const jsonUrl = getSignedUrl(s3, bucketName, jsonKey, true);

      return {
        mediaUrl: mediaUrl,
        jsonUrl: jsonUrl,
        mediaFilename: mediaKey, 
        isVideo: isVideo
      };
    });

    console.log("Media:", media);

    setMedia(media);
  });
};


export const downloadMedia = async (mediaKey, isVideo, idToken, bucketName_fingerprint) => {
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId,
        Logins: {
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
        },
      }),
    });
  
    const bucketName = bucketName_fingerprint;
  
    // Helper function to create and trigger a download link
    const triggerDownload = (url, filename) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    if (isVideo == true) {
      mediaKey = mediaKey.replace('.mp4', '.avi');
    }

    // Get signed URL and download the image
    const mediaParams = {
      Bucket: bucketName,
      Key: mediaKey,
    };
  
    s3.getSignedUrl('getObject',  mediaParams, (err, mediaUrl) => {
      if (err) {
        console.error('Error getting signed URL for image:', err);
        return;
      }
      triggerDownload(mediaUrl, mediaKey);
    });
  
    let extension;
    if (isVideo == true) {
      extension = '.avi';
    }
    else {
      extension = '.png';
    }

    const jsonKey = mediaKey.replace(extension, '.json');

    const jsonParams = {
      Bucket: bucketName,
      Key: jsonKey,
    };
  
    setTimeout(() => {
      s3.getSignedUrl('getObject', jsonParams, (err, jsonUrl) => {
        if (err) {
          console.error('Error getting signed URL for JSON:', err);
          return;
        }
        triggerDownload(jsonUrl, jsonKey);
      });
  
    }, 3000);
    
  };


  export const deleteMedia = async (mediaKey, isVideo, idToken, bucketName_fingerprint) => {
    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      region: region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId,
        Logins: {
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
        },
      }),
    });
  
    const bucketName = bucketName_fingerprint;
  
    // Parameters for deleting the media object

    const deleteFile = async (mediaKey) => {
      const mediaParams = {
        Bucket: bucketName,
        Key: mediaKey,
      };
      try {
        const deleteResponse = await s3.deleteObject(mediaParams).promise();
        console.log(`Successfully deleted file: ${mediaKey}`, deleteResponse);
      } catch (err) {
        console.error(`Error deleting file: ${mediaKey}`, err);
        throw err; // Rethrow the error to handle it in the calling function
      }
    };
  
    // Determine the media extension
    const mediaExtension = isVideo ? '.mp4' : '.png'; // Adjust the extension if necessary
    // Replace the extension with '.json' to get the key for the JSON file
    const jsonKey = mediaKey.replace(mediaExtension, '.json');
  
    // Delete the media file
    await deleteFile(mediaKey);

    if (isVideo) { 
      mediaKey = mediaKey.replace('.mp4', '.avi');
      await deleteFile(mediaKey);
    }

    await deleteFile(jsonKey);
  };