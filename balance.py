import random

students = [
  {'name': 'Nguyễn Quốc Huy', 'score': 23, 'special': True},
  {'name': 'Nguyễn Bảo Long', 'score': 25, 'special': True},
  {'name': 'Tạ Thanh Ngọc Giàu', 'score': 26, 'special': True},
  {'name': 'Đỗ Tuấn Hưng', 'score': 29, 'special': True},
  {'name': 'Nguyễn Ngọc Anh Thư', 'score': 29, 'special': True},
  {'name': 'Nguyễn Ngọc Trinh', 'score': 29, 'force_group': 4, 'role': 'Tổ trưởng'},
  {'name': 'Trần Phúc Vinh', 'score': 29, 'special': True},
  {'name': 'Nguyễn Thị Thanh Tuyền', 'dob': '12/01/2011', 'score': 31, 'special': True},
  {'name': 'Nguyễn Thị Kim Bơ', 'score': 33, 'special': True},
  {'name': 'Từ Diệu Yên Diễm', 'score': 33, 'role': 'Lớp phó'},
  {'name': 'Trần Hữu Đồng', 'score': 33, 'special': True},
  {'name': 'Võ Thị Yến Nhi', 'score': 34},
  {'name': 'Lê Tuấn Phát Tài', 'score': 34},
  {'name': 'Võ Bách Tùng', 'score': 34},
  {'name': 'Lê Thị Kim Trúc', 'score': 34},
  {'name': 'Dương Lục Yến Vy', 'score': 34, 'force_group': 1, 'role': 'Tổ trưởng'},
  {'name': 'Phan Thị Ngọc Ẩn', 'score': 35},
  {'name': 'Trương Nguyễn Trường Giang', 'score': 35},
  {'name': 'Võ Quốc Duy Khôi', 'score': 35},
  {'name': 'Lê Thị Mỹ Linh', 'score': 36},
  {'name': 'Ngô Quang Nhân', 'score': 36},
  {'name': 'Trần Lê Hồng Nhung', 'score': 36, 'role': 'Lớp trưởng'},
  {'name': 'Huỳnh Khánh Như', 'score': 36},
  {'name': 'Võ Thành Phát', 'score': 36},
  {'name': 'Trần Thị Ngọc Phúc', 'score': 36},
  {'name': 'Đỗ Khôi Vỹ', 'score': 36},
  {'name': 'Võ Ngọc Mỹ Duyên', 'score': 37},
  {'name': 'Ngô Thị Diễm Hằng', 'score': 37},
  {'name': 'Nguyễn Vinh Hoa', 'score': 37},
  {'name': 'Nguyễn Minh Hoàng', 'score': 37},
  {'name': 'Nguyễn Tấn Kỳ', 'score': 37},
  {'name': 'Lê Minh Khải', 'score': 37},
  {'name': 'Nguyễn Đỗ Kim Yến Linh', 'score': 37},
  {'name': 'Bùi Nguyễn Hoàng Long', 'score': 38},
  {'name': 'Trần Minh Luân', 'score': 38},
  {'name': 'Trương Thị Mỹ Ngân', 'score': 38, 'force_group': 6, 'role': 'Tổ trưởng'},
  {'name': 'Nguyễn Hoàng Gia Nguyên', 'score': 38},
  {'name': 'Nguyễn Xuân Phúc', 'score': 38},
  {'name': 'Nguyễn Thị Thanh Tuyền', 'dob': '14/06/2011', 'score': 38},
  {'name': 'Trần Bảo Phi Hoàng', 'score': 39},
  {'name': 'Nguyễn Hữu Đan Mạch', 'score': 39},
  {'name': 'Cao Ngọc An Nhiên', 'score': 39},
  {'name': 'Lê Văn Vũ', 'score': 39},
  {'name': 'Phạm Ngọc Tường Vy', 'score': 34.5, 'dob': '01/08/2010', 'special': True}
]

sizes = [8, 8, 7, 7, 7, 7]

best_groups = None
best_variance = 999999

random.seed(12345)
for _ in range(300000):
  forced = {1: [], 2: [], 3: [], 4: [], 5: [], 6: []}
  unforced = []
  for s in students:
    if s.get('force_group'):
      forced[s['force_group']].append(s)
    else:
      unforced.append(s)
  
  random.shuffle(unforced)
  groups = {i: list(forced[i]) for i in range(1, 7)}
  
  idx = 0
  for i in range(1, 7):
    needed = sizes[i-1] - len(groups[i])
    groups[i].extend(unforced[idx:idx+needed])
    idx += needed
  
  special_counts = [sum(1 for s in groups[i] if s.get('special')) for i in range(1, 7)]
  if any(sc < 1 or sc > 2 for sc in special_counts):
    continue
  
  averages = [sum(s['score'] for s in groups[i])/len(groups[i]) for i in range(1, 7)]
  var = max(averages) - min(averages)
  
  if var < best_variance:
    best_variance = var
    best_groups = groups
    if var < 0.08:
      break

print(f'Best max-min diff: {best_variance:.3f}')
for i in range(1, 7):
  avg = sum(s['score'] for s in best_groups[i])/len(best_groups[i])
  spec_cnt = sum(1 for s in best_groups[i] if s.get('special'))
  print(f'=== TỔ {i} (Sĩ số: {len(best_groups[i])}, Điểm TB: {avg:.2f}, HS hỗ trợ: {spec_cnt}) ===')
  for s in best_groups[i]:
    r = s.get('role', 'Thành viên')
    print(f"  {s['name']} - Điểm: {s['score']} ({r})")
