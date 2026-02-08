const siteName = "کمکتیم";
const siteUrl = "Komaketim.ir";

const fmt = (n, d = 2) => Number(n).toFixed(d);

const bmiCategoryAdult = (bmi) => {
  if (bmi < 18.5) return "کم‌وزن";
  if (bmi < 25) return "نرمال";
  if (bmi < 30) return "اضافه‌وزن";
  if (bmi < 35) return "چاقی درجه 1";
  if (bmi < 40) return "چاقی درجه 2";
  return "چاقی درجه 3";
};

const whoCategory = (z) => {
  if (z < -3) return "لاغری شدید";
  if (z < -2) return "لاغری";
  if (z <= 1) return "نرمال";
  if (z <= 2) return "اضافه‌وزن";
  if (z <= 3) return "چاقی";
  return "چاقی شدید";
};

const calcBMI = (w, hCm) => {
  const h = hCm / 100;
  return w / (h * h);
};

const zScore = (bmi, L, M, S) => {
  if (L === 0) return Math.log(bmi / M) / S;
  return (Math.pow(bmi / M, L) - 1) / (L * S);
};

const bmrMifflin = (sex, w, h, age) => {
  if (sex === "male") return 10 * w + 6.25 * h - 5 * age + 5;
  return 10 * w + 6.25 * h - 5 * age - 161;
};

const setPdfDate = () => {
  const d = new Date();
  document.getElementById("pdfDate").textContent = d.toLocaleDateString("fa-IR");
};

const showResult = (el, html) => {
  el.innerHTML = html;
  el.classList.remove("hidden");
};

const syncPdfBlock = (block, html) => {
  block.innerHTML = html;
  block.classList.remove("hidden");
};

const hidePdfBlock = (block) => {
  block.classList.add("hidden");
  block.innerHTML = "";
};

const switchTabs = () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-section");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`).classList.add("active");
    });
  });
};

const validateNumber = (v) => !isNaN(v) && v > 0;

const calcAdultHandler = () => {
  const w = parseFloat(document.getElementById("adultWeight").value);
  const h = parseFloat(document.getElementById("adultHeight").value);
  const age = document.getElementById("adultAge").value;

  if (!validateNumber(w) || !validateNumber(h)) {
    alert("وزن و قد را درست وارد کنید.");
    return;
  }

  const bmi = calcBMI(w, h);
  const cat = bmiCategoryAdult(bmi);

  const html = `
    <strong>نتیجه BMI بزرگسال</strong><br/>
    BMI: <b>${fmt(bmi)}</b><br/>
    وضعیت: <b>${cat}</b><br/>
    ${age ? `سن: <b>${age}</b> سال` : ""}
  `;
  showResult(document.getElementById("adultResult"), html);
  syncPdfBlock(document.getElementById("pdfAdult"), html);
};

const calcChildHandler = () => {
  const sex = document.getElementById("childSex").value;
  const years = parseInt(document.getElementById("childAgeYears").value || "0", 10);
  const months = parseInt(document.getElementById("childAgeMonths").value || "0", 10);
  const w = parseFloat(document.getElementById("childWeight").value);
  const h = parseFloat(document.getElementById("childHeight").value);

  if (months < 0 || months > 11) {
    alert("ماه باید بین 0 تا 11 باشد.");
    return;
  }
  if (!validateNumber(w) || !validateNumber(h)) {
    alert("وزن و قد را درست وارد کنید.");
    return;
  }

  const totalMonths = years * 12 + months;
  if (totalMonths < 61 || totalMonths > 228) {
    alert("سن کودک/نوجوان باید بین ۶۱ تا ۲۲۸ ماه باشد.");
    return;
  }

  const map = sex === "male" ? LMS.boys : LMS.girls;
  const lms = map.get(totalMonths);
  if (!lms) {
    alert("داده LMS برای این ماه پیدا نشد.");
    return;
  }

  const bmi = calcBMI(w, h);
  const z = zScore(bmi, lms.L, lms.M, lms.S);
  const cat = whoCategory(z);

  const html = `
    <strong>نتیجه BMI کودک/نوجوان (WHO)</strong><br/>
    سن: <b>${years} سال و ${months} ماه</b><br/>
    BMI: <b>${fmt(bmi)}</b><br/>
    Z-Score: <b>${fmt(z)}</b><br/>
    وضعیت: <b>${cat}</b>
  `;
  showResult(document.getElementById("childResult"), html);
  syncPdfBlock(document.getElementById("pdfChild"), html);
};

const calcBmrHandler = () => {
  const sex = document.getElementById("bmrSex").value;
  const age = parseFloat(document.getElementById("bmrAge").value);
  const w = parseFloat(document.getElementById("bmrWeight").value);
  const h = parseFloat(document.getElementById("bmrHeight").value);
  const activity = parseFloat(document.getElementById("activityLevel").value);

  if (!validateNumber(age) || !validateNumber(w) || !validateNumber(h)) {
    alert("سن، وزن و قد را درست وارد کنید.");
    return;
  }

  const bmr = bmrMifflin(sex, w, h, age);
  const tdee = bmr * activity;

  const html = `
    <strong>نتیجه BMR و TDEE</strong><br/>
    BMR: <b>${fmt(bmr)}</b> کالری در روز<br/>
    TDEE: <b>${fmt(tdee)}</b> کالری در روز
  `;
  showResult(document.getElementById("bmrResult"), html);
  syncPdfBlock(document.getElementById("pdfBmr"), html);
};

const downloadPdf = async () => {
  const pdfArea = document.getElementById("pdf-area");
  if (!pdfArea) return;

  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(pdfArea, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save("Komaketim-Report.pdf");
};

document.getElementById("calcAdult").addEventListener("click", calcAdultHandler);
document.getElementById("calcChild").addEventListener("click", calcChildHandler);
document.getElementById("calcBmr").addEventListener("click", calcBmrHandler);
document.getElementById("btnDownloadPdf").addEventListener("click", downloadPdf);

setPdfDate();
switchTabs();
