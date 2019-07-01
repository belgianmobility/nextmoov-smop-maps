FROM node:dubnium-stretch-slim

COPY ./ /app

WORKDIR /app
RUN yarn


RUN wget https://github.com/omniscale/imposm3/releases/download/v0.6.0-alpha.4/imposm-0.6.0-alpha.4-linux-x86-64.tar.gz && \
tar xf imposm-0.6.0-alpha.4-linux-x86-64.tar.gz && \
rm imposm-0.6.0-alpha.4-linux-x86-64.tar.gz


RUN mkdir /app/tmp


VOLUME /app/tmp

WORKDIR /app
CMD [ "yarn", "start" ]
