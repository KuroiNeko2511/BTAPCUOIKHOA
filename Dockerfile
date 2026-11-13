# 1. Base image Node.js LTS bản Alpine siêu nhẹ (~100MB)
FROM node:20-alpine

# 2. Tạo thư mục làm việc trong container
WORKDIR /app

# 3. Copy file định nghĩa package trước để tận dụng Docker cache
COPY package*.json ./

# 4. Cài đặt các thư viện (chỉ cài production dependencies)
RUN npm install --omit=dev

# 5. Copy toàn bộ mã nguồn của dự án vào container
COPY . .

# 6. Khai báo cổng ứng dụng chạy (cổng 3000)
EXPOSE 3000

# 7. Lệnh khởi động server
CMD ["node", "./src/index.js"]