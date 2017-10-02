FROM node:8.3.0

# install tools
RUN useradd --user-group --create-home --shell /bin/false app

CMD ["node", "server.js"]

ENV HOME=/home/app
COPY package.json $HOME/busy/
RUN chown -R app:app $HOME/*

USER app
WORKDIR $HOME/busy

RUN npm install
