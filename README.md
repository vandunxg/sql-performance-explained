# SQL Performance Explained

Bản dịch tiếng Việt của _SQL Performance Explained_, được dựng thành website HTML tĩnh.

## Website

Website được deploy bằng GitHub Pages:

https://vandunxg.github.io/sql-performance-explained/

## Cấu trúc

- `html/`: nội dung website được publish, gồm các chapter, CSS, JavaScript và hình ảnh.
- `html/index.html`: trang mục lục chính.
- `html/tools/`: công cụ dùng để build/cập nhật các file HTML.
- `vi/`: dữ liệu dịch, source text và kết quả QA.
- `.github/workflows/deploy-pages.yml`: workflow tự động deploy GitHub Pages.

## Chạy local

Từ thư mục gốc của repository:

```bash
python3 -m http.server 8000 --directory html
```

Mở http://localhost:8000/ trong trình duyệt.

## Deploy

Workflow GitHub Actions sẽ tự chạy khi có push vào branch `main`. Có thể chạy thủ công từ tab **Actions** bằng workflow `Deploy HTML to GitHub Pages`.

Nếu repository chưa bật Pages, vào **Settings → Pages → Source** và chọn **GitHub Actions**.
