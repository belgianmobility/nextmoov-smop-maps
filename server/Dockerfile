FROM node:dubnium-alpine

COPY ./ /app

WORKDIR /app
RUN yarn


VOLUME /app/cache
EXPOSE 80

WORKDIR /app
CMD [ "yarn", "start" ]
