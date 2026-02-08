// ===========================
// Jalali Date Helpers
// ===========================
const jalaliMonths = [
  "فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
  "مهر","آبان","آذر","دی","بهمن","اسفند"
];

function isJalaliLeapYear(jy) {
  const a = jy - 474;
  const b = mod(a, 2820);
  return mod(b + 474 + 38, 2820) < 682;
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

function jalaliToGregorian(jy, jm, jd) {
  jy = parseInt(jy, 10);
  jm = parseInt(jm, 10);
  jd = parseInt(jd, 10);

  let gy;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }

  let days = (365 * jy) + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 1; i < jm; ++i) days += jalaliMonthDays(jy, i);
  days += jd - 1;

  gy += 400 * Math.floor(days / 146097);
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

  const gd = days + 1;
  const sal_a = [0,31, (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  let gm = 0;
  let dayCount = gd;
  for (gm = 1; gm <= 12; gm++) {
    if (dayCount <= sal_a[gm]) break;
    dayCount -= sal_a[gm];
  }
  return { gy, gm, gd: dayCount };
}

function gregorianToJalali(gy, gm, gd) {
  let jy;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }

  let days = (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
  const gdm = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  for (let i = 1; i < gm; ++i) days += gdm[i];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) days++;

  days += gd - 1;

  let jDayNo = days - 79;

  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  jy += 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm, jd;
  for (jm = 1; jm <= 12; jm++) {
    const daysInMonth = jalaliMonthDays(jy, jm);
    if (jDayNo < daysInMonth) break;
    jDayNo -= daysInMonth;
  }
  jd = jDayNo + 1;

  return { jy: jy + 1, jm, jd };
}

