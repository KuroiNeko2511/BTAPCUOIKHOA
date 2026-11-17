FROM node:24-alpine

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file định nghĩa package trước để tận dụng Docker cache
COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src
USER node

# 6. Khai báo cổng ứng dụng chạy (cổng 3000)
EXPOSE 3000

# 7. Lệnh khởi động server
CMD ["node", "./src/index.js"]
