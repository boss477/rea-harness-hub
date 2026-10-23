FROM node:24-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends git curl unzip openjdk-17-jre-headless ca-certificates && rm -rf /var/lib/apt/lists/*
ARG REA_REF=main
RUN git clone --depth 1 --branch ${REA_REF} https://github.com/morluto/rea.git /opt/rea
WORKDIR /opt/rea
RUN npm ci && npm run compile
ENV REA_ROOT=/opt/rea
WORKDIR /app
COPY worker/package.json worker/server.mjs ./
EXPOSE 10000
CMD ["npm","start"]
