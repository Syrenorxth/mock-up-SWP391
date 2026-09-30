# Mock-up full SWP391 – Hệ thống Đánh giá Chất lượng và Quản lý Nhuận bút (KPI & Royalty)

Mockup giao diện đầy đủ 5 luồng nghiệp vụ (bản chia luồng 27/09/2026), viết bằng **React + TypeScript + Tailwind CSS**, chạy bằng **Node.js** (Vite).
Không có backend: toàn bộ dữ liệu mẫu nằm trong `src/data/mockData.ts` và state của `src/context/AppContext.tsx`.
Tải lại trang (F5) thì dữ liệu trở về ban đầu.

## Cách chạy

Yêu cầu: **Node.js 18 trở lên** (khuyên dùng Node 20 hoặc 22).

```bash
cd "mock-up full SWP391"
npm install        # cài thư viện (chỉ cần lần đầu)
npm run dev        # chạy ở http://localhost:3000
```

Các lệnh khác:

| Lệnh | Tác dụng |
|---|---|
| `npm run build` | Đóng gói bản chạy thật vào thư mục `dist/` |
| `npm run preview` | Chạy thử bản đã đóng gói ở http://localhost:4173 |
| `npm run lint` | Kiểm tra lỗi TypeScript |

## Cách demo

- Vào `/login` để chọn người dùng theo vai trò, hoặc đổi nhanh người dùng/vai trò trên thanh trên cùng.
- Thanh **Kịch bản demo** ở cuối màn hình đi 14 bước theo đúng ví dụ bài "Nước sạch ở xóm chài ven sông" qua cả 5 luồng, mỗi bước tự đổi đúng người dùng và mở đúng màn. Nút "Khôi phục dữ liệu" đưa dữ liệu về ban đầu.
- Mỗi màn có nhãn "Luồng 0X" ở đầu trang; màn thuộc Iteration 3 có nhãn "Iter 3".

## Cấu trúc thư mục

```
src/
  App.tsx                  Khai báo route
  types.ts                 Kiểu dữ liệu, trạng thái bài, hàm định dạng
  data/mockData.ts         Dữ liệu mẫu (nhuận bút và KPI được sinh bằng chính hàm tính)
  context/AppContext.tsx   State + reducer cho mọi thao tác
  utils/royalty.ts         Công thức nhuận bút ①–⑧ (dùng chung luồng 01 & 04)
  utils/kpi.ts             Tính KPI: bài quy đổi, điểm hiệu lực, Đạt/Chưa đạt, snapshot
  utils/readerReports.ts   Báo cáo thể loại (Bayes, chi/1.000 lượt xem), sự kiện đang nổi
  components/              Layout, header, thanh demo, badge, modal…
  pages/flow1 … flow5      Màn theo từng luồng
  pages/admin              Danh mục, bộ tiêu chí, tham số
  pages/shared             Bài đã đăng
```

## Số liệu kiểm chứng (khớp file Tổng hợp 5 luồng)

- Điểm bài mẫu: lần 1 = 64, lần 2 = 78, sau khiếu nại = 92.
- Kỳ 06/2026: 9,6 × 234.000 = 2.246.400 đ → An 1.348.400 đ, Bình 898.000 đ, ảnh 702.000 đ.
- Sau khiếu nại: 15 × 234.000 = 3.510.000 đ → điều chỉnh kỳ 07: An +757.600 đ, Bình +506.000 đ (tổng +1.263.600 đ).
- KPI tháng 06: An 0,6 bài, Bình 0,4 bài. Báo cáo thể loại: chi / 1.000 lượt xem ≈ 339.700 đ (12.400 lượt xem).
