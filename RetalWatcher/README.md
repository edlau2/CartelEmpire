# Cartel Empire Retal Watcher
This Node.js program periodically checks for attacks made against cartel members via an API call and posts them to a Discord channel.

# Installation

1. Copy the files from this directory into a folder of your choice.
   <details>
     <summary>Click for file list</summary>
     1. ce-retals.service - only required to run as a service/daemon on Linux
     2. config.json - Configurable options are set in here
     3. defPersistent.json (not required, just a reference)
     4. index.js - the main program
     5. logger.js - handles logging to the console and/or a rotating log file.
     6. persistent.json - will be created if it doesn't exist, same a defPersistent.json
     7. persistentStore.js - handles saving to the persistent data store
     8. webhookQueue.js - a queue to pace Discord requests, preventing 429 errors.
   </details>
2. You can run directly from a terminal as long as Node.js is installed. Simply type 'node index.js' 
3. Ctrl-C will terminate, otherwise, it runs forever.
4. It can be run as a service/daemon under Linux, read the file 'ce-retals.service' for details.

index.js and webhookQueue.js both use fetch(), it is currently configured to use cross-fetch, since I have that 
package installed. You could also use node-fetch, it is included with Node.js version 18+, otherwise, replace
the lines that say 'require("cross-fetch")' with 'require("node-fetch")'

Configurable options are in the file config.js. It is commented and should be self-explanatory, but there are two critical
options you MUST fill in:

1. "api_key"
2. "discordWebhookUrl"
  
