FROM node:8.9.0

WORKDIR /probot-app-release

COPY package.json yarn.lock /probot-app-release/

RUN yarn
