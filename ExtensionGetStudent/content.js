// Content script - giao tiếp với trang web (Enhanced version)
console.log(
  "🔍 DEBUG: Student Card Auto Verifier content script loaded on:",
  window.location.href
);
console.log("🔍 DEBUG: Document ready state:", document.readyState);
console.log("🔍 DEBUG: Content script timestamp:", new Date().toISOString());

// Biến lưu trữ thông tin student - sử dụng window object để tránh redeclaration
window.currentStudentInfo = window.currentStudentInfo || null;

// Lắng nghe message từ web page
window.addEventListener("message", event => {
  // Chỉ nhận message từ cùng origin
  if (event.source !== window) return;

  // Xử lý extract thông tin (chỉ lưu, không verify)
  if (event.data.type === "STUDENT_CARD_EXTRACT") {
    console.log(
      "🔍 DEBUG: Extracting student info from card:",
      event.data.studentInfo
    );
    window.currentStudentInfo = event.data.studentInfo;

    // Gửi thông tin đến background để lưu
    chrome.runtime.sendMessage(
      {
        action: "saveStudentInfo",
        studentInfo: window.currentStudentInfo,
      },
      response => {
        console.log("🔍 DEBUG: Info saved to extension:", response);
        console.log("🔍 DEBUG: Saved data:", window.currentStudentInfo);

        // Gửi kết quả về cho web page
        window.postMessage(
          {
            type: "INFO_EXTRACTED",
            success: response?.success || false,
          },
          "*"
        );
      }
    );
  }

  // Nhận dữ liệu student card từ website (legacy - auto verify)
  if (event.data.type === "STUDENT_CARD_DATA") {
    console.log(
      "Nhận được thông tin student card từ website:",
      event.data.studentInfo
    );
    window.currentStudentInfo = event.data.studentInfo;

    // Lưu vào storage để popup sử dụng
    chrome.runtime.sendMessage({
      action: "saveStudentInfo",
      studentInfo: window.currentStudentInfo,
    });
  }

  if (event.data.type === "START_STUDENT_VERIFICATION") {
    console.log("Nhận được yêu cầu bắt đầu xác minh từ web page");

    // Gửi message đến background script
    chrome.runtime.sendMessage(
      {
        action: "startVerification",
        studentInfo: window.currentStudentInfo,
      },
      response => {
        console.log("Response từ background:", response);

        // Gửi kết quả về cho web page
        window.postMessage(
          {
            type: "VERIFICATION_STARTED",
            success: response?.success || false,
          },
          "*"
        );
      }
    );
  }
});

// Lắng nghe message từ popup extension để extract thông tin
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🔍 DEBUG: Content script received message:", request);

  if (request.action === "extractStudentInfo") {
    console.log("🔍 DEBUG: Popup yêu cầu extract student info từ website");
    console.log("🔍 DEBUG: Current URL:", window.location.href);
    console.log("🔍 DEBUG: Document ready state:", document.readyState);

    try {
      // Enhanced extraction logic - sử dụng nhiều selectors để tìm thông tin
      console.log(
        "🔍 DEBUG: Attempting to find student information using flexible selectors..."
      );

      const extractedData = extractStudentInfoFromPage();

      if (!extractedData.hasBasicInfo) {
        console.log("🔍 DEBUG: No student information found on this page");
        logAvailableElements();

        sendResponse({
          success: false,
          error:
            "No student information found on this page. Please make sure you are on a page with student card or student form.",
        });
        return true;
      }

      const studentInfo = processExtractedData(extractedData);

      console.log("🔍 DEBUG: Final processed student info:", studentInfo);

      sendResponse({
        success: true,
        studentInfo: studentInfo,
      });
    } catch (error) {
      console.error("🔍 DEBUG: Error extracting student info:", error);
      sendResponse({
        success: false,
        error: "Error extracting student information: " + error.message,
      });
    }

    return true; // Keep message channel open
  }

  return true; // Keep message channel open for async response
});

