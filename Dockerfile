
FROM node:18

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

RUN mkdir -p /usr/src/app/cache

COPY . .

EXPOSE 3000

CMD ["npx", "nodemon", "server.js"]