function jalaliMonthDays(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

function diffJalali(jy, jm, jd, toGy, toGm, toGd) {
  const birth = jalaliToGregorian(jy, jm, jd);
  let y = toGy - birth.gy;
  let m = toGm - birth.gm;
  let d = toGd - birth.gd;

  if (d < 0) {
    m -= 1;
    const prevMonth = toGm - 1 <= 0 ? 12 : toGm - 1;
    const prevYear = prevMonth === 12 ? toGy - 1 : toGy;
    d += daysInGregorianMonth(prevYear, prevMonth);
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { years: y, months: m, days: d };
}

function daysInGregorianMonth(gy, gm) {
  const md = [31,28,31,30,31,30,31,31,30,31,30,31];
  if (gm === 2 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) return 29;
  return md[gm - 1];
}

// ===========================
// LMS Helpers
// ===========================
function getLMSRecord(ageMonths, isMale) {
  const month = Math.floor(Number(ageMonths));
  const map = isMale ? window.LMS?.boys : window.LMS?.girls;
  if (!map || !(map instanceof Map)) return null;
  if (month < 61 || month > 228) return null;
  return map.get(month) || null;
}

function calcZScore(bmi, L, M, S) {
  if (L === 0) return Math.log(bmi / M) / S;
  return (Math.pow(bmi / M, L) - 1) / (L * S);
}

function classifyZScore(z) {
  if (z < -3) return "بشدت لاغر";
  if (z < -2) return "لاغر";
  if (z <= 1) return "نرمال";
  if (z <= 2) return "اضافه‌وزن";
  return "چاق";
}

// ===========================
// UI Init
// ===========================
const yearsList = document.getElementById("yearsList");
const birthYear = document.getElementById("birthYear");
const birthMonth = document.getElementById("birthMonth");
const birthDay = document.getElementById("birthDay");

const heightInput = document.getElementById("height");
const weightInput = document.getElementById("weight");
const activity = document.getElementById("activity");

const genderFemale = document.getElementById("genderFemale");
const genderMale = document.getElementById("genderMale");
let gender = "female";

function initYears() {
  const now = new Date();
  const g = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const currentJY = g.jy;

  yearsList.innerHTML = "";
  for (let y = currentJY; y >= currentJY - 120; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    yearsList.appendChild(opt);
  }
}

function initMonths() {
  birthMonth.innerHTML = "";
  jalaliMonths.forEach((m, i) => {
    const opt = document.createElement("option");
    opt.value = i + 1;
    opt.textContent = m;
    birthMonth.appendChild(opt);
  });
}

function updateDays() {
  const jy = Number(birthYear.value);
  const jm = Number(birthMonth.value);
  if (!jy || !jm) return;
  const maxDays = jalaliMonthDays(jy, jm);
  birthDay.innerHTML = "";
  for (let d = 1; d <= maxDays; d++) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    birthDay.appendChild(opt);
  }
}

genderFemale.addEventListener("click", () => {
  gender = "female";
  genderFemale.classList.add("active");
  genderMale.classList.remove("active");
});

genderMale.addEventListener("click", () => {
  gender = "male";
  genderMale.classList.add("active");
  genderFemale.classList.remove("active");
});

birthYear.addEventListener("input", updateDays);
birthMonth.addEventListener("change", updateDays);

// ===========================
// Calculations
// ===========================
function calculate() {
  const jy = Number(birthYear.value);
  const jm = Number(birthMonth.value);
  const jd = Number(birthDay.value);

  const h = Number(heightInput.value);
  const w = Number(weightInput.value);
  const act = Number(activity.value);

  const exactAgeResult = document.getElementById("exactAgeResult");
  const bmiResult = document.getElementById("bmiResult");
  const zScoreResult = document.getElementById("zScoreResult");
  const bmrResult = document.getElementById("bmrResult");
  const tdeeResult = document.getElementById("tdeeResult");

  if (!jy || !jm || !jd || !h || !w) {
    exactAgeResult.textContent = "سن دقیق: —";
    bmiResult.textContent = "شاخص توده بدنی (BMI): —";
    zScoreResult.textContent = "طبقه‌بندی: —";
    bmrResult.textContent = "BMR (متابولیسم پایه): —";
    tdeeResult.textContent = "TDEE (کالری روزانه): —";
    return;
  }

  const now = new Date();
  const age = diffJalali(jy, jm, jd, now.getFullYear(), now.getMonth() + 1, now.getDate());
  exactAgeResult.textContent = `سن دقیق: ${age.years} سال، ${age.months} ماه، ${age.days} روز`;

  const heightM = h / 100;
  const bmi = w / (heightM * heightM);
  bmiResult.textContent = `شاخص توده بدنی (BMI): ${bmi.toFixed(1)}`;

  const ageMonths = age.years * 12 + age.months;
  if (ageMonths >= 61 && ageMonths <= 228) {
    const lms = getLMSRecord(ageMonths, gender === "male");
    if (!lms) {
      zScoreResult.textContent = `اطلاعات مرجع برای سن ${ageMonths} ماه یافت نشد.`;
    } else {
      const z = calcZScore(bmi, lms.L, lms.M, lms.S);
      const cat = classifyZScore(z);
      zScoreResult.textContent = `طبقه‌بندی بر اساس Z-Score: ${cat} (Z=${z.toFixed(2)})`;
    }
  } else {
    zScoreResult.textContent = "طبقه‌بندی: برای بزرگسالان از جدول Z-Score استفاده نمی‌شود.";
  }

  // BMR: Mifflin-St Jeor
  const ageYears = age.years;
  let bmr;
  if (gender === "male") {
    bmr = 10 * w + 6.25 * h - 5 * ageYears + 5;
  } else {
    bmr = 10 * w + 6.25 * h - 5 * ageYears - 161;
  }

  const tdee = bmr * act;
  bmrResult.textContent = `BMR (متابولیسم پایه): ${Math.round(bmr)} kcal`;
  tdeeResult.textContent = `TDEE (کالری روزانه): ${Math.round(tdee)} kcal`;
}

document.getElementById("calcBtn").addEventListener("click", calculate);

// ===========================
// PDF Export
// ===========================
document.getElementById("pdfBtn").addEventListener("click", () => {
  const hint = document.getElementById("pdfHint");

  if (typeof html2pdf === "undefined") {
    hint.textContent = "خطا: کتابخانه PDF لود نشده است. لطفاً فایل js/html2pdf.bundle.min.js را کامل و صحیح قرار دهید.";
    return;
  }

  const element = document.getElementById("resultsCard");
  const opt = {
    margin: 0.4,
    filename: `Komaketim-Report-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, backgroundColor: "#0c1120" },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(element).save();
  hint.textContent = "";
});

// ===========================
// Init
// ===========================
initYears();
initMonths();
updateDays();