// Enhanced extraction function
function extractStudentInfoFromPage() {
  // Hàm helper để tìm text content từ nhiều selectors
  const findTextBySelectors = selectors => {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent?.trim()) {
          console.log(
            `🔍 DEBUG: Found text using selector "${selector}":`,
            element.textContent.trim()
          );
          return element.textContent.trim();
        }
      } catch (e) {
        console.log(`🔍 DEBUG: Error with selector "${selector}":`, e.message);
      }
    }
    return "";
  };

  // Hàm helper để tìm input value từ nhiều selectors
  const findInputValueBySelectors = selectors => {
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && (element.value?.trim() || element.textContent?.trim())) {
          const value = element.value?.trim() || element.textContent?.trim();
          console.log(
            `🔍 DEBUG: Found value using selector "${selector}":`,
            value
          );
          return value;
        }
      } catch (e) {
        console.log(`🔍 DEBUG: Error with selector "${selector}":`, e.message);
      }
    }
    return "";
  };

  // Comprehensive selector lists
  const universitySelectors = [
    // Original selectors
    "#university-name",
    "#school-name",
    "#institution-name",
    // Data attributes
    '[data-field="university"]',
    '[data-field="school"]',
    '[data-field="institution"]',
    '[data-testid*="university"]',
    '[data-testid*="school"]',
    // Input fields
    'input[name*="university" i]',
    'input[name*="school" i]',
    'input[name*="institution" i]',
    'input[name*="college" i]',
    'input[name="school"]',
    'input[id*="school"]',
    // Placeholder text
    'input[placeholder*="university" i]',
    'input[placeholder*="school" i]',
    'input[placeholder*="college" i]',
    // Class names
    ".university-name",
    ".school-name",
    ".institution-name",
    '[class*="university"]',
    '[class*="school"]',
    '[class*="institution"]',
    // Labels and spans
    'label[for*="university"] + input',
    'label[for*="school"] + input',
    'span[class*="university"]',
    'span[class*="school"]',
    // Form fields with common patterns
    'select[name*="university"]',
    'select[name*="school"]',
  ];

  const studentNameSelectors = [
    // Original selectors
    "#student-name",
    "#name",
    "#full-name",
    "#student-full-name",
    // Data attributes
    '[data-field="name"]',
    '[data-field="student-name"]',
    '[data-field="fullName"]',
    '[data-testid*="name"]',
    '[data-testid="student-name"]',
    // Input fields
    'input[name*="name" i]',
    'input[name="name"]',
    'input[name="fullName"]',
    'input[name="studentName"]',
    'input[id*="name"]',
    // Placeholder text
    'input[placeholder*="name" i]',
    'input[placeholder*="student" i]',
    // Class names
    ".student-name",
    ".full-name",
    ".name",
    '[class*="student-name"]',
    '[class*="full-name"]',
    // Labels
    'label[for*="name"] + input',
  ];

  const firstNameSelectors = [
    'input[name*="firstName" i]',
    'input[name*="first" i]',
    'input[name="firstName"]',
    '[data-field="firstName"]',
    '[data-testid*="first"]',
    'input[placeholder*="first" i]',
    "#firstName",
    "#first-name",
    'input[id*="first"]',
    ".first-name",
    'label[for*="first"] + input',
  ];

  const lastNameSelectors = [
    'input[name*="lastName" i]',
    'input[name*="last" i]',
    'input[name="lastName"]',
    '[data-field="lastName"]',
    '[data-testid*="last"]',
    'input[placeholder*="last" i]',
    "#lastName",
    "#last-name",
    'input[id*="last"]',
    ".last-name",
    'label[for*="last"] + input',
  ];

  const dobSelectors = [
    "#student-dob",
    "#dob",
    "#date-of-birth",
    "#birth-date",
    "#dateOfBirth",
    '[data-field="dob"]',
    '[data-field="dateOfBirth"]',
    '[data-field="birthDate"]',
    'input[name*="dob" i]',
    'input[name*="birth" i]',
    'input[name*="date" i]',
    'input[type="date"]',
    'input[placeholder*="birth" i]',
    'input[placeholder*="date" i]',
    ".dob",
    ".date-of-birth",
    '[class*="birth"]',
    '[class*="dob"]',
    'label[for*="birth"] + input',
    'label[for*="dob"] + input',
  ];

  const departmentSelectors = [
    "#student-department",
    "#department",
    "#faculty",
    "#major",
    "#course",
    '[data-field="department"]',
    '[data-field="faculty"]',
    '[data-field="major"]',
    'input[name*="department" i]',
    'input[name*="faculty" i]',
    'input[name*="major" i]',
    'select[name*="department" i]',
    'select[name*="faculty" i]',
    'select[name*="major" i]',
    'input[placeholder*="department" i]',
    'input[placeholder*="faculty" i]',
    ".department",
    ".faculty",
    ".major",
    '[class*="department"]',
    'label[for*="department"] + input',
    'label[for*="faculty"] + input',
  ];

  const emailSelectors = [
    "#email",
    "#student-email",
    "#emailAddress",
    '[data-field="email"]',
    '[data-testid*="email"]',
    'input[name*="email" i]',
    'input[type="email"]',
    'input[placeholder*="email" i]',
    ".email",
    '[class*="email"]',
    'label[for*="email"] + input',
  ];

  // Extract information
  const universityName =
    findTextBySelectors(universitySelectors) ||
    findInputValueBySelectors(universitySelectors);
  const studentName =
    findTextBySelectors(studentNameSelectors) ||
    findInputValueBySelectors(studentNameSelectors);
  const firstName = findInputValueBySelectors(firstNameSelectors);
  const lastName = findInputValueBySelectors(lastNameSelectors);
  const studentDob =
    findTextBySelectors(dobSelectors) ||
    findInputValueBySelectors(dobSelectors);
  const studentDepartment =
    findTextBySelectors(departmentSelectors) ||
    findInputValueBySelectors(departmentSelectors);
  const studentEmail = findInputValueBySelectors(emailSelectors);

  console.log("🔍 DEBUG: Raw extracted data:", {
    universityName,
    studentName,
    firstName,
    lastName,
    studentDob,
    studentDepartment,
    studentEmail,
    pageTitle: document.title,
    pageUrl: window.location.href,
  });

  // Check if we have enough basic information
  const hasBasicInfo =
    universityName || studentName || (firstName && lastName) || studentEmail;

  return {
    universityName,
    studentName,
    firstName,
    lastName,
    studentDob,
    studentDepartment,
    studentEmail,
    hasBasicInfo,
  };
}

