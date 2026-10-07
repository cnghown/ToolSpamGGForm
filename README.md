# Google Forms QA & Automated Testing Web Tool

Công cụ kiểm thử tự động cho Google Forms với giao diện trực quan (Web UI), cho phép mô phỏng và chạy test đáp án dành cho các Google Form thuộc quyền sở hữu/kiểm soát của bạn.

---

## 🚀 Tính Năng Nổi Bật

1. **Tự động nhận diện loại câu hỏi (Auto Parse Google Form)**:
   - Tự phân tích URL Google Form & trích xuất danh sách câu hỏi, entry ID, loại câu hỏi, và các option có sẵn.
   - Hỗ trợ đầy đủ các loại câu hỏi: *Short Answer, Paragraph, Multiple Choice, Checkbox, Dropdown, Linear Scale, Rating, Date, Time*.

2. **Cấu hình dữ liệu độc lập cho từng câu hỏi**:
   - **Nhập dữ liệu**:
     - *Thủ công (Manual)*: Nhập chuỗi cố định.
     - *Import File (.txt, .csv, .json, .xlsx)*: Hỗ trợ chế độ chọn **Random** hoặc **Sequential (Nối tiếp)**.
       - Tùy chọn xử lý overflow khi số response > số dòng file: *Loop từ đầu* hoặc *Stop khi hết dữ liệu*.
     - *Sinh dữ liệu tự động (Generated)*.
   - **Multiple Choice / Dropdown / Scale / Rating**:
     - *Fixed*: Chọn 1 đáp án cố định.
     - *Random*: Chọn ngẫu nhiên giữa các option.
     - *Weighted Random*: Đặt tỷ lệ % hoặc số lượng mục tiêu cho từng đáp án.
     - *Exact Count*: Đảm bảo đúng chính xác số lượng đáp án mong muốn trên tổng số test run (ví dụ: 60 "Đồng ý", 30 "Không đồng ý", 10 "Hoàn toàn đồng ý" trên 100 test responses) và tự động xáo trộn thứ tự (Shuffle).
   - **Checkbox**:
     - Hỗ trợ nhiều lựa chọn cùng lúc (Min selected, Max selected) hoặc cấu hình tỷ lệ %.

3. **Lưu trữ Dataset / Profile**:
   - Lưu cấu hình theo tên Profile vào LocalStorage.
   - Xuất (Export) & Nhập (Import) cấu hình dạng file **JSON**.

4. **Bản xem trước (Preview Data)**:
   - Hiển thị bảng mô phỏng dữ liệu test (Table Preview) cho N responses trước khi Start Test.

5. **Test Runner & Thống Kê**:
   - Đặt số lượng response test & thời gian delay giữa các lượt.
   - Thanh tiến trình trực tiếp (%), hiển thị số Completed / Success / Failed.
   - Khung Output Log thời gian thực với timestamp.
   - Tự động dừng/backoff khi gặp lỗi HTTP 429 hoặc rate-limit.
   - Thống kê chi tiết biểu đồ tỷ lệ chọn đáp án và danh sách dữ liệu sequential đã dùng.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Tool

### 1. Cài Đặt Package

Chạy lệnh sau tại thư mục dự án:

```bash
npm install
```

### 2. Khởi Chạy Web Tool (Development Mode)

```bash
npm run dev
```

Lệnh này sẽ tự động khởi chạy cả **Express API Backend (port 3001)** và **Vite Web UI (port 3000)**.

Sau khi khởi chạy thành công, mở trình duyệt và truy cập:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📖 Quy Trình Sử Dụng

1. **Mở Web Tool** tại `http://localhost:3000`.
2. **Dán Google Form URL** vào ô tìm kiếm và bấm **[ LOAD FORM ]**.
3. **Cấu hình từng câu hỏi**:
   - Chọn nguồn dữ liệu (Manual, File import `.txt/.csv/.json/.xlsx`, hoặc Generated).
   - Chọn chế độ chọn đáp án (*Fixed, Random, Weighted, Exact Count*).
4. **Bấm [ Preview Data ]** để kiểm tra bảng dữ liệu mô phỏng.
5. **Cấu hình Test Runner**: nhập số lượng test responses (ví dụ `100`) và thời gian delay (`2` giây).
6. **Bấm [ START TEST ]** và theo dõi tiến trình chạy trực tiếp.
7. Xem báo cáo thống kê tỷ lệ chọn sau khi hoàn thành.
