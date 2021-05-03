# AngelSquad---Android

This is the Android version of Angel Squad
Description:
- it can be turned into an .APK from Cordova:
  it does not require any plugin
  
- it contains all files in /www
- it needs to be copied in a local server to be run
  e.g.: 
    - install xampp for Windows    
    - unzip archive 'AngelSquad---Android' into xampp/htdocs/
    - open your browser
    - open the URL:  localhost/AngelSquad---Android

 - Angel Squad uses Dexie.js, i.e. IndexedDB to store all data
    - to reset all changes in the game, such as unlocked levels, gold amount, profile,...:
      delete IndexedDB > ASDB & IndexedDB > _dbnames from browser, 
    
      
