FROM node:24-alpine

LABEL maintainer="Pierre Awaragi <pierre@awaragi.com>"

ENV NODE_ENV=production

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

COPY *.js ./

# Expose the port the app runs in
EXPOSE 4000

USER node

# Serve the app
CMD ["node", "index.js"]
