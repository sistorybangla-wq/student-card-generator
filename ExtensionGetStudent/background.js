// Background script - xử lý logic chính
let currentStudentInfo = {
  school: "Đại học Bách khoa TP.HCM",
  firstName: "Lan",
  lastName: "Phuong",
  email: "lan.phuong@hcmut.edu.vn",
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startVerification") {
    // Sử dụng studentInfo từ request nếu có
    if (request.studentInfo) {
      currentStudentInfo = request.studentInfo;
      console.log(
        "Đã cập nhật thông tin student từ website:",
        currentStudentInfo
      );
    }
    startStudentVerification();
    sendResponse({ success: true });
  } else if (request.action === "startDirectVerification") {
    // Xử lý verification trực tiếp từ popup extension
    console.log("Starting DIRECT verification with:", request.studentInfo);

    currentStudentInfo = request.studentInfo;

    // Save student info mà không có auto-filled flag
    chrome.storage.sync.set({
      studentInfo: request.studentInfo,
      autoFilled: false,
      lastUpdated: Date.now(),
    });

    startStudentVerification();
    sendResponse({ success: true });
  } else if (request.action === "updateStudentInfo") {
    currentStudentInfo = request.studentInfo;
    sendResponse({ success: true });
  } else if (request.action === "saveStudentInfo") {
    // Lưu thông tin student từ website vào storage
    currentStudentInfo = request.studentInfo;
    chrome.storage.sync.set({
      studentInfo: currentStudentInfo,
      autoFilled: true,
      lastUpdated: new Date().toISOString(),
    });
    console.log("Đã lưu thông tin student từ website:", currentStudentInfo);
    sendResponse({ success: true });
  }
});

// Bước 2: Mở trang Google One
function startStudentVerification() {
  chrome.tabs.create(
    {
      url: "https://one.google.com/u/1/ai-student",
    },
    tab => {
      console.log("Đã mở trang Google One, tabId:", tab.id);
      console.log("Sử dụng thông tin student:", currentStudentInfo);

      // Đợi trang load xong rồi click nút xác minh
      setTimeout(() => {
        clickVerifyButton(tab.id);
      }, 3000);
    }
  );
}

// Bước 3: Click nút "Xác minh điều kiện sử dụng"
function clickVerifyButton(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: () => {
        // Thử nhiều selector khác nhau để tìm nút
        const selectors = [
          '[aria-label*="Xác minh điều kiện sử dụng"]',
          '[aria-label*="Verify eligibility"]',
          'button:has-text("Xác minh điều kiện sử dụng")',
          'button[data-testid*="verify"]',
          'a[href*="verify"]',
        ];

        for (const selector of selectors) {
          const button = document.querySelector(selector);
          if (button) {
            console.log("Tìm thấy nút xác minh:", button);
            button.click();
            return;
          }
        }

        // Nếu không tìm thấy, thử tìm theo text content
        const buttons = document.querySelectorAll("button, a");
        for (const btn of buttons) {
          if (
            btn.textContent.includes("Xác minh") ||
            btn.textContent.includes("Verify") ||
            btn.textContent.includes("verify")
          ) {
            console.log("Tìm thấy nút theo text:", btn.textContent);
            btn.click();
            return;
          }
        }

        console.log("Không tìm thấy nút xác minh");
      },
    })
    .catch(err => {
      console.error("Lỗi khi click nút xác minh:", err);
    });
}

// Bước 4: Lắng nghe tab mới mở (SheerID)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.includes("sheerid.com") ||
      tab.url.includes("services.sheerid.com"))
  ) {
    console.log("Phát hiện trang SheerID:", tab.url);

    // Kiểm tra xem có phải là trang verification form không
    if (tab.url.includes("/verify/")) {
      // Đợi một chút để trang load hoàn toàn
      setTimeout(() => {
        fillSheerIDForm(tabId);
      }, 2000);
    }
  }
});

// Whitelist các domain được phép đóng tab tự động
const ALLOWED_CLOSE_DOMAINS = [
  "sheerid.com",
  "services.sheerid.com",
  "accounts.google.com",
];

