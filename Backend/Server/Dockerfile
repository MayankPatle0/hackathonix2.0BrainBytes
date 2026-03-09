FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# Copy application source
COPY . .

# Environment
ENV NODE_ENV=production

# Expose API port (matches PORT in .env/template)
EXPOSE 3001

# Start the web server
CMD ["npm", "start"]
