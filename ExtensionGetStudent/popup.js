// Popup script
document.addEventListener("DOMContentLoaded", function () {
  const directVerifyBtn = document.getElementById("directVerifyBtn");
  const extractBtn = document.getElementById("extractBtn");
  const cardGeneratorBtn = document.getElementById("cardGeneratorBtn");
  const statusDiv = document.getElementById("status");

  // Load saved config và kiểm tra auto-filled data
  chrome.storage.sync.get(
    ["studentInfo", "autoFilled", "lastUpdated"],
    result => {
      if (result.studentInfo) {
        // Điền thông tin vào form
        document.getElementById("school").value =
          result.studentInfo.school || "";
        document.getElementById("firstName").value =
          result.studentInfo.firstName || "";
        document.getElementById("lastName").value =
          result.studentInfo.lastName || "";
        document.getElementById("dateOfBirth").value =
          result.studentInfo.dateOfBirth || "";
        document.getElementById("email").value = result.studentInfo.email || "";

        // Hiển thị thông báo nếu data được auto-fill từ website
        if (result.autoFilled && result.lastUpdated) {
          const lastUpdated = new Date(result.lastUpdated);
          const timeAgo = getTimeAgo(lastUpdated);

          showStatus("info", `📋 Extracted from Student Card (${timeAgo})`);

          // Highlight các field được auto-fill
          const fields = [
            "school",
            "firstName",
            "lastName",
            "dateOfBirth",
            "email",
          ];
          fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value) {
              field.style.backgroundColor = "#e8f5e8";
              field.style.border = "2px solid #4CAF50";
            }
          });

          // Focus vào nút verify để user biết bước tiếp theo
          directVerifyBtn.style.animation = "pulse 2s infinite";
          setTimeout(() => {
            directVerifyBtn.style.animation = "";
          }, 6000);
        } else {
          // Data được nhập manual hoặc từ direct verify
          showStatus("success", "✅ Ready to verify");
        }
      }
    }
  );

  // Event listener cho nút Direct Verify
  directVerifyBtn.addEventListener("click", function () {
    // Lấy thông tin từ form
    const studentInfo = {
      school: document.getElementById("school").value,
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      dateOfBirth: document.getElementById("dateOfBirth").value,
      email: document.getElementById("email").value,
    };

    // Validate thông tin
    if (
      !studentInfo.school ||
      !studentInfo.firstName ||
      !studentInfo.lastName ||
      !studentInfo.email
    ) {
      showStatus("error", "❌ Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Disable button và show status
    directVerifyBtn.disabled = true;
    directVerifyBtn.textContent = "⏳ Đang verify...";

    showStatus("info", "🔐 Bắt đầu verify Google One Student...");

    // Save thông tin và bắt đầu verify trực tiếp
    chrome.storage.sync.set({
      studentInfo,
      autoFilled: false,
    });

    // Gửi message trực tiếp để verify Google One
    chrome.runtime.sendMessage(
      {
        action: "startDirectVerification",
        studentInfo: studentInfo,
      },
      response => {
        if (response && response.success) {
          showStatus(
            "success",
            "✅ Đang mở Google One... Vui lòng hoàn tất verification!"
          );

          // Tự động đóng CHỈ popup extension sau 3 giây
          setTimeout(() => {
            // Kiểm tra xem đây có phải là popup extension không
            if (chrome.extension && chrome.extension.getViews) {
              const views = chrome.extension.getViews({ type: "popup" });
              if (views.length > 0 && views[0] === window) {
                window.close(); // Chỉ đóng popup extension
              }
            } else {
              // Fallback: chỉ đóng nếu window có kích thước nhỏ (popup)
              if (window.outerWidth < 500 && window.outerHeight < 600) {
                window.close();
              }
            }
          }, 3000);
        } else {
          showStatus(
            "error",
            "❌ Lỗi: " + (response?.error || "Không thể bắt đầu verification")
          );
          directVerifyBtn.disabled = false;
          directVerifyBtn.textContent = "🔐 Verify Google One";
        }
      }
    );
  });

  // Helper function để hiển thị status
  function showStatus(type, message) {
    // Cho phép truyền HTML nếu message chứa thẻ <a>
    if (/<a\s/i.test(message)) {
      statusDiv.innerHTML = message;
    } else {
      statusDiv.textContent = message;
    }
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";
  }

  // Helper function để tính thời gian
  function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  }
});

