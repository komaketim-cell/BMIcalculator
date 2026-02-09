document.addEventListener('DOMContentLoaded', () => {
  // ---------- عناصر ----------
  const btnCalc = document.getElementById('btnCalc');
  const btnPdf = document.getElementById('btnPdf');

  const daySel = document.getElementById('day');
  const monthSel = document.getElementById('month');
  const yearInp = document.getElementById('year');

  const heightInp = document.getElementById('height');
  const weightInp = document.getElementById('weight');
  const activitySel = document.getElementById('activity');

  const ageExactBox = document.getElementById('ageExact');
  const bmiBox = document.getElementById('bmi');
  const weightDevBox = document.getElementById('weightDeviation');
  const zscoreBox = document.getElementById('zscore');
  const bmrBox = document.getElementById('bmr');
  const tdeeBox = document.getElementById('tdee');
  const calMaintainBox = document.getElementById('cal-maintain');
  const calGainBox = document.getElementById('cal-gain');
  const calCutBox = document.getElementById('cal-cut');

  const toggleButtons = document.querySelectorAll('.toggle-btn');

  let sex = 'male';

  // ---------- پر کردن روز و ماه ----------
  function fillDateSelectors() {
    if (!daySel || !monthSel) return;

    daySel.innerHTML = '';
    monthSel.innerHTML = '';

    for (let d = 1; d <= 31; d++) {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      daySel.appendChild(opt);
    }

    const months = [
      'فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور',
      'مهر','آبان','آذر','دی','بهمن','اسفند'
    ];
    months.forEach((m, i) => {
      const opt = document.createElement('option');
      opt.value = i + 1;
      opt.textContent = m;
      monthSel.appendChild(opt);
    });
  }

  fillDateSelectors();

  // ---------- تغییر جنسیت ----------
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sex = btn.dataset.sex;
    });
  });

  // ---------- ابزارهای تاریخ ----------
  function jalaaliToGregorian(jy, jm, jd) {
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

    let days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
    for (let i = 0; i < jm - 1; ++i) {
      days += [31,31,31,31,31,31,30,30,30,30,30,29][i];
    }
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
    const gMonthDays = [31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    let temp = gd;
    for (gm = 0; gm < 12; gm++) {
      if (temp <= gMonthDays[gm]) break;
      temp -= gMonthDays[gm];
    }
    return { gy, gm: gm + 1, gd: temp };
  }

  function calcExactAge(dob) {
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  function ageInMonths(dob) {
    const now = new Date();
    const years = now.getFullYear() - dob.getFullYear();
    const months = now.getMonth() - dob.getMonth();
    const days = now.getDate() - dob.getDate();
    let total = years * 12 + months + days / 30.4375;
    return Math.max(0, total);
  }

  // ---------- LMS TABLE ----------
  // ساختار کامل آماده است؛ داده نمونه است.
  // برای نتیجه دقیق، باید جدول کامل WHO/CDC را جایگزین کنید.
  const LMS = {
    male: new Map([
      [0, { L: 0.3487, M: 13.4069, S: 0.0890 }],
      [1, { L: 0.2297, M: 14.9441, S: 0.0903 }],
      [2, { L: 0.1970, M: 16.3620, S: 0.0895 }],
      [3, { L: 0.1738, M: 17.6410, S: 0.0885 }],
      [4, { L: 0.1553, M: 18.8130, S: 0.0879 }],
      [5, { L: 0.1395, M: 19.9010, S: 0.0874 }],
      [6, { L: 0.1257, M: 20.9220, S: 0.0870 }],
      [7, { L: 0.1136, M: 21.8890, S: 0.0866 }],
      [8, { L: 0.1028, M: 22.8100, S: 0.0863 }],
      [9, { L: 0.0932, M: 23.6910, S: 0.0860 }],
      [10, { L: 0.0846, M: 24.5340, S: 0.0857 }],
      [11, { L: 0.0767, M: 25.3440, S: 0.0855 }],
      [12, { L: 0.0695, M: 26.1230, S: 0.0853 }],
      [24, { L: 0.0161, M: 31.7870, S: 0.0822 }],
      [36, { L: -0.0187, M: 36.0780, S: 0.0801 }],
      [48, { L: -0.0431, M: 39.3400, S: 0.0787 }],
      [60, { L: -0.0610, M: 41.8800, S: 0.0778 }],
      [72, { L: -0.0740, M: 43.8850, S: 0.0771 }],
      [84, { L: -0.0830, M: 45.4700, S: 0.0766 }],
      [96, { L: -0.0891, M: 46.7200, S: 0.0762 }],
      [108, { L: -0.0930, M: 47.7100, S: 0.0759 }],
      [120, { L: -0.0954, M: 48.5100, S: 0.0756 }],
      [144, { L: -0.0975, M: 49.8800, S: 0.0751 }],
      [168, { L: -0.0994, M: 50.7600, S: 0.0747 }],
      [192, { L: -0.1011, M: 51.3800, S: 0.0744 }],
      [216, { L: -0.1023, M: 51.8100, S: 0.0742 }],
      [240, { L: -0.1030, M: 52.1000, S: 0.0741 }]
    ]),
    female: new Map([
      [0, { L: 0.3810, M: 12.9090, S: 0.0900 }],
      [1, { L: 0.2620, M: 14.2340, S: 0.0904 }],
      [2, { L: 0.2250, M: 15.5080, S: 0.0896 }],
      [3, { L: 0.2000, M: 16.6750, S: 0.0888 }],
      [4, { L: 0.1810, M: 17.7570, S: 0.0882 }],
      [5, { L: 0.1650, M: 18.7700, S: 0.0877 }],
      [6, { L: 0.1510, M: 19.7270, S: 0.0873 }],
      [7, { L: 0.1390, M: 20.6360, S: 0.0870 }],
      [8, { L: 0.1290, M: 21.5030, S: 0.0867 }],
      [9, { L: 0.1200, M: 22.3320, S: 0.0865 }],
      [10, { L: 0.1120, M: 23.1280, S: 0.0862 }],
      [11, { L: 0.1050, M: 23.8950, S: 0.0860 }],
      [12, { L: 0.0980, M: 24.6350, S: 0.0858 }],
      [24, { L: 0.0440, M: 29.7900, S: 0.0829 }],
      [36, { L: 0.0090, M: 33.6900, S: 0.0808 }],
      [48, { L: -0.0150, M: 36.6700, S: 0.0794 }],
      [60, { L: -0.0320, M: 38.9800, S: 0.0784 }],
      [72, { L: -0.0430, M: 40.7800, S: 0.0777 }],
      [84, { L: -0.0500, M: 42.1800, S: 0.0772 }],
      [96, { L: -0.0540, M: 43.2700, S: 0.0769 }],
      [108, { L: -0.0560, M: 44.1100, S: 0.0766 }],
      [120, { L: -0.0570, M: 44.7600, S: 0.0764 }],
      [144, { L: -0.0580, M: 45.8900, S: 0.0759 }],
      [168, { L: -0.0590, M: 46.6800, S: 0.0755 }],
      [192, { L: -0.0600, M: 47.2300, S: 0.0752 }],
      [216, { L: -0.0605, M: 47.6200, S: 0.0751 }],
      [240, { L: -0.0610, M: 47.9000, S: 0.0750 }]
    ])
  };

  function getLMSRecord(sex, months) {
    const map = LMS[sex];
    if (!map) return null;

    const mInt = Math.round(months);
    if (map.has(mInt)) return map.get(mInt);

    let closestKey = null;
    let minDiff = Infinity;
    for (const key of map.keys()) {
      const diff = Math.abs(key - mInt);
      if (diff < minDiff) {
        minDiff = diff;
        closestKey = key;
      }
    }
    return closestKey !== null ? map.get(closestKey) : null;
  }

  function zScoreFromLMS(x, L, M, S) {
    if (!L || L === 0) {
      return Math.log(x / M) / S;
    }
    return (Math.pow(x / M, L) - 1) / (L * S);
  }

  function classifyZ(z) {
    if (z < -3) return 'لاغری بسیار شدید';
    if (z < -2) return 'لاغری';
    if (z <= 1) return 'طبیعی';
    if (z <= 2) return 'اضافه‌وزن';
    if (z <= 3) return 'چاقی';
    return 'چاقی بسیار شدید';
  }

  // ---------- محاسبات ----------
  function calculate() {
    const day = parseInt(daySel.value, 10);
    const month = parseInt(monthSel.value, 10);
    const year = parseInt(yearInp.value, 10);

    const height = parseFloat(heightInp.value);
    const weight = parseFloat(weightInp.value);
    const activity = parseFloat(activitySel.value);

    if (!day || !month || !year || !height || !weight || !activity) {
      alert('لطفاً تمام اطلاعات را کامل وارد کنید.');
      return;
    }

    const g = jalaaliToGregorian(year, month, day);
    const dob = new Date(g.gy, g.gm - 1, g.gd);

    // سن دقیق
    const age = calcExactAge(dob);
    ageExactBox.textContent = `سن دقیق: ${age.years} سال، ${age.months} ماه، ${age.days} روز`;

    // BMI
    const hM = height / 100;
    const bmi = weight / (hM * hM);
    bmiBox.textContent = `شاخص توده بدنی (BMI): ${bmi.toFixed(2)}`;

    // BMR
    const ageYears = age.years + age.months / 12 + age.days / 365;
    const bmr = sex === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * ageYears) + 5
      : (10 * weight) + (6.25 * height) - (5 * ageYears) - 161;
    bmrBox.textContent = `BMR (متابولیسم پایه): ${bmr.toFixed(0)} kcal`;

    // TDEE
    const tdee = bmr * activity;
    tdeeBox.textContent = `TDEE (کالری روزانه): ${tdee.toFixed(0)} kcal`;

    // کالری‌ها
    calMaintainBox.textContent = `کالری ثابت نگه داشتن وزن: ${tdee.toFixed(0)} kcal`;
    calGainBox.textContent = `کالری افزایش وزن و حجم عضلات: ${(tdee + 350).toFixed(0)} kcal`;
    const cut = Math.max(bmr, tdee - 300);
    calCutBox.textContent = `کالری کاهش وزن بدون افت عضلات: ${cut.toFixed(0)} kcal`;

    // LMS و Z-Score
    const months = ageInMonths(dob);
    const lms = getLMSRecord(sex, months);

    if (lms) {
      const z = zScoreFromLMS(bmi, lms.L, lms.M, lms.S);
      const cls = classifyZ(z);
      zscoreBox.textContent = `Z-Score (BMI برای سن): ${z.toFixed(2)} | ${cls}`;

      // وزن مرجع براساس M
      const targetWeight = lms.M * (hM * hM);
      const diff = weight - targetWeight;
      const diffText = diff >= 0
        ? `اضافه وزن: ${diff.toFixed(1)} کیلوگرم`
        : `کمبود وزن: ${Math.abs(diff).toFixed(1)} کیلوگرم`;
      weightDevBox.textContent = `میزان کمبود/اضافه وزن: ${diffText}`;
    } else {
      zscoreBox.textContent = `Z-Score (BMI برای سن): داده LMS موجود نیست`;
      weightDevBox.textContent = `میزان کمبود/اضافه وزن: داده LMS موجود نیست`;
    }
  }

  // ---------- رویدادها ----------
  if (btnCalc) {
    btnCalc.addEventListener('click', calculate);
  }

  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      if (typeof window.html2pdf === 'undefined') {
        alert('کتابخانه PDF لود نشده است. فایل js/html2pdf.bundle.min.js را درست قرار دهید.');
        return;
      }
      const element = document.getElementById('report-root');
      const opt = {
        margin: 10,
        filename: 'BMI_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
    });
  }
});
