import AWS from 'aws-sdk';

//=============== AWS IDs ===============
var userPoolId = 'us-east-2_jgICLJECT';
var clientId = '4uda3lbttf8o7t7iu1jap3dr1h';
var region = 'us-east-2';
var identityPoolId = 'us-east-2:27d074d6-1504-4bbf-8394-45f8a4595b87';


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

export const viewAlbum = (setImages, globalCameraNumber) => {
  var bucketName = 'camera' + globalCameraNumber + 'verifiedimages';

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

    var files = data.Contents.reduce((acc, file) => {
      if (file.Key.endsWith('.png')) {
        const jsonKey = file.Key.replace('.png', '.json');
        acc.push({
          pngKey: file.Key,
          jsonKey: jsonKey
        });
      }
      return acc;
    }, []);

    var photos = files.map(({ pngKey, jsonKey }) => {
      // Generate signed URLs for each image and JSON file
      const imageUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: pngKey,
        Expires: 60 // This URL will be valid for 60 seconds
      });

      const jsonUrl = s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: jsonKey,
        Expires: 60 // This URL will be valid for 60 seconds
      });

      return {
        imageUrl: imageUrl,
        jsonUrl: jsonUrl,
        imageFilename: pngKey,
      };
    });

    console.log("Photos:", photos);

    setImages(photos);
  });
};


export const downloadImageAndJson = async (imageKey, idToken, globalCameraNumber) => {
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
  
    const bucketName = 'camera' + globalCameraNumber + "verifiedimages";
  
    // Helper function to create and trigger a download link
    const triggerDownload = (url, filename) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  
    // Get signed URL and download the image
    const imageParams = {
      Bucket: bucketName,
      Key: imageKey,
    };
  
    s3.getSignedUrl('getObject', imageParams, (err, imageUrl) => {
      if (err) {
        console.error('Error getting signed URL for image:', err);
        return;
      }
      triggerDownload(imageUrl, imageKey);
    });
  
    // Get signed URL and download the JSON
    const jsonKey = imageKey.replace('.png', '.json');
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