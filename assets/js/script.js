$(document).ready(function () {
  $("#menu").click(function () {
    $(this).toggleClass("fa-times");
    $(".navbar").toggleClass("nav-toggle");
  });

  $(window).on("scroll load", function () {
    $("#menu").removeClass("fa-times");
    $(".navbar").removeClass("nav-toggle");

    if (window.scrollY > 60) {
      document.querySelector("#scroll-top").classList.add("active");
    } else {
      document.querySelector("#scroll-top").classList.remove("active");
    }

    // scroll spy
    $("section").each(function () {
      let height = $(this).height();
      let offset = $(this).offset().top - 200;
      let top = $(window).scrollTop();
      let id = $(this).attr("id");

      if (top > offset && top < offset + height) {
        $(".navbar ul li a").removeClass("active");
        $(".navbar").find(`[href="#${id}"]`).addClass("active");
      }
    });
  });

  // smooth scrolling
  $('a[href*="#"]').on("click", function (e) {
    e.preventDefault();
    $("html, body").animate(
      {
        scrollTop: $($(this).attr("href")).offset().top - 70,
      },
      500,
      "linear"
    );
  });

  // <!-- emailjs to mail contact form data -->
  emailjs.init("5Zp2jGRolQNauoQlC"); // Ganti dengan Public Key Anda

  const contactForm = document.getElementById("contact-form");
  const submitBtn = document.getElementById("submit-btn");
  const successMessage = document.getElementById("success-message");
  const errorMessage = document.getElementById("error-message");

  // Security Validation Functions
  const SecurityValidator = {
    // Sanitize input untuk mencegah XSS
    sanitizeInput: function (input) {
      if (!input) return "";
      return input
        .toString()
        .replace(/[<>]/g, "") // Hapus tag HTML
        .replace(/javascript:/gi, "") // Hapus javascript: protocol
        .replace(/on\w+=/gi, "") // Hapus event handlers
        .replace(/script/gi, "") // Hapus kata script
        .trim();
    },

    // Validasi email yang lebih ketat
    validateEmail: function (email) {
      // Pattern email yang aman
      const emailPattern =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      // Cek panjang email
      if (email.length > 254) return false;

      // Cek pattern dasar
      if (!emailPattern.test(email)) return false;

      // Cek karakter berbahaya
      const dangerousChars = ["<", ">", '"', "'", "&", "%", "+", "="];
      for (let char of dangerousChars) {
        if (email.includes(char)) return false;
      }

      // Cek domain yang mencurigakan
      const suspiciousDomains = [
        "javascript",
        "vbscript",
        "data:",
        "file:",
        "ftp:",
      ];
      const domain = email.split("@")[1];
      if (domain) {
        for (let suspicious of suspiciousDomains) {
          if (domain.toLowerCase().includes(suspicious)) return false;
        }
      }

      return true;
    },

    // Validasi nomor telepon
    validatePhone: function (phone) {
      if (!phone) return true; // Phone is optional

      // Hapus spasi dan karakter non-digit kecuali +, -, (, )
      const cleanPhone = phone.replace(/[^\d+\-\(\)\s]/g, "");

      // Cek panjang (5-20 digit)
      const digitCount = cleanPhone.replace(/[^\d]/g, "").length;
      if (digitCount < 5 || digitCount > 20) return false;

      // Pattern nomor telepon internasional
      const phonePattern = /^[\+]?[\d\s\-\(\)]{5,20}$/;
      return phonePattern.test(cleanPhone);
    },

    // Validasi nama
    validateName: function (name) {
      if (!name || name.length < 2) return false;
      if (name.length > 50) return false;

      // Hanya huruf, spasi, dan beberapa karakter khusus
      const namePattern = /^[a-zA-Z\s\.\-\']{2,50}$/;
      return namePattern.test(name);
    },

    // Validasi pesan
    validateMessage: function (message) {
      if (!message || message.length < 5) return false;
      if (message.length > 1000) return false;

      // Cek script injection
      const scriptPattern = /<script|javascript:|on\w+\s*=/gi;
      if (scriptPattern.test(message)) return false;

      return true;
    },

    // Rate limiting sederhana
    checkRateLimit: function () {
      const now = Date.now();
      const lastSubmit = localStorage.getItem("lastFormSubmit");

      if (lastSubmit && now - parseInt(lastSubmit) < 30000) {
        // 30 detik
        return false;
      }

      localStorage.setItem("lastFormSubmit", now.toString());
      return true;
    },
  };

  // Real-time validation
  const nameInput = document.querySelector('input[name="name"]');
  const emailInput = document.querySelector('input[name="email"]');
  const phoneInput = document.querySelector('input[name="phone"]');
  const messageInput = document.querySelector('textarea[name="message"]');

  // Add validation styling
  function addValidationStyling() {
    const style = document.createElement("style");
    style.textContent = `
                .field input.invalid, .message textarea.invalid {
                    border-color: #dc3545 !important;
                    background-color: #fff5f5 !important;
                }
                .field input.valid, .message textarea.valid {
                    border-color: #28a745 !important;
                    background-color: #f0fff4 !important;
                }
                .validation-error {
                    color: #dc3545;
                    font-size: 12px;
                    margin-top: 5px;
                    display: none;
                }
            `;
    document.head.appendChild(style);
  }

  // Add error message elements
  function addErrorMessages() {
    const fields = [
      {
        input: nameInput,
        message: "Name must be 2-50 characters, letters only",
      },
      { input: emailInput, message: "Please enter a valid email address" },
      {
        input: phoneInput,
        message: "Please enter a valid phone number (5-20 digits)",
      },
      { input: messageInput, message: "Message must be 5-1000 characters" },
    ];

    fields.forEach((field) => {
      const errorDiv = document.createElement("div");
      errorDiv.className = "validation-error";
      errorDiv.textContent = field.message;
      field.input.parentNode.appendChild(errorDiv);
    });
  }

  // Validate field and show/hide error
  function validateField(input, validator, errorMessage) {
    const value = SecurityValidator.sanitizeInput(input.value);
    const isValid = validator(value);
    const errorDiv = input.parentNode.querySelector(".validation-error");

    if (isValid) {
      input.classList.remove("invalid");
      input.classList.add("valid");
      errorDiv.style.display = "none";
    } else {
      input.classList.remove("valid");
      input.classList.add("invalid");
      errorDiv.style.display = "block";
    }

    return isValid;
  }

  // Initialize validation
  addValidationStyling();
  addErrorMessages();

  // Real-time validation events
  nameInput.addEventListener("blur", () => {
    validateField(nameInput, SecurityValidator.validateName);
  });

  emailInput.addEventListener("blur", () => {
    validateField(emailInput, SecurityValidator.validateEmail);
  });

  phoneInput.addEventListener("blur", () => {
    validateField(phoneInput, SecurityValidator.validatePhone);
  });

  messageInput.addEventListener("blur", () => {
    validateField(messageInput, SecurityValidator.validateMessage);
  });

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const message = formData.get("message");

    // Sembunyikan pesan sebelumnya
    successMessage.style.display = "none";
    errorMessage.style.display = "none";

    // Security validations
    let isValid = true;
    let errorMsg = "";

    // Rate limiting check
    if (!SecurityValidator.checkRateLimit()) {
      errorMsg = "Please wait 30 seconds before submitting again.";
      isValid = false;
    }

    // Validate all fields
    if (isValid && !SecurityValidator.validateName(name)) {
      errorMsg = "Please enter a valid name (2-50 characters, letters only).";
      isValid = false;
    }

    if (isValid && !SecurityValidator.validateEmail(email)) {
      errorMsg = "Please enter a valid email address.";
      isValid = false;
    }

    if (isValid && phone && !SecurityValidator.validatePhone(phone)) {
      errorMsg = "Please enter a valid phone number.";
      isValid = false;
    }

    if (isValid && !SecurityValidator.validateMessage(message)) {
      errorMsg = "Please enter a valid message (5-1000 characters).";
      isValid = false;
    }

    // If validation fails, show error
    if (!isValid) {
      const errorDiv = document.getElementById("error-message");
      errorDiv.innerHTML =
        '<i class="fas fa-exclamation-triangle"></i> ' + errorMsg;
      errorDiv.style.display = "block";
      return;
    }

    // Sanitize all inputs before sending
    const sanitizedData = {
      name: SecurityValidator.sanitizeInput(name),
      email: SecurityValidator.sanitizeInput(email),
      phone: SecurityValidator.sanitizeInput(phone),
      message: SecurityValidator.sanitizeInput(message),
    };

    // Update form with sanitized data
    nameInput.value = sanitizedData.name;
    emailInput.value = sanitizedData.email;
    phoneInput.value = sanitizedData.phone;
    messageInput.value = sanitizedData.message;

    // Ubah status button
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    // Konfigurasi service dan template ID
    const serviceID = "default_service"; // Ganti dengan Service ID Anda
    const templateID = "template_zgugfyg"; // Ganti dengan Template ID Anda

    // Kirim form menggunakan EmailJS
    emailjs.sendForm(serviceID, templateID, this).then(
      function (response) {
        console.log("SUCCESS!", response.status, response.text);

        // Reset form
        contactForm.reset();

        // Remove validation classes
        document.querySelectorAll(".valid, .invalid").forEach((el) => {
          el.classList.remove("valid", "invalid");
        });

        // Tampilkan pesan sukses
        successMessage.style.display = "block";

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      },
      function (error) {
        console.log("FAILED...", error);

        // Tampilkan pesan error
        const errorDiv = document.getElementById("error-message");
        errorDiv.innerHTML =
          '<i class="fas fa-exclamation-triangle"></i> Failed to send message. Please try again.';
        errorDiv.style.display = "block";

        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    );
  });
  // <!-- emailjs to mail contact form data -->
});

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "visible") {
    document.title = "Portfolio | M.Kelvin Prayoga";
    $("#favicon").attr("href", "assets/images/favicon.png");
  } else {
    document.title = "Come Back To Portfolio";
    $("#favicon").attr("href", "assets/images/favhand.png");
  }
});

