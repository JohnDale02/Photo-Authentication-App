This repository contains a Next.js application for visualizing photos stored in AWS S3 buckets. Users can sign up cooresponding to their PhotoLock camera and view, download, and send their authentic images and metadata to other users. 

This app is a visual proof-of-concept with limited functionality. As part of my UMass Senior Design project, with the goal of authenticating photos using digital signatures. This app pairs with our hardware proof-of-concept, PhotoLock. 

Known Issues / Functionality Limitations:
- Multiple users can sign up with the same email
- Multiple users can sign up with the same camera number
- Camera numbers are not a secure way to associate cameras with users
- Forgot password route is not setup
- "Remember me" checkbox not setup