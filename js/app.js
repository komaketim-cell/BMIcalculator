(() => {
  const $ = (id) => document.getElementById(id);

  const el = {
    genderMale: $("genderMale"),
    genderFemale: $("genderFemale"),
    birthYear: $("birthYear"),
    birthMonth: $("birthMonth"),
    birthDay: $("birthDay"),
    heightCm: $("heightCm"),
    weightKg: $("weightKg"),
    activityLevel: $("activityLevel"),
    calcBtn: $("calcBtn"),
    pdfBtn: $("pdfBtn"),
    ageResult: $("ageResult"),
    bmiResult: $("bmiResult"),
    bmiCategory: $("bmiCategory"),
    bmrResult: $("bmrResult"),
    tdeeResult: $("tdeeResult"),
    zScoreResult: $("zScoreResult"),
    toast: $("toast"),
    resultCard: $("resultCard")
  };

  let gender = "male";

  const showToast = (msg) => {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    setTimeout(() => el.toast.classList.remove("show"), 2500);
  };

  const populateDateSelects = () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    for (let y = currentYear; y >= currentYear - 100; y--) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      if (y === currentYear - 25) opt.selected = true;
      el.birthYear.appendChild(opt);
    }

    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      if (m === 1) opt.selected = true;
      el.birthMonth.appendChild(opt);
    }

    updateDays();
  };

  const daysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const updateDays = () => {
    const y = parseInt(el.birthYear.value, 10);
    const m = parseInt(el.birthMonth.value, 10);
    const maxDay = daysInMonth(y, m);

    const current = parseInt(el.birthDay.value || "1", 10);
    el.birthDay.innerHTML = "";
    for (let d = 1; d <= maxDay; d++) {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      if (d === Math.min(current, maxDay)) opt.selected = true;
      el.birthDay.appendChild(opt);
    }
  };

  const getAge = (birthDate, now = new Date()) => {
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    let days = now.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const ageInMonths = years * 12 + months + (days >= 15 ? 1 : 0);

    return { years, months, days, ageInMonths };
  };

  const bmiCategory = (bmi) => {
    if (bmi < 18.5) return "کم‌وزن";
    if (bmi < 25) return "نرمال";
    if (bmi < 30) return "اضافه‌وزن";
    if (bmi < 35) return "چاقی درجه ۱";
    if (bmi < 40) return "چاقی درجه ۲";
    return "چاقی شدید";
  };

  const calcBMR = (weight, height, ageYears, gender) => {
    if (gender === "male") {
      return 10 * weight + 6.25 * height - 5 * ageYears + 5;
    }
    return 10 * weight + 6.25 * height - 5 * ageYears - 161;
  };

  const calcZScore = (bmi, ageMonths, gender) => {
    if (!window.LMS) return null;
    const table = gender === "male" ? window.LMS.boys : window.LMS.girls;
    if (!table || table.size === 0) return null;

    const minMonth = 61;
    const maxMonth = 228;
    if (ageMonths < minMonth || ageMonths > maxMonth) return null;

    const monthKey = Math.min(maxMonth, Math.max(minMonth, ageMonths));
    const lms = table.get(monthKey);
    if (!lms) return null;

    const { L, M, S } = lms;
    if (L === 0) {
      return Math.log(bmi / M) / S;
    }
    return (Math.pow(bmi / M, L) - 1) / (L * S);
  };

  const formatNumber = (n, digits = 2) => {
    return Number.isFinite(n) ? n.toFixed(digits) : "—";
  };

  const calculate = () => {
    const height = parseFloat(el.heightCm.value);
    const weight = parseFloat(el.weightKg.value);

    if (!height || !weight || height <= 0 || weight <= 0) {
      showToast("قد و وزن معتبر وارد کنید");
      return;
    }

    const y = parseInt(el.birthYear.value, 10);
    const m = parseInt(el.birthMonth.value, 10);
    const d = parseInt(el.birthDay.value, 10);
    const birthDate = new Date(y, m - 1, d);

    if (isNaN(birthDate.getTime())) {
      showToast("تاریخ تولد معتبر نیست");
      return;
    }

    const age = getAge(birthDate);
    const bmi = weight / Math.pow(height / 100, 2);
    const bmr = calcBMR(weight, height, age.years, gender);
    const tdee = bmr * parseFloat(el.activityLevel.value);

    el.ageResult.textContent = `سن دقیق: ${age.years} سال، ${age.months} ماه، ${age.days} روز`;
    el.bmiResult.textContent = `BMI: ${formatNumber(bmi, 2)}`;
    el.bmiCategory.textContent = `تفسیر BMI: ${bmiCategory(bmi)}`;
    el.bmrResult.textContent = `BMR: ${formatNumber(bmr, 0)} کیلوکالری`;
    el.tdeeResult.textContent = `TDEE: ${formatNumber(tdee, 0)} کیلوکالری`;

    const z = calcZScore(bmi, age.ageInMonths, gender);
    el.zScoreResult.textContent = z === null
      ? "Z-Score (۵ تا ۱۹ سال): قابل محاسبه نیست"
      : `Z-Score (۵ تا ۱۹ سال): ${formatNumber(z, 2)}`;
  };

  const handlePDF = async () => {
    if (!window.html2canvas || !window.jspdf) {
      showToast("کتابخانه PDF لود نشده است");
      return;
    }

    document.body.classList.add("pdf-mode");

    const canvas = await html2canvas(el.resultCard, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("health-results.pdf");

    document.body.classList.remove("pdf-mode");
  };

  el.genderMale.addEventListener("click", () => {
    gender = "male";
    el.genderMale.classList.add("active");
    el.genderFemale.classList.remove("active");
  });

  el.genderFemale.addEventListener("click", () => {
    gender = "female";
    el.genderFemale.classList.add("active");
    el.genderMale.classList.remove("active");
  });

  el.birthYear.addEventListener("change", updateDays);
  el.birthMonth.addEventListener("change", updateDays);

  el.calcBtn.addEventListener("click", calculate);
  el.pdfBtn.addEventListener("click", handlePDF);

  populateDateSelects();
})();