// <!-- typed js effect starts -->
var typed = new Typed(".typing-text", {
  strings: [
    "Penetration Tester",
    "System Administrator",
    "Cyber Security Enthusiast",
  ],
  loop: true,
  typeSpeed: 50,
  backSpeed: 25,
  backDelay: 500,
});
// <!-- typed js effect ends -->

async function fetchData(type = "skills") {
  let response;
  type === "skills"
    ? (response = await fetch("skills.json"))
    : (response = await fetch("./projects/projects.json"));
  const data = await response.json();
  return data;
}

function showSkills(skills) {
  let skillsContainer = document.getElementById("skillsContainer");
  let skillHTML = "";
  skills.forEach((skill) => {
    skillHTML += `
        <div class="bar">
              <div class="info">
                <img src=${skill.icon} alt="skill" />
                <span>${skill.name}</span>
              </div>
            </div>`;
  });
  skillsContainer.innerHTML = skillHTML;
}

function showProjects(projects) {
  let projectsContainer = document.querySelector("#work .box-container");
  let projectHTML = "";
  projects
    .slice(0, 10)
    .filter((project) => project.category != "android")
    .forEach((project) => {
      projectHTML += `
        <div class="box tilt">
      <img draggable="false" src="/assets/images/projects/${project.image}.png" alt="project" />
      <div class="content">
        <div class="tag">
        <h3>${project.name}</h3>
        </div>
        <div class="desc">
          <p>${project.desc}</p>
          <div class="btns">
            <a href="${project.links.view}" class="btn" target="_blank"><i class="fas fa-eye"></i> View</a>
            <a href="${project.links.code}" class="btn" target="_blank">Code <i class="fas fa-code"></i></a>
          </div>
        </div>
      </div>
    </div>`;
    });
  projectsContainer.innerHTML = projectHTML;

  // <!-- tilt js effect starts -->
  VanillaTilt.init(document.querySelectorAll(".tilt"), {
    max: 15,
  });
  // <!-- tilt js effect ends -->

  /* ===== SCROLL REVEAL ANIMATION ===== */
  const srtop = ScrollReveal({
    origin: "top",
    distance: "80px",
    duration: 1000,
    reset: true,
  });

  /* SCROLL PROJECTS */
  srtop.reveal(".work .box", { interval: 200 });
}

