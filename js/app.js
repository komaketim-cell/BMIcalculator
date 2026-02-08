const genderButtons = document.querySelectorAll(".gender-btn");
const dobInput = document.getElementById("dobInput");
const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");
const activitySelect = document.getElementById("activityLevel");
const calculateBtn = document.getElementById("calculateBtn");
const scrollToCalculator = document.getElementById("scrollToCalculator");

const bmiResult = document.getElementById("bmiResult");
const growthResult = document.getElementById("growthResult");
const metabolismResult = document.getElementById("metabolismResult");
const downloadBtn = document.getElementById("downloadPDF");
const toast = document.getElementById("toast");

let selectedGender = "male";

if (scrollToCalculator) {
  scrollToCalculator.addEventListener("click", () => {
    document.getElementById("calculatorSection").scrollIntoView({ behavior: "smooth" });
  });
}

genderButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    genderButtons.forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    selectedGender = btn.dataset.gender;
  });
});

calculateBtn.addEventListener("click", () => {
  const dobValue = dobInput.value;
  const heightCm = parseFloat(heightInput.value);
  const weightKg = parseFloat(weightInput.value);

  if (!dobValue || !isValidInput(heightCm, weightKg)) {
    showToast("لطفاً تاریخ تولد، قد و وزن معتبر وارد کنید.");
    return;
  }

  const dob = new Date(dobValue);
  const today = new Date();
  if (dob > today) {
    showToast("تاریخ تولد نمی‌تواند در آینده باشد.");
    return;
  }

  const ageInfo = calculateAge(dob, today);
  const ageYears = ageInfo.ageYears;
  const ageMonths = ageInfo.ageMonthsPrecise;

  const heightM = heightCm / 100;
  const bmi = weightKg / Math.pow(heightM, 2);
  const activityFactor = parseFloat(activitySelect.value || "1.55");

  renderBMIResult(ageYears, bmi);
  renderGrowthResult(ageMonths, bmi, selectedGender);
  renderMetabolismResult(ageYears, heightCm, weightKg, selectedGender, activityFactor);

  showToast("محاسبات با موفقیت انجام شد.");
});

