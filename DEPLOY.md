# Khi đặt server ở máy khác – Cấu hình trong `.env`

Chỉ cần chỉnh **một file**: `.env` ở thư mục gốc dự án (MedicalTech). Sau đó chạy `docker compose up -d`.

---

## 1. MySQL (bắt buộc)

| Biến | Ý nghĩa | Ví dụ |
|------|----------|--------|
| `MYSQL_HOST` | IP hoặc hostname máy chạy MySQL | `192.168.1.10` hoặc `100.78.133.11` |
| `MYSQL_PORT` | Port MySQL (map ra host) | `1776` |
| `MYSQL_DATABASE` | Tên database | `medical_appointment_system` |
| `MYSQL_USER` | User MySQL | `root` |
| `MYSQL_PASSWORD` | Mật khẩu MySQL | (mật khẩu thật) |

---

## 2. CORS – URL truy cập giao diện (bắt buộc nếu không dùng localhost)

User truy cập app bằng URL nào thì thêm URL đó vào đây (tránh lỗi 403 khi đăng nhập).

| Biến | Ý nghĩa | Ví dụ |
|------|----------|--------|
| `APP_CORS_ALLOWED_ORIGINS` | Các origin được phép, cách nhau bằng dấu phẩy | `http://192.168.1.50:3000,https://meditech.example.com` |

- Server chạy tại **http://192.168.1.50:3000** → thêm `http://192.168.1.50:3000` và `http://192.168.1.50`.
- Có domain **https://meditech.example.com** → thêm `https://meditech.example.com`.

---

## 3. URL giao diện (link trong email, redirect)

| Biến | Ý nghĩa | Ví dụ |
|------|----------|--------|
| `FRONTEND_URL` | URL giao diện web (để tạo link trong email, redirect) | `http://192.168.1.50:3000` hoặc `https://meditech.example.com` |

---

## 4. MoMo production (chỉ khi bật thanh toán MoMo prod)

| Biến | Ý nghĩa | Ví dụ |
|------|----------|--------|
| `PROD_MOMO_RETURN_URL` | URL redirect sau thanh toán | `https://meditech.example.com/` |
| `PROD_MOMO_IPN_URL` | URL MoMo gọi webhook | `https://meditech.example.com/api/momo/ipn-handler` |

Đổi `your-domain.com` thành domain thật của server.

---

## 5. Profile (tùy chọn)

| Biến | Ý nghĩa |
|------|----------|
| `SPRING_PROFILES_ACTIVE` | `dev` (mặc định) hoặc `prod` khi chạy production |

---

## Tóm tắt

- **Mọi cấu hình theo server** đều set trong **`.env`**.
- **Không cần sửa** `docker-compose.yml` hay code khi chỉ đổi máy/server.
- Sau khi sửa `.env`, chạy: `docker compose up -d --force-recreate` để áp dụng.
