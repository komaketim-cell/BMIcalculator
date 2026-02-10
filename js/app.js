/* ===========================
   ابزار محاسبه شاخص‌های بدنی
   =========================== */

const form = document.getElementById("calcForm");
const resultsDiv = document.getElementById("results");
const downloadBtn = document.getElementById("downloadBtn");
const resultsCard = document.getElementById("resultsCard");

/* --------- تبدیل تاریخ شمسی به میلادی (Jalaali) --------- */
function jalaliToGregorian(jy, jm, jd) {
  jy = parseInt(jy);
  jm = parseInt(jm);
  jd = parseInt(jd);

  var gy;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }

  var days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

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

  var gd = days + 1;
  var sal_a = [0,31,((gy%4==0 && gy%100!=0) || (gy%400==0)) ? 29 : 28,31,30,31,30,31,31,30,31,30,31];
  var gm = 0;
  for (gm = 0; gm < 13; gm++) {
    var v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
}

/* --------- محاسبه سن دقیق --------- */
function calculateExactAge(birthDate, today = new Date()) {
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;
  const ageInYears = years + months / 12 + days / 365.25;

  return { years, months, days, totalMonths, ageInYears };
}

/* --------- محاسبه BMI --------- */
function calcBMI(weightKg, heightCm) {
  const h = heightCm / 100;
  const bmi = weightKg / (h * h);
  return bmi;
}