// Process and normalize the extracted data
function processExtractedData(extractedData) {
  let {
    universityName,
    studentName,
    firstName,
    lastName,
    studentDob,
    studentDepartment,
    studentEmail,
  } = extractedData;

  // Process names
  if (studentName && !firstName && !lastName) {
    // Split full name into first and last
    const nameParts = studentName.split(" ").filter(part => part.trim());
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  } else if (!studentName && (firstName || lastName)) {
    // Combine first and last name
    studentName = `${firstName || ""} ${lastName || ""}`.trim();
  }

  // Process date of birth
  let formattedDob = "";
  if (studentDob) {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(studentDob)) {
        formattedDob = studentDob;
      } else {
        const dobDate = new Date(studentDob);
        if (!isNaN(dobDate.getTime())) {
          formattedDob = dobDate.toISOString().split("T")[0];
        }
      }
    } catch (error) {
      console.log("🔍 DEBUG: Could not format date:", studentDob, error);
    }
  }

  // Generate random date of birth if not found (18-25 years old)
  if (!formattedDob) {
    const age = Math.floor(Math.random() * 8) + 18; // Random age between 18-25
    const birthYear = new Date().getFullYear() - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1; // 1-12
    const birthDay = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid invalid dates
    formattedDob = `${birthYear}-${birthMonth
      .toString()
      .padStart(2, "0")}-${birthDay.toString().padStart(2, "0")}`;
    console.log(
      `🔍 DEBUG: Generated random date of birth for age ${age}: ${formattedDob}`
    );
  }

  // Generate email if not found
  if (!studentEmail && (firstName || lastName || studentName)) {
    const randomNumbers = Math.floor(1000 + Math.random() * 9000);
    let emailPrefix = "";

    if (firstName && lastName) {
      emailPrefix =
        firstName.toLowerCase() + lastName.toLowerCase().replace(/\s+/g, "");
    } else if (studentName) {
      emailPrefix = studentName.toLowerCase().replace(/\s+/g, "");
    }

    if (emailPrefix) {
      // Use university domain if possible
      const domain =
        getEmailDomainFromUniversity(universityName) || "student.edu.in";
      studentEmail = `${emailPrefix}${randomNumbers}@${domain}`;
    }
  }

  // Set default values for missing fields
  if (!universityName) {
    universityName = "University/College Name";
  }

  if (!firstName && !lastName && !studentName) {
    firstName = "Student";
    lastName = "Name";
  }

  if (!studentDepartment) {
    studentDepartment = "General Studies";
  }

  return {
    school: universityName,
    firstName: firstName,
    lastName: lastName,
    email: studentEmail,
    dateOfBirth: formattedDob,
    department: studentDepartment,
    extractedAt: new Date().toISOString(),
    source: "flexible-extractor",
    originalData: extractedData,
  };
}

