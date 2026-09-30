import type { AppData, Competition, Profile } from "./types.ts";
export const demoId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const people: Profile[] = [
  { id: demoId(1), full_name: "Nguyễn Khánh Linh", university: "Đại học Ngoại thương", major: "Kinh tế đối ngoại", bio: "Thích tìm insight trong dữ liệu và biến ý tưởng thành câu chuyện có sức thuyết phục.", skills: ["Research", "Strategy", "PowerPoint", "Marketing"], desired_roles: ["Strategy", "Research"], commitment: "high", experience: "Đã tham gia 2 cuộc thi giải tình huống cấp trường.", portfolio_url: "" },
  { id: demoId(2), full_name: "Trần Minh Anh", university: "Đại học Kinh tế Quốc dân", major: "Marketing", bio: "Tìm đồng đội cùng thử những ý tưởng khác biệt. Tôn trọng deadline và sự thẳng thắn.", skills: ["Marketing", "Design", "Figma"], desired_roles: ["Marketing"], commitment: "high", experience: "Thành viên CLB Marketing.", portfolio_url: "" },
  { id: demoId(3), full_name: "Lê Thanh Hà", university: "Đại học Bách khoa Hà Nội", major: "Khoa học dữ liệu", bio: "Yêu dữ liệu, mô hình tài chính và những vấn đề thực tế.", skills: ["Data", "Excel", "Finance", "Research"], desired_roles: ["Data", "Finance"], commitment: "medium", experience: "Một dự án phân tích dữ liệu bán lẻ.", portfolio_url: "" },
  { id: demoId(4), full_name: "Phạm Quang Huy", university: "Đại học Quốc gia Hà Nội", major: "Quản trị kinh doanh", bio: "Học bằng cách làm; xây đội dựa trên kỹ năng bổ trợ.", skills: ["Strategy", "Finance", "Presentation"], desired_roles: ["Strategy"], commitment: "high", experience: "Hai mùa thi business case.", portfolio_url: "" },
];
export const demoCompetitions: Competition[] = [
  { id: demoId(101), title: "Brandstorm: Beyond Beauty", organizer: "CaseMatch Studio", category: "Marketing", description: "Đề bài giả định: thiết kế một trải nghiệm làm đẹp bền vững cho Gen Z. Kết hợp nghiên cứu người dùng, chiến lược thương hiệu và mô hình kinh doanh khả thi. Bài nộp gồm 10 slide và video thuyết trình 3 phút.", deadline: "2026-11-18T16:59:00Z", min_team_size: 3, max_team_size: 4, location: "Online · Toàn quốc", information_url: "", accent: "peach" },
  { id: demoId(102), title: "The Next Business Challenge", organizer: "CaseMatch Academy", category: "Business", description: "Đề bài giả định: giúp một doanh nghiệp bán lẻ tăng trưởng có trách nhiệm. Phân tích thị trường, đề xuất hướng đi mới và bảo vệ luận điểm bằng dữ liệu.", deadline: "2026-11-28T16:59:00Z", min_team_size: 3, max_team_size: 5, location: "Hybrid · Hà Nội", information_url: "", accent: "violet" },
  { id: demoId(103), title: "Green Capital Case", organizer: "CaseMatch Finance Lab", category: "Finance", description: "Đề bài giả định: xây danh mục đầu tư cho các mô hình kinh tế tuần hoàn. Đánh giá tài chính, rủi ro và tác động môi trường. Đây là nội dung học tập, không phải tư vấn đầu tư.", deadline: "2026-12-05T16:59:00Z", min_team_size: 2, max_team_size: 4, location: "Online · Toàn quốc", information_url: "", accent: "sage" },
  { id: demoId(104), title: "Data for a Better City", organizer: "CaseMatch Data Club", category: "Data", description: "Đề bài giả định: dùng dữ liệu mở để cải thiện trải nghiệm giao thông đô thị. Đề xuất giải pháp, dashboard và kế hoạch triển khai có thể kiểm chứng.", deadline: "2026-12-12T16:59:00Z", min_team_size: 2, max_team_size: 4, location: "Online · Toàn quốc", information_url: "", accent: "blue" },
];
export function initialDemo(): AppData {
  return {
    profiles: structuredClone(people), competitions: structuredClone(demoCompetitions),
    teams: [
      { id: demoId(201), competition_id: demoId(101), captain_id: demoId(2), name: "Northstar", description: "Tìm những người nghĩ khác, thích đào sâu insight và không ngại thử. Cùng tạo một bài thi đáng tự hào, không chỉ để lấy giải.", commitment: "high", status: "recruiting", created_at: "2026-09-29T08:00:00Z" },
      { id: demoId(202), competition_id: demoId(102), captain_id: demoId(1), name: "The Outliers", description: "Một đội nhỏ, những câu hỏi lớn. Chúng mình cần đồng đội mạnh về phân tích tài chính để biến ý tưởng tăng trưởng thành kế hoạch thực tế.", commitment: "high", status: "recruiting", created_at: "2026-09-28T08:00:00Z" },
      { id: demoId(203), competition_id: demoId(103), captain_id: demoId(3), name: "Project Bloom", description: "Học cùng nhau, làm thật nghiêm túc. Khám phá cách tài chính có thể giúp những ý tưởng bền vững đi xa hơn.", commitment: "medium", status: "open", created_at: "2026-09-27T08:00:00Z" },
      { id: demoId(204), competition_id: demoId(104), captain_id: demoId(4), name: "Ctrl + Impact", description: "Biến dữ liệu thành tác động tích cực. Tìm người yêu nghiên cứu và trực quan hóa dữ liệu, cùng xây một câu chuyện rõ ràng.", commitment: "high", status: "recruiting", created_at: "2026-09-30T08:00:00Z" },
    ],
    team_roles: [
      { id: demoId(301), team_id: demoId(201), name: "Strategy", skills: ["Research", "Strategy", "PowerPoint"], slots: 2 },
      { id: demoId(302), team_id: demoId(201), name: "Design", skills: ["Figma", "Design"], slots: 1 },
      { id: demoId(303), team_id: demoId(202), name: "Finance", skills: ["Finance", "Excel"], slots: 2 },
      { id: demoId(304), team_id: demoId(202), name: "Research", skills: ["Research", "Marketing"], slots: 2 },
      { id: demoId(305), team_id: demoId(203), name: "Research", skills: ["Research", "Strategy"], slots: 2 },
      { id: demoId(306), team_id: demoId(203), name: "Design", skills: ["Figma", "PowerPoint"], slots: 1 },
      { id: demoId(307), team_id: demoId(204), name: "Data", skills: ["Data", "Excel", "Research"], slots: 2 },
      { id: demoId(308), team_id: demoId(204), name: "Design", skills: ["Figma", "Design"], slots: 1 },
    ],
    applications: [{ id: demoId(401), team_id: demoId(202), role_id: demoId(303), applicant_id: demoId(3), message: "Mình có kinh nghiệm phân tích dữ liệu bán lẻ và xây mô hình tài chính bằng Excel. Muốn đóng góp vào phần đánh giá tính khả thi của đội.", status: "pending", created_at: "2026-09-30T10:00:00Z" }],
    team_members: [201, 202, 203, 204].map((id, i) => ({ id: demoId(501 + i), team_id: demoId(id), competition_id: demoId(101 + i), user_id: people[[1, 0, 2, 3][i]].id, role_id: null, role_name: "Captain", joined_at: "2026-09-28T08:00:00Z" })),
    saved_items: [{ id: demoId(601), user_id: demoId(1), team_id: demoId(201), competition_id: null }],
  };
}
