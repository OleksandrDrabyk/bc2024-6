# Використання офіційного Node.js образу
FROM node:18

# Встановлення робочої директорії в контейнері
WORKDIR /usr/src/app

# Копіювання файлу package.json до контейнера
COPY package.json ./

# Встановлення залежностей
RUN npm install

RUN mkdir -p /usr/src/app/cache

# Копіювання всіх файлів проєкту в контейнер
COPY . .

# Відкриття порту, на якому буде працювати сервер
EXPOSE 3000

# Команда для запуску програми
CMD ["npm", "start"]