// Lắng nghe tab mới được tạo (cho sign-in) - CHỈ đóng tab trong whitelist
chrome.tabs.onCreated.addListener(tab => {
  console.log("🆕 Tab mới được tạo:", tab.id);

  // Đợi tab load xong rồi check URL
  setTimeout(() => {
    chrome.tabs.get(tab.id, updatedTab => {
      if (!updatedTab || !updatedTab.url) {
        console.log("⚠️ Tab không có URL hoặc đã bị đóng:", tab.id);
        return;
      }

      console.log("🔍 Kiểm tra URL tab mới:", updatedTab.url);

      // Kiểm tra xem URL có trong whitelist không
      const isAllowedDomain = ALLOWED_CLOSE_DOMAINS.some(domain =>
        updatedTab.url.includes(domain)
      );

      if (
        isAllowedDomain &&
        (updatedTab.url.includes("login") ||
          updatedTab.url.includes("signin") ||
          updatedTab.url.includes("auth") ||
          updatedTab.url.includes("sso"))
      ) {
        console.log(
          "🎯 Tab sign-in trong whitelist phát hiện:",
          updatedTab.url
        );
        console.log("🚪 Sẽ đóng tab sign-in sau 3 giây...");

        // Đóng tab sau 3 giây với error handling
        setTimeout(() => {
          chrome.tabs.remove(tab.id, () => {
            if (chrome.runtime.lastError) {
              console.log(
                "⚠️ Không thể đóng tab (có thể đã đóng):",
                chrome.runtime.lastError.message
              );
            } else {
              console.log(
                "✅ Đã đóng tab sign-in verification:",
                updatedTab.url
              );
            }
          });
        }, 3000);
      } else {
        console.log(
          "✋ Tab không trong whitelist hoặc không phải sign-in, bỏ qua:",
          updatedTab.url
        );
      }
    });
  }, 2000);
});

// Bước 5: Xử lý sau khi submit form - tìm nút "Sign in to your school" hoặc "Upload Proof of Enrollment"
function handlePostSubmit(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: () => {
        console.log(
          '🔍 Tìm nút "Sign in to your school" hoặc "Upload Proof of Enrollment"...'
        );

        function findAndClickButton() {
          // Tìm nút "Upload Proof of Enrollment" trước
          const uploadSelectors = [
            'button:contains("Upload Proof of Enrollment")',
            'a:contains("Upload Proof of Enrollment")',
            '[aria-label*="Upload Proof of Enrollment"]',
            'button[title*="Upload Proof of Enrollment"]',
          ];

          let uploadBtn = null;
          // Vì :contains không có trong querySelector, dùng cách khác
          const buttons = document.querySelectorAll(
            'button, a, [role="button"]'
          );
          for (const btn of buttons) {
            if (
              btn.textContent &&
              btn.textContent.includes("Upload Proof of Enrollment")
            ) {
              uploadBtn = btn;
              break;
            }
          }

          if (uploadBtn && uploadBtn.offsetParent !== null) {
            console.log(
              '✅ Tìm thấy nút "Upload Proof of Enrollment", click luôn...'
            );
            uploadBtn.click();
            console.log('✅ Đã click vào "Upload Proof of Enrollment"');
            return true;
          }

          // Nếu không có "Upload Proof of Enrollment", tìm "Sign in to your school"
          let signinBtn = document.querySelector("#sid-submit-btn-sso");

          if (!signinBtn || signinBtn.offsetParent === null) {
            // Fallback: tìm theo text nếu không tìm thấy ID
            const allButtons = document.querySelectorAll(
              'button, a, [role="button"]'
            );
            for (const btn of allButtons) {
              if (
                btn.textContent &&
                btn.textContent.includes("Sign in to your school")
              ) {
                signinBtn = btn;
                break;
              }
            }
          }

          if (signinBtn && signinBtn.offsetParent !== null) {
            console.log(
              '✅ Tìm thấy nút "Sign in to your school" với ID:',
              signinBtn.id || "unknown"
            );

            // Lắng nghe tab mới mở
            let newTabId = null;
            const originalTabCount = window.chrome?.tabs?.query ? 0 : -1; // Placeholder, sẽ xử lý trong background

            signinBtn.click();
            console.log('✅ Đã click vào "Sign in to your school"');

            return "signin_clicked";
          }

          return false;
        }

        // Thử tìm ngay lập tức
        const result = findAndClickButton();
        if (result === true) {
          return; // Đã tìm thấy và click "Upload Proof of Enrollment"
        } else if (result === "signin_clicked") {
          return; // Đã click "Sign in to your school", sẽ xử lý ở background
        }

        // Nếu chưa tìm thấy, thử lại sau một vài giây
        let attempts = 0;
        const maxAttempts = 10;

        const retryInterval = setInterval(() => {
          attempts++;
          console.log(`🔄 Thử lần ${attempts}/${maxAttempts} tìm nút...`);

          const result = findAndClickButton();
          if (result === true || result === "signin_clicked") {
            clearInterval(retryInterval);
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(retryInterval);
            console.log(
              '❌ Timeout - không tìm thấy nút "Sign in to your school" hoặc "Upload Proof of Enrollment"'
            );
          }
        }, 1000);
      },
    })
    .catch(err => {
      console.error("Lỗi khi tìm nút post-submit:", err);
    });
}