// Lắng nghe message từ background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    const statusDiv = document.getElementById("status");
    if (statusDiv) {
      statusDiv.className = `status ${request.type}`;
      statusDiv.textContent = request.message;
    }
  }
});

// Event listener cho nút Extract từ website
document.addEventListener("DOMContentLoaded", function () {
  const extractBtn = document.getElementById("extractBtn");
  const loadTestDataBtn = document.getElementById("loadTestDataBtn");

  // Helper function để hiển thị status
  function showStatus(type, message) {
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = "block";
  }

  // Event listener cho Load Test Data button
  if (loadTestDataBtn) {
    loadTestDataBtn.addEventListener("click", function () {
      // Test data mô phỏng SheerID
      const testData = {
        school: "Indian Institute of Technology Madras (Chennai, Tamil Nadu)",
        firstName: "Lan",
        lastName: "Phuong",
        email: "lan.phuong2345@gmail.com",
        dateOfBirth: "1995-05-15",
        extractedAt: new Date().toISOString(),
        source: "test-data",
      };

      // Điền vào form
      document.getElementById("school").value = testData.school;
      document.getElementById("firstName").value = testData.firstName;
      document.getElementById("lastName").value = testData.lastName;
      document.getElementById("dateOfBirth").value = testData.dateOfBirth;
      document.getElementById("email").value = testData.email;

      // Highlight các field
      const fields = [
        "school",
        "firstName",
        "lastName",
        "dateOfBirth",
        "email",
      ];
      fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
          field.style.backgroundColor = "#fff3e0";
          field.style.border = "2px solid #ff9800";
        }
      });

      // Lưu vào storage
      chrome.storage.sync.set({
        studentInfo: testData,
        autoFilled: false,
        lastUpdated: new Date().toISOString(),
      });

      showStatus("success", "🧪 Test data loaded successfully!");

      // Focus vào verify button
      const directVerifyBtn = document.getElementById("directVerifyBtn");
      if (directVerifyBtn) {
        directVerifyBtn.style.animation = "pulse 2s infinite";
        setTimeout(() => {
          directVerifyBtn.style.animation = "";
        }, 4000);
      }
    });
  }

  if (extractBtn) {
    extractBtn.addEventListener("click", async function () {
      // Disable button và show loading
      extractBtn.disabled = true;
      extractBtn.textContent = "⏳ Extracting...";

      showStatus("info", "📋 Reading student card from website...");

      // Gửi message đến content script để extract thông tin
      chrome.tabs.query(
        { active: true, currentWindow: true },
        async function (tabs) {
          const currentTab = tabs[0];

          // Kiểm tra xem tab hiện tại có phải là trang web phù hợp không
          // Thay vì kiểm tra URL cố định, ta sẽ gửi message để kiểm tra
          // xem trang có student card hay form thông tin student không
          console.log("🔍 DEBUG: Checking if current page has student info...");
          console.log("🔍 DEBUG: Current URL:", currentTab.url);
          console.log("🔍 DEBUG: Attempting to inject content script first...");

          // Inject content script manually để đảm bảo nó được load
          try {
            await chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              files: ["content.js"],
            });
            console.log("🔍 DEBUG: Content script injected successfully");
          } catch (scriptError) {
            console.log(
              "🔍 DEBUG: Script injection failed (might already be injected):",
              scriptError
            );
          }

          // Đợi một chút để content script khởi tạo
          await new Promise(resolve => setTimeout(resolve, 500));

          // Gửi message đến content script để extract data
          chrome.tabs.sendMessage(
            currentTab.id,
            {
              action: "extractStudentInfo",
            },
            response => {
              console.log("🔍 DEBUG: Response from content script:", response);
              console.log(
                "🔍 DEBUG: Chrome runtime error:",
                chrome.runtime.lastError
              );

              if (chrome.runtime.lastError) {
                console.error(
                  "🔍 DEBUG: Runtime error details:",
                  chrome.runtime.lastError.message
                );
                showStatus(
                  "error",
                  "❌ Cannot connect to website. Please refresh the page and try again."
                );
                extractBtn.disabled = false;
                extractBtn.textContent = "📋 Extract Info from Website";
                return;
              }

              if (response && response.success && response.studentInfo) {
                console.log(
                  "🔍 DEBUG: Successfully extracted:",
                  response.studentInfo
                );

                // Điền thông tin vào form
                document.getElementById("school").value =
                  response.studentInfo.school || "";
                document.getElementById("firstName").value =
                  response.studentInfo.firstName || "";
                document.getElementById("lastName").value =
                  response.studentInfo.lastName || "";
                document.getElementById("dateOfBirth").value =
                  response.studentInfo.dateOfBirth || "";
                document.getElementById("email").value =
                  response.studentInfo.email || "";

                // Save data với auto-filled flag
                chrome.storage.sync.set({
                  studentInfo: response.studentInfo,
                  autoFilled: true,
                  lastUpdated: Date.now(),
                });

                showStatus(
                  "success",
                  "✅ Student info extracted successfully!"
                );

                // Highlight các field được extract
                const fields = [
                  "school",
                  "firstName",
                  "lastName",
                  "dateOfBirth",
                  "email",
                ];
                fields.forEach(fieldId => {
                  const field = document.getElementById(fieldId);
                  if (field && field.value) {
                    field.style.backgroundColor = "#e8f5e8";
                    field.style.border = "2px solid #4CAF50";
                  }
                });

                // Pulse animation cho verify button
                const directVerifyBtn =
                  document.getElementById("directVerifyBtn");
                if (directVerifyBtn) {
                  directVerifyBtn.style.animation = "pulse 2s infinite";
                  setTimeout(() => {
                    directVerifyBtn.style.animation = "";
                  }, 6000);
                }
              } else {
                console.error(
                  "🔍 DEBUG: No data or failed response:",
                  response
                );
                const errorMsg =
                  response?.error ||
                  "No student information found on this page!";
                showStatus("error", `❌ ${errorMsg}`);
              }

              extractBtn.disabled = false;
              extractBtn.textContent = "📋 Extract Info from Website";
            }
          );

          // Timeout fallback để tránh button bị stuck
          setTimeout(() => {
            if (extractBtn.disabled) {
              console.log("🔍 DEBUG: Extract timeout - resetting button");
              extractBtn.disabled = false;
              extractBtn.textContent = "📋 Extract Info from Website";
              showStatus("error", "⏰ Extraction timeout - please try again");
            }
          }, 8000);
        }
      );
    });
  }

  // Event listener cho nút Card Generator
  if (cardGeneratorBtn) {
    cardGeneratorBtn.addEventListener("click", function () {
      // Mở trang web card generator trong tab mới
      chrome.tabs.create({
        url: "https://card.loading99.site/card-generator",
      });

      // Hiển thị thông báo
      showStatus("success", "🎓 Opening Card Generator...");

      // Đóng CHỈ popup extension, không đóng tab/window khác
      setTimeout(() => {
        // Kiểm tra xem đây có phải là popup extension không
        if (chrome.extension && chrome.extension.getViews) {
          const views = chrome.extension.getViews({ type: "popup" });
          if (views.length > 0 && views[0] === window) {
            window.close(); // Chỉ đóng popup extension
          }
        } else {
          // Fallback: chỉ đóng nếu window có kích thước nhỏ (popup)
          if (window.outerWidth < 500 && window.outerHeight < 600) {
            window.close();
          }
        }
      }, 500);
    });
  }
});