fetchData().then((data) => {
  showSkills(data);
});

fetchData("projects").then((data) => {
  showProjects(data);
});

// <!-- tilt js effect starts -->
VanillaTilt.init(document.querySelectorAll(".tilt"), {
  max: 15,
});
// <!-- tilt js effect ends -->

// pre loader start
// function loader() {
//     document.querySelector('.loader-container').classList.add('fade-out');
// }
// function fadeOut() {
//     setInterval(loader, 500);
// }
// window.onload = fadeOut;
// pre loader end

// disable developer mode
document.onkeydown = function (e) {
  if (e.keyCode == 123) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "I".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "C".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && e.keyCode == "J".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.keyCode == "U".charCodeAt(0)) {
    return false;
  }
};

/* ===== SCROLL REVEAL ANIMATION ===== */
const srtop = ScrollReveal({
  origin: "top",
  distance: "60px",
  duration: 1000,
  reset: true,
});

/* SCROLL HOME */
srtop.reveal(".home .content h3", { delay: 200 });
srtop.reveal(".home .content p", { delay: 200 });
srtop.reveal(".home .content .btn", { delay: 200 });

srtop.reveal(".home .image", { delay: 400 });
srtop.reveal(".home .linkedin", { interval: 600 });
srtop.reveal(".home .github", { interval: 800 });
srtop.reveal(".home .twitter", { interval: 1000 });
srtop.reveal(".home .telegram", { interval: 600 });
srtop.reveal(".home .instagram", { interval: 600 });
srtop.reveal(".home .dev", { interval: 600 });

/* SCROLL ABOUT */
srtop.reveal(".about .content h3", { delay: 200 });
srtop.reveal(".about .content .tag", { delay: 200 });
srtop.reveal(".about .content p", { delay: 200 });
srtop.reveal(".about .content .box-container", { delay: 200 });
srtop.reveal(".about .content .resumebtn", { delay: 200 });

/* SCROLL SKILLS */
srtop.reveal(".skills .container", { interval: 200 });
srtop.reveal(".skills .container .bar", { delay: 400 });

/* SCROLL EDUCATION */
srtop.reveal(".education .box", { interval: 200 });

/* SCROLL PROJECTS */
srtop.reveal(".work .box", { interval: 200 });

/* SCROLL EXPERIENCE */
srtop.reveal(".experience .timeline", { delay: 400 });
srtop.reveal(".experience .timeline .container", { interval: 400 });

/* SCROLL CONTACT */
srtop.reveal(".contact .container", { delay: 400 });
srtop.reveal(".contact .container .form-group", { delay: 400 });
