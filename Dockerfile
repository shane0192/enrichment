# Use the official Node.js 20 image as the base
FROM node:20-slim

# Install necessary dependencies for Chromium
RUN apt-get update && \
    apt-get install -y wget ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Chromium
RUN wget -O /usr/bin/chromium "https://github.com/puppeteer/puppeteer/releases/download/v122.0.0/chrome-linux64.zip" && \
    chmod +x /usr/bin/chromium

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the port
EXPOSE 8080

# Start the app
CMD ["npm", "start"] 