const genderButtons = document.querySelectorAll(".gender-btn");
const yearInput = document.getElementById("dobYear");
const monthSelect = document.getElementById("dobMonth");
const daySelect = document.getElementById("dobDay");
const heightInput = document.getElementById("heightInput");
const weightInput = document.getElementById("weightInput");
const activitySelect = document.getElementById("activityLevel");
const calculateBtn = document.getElementById("calculateBtn");

const bmiResult = document.getElementById("bmiResult");
const growthResult = document.getElementById("growthResult");
const metabolismResult = document.getElementById("metabolismResult");
const exactAgeResult = document.getElementById("exactAgeResult");

const downloadBtn = document.getElementById("downloadPDF");
const toast = document.getElementById("toast");

let selectedGender = "male";

genderButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    genderButtons.forEach(el => el.classList.remove("active"));
    btn.classList.add("active");
    selectedGender = btn.dataset.gender;
  });
});

initYearList();
updateDayOptions();

yearInput.addEventListener("input", updateDayOptions);
monthSelect.addEventListener("change", updateDayOptions);

calculateBtn.addEventListener("click", () => {
  const jy = parseInt(yearInput.value, 10);
  const jm = parseInt(monthSelect.value, 10);
  const jd = parseInt(daySelect.value, 10);

  const heightCm = parseFloat(heightInput.value);
  const weightKg = parseFloat(weightInput.value);

  if (!isValidJalaliDate(jy, jm, jd) || !isValidInput(heightCm, weightKg)) {
    showToast("لطفاً تاریخ تولد، قد و وزن معتبر وارد کنید.");
    return;
  }

  const gDate = jalaliToGregorian(jy, jm, jd);
  const dob = new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  const today = new Date();

  if (dob > today) {
    showToast("تاریخ تولد نمی‌تواند در آینده باشد.");
    return;
  }

  const ageJalali = diffJalali(jy, jm, jd, today);
  exactAgeResult.innerHTML = `سن دقیق: <strong>${ageJalali.y} سال</strong>، <strong>${ageJalali.m} ماه</strong>، <strong>${ageJalali.d} روز</strong>`;

  const ageMonthsPrecise = ageJalali.y * 12 + ageJalali.m + (ageJalali.d / 30.4375);
  const ageYears = ageMonthsPrecise / 12;

  const heightM = heightCm / 100;
  const bmi = weightKg / Math.pow(heightM, 2);
  const activityFactor = parseFloat(activitySelect.value || "1.55");

  renderBMIResult(ageYears, bmi);
  renderGrowthResult(ageMonthsPrecise, bmi, selectedGender);
  renderMetabolismResult(ageYears, heightCm, weightKg, selectedGender, activityFactor);

  showToast("محاسبات با موفقیت انجام شد.");
});

downloadBtn.addEventListener("click", () => {
  const reportCard = document.getElementById("reportCard");

  if (typeof html2pdf === "undefined") {
    showToast("کتابخانه PDF بارگذاری نشده است. مطمئن شوید فایل «js/html2pdf.bundle.min.js» در پروژه وجود دارد.");
    return;
  }

  document.body.classList.add("pdf-mode");

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Komaketim-Report-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff"
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf()
    .set(opt)
    .from(reportCard)
    .save()
    .then(() => {
      document.body.classList.remove("pdf-mode");
    })
    .catch(() => {
      document.body.classList.remove("pdf-mode");
    });
});

function isValidInput(height, weight) {
  return height > 0 && weight > 0;
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
      <div class="muted">محاسبات رشد کودک/نوجوان در بازه ۵ تا ۱۹ سال انجام می‌شود.</div>
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

/* ---------- Jalali Utilities ---------- */

function initYearList() {
  const dl = document.getElementById("yearList");
  const today = new Date();
  const jy = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate()).jy;

  const start = jy - 120;
  for (let y = jy; y >= start; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    dl.appendChild(opt);
  }
}

function updateDayOptions() {
  const y = parseInt(yearInput.value, 10);
  const m = parseInt(monthSelect.value, 10);
  const maxDay = getJalaliMonthDays(y, m);

  daySelect.innerHTML = `<option value="">روز</option>`;
  if (!maxDay) return;

  for (let d = 1; d <= maxDay; d++) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    daySelect.appendChild(opt);
  }
}

function getJalaliMonthDays(jy, jm) {
  if (!jy || !jm) return 0;
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

function isValidJalaliDate(jy, jm, jd) {
  if (!jy || !jm || !jd) return false;
  if (jm < 1 || jm > 12) return false;
  const max = getJalaliMonthDays(jy, jm);
  return jd >= 1 && jd <= max;
}

function diffJalali(jy, jm, jd, todayGregorian) {
  const tj = gregorianToJalali(todayGregorian.getFullYear(), todayGregorian.getMonth() + 1, todayGregorian.getDate());
  let y = tj.jy - jy;
  let m = tj.jm - jm;
  let d = tj.jd - jd;

  if (d < 0) {
    m -= 1;
    const prevMonthDays = getJalaliMonthDays(jy + y, ((tj.jm - 1) < 1 ? 12 : tj.jm - 1));
    d += prevMonthDays;
  }

  if (m < 0) {
    y -= 1;
    m += 12;
  }

  return { y, m, d };
}

/* -------- jalaali conversion (pure JS) -------- */

function jalaliToGregorian(jy, jm, jd) {
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd;

  if (jm < 7) days += (jm - 1) * 31;
  else days += ((jm - 7) * 30) + 186;

  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gd = days + 1;
  const sal_a = [0,31, (isGregorianLeap(gy)?29:28),31,30,31,30,31,31,30,31,30,31];
  let gm = 1;
  while (gm <= 12 && gd > sal_a[gm]) {
    gd -= sal_a[gm];
    gm++;
  }
  return { gy, gm, gd };
}

function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;

  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd;

  for (let i = 0; i < gm; ++i) days += g_d_m[i];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));

  return { jy, jm, jd };
}

function isJalaliLeapYear(jy) {
  const breaks = [-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
  let bl = breaks.length;
  let gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm, jump, leap, n, i;

  if (jy < jp || jy >= breaks[bl - 1]) return false;

  for (i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jm;
  }

  n = jy - jp;
  leapJ += Math.floor(n / 33) * 8 + Math.floor(((n % 33) + 3) / 4);

  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;

  let leapG = Math.floor(gy / 4) - Math.floor(((gy / 100) + 1) * 3 / 4) - 150;
  let march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;

  leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;

  return leap === 0;
}

function isGregorianLeap(gy) {
  return (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
}