downloadBtn.addEventListener("click", () => {
  const reportCard = document.getElementById("reportCard");

  if (typeof html2pdf === "undefined") {
    showToast("کتابخانه PDF بارگذاری نشده است. اتصال اینترنت را بررسی کنید.");
    return;
  }

  const opt = {
    margin: [0.8, 0.6, 0.8, 0.6],
    filename: `Komaketim-Report-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2.2,
      useCORS: true,
      backgroundColor: "#0f172a",
    },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all"] }
  };

  html2pdf().set(opt).from(reportCard).save()
    .catch(() => {
      showToast("خطا در تولید PDF. لطفاً دوباره تلاش کنید.");
    });
});

function isValidInput(height, weight) {
  return height > 0 && weight > 0;
}

function calculateAge(dob, today) {
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const ageMonthsPrecise = (years * 12) + months + (days / 30.4375);
  const ageYears = ageMonthsPrecise / 12;

  return { ageYears, ageMonthsPrecise };
}

function renderBMIResult(ageYears, bmi) {
  const category = getBMICategory(ageYears, bmi);
  bmiResult.innerHTML = `
    <div>شاخص توده بدنی (BMI): <strong>${bmi.toFixed(1)}</strong></div>
    <div>طبقه‌بندی: <strong>${category.label}</strong></div>
    <div class="muted">${category.description}</div>
  `;
}

function renderGrowthResult(ageMonths, bmi, gender) {
  if (ageMonths < 61) {
    growthResult.innerHTML = `
      <div>این محاسبه برای سنین زیر ۵ سال در دسترس نیست.</div>
      <div class="muted">در صورت نیاز از جدول‌های رشد مخصوص نوزادان و کودکان خردسال استفاده کنید.</div>
    `;
    return;
  }
  if (ageMonths > 228) {
    growthResult.innerHTML = `
      <div>آیا سنتان بالای ۱۹ سال است؟</div>
      <div class="muted">محاسبات رشد کودک/نوجوان در بازه ۵ تا ۱۹ سال انجام می‌شود. برای سنین بالاتر از محاسبات بزرگسال استفاده کنید.</div>
    `;
    return;
  }

  const roundedAge = Math.round(ageMonths);
  const key = `${roundedAge}`;
  const atlas = gender === "male" ? LMS_MALE : LMS_FEMALE;
  const data = atlas[key];

  if (!data) {
    growthResult.innerHTML = `
      <div>اطلاعات مرجع برای سن ${roundedAge} ماه یافت نشد.</div>
      <div class="muted">لطفاً تاریخ تولد را کمی تغییر دهید و مجدداً تلاش کنید.</div>
    `;
    return;
  }

  const { L, M, S } = data;
  const zScore = calculateZScore(bmi, L, M, S);
  const interpretation = interpretZScore(zScore);

  growthResult.innerHTML = `
    <div>Z-Score BMI-for-Age: <strong>${zScore.toFixed(2)}</strong></div>
    <div>سطح رشد: <strong>${interpretation.status}</strong></div>
    <div class="muted">${interpretation.message}</div>
  `;
}

function renderMetabolismResult(ageYears, heightCm, weightKg, gender, activityFactor) {
  const bmr = calculateBMR(gender, weightKg, heightCm, ageYears);
  const tdee = bmr * activityFactor;

  metabolismResult.innerHTML = `
    <div>BMR (متابولیسم پایه): <strong>${Math.round(bmr)} kcal</strong></div>
    <div>TDEE (کالری روزانه): <strong>${Math.round(tdee)} kcal</strong></div>
    <div class="muted">سطح فعالیت در نظر گرفته شده: <strong>${activityLabel(activityFactor)}</strong></div>
  `;
}

function getBMICategory(ageYears, bmi) {
  if (ageYears < 20) {
    return {
      label: "برای تفسیر دقیق از Z-Score استفاده می‌شود",
      description: "بازه سنی شما زیر ۲۰ سال است؛ نتیجه اصلی در بخش رشد کودک/نوجوان نمایش داده شده."
    };
  }
  if (bmi < 18.5) return { label: "کمبود وزن", description: "وزن شما کمتر از محدوده استاندارد است. مشاوره تغذیه پیشنهاد می‌شود." };
  if (bmi < 25) return { label: "طبیعی", description: "شاخص توده بدنی در محدوده سالم قرار دارد." };
  if (bmi < 30) return { label: "اضافه وزن", description: "وزن شما بالاتر از محدوده استاندارد است. به تعادل تغذیه و فعالیت بدنی توجه کنید." };
  return { label: "چاقی", description: "شاخص BMI بالا است. برنامه‌ریزی تغذیه و فعالیت با نظر متخصص توصیه می‌شود." };
}

function calculateBMR(gender, weight, height, age) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calculateZScore(value, L, M, S) {
  if (L !== 0) {
    return (Math.pow(value / M, L) - 1) / (L * S);
  }
  return Math.log(value / M) / S;
}

function interpretZScore(z) {
  if (z < -3) return { status: "کمبود شدید", message: "نیاز به بررسی فوری وضعیت تغذیه‌ای و رشد وجود دارد." };
  if (z >= -3 && z < -2) return { status: "کمبود وزن", message: "رشد کمتر از حد انتظار است. پیگیری با متخصص پیشنهاد می‌شود." };
  if (z >= -2 && z <= 1) return { status: "رشد طبیعی", message: "رشد در محدوده سالم قرار دارد." };
  if (z > 1 && z <= 2) return { status: "اضافه وزن", message: "در حال افزایش وزن بالاتر از محدوده طبیعی هستید. نظارت ضروری است." };
  return { status: "چاقی", message: "شاخص رشد بالا است. حتماً با متخصص مشورت کنید." };
}

function activityLabel(factor) {
  const mapping = {
    "1.2": "بی‌تحرک",
    "1.375": "فعالیت سبک",
    "1.55": "فعالیت متوسط",
    "1.725": "فعال",
    "1.9": "بسیار فعال"
  };
  return mapping[factor.toString()] || "فعالیت متوسط";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