// Điền form SheerID
function fillSheerIDForm(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId: tabId },
      func: studentInfo => {
        console.log("Bắt đầu điền form SheerID với thông tin:", studentInfo);

        // Thông tin từ popup
        // studentInfo đã được truyền vào hàm

        // Hàm helper để điền field
        function fillField(selector, value) {
          const field = document.querySelector(selector);
          if (field) {
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(`Đã điền ${selector}: ${value}`);
            return true;
          }
          return false;
        }

        // Hàm xử lý Date of Birth với cấu trúc SheerID đặc biệt
        async function fillDateOfBirth(dateValue) {
          if (!dateValue) return;

          // Parse date (format: YYYY-MM-DD)
          const dateParts = dateValue.split("-");
          if (dateParts.length !== 3) return;

          const year = dateParts[0];
          const monthWithZero = dateParts[1]; // "01", "02", etc.
          const month = parseInt(monthWithZero, 10).toString(); // "1", "2", etc. (remove leading zero)
          const day = dateParts[2];

          console.log(
            `Đang điền Date of Birth: ${month}/${day}/${year} (month without zero: ${month})`
          );

          // 1. Xử lý Month field (có dropdown giống School) - Dùng month không có số 0
          await fillMonthField(month);

          // 2. Xử lý Day field (autocomplete="bday-day")
          const daySelectors = [
            'input[name="sid-birthdate-day"]',
            'input[autocomplete="bday-day"]',
            'input[placeholder="Day"]',
            'input[aria-label="Day"]',
            'select[name*="day"]',
            'select[id*="day"]',
            'input[name*="day"]',
            'select[placeholder*="day"]',
            'select[placeholder*="ngày"]',
          ];

          for (const selector of daySelectors) {
            const dayField = document.querySelector(selector);
            if (dayField) {
              console.log(
                `✅ Tìm thấy day field với selector: ${selector}`,
                dayField
              );

              // Focus trước khi điền
              dayField.focus();

              // Clear existing value
              dayField.value = "";

              // Set new value
              dayField.value = day;

              // Trigger comprehensive events
              const events = [
                new Event("focus", { bubbles: true }),
                new Event("input", { bubbles: true, cancelable: true }),
                new Event("keydown", { bubbles: true }),
                new Event("keyup", { bubbles: true }),
                new Event("change", { bubbles: true }),
                new Event("blur", { bubbles: true }),
              ];

              events.forEach(event => dayField.dispatchEvent(event));

              // Verify value was set for Day field
              setTimeout(() => {
                if (dayField.value === day) {
                  console.log(
                    `✅ VERIFIED: Day = "${day}" hiển thị chính xác trong UI`
                  );
                } else {
                  console.log(
                    `⚠️ WARNING: Day value trong DOM = "${dayField.value}" khác với expected = "${day}"`
                  );

                  // Try to force set value again
                  dayField.value = day;
                  dayField.dispatchEvent(new Event("input", { bubbles: true }));
                  dayField.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                  console.log(`🔄 RETRY: Đã thử set lại Day value = "${day}"`);
                }
              }, 200);

              console.log(`✅ Đã chọn ngày: ${day} bằng selector: ${selector}`);
              break;
            }
          }

          // 3. Xử lý Year field (autocomplete="bday-year")
          const yearSelectors = [
            'input[autocomplete="bday-year"]',
            'select[name*="year"]',
            'select[id*="year"]',
            'input[name*="year"]',
            'select[placeholder*="year"]',
            'select[placeholder*="năm"]',
          ];

          for (const selector of yearSelectors) {
            const yearField = document.querySelector(selector);
            if (yearField) {
              console.log(
                `✅ Tìm thấy year field với selector: ${selector}`,
                yearField
              );

              // Focus trước khi điền
              yearField.focus();

              // Clear existing value
              yearField.value = "";

              // Set new value
              yearField.value = year;

              // Trigger comprehensive events
              const events = [
                new Event("focus", { bubbles: true }),
                new Event("input", { bubbles: true, cancelable: true }),
                new Event("keydown", { bubbles: true }),
                new Event("keyup", { bubbles: true }),
                new Event("change", { bubbles: true }),
                new Event("blur", { bubbles: true }),
              ];

              events.forEach(event => yearField.dispatchEvent(event));

              // Verify value was set for Year field
              setTimeout(() => {
                if (yearField.value === year) {
                  console.log(
                    `✅ VERIFIED: Year = "${year}" hiển thị chính xác trong UI`
                  );
                } else {
                  console.log(
                    `⚠️ WARNING: Year value trong DOM = "${yearField.value}" khác với expected = "${year}"`
                  );
                }
              }, 200);

              console.log(`✅ Đã chọn năm: ${year} bằng selector: ${selector}`);
              break;
            }
          }

          // Fallback: Chỉ dùng nếu không tìm thấy bất kỳ dropdown nào
          // (Tạm thời tắt để tránh ghi đè dropdown)
          /*
        const dateInputSelectors = [
          'input[type="date"]',
          'input[name*="birth"]',
          'input[name*="dob"]',
          'input[placeholder*="birth"]'
        ];
        
        for (const selector of dateInputSelectors) {
          const dateInput = document.querySelector(selector);
          if (dateInput) {
            dateInput.value = dateValue;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ Đã điền ngày sinh: ${dateValue} bằng selector: ${selector}`);
            break;
          }
        }
        */
        }

        // Hàm đặc biệt để xử lý Month field (có dropdown như School)
        async function fillMonthField(monthValue) {
          const monthSelectors = [
            'input[name*="month"]',
            'input[id*="month"]',
            'select[name*="month"]',
            'select[id*="month"]',
            'input[placeholder*="month"]',
            'input[placeholder*="tháng"]',
          ];

          let monthField = null;
          for (const selector of monthSelectors) {
            monthField = document.querySelector(selector);
            if (monthField) {
              console.log(`Tìm thấy month field với selector: ${selector}`);
              break;
            }
          }

          if (!monthField) {
            console.log("Không tìm thấy month field");
            return false;
          }

          // Nếu là select dropdown thông thường
          if (monthField.tagName === "SELECT") {
            monthField.value = monthValue;
            monthField.dispatchEvent(new Event("change", { bubbles: true }));
            console.log(`✅ Đã chọn tháng từ select: ${monthValue}`);
            return true;
          }

          // Nếu là input với dropdown (giống School)
          if (monthField.tagName === "INPUT") {
            // Click và focus
            monthField.click();
            monthField.focus();

            // Điền số tháng (không có leading zero)
            monthField.value = monthValue;

            console.log(
              `Đã điền month value: "${monthValue}" (không có leading zero)`
            );

            // Trigger events
            const events = ["focus", "input", "keydown", "keyup", "change"];
            events.forEach(eventType => {
              monthField.dispatchEvent(new Event(eventType, { bubbles: true }));
            });

            // Đợi và tìm dropdown item cho month
            return new Promise(resolve => {
              let attempts = 0;
              const maxAttempts = 15;

              const checkForMonthDropdown = () => {
                attempts++;

                // Tìm month dropdown item (sid-birthdate_month-item-0)
                const monthItemSelectors = [
                  ".sid-birthdate_month-item-0",
                  '[class*="birthdate_month-item-0"]',
                  '[class*="month-item"]:first-child',
                  '[id*="month-item-0"]',
                  '[role="option"]:first-child',
                ];

                let firstMonthItem = null;
                for (const selector of monthItemSelectors) {
                  firstMonthItem = document.querySelector(selector);
                  if (firstMonthItem && firstMonthItem.offsetParent !== null) {
                    console.log(
                      `Tìm thấy month item với selector: ${selector}`
                    );
                    break;
                  }
                }

                if (firstMonthItem && firstMonthItem.offsetParent !== null) {
                  // Hover và click
                  firstMonthItem.dispatchEvent(
                    new MouseEvent("mouseenter", { bubbles: true })
                  );

                  setTimeout(() => {
                    firstMonthItem.click();
                    console.log("✅ Đã click vào month item đầu tiên");
                    resolve(true);
                  }, 100);

                  return;
                }

                // Debug month dropdown items
                if (attempts === 5) {
                  console.log("Debug: Tìm tất cả month dropdown items:");
                  const allMonthItems = document.querySelectorAll(
                    '[class*="month"], [class*="birthdate"], [role="option"]'
                  );
                  allMonthItems.forEach((item, index) => {
                    if (item.offsetParent !== null) {
                      console.log(`Month item ${index}:`, {
                        text: item.textContent?.substring(0, 30),
                        classes: item.className,
                        id: item.id,
                      });
                    }
                  });
                }

                if (attempts < maxAttempts) {
                  setTimeout(checkForMonthDropdown, 200);
                } else {
                  console.log("Timeout - không tìm thấy month dropdown");
                  resolve(false);
                }
              };

              setTimeout(checkForMonthDropdown, 300);
            });
          }

          return false;
        }

        // Hàm đặc biệt để xử lý trường học với dropdown
        async function fillSchoolField(schoolName) {
          const schoolSelectors = [
            'input[id*="college"]',
            'input[name="school"]',
            'input[name="organization"]',
            'input[placeholder*="school"]',
            'input[placeholder*="trường"]',
            "#school",
            "#organization",
            '[role="combobox"]',
            'input[aria-autocomplete="list"]',
          ];

          let schoolField = null;
          for (const selector of schoolSelectors) {
            schoolField = document.querySelector(selector);
            if (schoolField) {
              console.log(
                `Tìm thấy trường học field với selector: ${selector}`
              );
              break;
            }
          }

          if (!schoolField) {
            console.log("Không tìm thấy field trường học");
            return false;
          }

          // Bước 1: Click vào field để focus và mở dropdown
          schoolField.click();
          schoolField.focus();
          console.log("Đã click vào field trường học");

          // Bước 2: Điền tên trường
          schoolField.value = schoolName;

          // Trigger các event để kích hoạt dropdown
          const events = ["focus", "input", "keydown", "keyup", "change"];
          events.forEach(eventType => {
            schoolField.dispatchEvent(new Event(eventType, { bubbles: true }));
          });

          // Thêm keyboard event để trigger autocomplete
          schoolField.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "ArrowDown",
              code: "ArrowDown",
              bubbles: true,
            })
          );

          console.log(`Đã điền tên trường: ${schoolName}`);

          // Bước 3: Đợi dropdown hiện ra và chọn item đầu tiên
          return new Promise(resolve => {
            let attempts = 0;
            const maxAttempts = 20; // Đợi tối đa 4 giây

            const checkForDropdown = () => {
              attempts++;

              // Tìm item đầu tiên trong dropdown
              const firstItemSelectors = [
                ".sid-college-name-item-0",
                '[id*="college-name-item-0"]',
                '[class*="college-name-item"]:first-child',
                '[class*="college-name-item"][data-index="0"]',
                '[role="option"]:first-child',
                ".dropdown-item:first-child",
                ".autocomplete-item:first-child",
                'li[data-index="0"]',
                'div[data-index="0"]',
                ".list-item:first-child",
                ".suggestion:first-child",
                ".option:first-child",
              ];

              let firstItem = null;
              for (const selector of firstItemSelectors) {
                // Tìm trong document chính
                firstItem = document.querySelector(selector);

                // Nếu không tìm thấy, thử tìm trong tất cả iframe
                if (!firstItem) {
                  const iframes = document.querySelectorAll("iframe");
                  for (const iframe of iframes) {
                    try {
                      const iframeDoc =
                        iframe.contentDocument || iframe.contentWindow.document;
                      firstItem = iframeDoc.querySelector(selector);
                      if (firstItem) break;
                    } catch (e) {
                      // Ignore cross-origin iframe errors
                    }
                  }
                }

                if (firstItem && firstItem.offsetParent !== null) {
                  // Kiểm tra element có visible không
                  console.log(
                    `Tìm thấy item đầu tiên với selector: ${selector}`
                  );
                  break;
                }
              }

              if (firstItem && firstItem.offsetParent !== null) {
                // Debug thông tin của item
                console.log("Item được tìm thấy:", {
                  text: firstItem.textContent,
                  classes: firstItem.className,
                  id: firstItem.id,
                  visible: firstItem.offsetParent !== null,
                });

                // Hover vào item để hiện ra
                firstItem.dispatchEvent(
                  new MouseEvent("mouseenter", { bubbles: true })
                );
                firstItem.dispatchEvent(
                  new MouseEvent("mouseover", { bubbles: true })
                );

                // Đợi một chút rồi click
                setTimeout(() => {
                  firstItem.click();
                  firstItem.dispatchEvent(
                    new MouseEvent("click", { bubbles: true })
                  );
                  console.log("Đã click vào item đầu tiên trong dropdown");
                  resolve(true);
                }, 200);

                return;
              }

              // Debug: In ra tất cả element có class chứa "college" hoặc "item"
              if (attempts === 5) {
                // Debug ở lần thử thứ 5
                console.log(
                  "Debug: Tìm tất cả element có thể là dropdown item:"
                );
                const allPossibleItems = document.querySelectorAll(
                  '[class*="college"], [class*="item"], [role="option"], .dropdown *, .autocomplete *'
                );
                allPossibleItems.forEach((item, index) => {
                  if (item.offsetParent !== null) {
                    // Chỉ log những element visible
                    console.log(`Item ${index}:`, {
                      text: item.textContent?.substring(0, 50),
                      classes: item.className,
                      id: item.id,
                      tagName: item.tagName,
                    });
                  }
                });
              }

              // Nếu chưa tìm thấy và chưa hết attempts thì tiếp tục
              if (attempts < maxAttempts) {
                setTimeout(checkForDropdown, 200);
              } else {
                console.log(
                  "Timeout - không tìm thấy dropdown sau",
                  maxAttempts * 200,
                  "ms"
                );
                resolve(false);
              }
            };

            // Bắt đầu check sau 300ms
            setTimeout(checkForDropdown, 300);
          });
        }

        // Thử các selector khác nhau cho các field khác
        const fieldSelectors = {
          firstName: [
            "#sid-first-name",
            'input[name="sid-first-name"]',
            'input[autocomplete="given-name"]',
            'input[name="firstName"]',
            'input[name="first_name"]',
            'input[name="first-name"]',
            'input[id*="first"]',
            'input[id*="fname"]',
            'input[id*="given"]',
            'input[placeholder*="first"]',
            'input[placeholder*="First"]',
            'input[placeholder*="given"]',
            'input[placeholder*="tên"]',
            'input[aria-label*="first"]',
            'input[aria-label*="First"]',
            'input[data-name*="first"]',
            "#firstName",
            "#first_name",
            "#fname",
            "#given-name",
          ],
          lastName: [
            "#sid-last-name",
            'input[autocomplete="family-name"]',
            'input[name="lastName"]',
            'input[name="last_name"]',
            'input[id*="last"]',
            'input[id*="lname"]',
            'input[placeholder*="last"]',
            'input[placeholder*="họ"]',
            "#lastName",
            "#last_name",
            "#lname",
          ],
          email: [
            'input[autocomplete="email"]',
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="email"]',
            "#email",
          ],
        };

        // Điền trường học trước (async)
        fillSchoolField(studentInfo.school).then(success => {
          if (success) {
            console.log("Đã điền và chọn trường học thành công");
          } else {
            console.log("Lỗi khi điền trường học, fallback về cách cũ");
            fillField('input[id*="college"]', studentInfo.school);
          }

          // Sau đó điền các field khác
          console.log("🔍 Bắt đầu điền các field name và email...");

          // Debug: In ra tất cả input fields trên trang
          const allInputs = document.querySelectorAll("input");
          console.log("🔍 DEBUG: Tất cả input fields trên trang:");
          allInputs.forEach((input, index) => {
            console.log(`Input ${index}:`, {
              id: input.id,
              name: input.name,
              type: input.type,
              autocomplete: input.autocomplete,
              placeholder: input.placeholder,
              className: input.className,
              ariaLabel: input.getAttribute("aria-label"),
              visible: input.offsetParent !== null,
            });
          });

          // Debug đặc biệt cho First Name
          console.log(
            "🔍 FIRST NAME DEBUG: Tìm tất cả field có thể là First Name:"
          );
          const potentialFirstNameFields = Array.from(allInputs).filter(
            input => {
              const searchText = (
                (input.id || "") +
                " " +
                (input.name || "") +
                " " +
                (input.placeholder || "") +
                " " +
                (input.className || "") +
                " " +
                (input.getAttribute("aria-label") || "") +
                " " +
                (input.autocomplete || "")
              ).toLowerCase();

              return (
                searchText.includes("first") ||
                searchText.includes("given") ||
                searchText.includes("fname") ||
                input.autocomplete === "given-name"
              );
            }
          );

          console.log(
            "🎯 Potential First Name fields found:",
            potentialFirstNameFields.length
          );
          potentialFirstNameFields.forEach((input, index) => {
            console.log(`First Name Candidate ${index}:`, {
              element: input,
              RECOMMENDED_SELECTOR: input.id
                ? `#${input.id}`
                : input.name
                ? `input[name="${input.name}"]`
                : input.autocomplete
                ? `input[autocomplete="${input.autocomplete}"]`
                : `input[placeholder="${input.placeholder}"]`,
              id: input.id,
              name: input.name,
              placeholder: input.placeholder,
              autocomplete: input.autocomplete,
              visible: input.offsetParent !== null,
            });
          });

          Object.keys(fieldSelectors).forEach(fieldName => {
            const selectors = fieldSelectors[fieldName];
            const value = studentInfo[fieldName];

            console.log(`🔍 Đang tìm field ${fieldName} với value: ${value}`);
            console.log(`🔍 Selectors để thử:`, selectors);

            let fieldFound = false;
            for (let i = 0; i < selectors.length; i++) {
              const selector = selectors[i];
              console.log(
                `🔍 Thử selector ${i + 1}/${selectors.length}: ${selector}`
              );

              const field = document.querySelector(selector);
              if (field) {
                console.log(
                  `✅ Tìm thấy field với selector: ${selector}`,
                  field
                );

                // Kiểm tra field có visible không
                if (field.offsetParent !== null) {
                  // Focus trước khi điền
                  field.focus();

                  // Clear existing value
                  field.value = "";

                  // Set new value
                  field.value = value;

                  // Trigger comprehensive events for modern frameworks
                  const events = [
                    new Event("focus", { bubbles: true }),
                    new Event("input", { bubbles: true, cancelable: true }),
                    new Event("keydown", { bubbles: true }),
                    new Event("keyup", { bubbles: true }),
                    new Event("change", { bubbles: true }),
                    new Event("blur", { bubbles: true }),
                  ];

                  events.forEach(event => field.dispatchEvent(event));

                  // For React/Vue: trigger input event with target value
                  const inputEvent = new Event("input", { bubbles: true });
                  Object.defineProperty(inputEvent, "target", {
                    writable: false,
                    value: field,
                  });
                  field.dispatchEvent(inputEvent);

                  // Verify value was set
                  setTimeout(() => {
                    if (field.value === value) {
                      console.log(
                        `✅ VERIFIED: ${fieldName} = "${value}" hiển thị chính xác trong UI`
                      );
                    } else {
                      console.log(
                        `⚠️ WARNING: ${fieldName} value trong DOM = "${field.value}" khác với expected = "${value}"`
                      );
                    }
                  }, 200);

                  console.log(
                    `✅ Đã điền ${fieldName} = "${value}" bằng selector: ${selector}`
                  );
                  fieldFound = true;
                  break;
                } else {
                  console.log(
                    `⚠️ Field tìm thấy nhưng không visible: ${selector}`
                  );
                }
              } else {
                console.log(
                  `❌ Không tìm thấy field với selector: ${selector}`
                );
              }
            }

            if (!fieldFound) {
              console.log(
                `❌ KHÔNG TÌM THẤY field ${fieldName} với tất cả selectors:`,
                selectors
              );

              // FALLBACK: Thử tìm bằng position/order cho First Name
              if (fieldName === "firstName") {
                console.log("🔄 FALLBACK: Thử tìm First Name bằng vị trí...");

                // Tìm tất cả input text fields visible
                const textInputs = Array.from(
                  document.querySelectorAll(
                    'input[type="text"], input:not([type])'
                  )
                ).filter(inp => inp.offsetParent !== null);

                // Thử các heuristics khác nhau
                let fallbackField = null;

                // 1. Tìm input đầu tiên sau School field
                const schoolField = document.querySelector(
                  'input[id*="college"], input[name*="school"], [role="combobox"]'
                );
                if (schoolField) {
                  const schoolIndex = textInputs.indexOf(schoolField);
                  if (schoolIndex >= 0 && schoolIndex < textInputs.length - 1) {
                    fallbackField = textInputs[schoolIndex + 1];
                    console.log(
                      "🎯 Found First Name sau School field:",
                      fallbackField
                    );
                  }
                }

                // 2. Nếu không có, thử input thứ 2 (sau school)
                if (!fallbackField && textInputs.length >= 2) {
                  fallbackField = textInputs[1];
                  console.log(
                    "🎯 Trying second text input as First Name:",
                    fallbackField
                  );
                }

                // 3. Test với input được tìm thấy
                if (fallbackField && fallbackField.offsetParent !== null) {
                  console.log("🧪 Testing fallback First Name field...");
                  fallbackField.value = value;
                  fallbackField.dispatchEvent(
                    new Event("input", { bubbles: true })
                  );
                  fallbackField.dispatchEvent(
                    new Event("change", { bubbles: true })
                  );
                  fallbackField.dispatchEvent(
                    new Event("blur", { bubbles: true })
                  );

                  console.log(
                    `✅ FALLBACK SUCCESS: Đã điền ${fieldName} = "${value}" vào fallback field`
                  );
                  fieldFound = true;
                }
              }
            }
          });

          // Xử lý Date of Birth riêng biệt (async)
          if (studentInfo.dateOfBirth) {
            setTimeout(() => {
              fillDateOfBirth(studentInfo.dateOfBirth);
            }, 500); // Delay để đảm bảo các field khác đã điền xong
          }
        });

        // Thử tìm và tự động click nút submit sau khi điền xong
        setTimeout(() => {
          console.log("🔍 Tìm nút Verify student status để tự động click...");

          const submitSelectors = [
            "#verify-status-text",
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Verify")',
            'button:has-text("Continue")',
          ];

          let submitBtn = null;
          for (const selector of submitSelectors) {
            submitBtn = document.querySelector(selector);
            if (submitBtn) {
              console.log(
                `✅ Tìm thấy nút submit với selector: ${selector}`,
                submitBtn
              );
              break;
            }
          }

          if (submitBtn) {
            console.log(
              "Tìm thấy nút submit:",
              submitBtn.textContent || submitBtn.id
            );

            // Highlight nút trước khi click (để user biết)
            submitBtn.style.border = "3px solid red";
            submitBtn.style.backgroundColor = "#ffeb3b";

            // Đợi 2-3 giây rồi tự động click
            setTimeout(() => {
              console.log("🚀 Tự động click nút Verify student status...");
              submitBtn.click();
              console.log("✅ Đã click vào nút Verify student status");

              // Sau khi click, đợi trang load rồi tìm nút tiếp theo
              setTimeout(() => {
                handlePostSubmitInSameTab();
              }, 3000);
            }, 2500); // 2.5 giây
          } else {
            console.log("❌ Không tìm thấy nút submit để tự động click");
          }
        }, 1000);

        // Function xử lý sau khi submit trong cùng tab
        function handlePostSubmitInSameTab() {
          console.log(
            '🔍 Tìm nút "Sign in to your school" hoặc "Upload Proof of Enrollment"...'
          );

          function findAndClickButton() {
            // Tìm nút "Upload Proof of Enrollment" trước
            const allButtons = document.querySelectorAll(
              'button, a, [role="button"]'
            );

            let uploadBtn = null;
            let signinBtn = null;

            // Tìm "Upload Proof of Enrollment" theo text
            for (const btn of allButtons) {
              if (
                btn.textContent &&
                btn.textContent.includes("Upload Proof of Enrollment")
              ) {
                uploadBtn = btn;
              }
            }

            // Tìm "Sign in to your school" theo ID và text
            signinBtn = document.querySelector("#sid-submit-btn-sso");
            if (!signinBtn || signinBtn.offsetParent === null) {
              // Fallback: tìm theo text nếu không tìm thấy ID
              for (const btn of allButtons) {
                if (
                  btn.textContent &&
                  btn.textContent.includes("Sign in to your school")
                ) {
                  signinBtn = btn;
                  break;
                }
              }
            }

            if (uploadBtn && uploadBtn.offsetParent !== null) {
              console.log(
                '✅ Tìm thấy nút "Upload Proof of Enrollment", click luôn...'
              );
              uploadBtn.click();
              console.log('✅ Đã click vào "Upload Proof of Enrollment"');
              return true;
            }

            if (signinBtn && signinBtn.offsetParent !== null) {
              console.log(
                '✅ Tìm thấy nút "Sign in to your school" với ID:',
                signinBtn.id || "unknown"
              );

              // Store current tab info trước khi click
              const currentURL = window.location.href;

              signinBtn.click();
              console.log('✅ Đã click vào "Sign in to your school"');

              // Đợi một chút rồi check xem có tab mới không, nếu có thì đóng và quay lại
              setTimeout(() => {
                // Nếu URL vẫn như cũ, có nghĩa là mở tab mới
                if (window.location.href === currentURL) {
                  console.log(
                    "🔄 Đã mở tab mới cho sign in, đợi nút chuyển thành Upload..."
                  );
                  // Retry tìm nút "Upload Proof of Enrollment" sau một vài giây
                  setTimeout(() => {
                    retryFindUploadButton();
                  }, 3000);
                }
              }, 1000);

              return "signin_clicked";
            }

            return false;
          }

          function retryFindUploadButton() {
            let attempts = 0;
            const maxAttempts = 10;

            const retryInterval = setInterval(() => {
              attempts++;
              console.log(
                `🔄 Thử lần ${attempts}/${maxAttempts} tìm nút "Upload Proof of Enrollment"...`
              );

              const allButtons = document.querySelectorAll(
                'button, a, [role="button"]'
              );
              for (const btn of allButtons) {
                if (
                  btn.textContent &&
                  btn.textContent.includes("Upload Proof of Enrollment") &&
                  btn.offsetParent !== null
                ) {
                  console.log(
                    '✅ Tìm thấy nút "Upload Proof of Enrollment" sau khi sign in!'
                  );
                  btn.click();
                  console.log('✅ Đã click vào "Upload Proof of Enrollment"');
                  clearInterval(retryInterval);
                  return;
                }
              }

              if (attempts >= maxAttempts) {
                clearInterval(retryInterval);
                console.log(
                  '❌ Timeout - không tìm thấy nút "Upload Proof of Enrollment" sau sign in'
                );
              }
            }, 1000);
          }

          // Thử tìm ngay lập tức
          const result = findAndClickButton();
          if (result === true) {
            return; // Đã tìm thấy và click "Upload Proof of Enrollment"
          } else if (result === "signin_clicked") {
            return; // Đã click "Sign in to your school", đang đợi
          }

          // Nếu chưa tìm thấy, thử lại sau một vài giây
          let attempts = 0;
          const maxAttempts = 10;

          const retryInterval = setInterval(() => {
            attempts++;
            console.log(`🔄 Thử lần ${attempts}/${maxAttempts} tìm nút...`);

            const result = findAndClickButton();
            if (result === true || result === "signin_clicked") {
              clearInterval(retryInterval);
              return;
            }

            if (attempts >= maxAttempts) {
              clearInterval(retryInterval);
              console.log(
                '❌ Timeout - không tìm thấy nút "Sign in to your school" hoặc "Upload Proof of Enrollment"'
              );
            }
          }, 1000);
        }
      },
      args: [currentStudentInfo], // Truyền studentInfo vào function
    })
    .catch(err => {
      console.error("Lỗi khi điền form SheerID:", err);
    });
}

// Xử lý lỗi chung
chrome.runtime.onInstalled.addListener(() => {
  console.log("Student Card Auto Verifier đã được cài đặt");
});
