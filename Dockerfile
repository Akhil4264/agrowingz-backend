FROM node:14-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY schema.prisma .

RUN npx prisma generate

COPY . .

ENV PORT 80

EXPOSE 80

CMD ["node" , "server"]
