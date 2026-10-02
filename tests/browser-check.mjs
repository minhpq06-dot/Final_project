import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Run: node tests/browser-check.mjs <absolute Playwright package path>
const require = createRequire(import.meta.url);
const { chromium } = require(process.argv[2] || "playwright");
const base = process.env.BASE_URL || "http://localhost:3001";
const output = path.resolve("test-results");
mkdirSync(output, { recursive: true });
const key = "casematch-state-v1";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const snapshot = () =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const cleanLabels = async () =>
  assert.doesNotMatch(
    await page.locator("body").innerText(),
    /demo|dữ liệu hư cấu/i,
  );
async function logIn(email) {
  await page.goto(`${base}/login`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  const start = Date.now();
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: "Đang đăng nhập..." }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Đang đăng nhập..." }).isDisabled(),
    true,
  );
  await page.waitForURL(`${base}/`);
  assert.ok(
    Date.now() - start >= 1000,
    "Login loading lasts at least one second",
  );
  assert.equal((await snapshot()).session.email, email);
}
async function logOut() {
  await page
    .getByRole("button", { name: "Đăng xuất", exact: true })
    .first()
    .click();
  await page.waitForURL(`${base}/login`);
  assert.equal((await snapshot()).session, null);
}
try {
  await page.goto(base);
  await page.waitForURL(`${base}/login`);
  await page.getByLabel("Email", { exact: true }).waitFor();
  await cleanLabels();
  assert.equal((await snapshot()).session, null);
  await page.screenshot({
    path: path.join(output, "login.png"),
    fullPage: true,
  });
  await logIn("linh@example.com");
  await page.goto(`${base}/profile`);
  await page.getByLabel("Họ và tên", { exact: true }).fill("Linh Persistence");
  await page
    .getByLabel("Kỹ năng", { exact: true })
    .fill("Research, Strategy, Excel");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await page.waitForFunction(
    (k) =>
      JSON.parse(localStorage.getItem(k)).data.profiles.some(
        (p) => p.full_name === "Linh Persistence",
      ),
    key,
  );
  await page.reload();
  assert.equal(
    await page.getByLabel("Họ và tên", { exact: true }).inputValue(),
    "Linh Persistence",
  );
  assert.equal(
    await page.getByLabel("Kỹ năng", { exact: true }).inputValue(),
    "Research, Strategy, Excel",
  );
  await cleanLabels();
  await page.goto(base);
  await page.getByRole("heading", { name: "Chào Persistence." }).waitFor();
  await page.screenshot({
    path: path.join(output, "dashboard.png"),
    fullPage: true,
  });
  await page.goto(`${base}/teams/new`);
  await page.getByLabel("Tên đội", { exact: true }).fill("QA Persistence Team");
  await page
    .getByLabel("Mục tiêu và cách đội làm việc")
    .fill(
      "A persistent research team with clear responsibilities and consistent weekly planning.",
    );
  await page.getByRole("button", { name: "Tạo đội", exact: true }).click();
  await page.waitForURL(`${base}/teams`);
  await page.getByRole("heading", { name: "QA Persistence Team" }).waitFor();
  const created = (await snapshot()).data.teams.find(
    (t) => t.name === "QA Persistence Team",
  );
  assert.ok(created);
  await page.reload();
  await page.getByRole("heading", { name: "QA Persistence Team" }).waitFor();
  await cleanLabels();
  await page.screenshot({
    path: path.join(output, "teams.png"),
    fullPage: true,
  });
  await logOut();
  await logIn("candidate@example.com");
  const applicant = (await snapshot()).session.userId;
  await page.goto(`${base}/teams/${created.id}`);
  await page
    .getByLabel("Lời giới thiệu")
    .fill(
      "I bring careful user research, presentation skills and consistent commitment to this team.",
    );
  await page.getByRole("button", { name: "Ứng tuyển vào đội" }).click();
  await page.getByText("Đã gửi đơn ứng tuyển", { exact: true }).waitFor();
  const application = (await snapshot()).data.applications.find(
    (a) => a.team_id === created.id && a.applicant_id === applicant,
  );
  assert.ok(application);
  await page.reload();
  await page.getByText("Đã gửi đơn ứng tuyển", { exact: true }).waitFor();
  assert.equal(
    (await snapshot()).data.applications.filter((a) => a.id === application.id)
      .length,
    1,
  );
  await page.goto(`${base}/applications`);
  await page.getByText("Chờ duyệt", { exact: true }).waitFor();
  await logOut();
  await logIn("linh@example.com");
  await page.goto(`${base}/applications`);
  const card = page
    .locator("div.rounded-2xl")
    .filter({ hasText: "Ứng tuyển Strategy vào QA Persistence Team" });
  await card.getByRole("button", { name: "Nhận", exact: true }).click();
  await card.getByText("Đã nhận", { exact: true }).waitFor();
  await page.reload();
  const accepted = await snapshot();
  assert.equal(
    accepted.data.applications.find((a) => a.id === application.id).status,
    "accepted",
  );
  assert.ok(
    accepted.data.team_members.some(
      (m) => m.team_id === created.id && m.user_id === applicant,
    ),
  );

  // A newly opened page restores session and synchronizes future writes.
  const second = await context.newPage();
  await second.goto(`${base}/profile`);
  assert.equal(
    await second.getByLabel("Họ và tên", { exact: true }).inputValue(),
    "Linh Persistence",
  );
  await second.getByLabel("Họ và tên", { exact: true }).fill("Linh Synced");
  await second.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await page.getByText("Linh Synced", { exact: true }).first().waitFor();
  await second.close();

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/teams",
    `/teams/${created.id}`,
    "/profile",
    "/applications",
    "/saved",
  ]) {
    await page.goto(`${base}${route}`);
    await page.locator("main").waitFor();
    await page.waitForTimeout(500);
    await cleanLabels();
    const dimensions = await page.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.content <= dimensions.width + 1,
      `No horizontal overflow at ${route}: ${JSON.stringify(dimensions)}`,
    );
  }
  await page.goto(`${base}/teams`);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(output, "teams-mobile.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);

  // A failed write must not report success or replace the saved profile.
  await page.goto(`${base}/profile`);
  await page.getByLabel("Họ và tên", { exact: true }).fill("Unsaved Name");
  const before = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await page
    .getByText(
      "Không lưu được dữ liệu. Kiểm tra quyền lưu trữ và dung lượng trình duyệt.",
    )
    .waitFor();
  assert.equal(
    await page.evaluate((k) => localStorage.getItem(k), key),
    before,
  );
  await page.reload();
  assert.equal(
    await page.getByLabel("Họ và tên", { exact: true }).inputValue(),
    "Linh Synced",
  );

  await page.evaluate((k) => localStorage.setItem(k, "{invalid-save"), key);
  await page.reload();
  await page.getByRole("heading", { name: "Không thể mở dữ liệu" }).waitFor();
  assert.equal(
    await page.evaluate((k) => localStorage.getItem(k), key),
    "{invalid-save",
  );
  console.log(
    "PASS: login delay, profile, team creation, application, acceptance, reload, reopened page, tab sync, mobile, write failure, corrupt-save protection.",
  );
} finally {
  await browser.close();
}
