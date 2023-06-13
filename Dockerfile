FROM --platform=linux/amd64 node:18

WORKDIR usr/src/app

COPY . .

EXPOSE 3001

RUN npm install

CMD npm run start
