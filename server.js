const express = require('express');
const fs = require('fs');
const { program } = require('commander');
const path = require('path');
const multer = require('multer');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const upload = multer(); 
// Дефолтний хост і порт
const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;

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

// Налаштування документації Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // Версія OpenAPI
    info: {
      title: 'Notes API', // Назва API
      version: '1.0.0',
      description: 'API для роботи з нотатками',
    },
  },
  apis: ['./server.js'], // Шлях до файлів, де є коментарі для Swagger
};

// Генеруємо Swagger документацію
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Підключаємо UI для документації
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     description: Додає нову нотатку на сервер.
 *     parameters:
 *       - in: formData
 *         name: note_name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *       - in: formData
 *         name: note
 *         required: true
 *         description: Текст нотатки
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Нотатку успішно створено
 *       400:
 *         description: Помилка при створенні нотатки
 */
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
  
/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати нотатку за назвою
 *     description: Повертає текст нотатки за її назвою.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Текст нотатки
 *       404:
 *         description: Нотатка не знайдена
 */
app.get('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  const noteContent = fs.readFileSync(notePath, 'utf-8');
  res.send(noteContent);
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити нотатку
 *     description: Оновлює текст існуючої нотатки.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *       - in: body
 *         name: text
 *         required: true
 *         description: Новий текст нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатку успішно оновлено
 *       400:
 *         description: Текст для оновлення відсутній
 *       404:
 *         description: Нотатка не знайдена
 */
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

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку
 *     description: Видаляє нотатку за назвою.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Назва нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Нотатку успішно видалено
 *       404:
 *         description: Нотатка не знайдена
 */
app.delete('/notes/:name', (req, res) => {
  const notePath = path.join(cachePath, req.params.name + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати всі нотатки
 *     description: Повертає список всіх нотаток.
 *     responses:
 *       200:
 *         description: Список нотаток
 */
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