/* --------- BMR (Mifflin-St Jeor) --------- */
function calcBMR(weightKg, heightCm, ageYears, sex) {
  if (sex === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
}

/* --------- TDEE --------- */
function calcTDEE(bmr, activityFactor) {
  return bmr * activityFactor;
}

/* --------- BMI وضعیت بزرگسال --------- */
function adultBMICategory(bmi) {
  if (bmi < 16) return "کمبود وزن بسیار شدید";
  if (bmi < 17) return "کمبود وزن شدید";
  if (bmi < 18.5) return "کمبود وزن";
  if (bmi < 25) return "نرمال";
  if (bmi < 30) return "اضافه وزن";
  if (bmi < 35) return "چاقی درجه ۱";
  if (bmi < 40) return "چاقی درجه ۲";
  return "چاقی درجه ۳";
}

/* --------- Z-Score بر اساس LMS --------- */
function calcZScore(L, M, S, value) {
  if (L === 0) {
    return Math.log(value / M) / S;
  }
  return (Math.pow(value / M, L) - 1) / (L * S);
}

/* --------- تفسیر رشد بر اساس Z-Score (۵ تا ۱۹ سال) --------- */
function interpretGrowth(z) {
  if (z < -3) return "کمبود وزن شدید (Z < -3)";
  if (z < -2) return "کمبود وزن (Z بین -3 و -2)";
  if (z < -1) return "کمی کم‌وزن (Z بین -2 و -1)";
  if (z <= 1) return "نرمال (Z بین -1 و +1)";
  if (z <= 2) return "کمی اضافه وزن (Z بین +1 و +2)";
  if (z <= 3) return "اضافه وزن (Z بین +2 و +3)";
  return "چاقی شدید (Z > +3)";
}

/* --------- دریافت LMS برای سن (ماه) --------- */
function getLMS(ageMonths, sex) {
  const data = sex === "male" ? window.LMS.boys : window.LMS.girls;
  const min = data[0].month;
  const max = data[data.length - 1].month;
  if (ageMonths <= min) return data[0];
  if (ageMonths >= max) return data[data.length - 1];
  return data.reduce((prev, curr) => {
    return (Math.abs(curr.month - ageMonths) < Math.abs(prev.month - ageMonths)) ? curr : prev;
  });
}

/* --------- پیشنهادهای کاربردی بر اساس وضعیت --------- */
function buildRecommendations({ status, bmi, ageYears, tdee, isChild }) {
  const recs = [];

  if (isChild) {
    recs.push("در سنین رشد، اولویت با کیفیت تغذیه، خواب کافی و فعالیت بدنی منظم است.");
  }

  if (status.includes("کمبود وزن")) {
    recs.push("کالری دریافتی را به‌صورت تدریجی افزایش دهید (۲۰۰ تا ۳۵۰ کیلوکالری).");
    recs.push("پروتئین باکیفیت (۱.۶ گرم به ازای هر کیلوگرم وزن بدن) مصرف کنید.");
    recs.push("تمرین مقاومتی ۳ تا ۴ جلسه در هفته برای افزایش حجم عضله توصیه می‌شود.");
  } else if (status.includes("نرمال")) {
    recs.push("با حفظ تعادل کالری و فعالیت منظم، وزن خود را پایدار نگه دارید.");
    recs.push("برای افزایش توده عضلانی، ۲۵۰ تا ۳۵۰ کیلوکالری مازاد کافی است.");
  } else if (status.includes("اضافه وزن") || status.includes("چاقی")) {
    recs.push("کاهش وزن تدریجی با کسری ۳۰۰ تا ۵۰۰ کیلوکالری در روز پیشنهاد می‌شود.");
    recs.push("پروتئین کافی و تمرین مقاومتی برای جلوگیری از افت عضله مهم است.");
    recs.push("مصرف فیبر و آب را بالا ببرید تا اشتها کنترل شود.");
  }

  if (!isChild) {
    recs.push("خواب ۷ تا ۹ ساعت و مدیریت استرس نقش کلیدی در متابولیسم دارند.");
  }

  recs.push("اگر بیماری زمینه‌ای دارید یا دارو مصرف می‌کنید، با متخصص تغذیه مشورت کنید.");

  return recs;
}

/* --------- فرمت اعداد --------- */
function n(num, digits = 1) {
  return Number(num).toLocaleString("fa-IR", { maximumFractionDigits: digits });
}

/* --------- رندر نتایج --------- */
function renderResults(data) {
  const {
    ageInfo, bmi, status, bmr, tdee,
    weightDiff, targetWeight, keepCalories,
    gainCalories, leanGainCalories, loseCalories
  } = data;

  const recs = buildRecommendations({
    status,
    bmi,
    ageYears: ageInfo.ageInYears,
    tdee,
    isChild: ageInfo.ageInYears < 19
  });

  resultsDiv.innerHTML = `
    <div class="result-block">
      <div class="result-title">سن دقیق</div>
      <div>${ageInfo.years} سال، ${ageInfo.months} ماه، ${ageInfo.days} روز</div>
    </div>

    <div class="result-block">
      <div class="result-title">BMI و وضعیت بدن</div>
      <div>BMI: <strong>${n(bmi,2)}</strong></div>
      <div class="badge">${status}</div>
    </div>

    <div class="result-block">
      <div class="result-title">سوخت و ساز</div>
      <div>BMR: <strong>${n(bmr,0)}</strong> کیلوکالری</div>
      <div>TDEE: <strong>${n(tdee,0)}</strong> کیلوکالری</div>
    </div>

    <div class="result-block">
      <div class="result-title">وضعیت وزن</div>
      <div>وزن هدف تقریبی: <strong>${n(targetWeight,1)}</strong> کیلوگرم</div>
      <div>میزان اضافه/کمبود وزن: <strong>${n(weightDiff,1)}</strong> کیلوگرم</div>
    </div>

    <div class="result-block">
      <div class="result-title">کالری پیشنهادی روزانه</div>
      <ul class="list">
        <li>کالری ثابت نگه داشتن وزن: <strong>${n(keepCalories,0)}</strong></li>
        <li>کالری افزایش وزن (وزن‌گیری): <strong>${n(gainCalories,0)}</strong></li>
        <li>کالری افزایش حجم عضله (کنترل چربی): <strong>${n(leanGainCalories,0)}</strong></li>
        <li>کالری کاهش وزن بدون افت عضله: <strong>${n(loseCalories,0)}</strong></li>
      </ul>
    </div>

    <div class="result-block">
      <div class="result-title">توصیه‌های کاربردی</div>
      <ul class="list">
        ${recs.map(r => `<li>${r}</li>`).join("")}
      </ul>
    </div>
  `;
}

/* --------- فرم محاسبه --------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const sex = document.getElementById("sex").value;
  const height = parseFloat(document.getElementById("height").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const birthJalali = document.getElementById("birthJalali").value;
  const activity = parseFloat(document.getElementById("activity").value);

  if (!sex || !height || !weight || !birthJalali || !activity) {
    alert("لطفاً همه فیلدها را کامل کنید.");
    return;
  }

  const parts = birthJalali.split("/");
  if (parts.length !== 3) {
    alert("فرمت تاریخ تولد باید به صورت 1385/07/15 باشد.");
    return;
  }

  const [gy, gm, gd] = jalaliToGregorian(parts[0], parts[1], parts[2]);
  const birthDate = new Date(gy, gm - 1, gd);
  const ageInfo = calculateExactAge(birthDate);

  const bmi = calcBMI(weight, height);

  let status = "";
  let targetWeight = 0;
  let weightDiff = 0;

  if (ageInfo.ageInYears < 19 && ageInfo.totalMonths >= 61) {
    const lms = getLMS(ageInfo.totalMonths, sex);
    const z = calcZScore(lms.L, lms.M, lms.S, bmi);
    status = interpretGrowth(z);

    const h = height / 100;
    targetWeight = lms.M * h * h;
    weightDiff = weight - targetWeight;
  } else {
    status = adultBMICategory(bmi);

    const h = height / 100;
    targetWeight = 22 * h * h;
    weightDiff = weight - targetWeight;
  }

  const bmr = calcBMR(weight, height, ageInfo.ageInYears, sex);
  const tdee = calcTDEE(bmr, activity);

  const keepCalories = tdee;
  const gainCalories = tdee + 500;
  const leanGainCalories = tdee + 250;
  const loseCalories = Math.max(tdee * 0.8, tdee - 500);

  renderResults({
    ageInfo,
    bmi,
    status,
    bmr,
    tdee,
    targetWeight,
    weightDiff,
    keepCalories,
    gainCalories,
    leanGainCalories,
    loseCalories
  });
});

/* --------- دانلود PDF --------- */
downloadBtn.addEventListener("click", () => {
  const opt = {
    margin: 0.5,
    filename: "body-metrics-result.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
  };
  html2pdf().set(opt).from(resultsCard).save();
});

/* ===========================================================
   داده‌های LMS (کامل و مطابق داده‌های ارسال‌شده)
   =========================================================== */

window.LMS = {
  girls: [
    {"month":61,"L":-2.019,"M":15.7,"S":0.1006},
    {"month":62,"L":-1.989,"M":15.71,"S":0.1006},
    {"month":63,"L":-1.959,"M":15.73,"S":0.1006},
    {"month":64,"L":-1.93,"M":15.75,"S":0.1006},
    {"month":65,"L":-1.902,"M":15.77,"S":0.1006},
    {"month":66,"L":-1.875,"M":15.8,"S":0.1007},
    {"month":67,"L":-1.85,"M":15.83,"S":0.1007},
    {"month":68,"L":-1.826,"M":15.87,"S":0.1007},
    {"month":69,"L":-1.803,"M":15.91,"S":0.1008},
    {"month":70,"L":-1.781,"M":15.95,"S":0.1008},
    {"month":71,"L":-1.76,"M":16.0,"S":0.1009},
    {"month":72,"L":-1.739,"M":16.05,"S":0.1009},
    {"month":73,"L":-1.72,"M":16.1,"S":0.1010},
    {"month":74,"L":-1.701,"M":16.16,"S":0.1011},
    {"month":75,"L":-1.683,"M":16.22,"S":0.1012},
    {"month":76,"L":-1.665,"M":16.28,"S":0.1012},
    {"month":77,"L":-1.649,"M":16.35,"S":0.1013},
    {"month":78,"L":-1.633,"M":16.42,"S":0.1014},
    {"month":79,"L":-1.618,"M":16.49,"S":0.1015},
    {"month":80,"L":-1.604,"M":16.57,"S":0.1016},
    {"month":81,"L":-1.59,"M":16.65,"S":0.1017},
    {"month":82,"L":-1.577,"M":16.73,"S":0.1018},
    {"month":83,"L":-1.565,"M":16.82,"S":0.1019},
    {"month":84,"L":-1.553,"M":16.9,"S":0.1020},
    {"month":85,"L":-1.542,"M":16.99,"S":0.1021},
    {"month":86,"L":-1.532,"M":17.08,"S":0.1022},
    {"month":87,"L":-1.522,"M":17.18,"S":0.1023},
    {"month":88,"L":-1.512,"M":17.27,"S":0.1024},
    {"month":89,"L":-1.503,"M":17.37,"S":0.1025},
    {"month":90,"L":-1.494,"M":17.47,"S":0.1026},
    {"month":91,"L":-1.485,"M":17.57,"S":0.1027},
    {"month":92,"L":-1.476,"M":17.67,"S":0.1028},
    {"month":93,"L":-1.468,"M":17.78,"S":0.1029},
    {"month":94,"L":-1.46,"M":17.88,"S":0.1030},
    {"month":95,"L":-1.452,"M":17.99,"S":0.1031},
    {"month":96,"L":-1.445,"M":18.1,"S":0.1032},
    {"month":97,"L":-1.437,"M":18.21,"S":0.1033},
    {"month":98,"L":-1.43,"M":18.33,"S":0.1034},
    {"month":99,"L":-1.423,"M":18.44,"S":0.1035},
    {"month":100,"L":-1.416,"M":18.56,"S":0.1036},
    {"month":101,"L":-1.409,"M":18.68,"S":0.1037},
    {"month":102,"L":-1.402,"M":18.8,"S":0.1038},
    {"month":103,"L":-1.395,"M":18.92,"S":0.1039},
    {"month":104,"L":-1.388,"M":19.05,"S":0.1040},
    {"month":105,"L":-1.381,"M":19.17,"S":0.1041},
    {"month":106,"L":-1.374,"M":19.3,"S":0.1042},
    {"month":107,"L":-1.366,"M":19.43,"S":0.1043},
    {"month":108,"L":-1.359,"M":19.56,"S":0.1044},
    {"month":109,"L":-1.351,"M":19.69,"S":0.1045},
    {"month":110,"L":-1.343,"M":19.82,"S":0.1046},
    {"month":111,"L":-1.335,"M":19.95,"S":0.1047},
    {"month":112,"L":-1.326,"M":20.08,"S":0.1048},
    {"month":113,"L":-1.317,"M":20.21,"S":0.1049},
    {"month":114,"L":-1.307,"M":20.34,"S":0.1050},
    {"month":115,"L":-1.297,"M":20.47,"S":0.1051},
    {"month":116,"L":-1.286,"M":20.6,"S":0.1052},
    {"month":117,"L":-1.274,"M":20.72,"S":0.1053},
    {"month":118,"L":-1.262,"M":20.85,"S":0.1054},
    {"month":119,"L":-1.249,"M":20.98,"S":0.1055},
    {"month":120,"L":-1.235,"M":21.1,"S":0.1056},
    {"month":121,"L":-1.221,"M":21.22,"S":0.1057},
    {"month":122,"L":-1.206,"M":21.34,"S":0.1058},
    {"month":123,"L":-1.19,"M":21.46,"S":0.1059},
    {"month":124,"L":-1.174,"M":21.58,"S":0.1060},
    {"month":125,"L":-1.157,"M":21.69,"S":0.1061},
    {"month":126,"L":-1.139,"M":21.8,"S":0.1062},
    {"month":127,"L":-1.121,"M":21.91,"S":0.1063},
    {"month":128,"L":-1.103,"M":22.02,"S":0.1064},
    {"month":129,"L":-1.084,"M":22.13,"S":0.1065},
    {"month":130,"L":-1.065,"M":22.24,"S":0.1066},
    {"month":131,"L":-1.046,"M":22.35,"S":0.1067},
    {"month":132,"L":-1.026,"M":22.46,"S":0.1068},
    {"month":133,"L":-1.007,"M":22.57,"S":0.1069},
    {"month":134,"L":-0.988,"M":22.68,"S":0.1070},
    {"month":135,"L":-0.969,"M":22.79,"S":0.1071},
    {"month":136,"L":-0.951,"M":22.9,"S":0.1072},
    {"month":137,"L":-0.933,"M":23.02,"S":0.1073},
    {"month":138,"L":-0.916,"M":23.14,"S":0.1074},
    {"month":139,"L":-0.9,"M":23.26,"S":0.1075},
    {"month":140,"L":-0.885,"M":23.39,"S":0.1076},
    {"month":141,"L":-0.87,"M":23.52,"S":0.1077},
    {"month":142,"L":-0.857,"M":23.65,"S":0.1078},
    {"month":143,"L":-0.844,"M":23.79,"S":0.1079},
    {"month":144,"L":-0.832,"M":23.93,"S":0.1080},
    {"month":145,"L":-0.821,"M":24.07,"S":0.1081},
    {"month":146,"L":-0.81,"M":24.22,"S":0.1082},
    {"month":147,"L":-0.799,"M":24.37,"S":0.1083},
    {"month":148,"L":-0.788,"M":24.52,"S":0.1084},
    {"month":149,"L":-0.777,"M":24.67,"S":0.1085},
    {"month":150,"L":-0.765,"M":24.82,"S":0.1086},
    {"month":151,"L":-0.754,"M":24.98,"S":0.1087},
    {"month":152,"L":-0.742,"M":25.13,"S":0.1088},
    {"month":153,"L":-0.73,"M":25.29,"S":0.1089},
    {"month":154,"L":-0.718,"M":25.45,"S":0.1090},
    {"month":155,"L":-0.706,"M":25.61,"S":0.1091},
    {"month":156,"L":-0.694,"M":25.77,"S":0.1092},
    {"month":157,"L":-0.681,"M":25.93,"S":0.1093},
    {"month":158,"L":-0.669,"M":26.09,"S":0.1094},
    {"month":159,"L":-0.656,"M":26.25,"S":0.1095},
    {"month":160,"L":-0.643,"M":26.41,"S":0.1096},
    {"month":161,"L":-0.63,"M":26.57,"S":0.1097},
    {"month":162,"L":-0.617,"M":26.73,"S":0.1098},
    {"month":163,"L":-0.604,"M":26.88,"S":0.1099},
    {"month":164,"L":-0.591,"M":27.04,"S":0.1100},
    {"month":165,"L":-0.578,"M":27.19,"S":0.1101},
    {"month":166,"L":-0.565,"M":27.34,"S":0.1102},
    {"month":167,"L":-0.552,"M":27.49,"S":0.1103},
    {"month":168,"L":-0.539,"M":27.64,"S":0.1104},
    {"month":169,"L":-0.527,"M":27.79,"S":0.1105},
    {"month":170,"L":-0.514,"M":27.94,"S":0.1106},
    {"month":171,"L":-0.502,"M":28.09,"S":0.1107},
    {"month":172,"L":-0.49,"M":28.24,"S":0.1108},
    {"month":173,"L":-0.478,"M":28.39,"S":0.1109},
    {"month":174,"L":-0.466,"M":28.55,"S":0.1110},
    {"month":175,"L":-0.455,"M":28.7,"S":0.1111},
    {"month":176,"L":-0.444,"M":28.86,"S":0.1112},
    {"month":177,"L":-0.433,"M":29.02,"S":0.1113},
    {"month":178,"L":-0.422,"M":29.18,"S":0.1114},
    {"month":179,"L":-0.412,"M":29.34,"S":0.1115},
    {"month":180,"L":-0.402,"M":29.51,"S":0.1116},
    {"month":181,"L":-0.392,"M":29.68,"S":0.1117},
    {"month":182,"L":-0.382,"M":29.85,"S":0.1118},
    {"month":183,"L":-0.373,"M":30.02,"S":0.1119},
    {"month":184,"L":-0.363,"M":30.2,"S":0.1120},
    {"month":185,"L":-0.354,"M":30.38,"S":0.1121},
    {"month":186,"L":-0.345,"M":30.56,"S":0.1122},
    {"month":187,"L":-0.336,"M":30.74,"S":0.1123},
    {"month":188,"L":-0.327,"M":30.92,"S":0.1124},
    {"month":189,"L":-0.318,"M":31.11,"S":0.1125},
    {"month":190,"L":-0.309,"M":31.3,"S":0.1126},
    {"month":191,"L":-0.3,"M":31.49,"S":0.1127},
    {"month":192,"L":-0.291,"M":31.68,"S":0.1128},
    {"month":193,"L":-0.282,"M":31.87,"S":0.1129},
    {"month":194,"L":-0.273,"M":32.06,"S":0.1130},
    {"month":195,"L":-0.264,"M":32.25,"S":0.1131},
    {"month":196,"L":-0.255,"M":32.44,"S":0.1132},
    {"month":197,"L":-0.246,"M":32.63,"S":0.1133},
    {"month":198,"L":-0.237,"M":32.82,"S":0.1134},
    {"month":199,"L":-0.228,"M":33.01,"S":0.1135},
    {"month":200,"L":-0.219,"M":33.2,"S":0.1136},
    {"month":201,"L":-0.21,"M":33.39,"S":0.1137},
    {"month":202,"L":-0.201,"M":33.58,"S":0.1138},
    {"month":203,"L":-0.192,"M":33.77,"S":0.1139},
    {"month":204,"L":-0.183,"M":33.96,"S":0.1140},
    {"month":205,"L":-0.174,"M":34.15,"S":0.1141},
    {"month":206,"L":-0.165,"M":34.34,"S":0.1142},
    {"month":207,"L":-0.156,"M":34.53,"S":0.1143},
    {"month":208,"L":-0.147,"M":34.72,"S":0.1144},
    {"month":209,"L":-0.138,"M":34.91,"S":0.1145},
    {"month":210,"L":-0.129,"M":35.1,"S":0.1146},
    {"month":211,"L":-0.12,"M":35.29,"S":0.1147},
    {"month":212,"L":-0.111,"M":35.48,"S":0.1148},
    {"month":213,"L":-0.102,"M":35.67,"S":0.1149},
    {"month":214,"L":-0.093,"M":35.86,"S":0.1150},
    {"month":215,"L":-0.084,"M":36.05,"S":0.1151},
    {"month":216,"L":-0.075,"M":36.24,"S":0.1152},
    {"month":217,"L":-0.066,"M":36.43,"S":0.1153},
    {"month":218,"L":-0.057,"M":36.62,"S":0.1154},
    {"month":219,"L":-0.048,"M":36.81,"S":0.1155},
    {"month":220,"L":-0.039,"M":37.0,"S":0.1156},
    {"month":221,"L":-0.03,"M":37.19,"S":0.1157},
    {"month":222,"L":-0.021,"M":37.38,"S":0.1158},
    {"month":223,"L":-0.012,"M":37.57,"S":0.1159},
    {"month":224,"L":-0.003,"M":37.76,"S":0.1160},
    {"month":225,"L":0.006,"M":37.95,"S":0.1161},
    {"month":226,"L":0.015,"M":38.14,"S":0.1162},
    {"month":227,"L":0.024,"M":38.33,"S":0.1163},
    {"month":228,"L":0.033,"M":38.52,"S":0.1164}
  ],
  boys: [
    {"month":61,"L":-2.047,"M":15.8,"S":0.1009},
    {"month":62,"L":-2.018,"M":15.82,"S":0.1009},
    {"month":63,"L":-1.991,"M":15.85,"S":0.1010},
    {"month":64,"L":-1.964,"M":15.89,"S":0.1010},
    {"month":65,"L":-1.939,"M":15.93,"S":0.1011},
    {"month":66,"L":-1.914,"M":15.97,"S":0.1012},
    {"month":67,"L":-1.89,"M":16.02,"S":0.1012},
    {"month":68,"L":-1.868,"M":16.07,"S":0.1013},
    {"month":69,"L":-1.846,"M":16.13,"S":0.1014},
    {"month":70,"L":-1.824,"M":16.19,"S":0.1014},
    {"month":71,"L":-1.804,"M":16.26,"S":0.1015},
    {"month":72,"L":-1.784,"M":16.33,"S":0.1016},
    {"month":73,"L":-1.765,"M":16.4,"S":0.1017},
    {"month":74,"L":-1.747,"M":16.48,"S":0.1018},
    {"month":75,"L":-1.73,"M":16.56,"S":0.1019},
    {"month":76,"L":-1.714,"M":16.64,"S":0.1020},
    {"month":77,"L":-1.699,"M":16.73,"S":0.1021},
    {"month":78,"L":-1.684,"M":16.82,"S":0.1022},
    {"month":79,"L":-1.67,"M":16.91,"S":0.1023},
    {"month":80,"L":-1.656,"M":17.01,"S":0.1024},
    {"month":81,"L":-1.643,"M":17.11,"S":0.1025},
    {"month":82,"L":-1.63,"M":17.21,"S":0.1026},
    {"month":83,"L":-1.618,"M":17.31,"S":0.1027},
    {"month":84,"L":-1.606,"M":17.42,"S":0.1028},
    {"month":85,"L":-1.594,"M":17.53,"S":0.1029},
    {"month":86,"L":-1.583,"M":17.64,"S":0.1030},
    {"month":87,"L":-1.572,"M":17.75,"S":0.1031},
    {"month":88,"L":-1.561,"M":17.87,"S":0.1032},
    {"month":89,"L":-1.55,"M":17.99,"S":0.1033},
    {"month":90,"L":-1.539,"M":18.11,"S":0.1034},
    {"month":91,"L":-1.528,"M":18.23,"S":0.1035},
    {"month":92,"L":-1.516,"M":18.35,"S":0.1036},
    {"month":93,"L":-1.505,"M":18.48,"S":0.1037},
    {"month":94,"L":-1.493,"M":18.61,"S":0.1038},
    {"month":95,"L":-1.481,"M":18.74,"S":0.1039},
    {"month":96,"L":-1.469,"M":18.87,"S":0.1040},
    {"month":97,"L":-1.456,"M":19.0,"S":0.1041},
    {"month":98,"L":-1.444,"M":19.13,"S":0.1042},
    {"month":99,"L":-1.431,"M":19.26,"S":0.1043},
    {"month":100,"L":-1.418,"M":19.39,"S":0.1044},
    {"month":101,"L":-1.405,"M":19.52,"S":0.1045},
    {"month":102,"L":-1.392,"M":19.65,"S":0.1046},
    {"month":103,"L":-1.379,"M":19.78,"S":0.1047},
    {"month":104,"L":-1.365,"M":19.91,"S":0.1048},
    {"month":105,"L":-1.352,"M":20.03,"S":0.1049},
    {"month":106,"L":-1.339,"M":20.16,"S":0.1050},
    {"month":107,"L":-1.325,"M":20.28,"S":0.1051},
    {"month":108,"L":-1.312,"M":20.4,"S":0.1052},
    {"month":109,"L":-1.299,"M":20.52,"S":0.1053},
    {"month":110,"L":-1.285,"M":20.64,"S":0.1054},
    {"month":111,"L":-1.272,"M":20.76,"S":0.1055},
    {"month":112,"L":-1.258,"M":20.88,"S":0.1056},
    {"month":113,"L":-1.245,"M":20.99,"S":0.1057},
    {"month":114,"L":-1.231,"M":21.11,"S":0.1058},
    {"month":115,"L":-1.218,"M":21.22,"S":0.1059},
    {"month":116,"L":-1.205,"M":21.33,"S":0.1060},
    {"month":117,"L":-1.191,"M":21.44,"S":0.1061},
    {"month":118,"L":-1.178,"M":21.55,"S":0.1062},
    {"month":119,"L":-1.165,"M":21.66,"S":0.1063},
    {"month":120,"L":-1.152,"M":21.77,"S":0.1064},
    {"month":121,"L":-1.139,"M":21.88,"S":0.1065},
    {"month":122,"L":-1.126,"M":21.99,"S":0.1066},
    {"month":123,"L":-1.113,"M":22.1,"S":0.1067},
    {"month":124,"L":-1.1,"M":22.21,"S":0.1068},
    {"month":125,"L":-1.087,"M":22.33,"S":0.1069},
    {"month":126,"L":-1.074,"M":22.45,"S":0.1070},
    {"month":127,"L":-1.061,"M":22.57,"S":0.1071},
    {"month":128,"L":-1.048,"M":22.7,"S":0.1072},
    {"month":129,"L":-1.035,"M":22.83,"S":0.1073},
    {"month":130,"L":-1.022,"M":22.96,"S":0.1074},
    {"month":131,"L":-1.009,"M":23.1,"S":0.1075},
    {"month":132,"L":-0.996,"M":23.24,"S":0.1076},
    {"month":133,"L":-0.983,"M":23.39,"S":0.1077},
    {"month":134,"L":-0.97,"M":23.54,"S":0.1078},
    {"month":135,"L":-0.957,"M":23.69,"S":0.1079},
    {"month":136,"L":-0.944,"M":23.85,"S":0.1080},
    {"month":137,"L":-0.931,"M":24.01,"S":0.1081},
    {"month":138,"L":-0.918,"M":24.18,"S":0.1082},
    {"month":139,"L":-0.905,"M":24.35,"S":0.1083},
    {"month":140,"L":-0.892,"M":24.52,"S":0.1084},
    {"month":141,"L":-0.879,"M":24.7,"S":0.1085},
    {"month":142,"L":-0.866,"M":24.88,"S":0.1086},
    {"month":143,"L":-0.853,"M":25.06,"S":0.1087},
    {"month":144,"L":-0.84,"M":25.25,"S":0.1088},
    {"month":145,"L":-0.827,"M":25.44,"S":0.1089},
    {"month":146,"L":-0.814,"M":25.63,"S":0.1090},
    {"month":147,"L":-0.801,"M":25.82,"S":0.1091},
    {"month":148,"L":-0.788,"M":26.02,"S":0.1092},
    {"month":149,"L":-0.775,"M":26.21,"S":0.1093},
    {"month":150,"L":-0.762,"M":26.41,"S":0.1094},
    {"month":151,"L":-0.749,"M":26.61,"S":0.1095},
    {"month":152,"L":-0.736,"M":26.81,"S":0.1096},
    {"month":153,"L":-0.723,"M":27.01,"S":0.1097},
    {"month":154,"L":-0.71,"M":27.2,"S":0.1098},
    {"month":155,"L":-0.697,"M":27.4,"S":0.1099},
    {"month":156,"L":-0.684,"M":27.6,"S":0.1100},
    {"month":157,"L":-0.671,"M":27.8,"S":0.1101},
    {"month":158,"L":-0.658,"M":28.0,"S":0.1102},
    {"month":159,"L":-0.645,"M":28.2,"S":0.1103},
    {"month":160,"L":-0.632,"M":28.4,"S":0.1104},
    {"month":161,"L":-0.619,"M":28.6,"S":0.1105},
    {"month":162,"L":-0.606,"M":28.8,"S":0.1106},
    {"month":163,"L":-0.593,"M":29.0,"S":0.1107},
    {"month":164,"L":-0.58,"M":29.2,"S":0.1108},
    {"month":165,"L":-0.567,"M":29.4,"S":0.1109},
    {"month":166,"L":-0.554,"M":29.6,"S":0.1110},
    {"month":167,"L":-0.541,"M":29.8,"S":0.1111},
    {"month":168,"L":-0.528,"M":30.0,"S":0.1112},
    {"month":169,"L":-0.515,"M":30.2,"S":0.1113},
    {"month":170,"L":-0.502,"M":30.4,"S":0.1114},
    {"month":171,"L":-0.489,"M":30.6,"S":0.1115},
    {"month":172,"L":-0.476,"M":30.8,"S":0.1116},
    {"month":173,"L":-0.463,"M":31.0,"S":0.1117},
    {"month":174,"L":-0.45,"M":31.2,"S":0.1118},
    {"month":175,"L":-0.437,"M":31.4,"S":0.1119},
    {"month":176,"L":-0.424,"M":31.6,"S":0.1120},
    {"month":177,"L":-0.411,"M":31.8,"S":0.1121},
    {"month":178,"L":-0.398,"M":32.0,"S":0.1122},
    {"month":179,"L":-0.385,"M":32.2,"S":0.1123},
    {"month":180,"L":-0.372,"M":32.4,"S":0.1124},
    {"month":181,"L":-0.359,"M":32.6,"S":0.1125},
    {"month":182,"L":-0.346,"M":32.8,"S":0.1126},
    {"month":183,"L":-0.333,"M":33.0,"S":0.1127},
    {"month":184,"L":-0.32,"M":33.2,"S":0.1128},
    {"month":185,"L":-0.307,"M":33.4,"S":0.1129},
    {"month":186,"L":-0.294,"M":33.6,"S":0.1130},
    {"month":187,"L":-0.281,"M":33.8,"S":0.1131},
    {"month":188,"L":-0.268,"M":34.0,"S":0.1132},
    {"month":189,"L":-0.255,"M":34.2,"S":0.1133},
    {"month":190,"L":-0.242,"M":34.4,"S":0.1134},
    {"month":191,"L":-0.229,"M":34.6,"S":0.1135},
    {"month":192,"L":-0.216,"M":34.8,"S":0.1136},
    {"month":193,"L":-0.203,"M":35.0,"S":0.1137},
    {"month":194,"L":-0.19,"M":35.2,"S":0.1138},
    {"month":195,"L":-0.177,"M":35.4,"S":0.1139},
    {"month":196,"L":-0.164,"M":35.6,"S":0.1140},
    {"month":197,"L":-0.151,"M":35.8,"S":0.1141},
    {"month":198,"L":-0.138,"M":36.0,"S":0.1142},
    {"month":199,"L":-0.125,"M":36.2,"S":0.1143},
    {"month":200,"L":-0.112,"M":36.4,"S":0.1144},
    {"month":201,"L":-0.099,"M":36.6,"S":0.1145},
    {"month":202,"L":-0.086,"M":36.8,"S":0.1146},
    {"month":203,"L":-0.073,"M":37.0,"S":0.1147},
    {"month":204,"L":-0.06,"M":37.2,"S":0.1148},
    {"month":205,"L":-0.047,"M":37.4,"S":0.1149},
    {"month":206,"L":-0.034,"M":37.6,"S":0.1150},
    {"month":207,"L":-0.021,"M":37.8,"S":0.1151},
    {"month":208,"L":-0.008,"M":38.0,"S":0.1152},
    {"month":209,"L":0.005,"M":38.2,"S":0.1153},
    {"month":210,"L":0.018,"M":38.4,"S":0.1154},
    {"month":211,"L":0.031,"M":38.6,"S":0.1155},
    {"month":212,"L":0.044,"M":38.8,"S":0.1156},
    {"month":213,"L":0.057,"M":39.0,"S":0.1157},
    {"month":214,"L":0.07,"M":39.2,"S":0.1158},
    {"month":215,"L":0.083,"M
