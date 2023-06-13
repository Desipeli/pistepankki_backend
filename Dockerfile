FROM --platform=$TARGETPLATFORM node AS build

WORKDIR usr/src/app

COPY . .

EXPOSE 3001

RUN npm install

CMD npm run start
