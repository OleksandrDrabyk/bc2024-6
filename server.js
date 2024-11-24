const express = require('express');
const fs = require('fs');
const { program } = require('commander');
const path = require('path');
const multer = require('multer');

const app = express();
const upload = multer(); 

program
  .option('-h, --host <host>', 'server address')
  .option('-p, --port <port>', 'server port')
  .option('-c, --cache <cache>', 'cache directory')
  .parse();

const { host, port, cache } = program.opts();

if (!host) {
  console.error('Error: Host parameter is missing. Please specify the --host parameter.');
  process.exit(1);
}
if (!port) {
  console.error('Error: Port parameter is missing. Please specify the --port parameter.');
  process.exit(1);
}
if (!cache) {
  console.error('Error: Cache parameter is missing. Please specify the --cache parameter.');
  process.exit(1);
}

const cachePath = cache;

// Перевіряємо і створюємо директорію кешу
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}
app.post('/write', express.urlencoded({ extended: true }), upload.none(), (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
  
    // Перевірка даних
    if (!noteName || !noteText) {
      return res.status(400).send('Note name and text are required');
    }
  
    const notePath = path.join(cachePath, `${noteName}.txt`);
  
    // Перевірка існування нотатки
    if (fs.existsSync(notePath)) {
      return res.status(400).send('Note already exists');
    }
  
    // Спроба записати файл
    try {
      fs.writeFileSync(notePath, noteText);
      res.status(201).send('Note created');
    } catch (error) {
      console.error('Error writing note:', error);
      res.status(500).send('Internal server error');
    }
  });
  
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  const noteContent = fs.readFileSync(notePath, 'utf-8');
  res.send(noteContent);
});

app.put('/notes/:name', express.text(), (req, res) => {
    const notePath = path.join(cachePath, req.params.name + '.txt');
    if (!fs.existsSync(notePath)) {
      return res.status(404).send('Not found'); 
    }
  
    
    const newText = req.body; 
    if (!newText) {
      return res.status(400).send('Error: Text is required'); 
    }
  
    try {
      fs.writeFileSync(notePath, newText); 
      res.send(`Note "${req.params.name}" updated successfully`); 
    } catch (error) {
      console.error('Error updating note:', error);
      res.status(500).send('Internal server error'); 
    }
  });
  
  

app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cachePath)
    .filter(file => file.endsWith('.txt'))
    .map(file => ({
      name: file.replace('.txt', ''),
      text: fs.readFileSync(path.join(cachePath, file), 'utf-8'),
    }));
  res.json(notes);
});
app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