// Log available elements for debugging
function logAvailableElements() {
  console.log("🔍 DEBUG: Available form elements:", {
    inputs: Array.from(document.querySelectorAll("input")).map(el => ({
      name: el.name,
      id: el.id,
      type: el.type,
      placeholder: el.placeholder,
      className: el.className,
      value: el.value?.substring(0, 20) + "...",
    })),
    selects: Array.from(document.querySelectorAll("select")).map(el => ({
      name: el.name,
      id: el.id,
      className: el.className,
    })),
    textElements: Array.from(document.querySelectorAll("[id]")).map(el => ({
      id: el.id,
      tagName: el.tagName,
      className: el.className,
      hasText: !!el.textContent?.trim(),
    })),
  });
}

// Helper function để tạo email domain từ tên trường
function getEmailDomainFromUniversity(universityName) {
  if (!universityName) return "student.edu.in";

  const domainMap = {
    "Indian Institute of Technology Bombay": "iitb.ac.in",
    "Indian Institute of Technology Delhi": "iitd.ac.in",
    "Indian Institute of Science Bangalore": "iisc.ac.in",
    "Indian Institute of Technology Madras": "iitm.ac.in",
    "Indian Institute of Technology Kanpur": "iitk.ac.in",
    "Indian Institute of Technology Kharagpur": "iitkgp.ac.in",
    "University of Delhi": "du.ac.in",
    "Jawaharlal Nehru University": "jnu.ac.in",
    "Indian Institute of Management Ahmedabad": "iima.ac.in",
    "Banaras Hindu University": "bhu.ac.in",
    "Manipal Academy of Higher Education": "manipal.edu",
    "Babu Banarasi Das University": "bbditm.edu.in",
    "Indian Institute of Technology Madras": "iitm.edu.in",
  };

  // Check for exact match
  if (domainMap[universityName]) {
    return domainMap[universityName];
  }

  // Check for partial matches
  for (const [key, domain] of Object.entries(domainMap)) {
    if (universityName.includes(key) || key.includes(universityName)) {
      return domain;
    }
  }

  return "student.edu.in";
}

// Hàm helper cho web page sử dụng
window.studentCardVerifier = {
  start: function () {
    window.postMessage(
      {
        type: "START_STUDENT_VERIFICATION",
      },
      "*"
    );
  },

  startWithData: function (studentInfo) {
    window.postMessage(
      {
        type: "STUDENT_CARD_DATA",
        studentInfo: studentInfo,
      },
      "*"
    );

    setTimeout(() => {
      window.postMessage(
        {
          type: "START_STUDENT_VERIFICATION",
        },
        "*"
      );
    }, 100);
  },
};
