const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime');


async function searchFiles(dir, item, dirPath) {
 let results = [];

 const files = await fs.readdir(dir);
 
 for (const file of files) {
   const filePath = path.join(dir, file);
   const stat = await fs.stat(filePath);
   if (stat.isDirectory()) {
     results = results.concat(await searchFiles(filePath, item, dirPath));
   } else if (stat.isFile() && file.includes(item)) {
     const relativePath = path.relative(dirPath, filePath);
     results.push({ name: file, path: relativePath });
   }
 }
 return results;
}


function handleCors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS' && req.headers['access-control-request-method']) {
    res.sendStatus(200);
  } else {
    next();
  }
}

app.use(handleCors);

app.get('*', async (req, res) => {
 const dirPath = '/home/user/data/';
 const urlPath = decodeURIComponent(req.params[0] || '');
 const filePath = path.join(dirPath, urlPath);
 console.log(req.path,filePath)
 if (req.query.book) {
   const searchResults = await searchFiles(dirPath, req.query.book, dirPath);
   res.json({ files: searchResults });
 }
 else {
   try {
     const stats = await fs.stat(filePath);
     if (stats.isDirectory()) {
       const files = await fs.readdir(filePath);
       const directories = [];
       const filesArray = [];

       for (const file of files) {
         const fullPath = path.join(filePath, file);
         const fileStats = await fs.stat(fullPath);

         if (fileStats.isDirectory()) {
           directories.push({
             name: file,
             path: path.join(urlPath, file),
           });
         } else if (fileStats.isFile()) {
           filesArray.push({
             name: file,
             path: fullPath,
           });
         }
       }

       const responseObject = {
         directories: directories,
         files: filesArray,
       };

       res.json(responseObject);
     } else if (stats.isFile()) {
       sendFile(filePath, res);
     }
    } catch (error) {
      res.status(404).send('Cannot GET ' + req.originalUrl);
    }
  }
});


function sendFile(filePath, res) {
 fs.readFile(filePath)
   .then(content => {
     const mimeType = mime.lookup(filePath) || 'application/octet-stream';
     res.setHeader('Content-Type', mimeType + '; charset=utf-8');
     res.end(content);
   })
   .catch(err => {
     console.error('Error reading file:', err);
     res.status(500).send('Error reading file');
   });
}


app.listen(8005, () => {
  console.log('The server is running on port 8005');
});
