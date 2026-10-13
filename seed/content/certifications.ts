/**
 * Certification seed records (reviewed against istqb.org on 2026-10-11).
 *
 * Rules (docs/ARCHITECTURE.md):
 * - Exam facts are stored ONLY when read on the issuing body's own page, with sourceUrl + reviewedOn.
 * - Unknown facts stay null and the UI says "Not yet verified".
 * - Fees are never stored: they vary by exam provider and country.
 * - Practice questions are original and never reproduce official sample exams.
 * - Official names and chapter titles stay in English; Arabic translations sit alongside.
 */
import type { QuizQuestion } from "../../src/lib/content/schema";

export type ExamFacts = {
  questions: number | null;
  totalPoints: number | null;
  passingScore: number | null;
  durationMinutes: number | null;
  nonNativeExtension: string | null;
};

export type StudyWeek = { week: string; focus: string; activities: string[] };

export type CertText = {
  summary?: string;
  audience?: string[];
  prerequisites?: string[];
  chapters?: string[];
  studyPlan?: StudyWeek[];
  practice?: QuizQuestion[];
};

export type SeedCertification = {
  slug: string;
  code: string;
  name: string;
  issuer: "ISTQB";
  version: string | null;
  stream: string;
  sourceUrl: string;
  reviewedOn: string | null;
  verified: boolean;
  exam: ExamFacts | null;
  chapters: string[];
  officialLinks: { label: string; url: string }[];
  relatedPaths: string[];
  text: { en: CertText; ar: CertText };
};

const ISTQB = "https://istqb.org/certifications/";

const ctflPracticeEn: QuizQuestion[] = [
  {
    id: "p1",
    prompt: "A team reviews a user story with the product owner and finds that it does not say what happens when a coupon has expired. Which kind of activity found this problem?",
    options: [
      { id: "a", text: "Dynamic testing" },
      { id: "b", text: "Static testing" },
      { id: "c", text: "Debugging" },
      { id: "d", text: "Confirmation testing" },
    ],
    answer: "b",
    explanation: "The defect was found by examining a work product (the story) without executing any code, which is static testing. Reviews are one of the most cost-effective ways to find defects in requirements.",
  },
  {
    id: "p2",
    prompt: "An input accepts integers from 10 to 50 inclusive. Using 2-value boundary value analysis, how many test values are needed to cover all boundaries?",
    options: [
      { id: "a", text: "2" },
      { id: "b", text: "4" },
      { id: "c", text: "6" },
      { id: "d", text: "3" },
    ],
    answer: "b",
    explanation: "There are two boundaries. 2-value BVA tests each boundary value and its nearest neighbour in the adjacent partition: 9, 10, 50 and 51, which is four values.",
  },
  {
    id: "p3",
    prompt: "Which statement best describes the difference between confirmation testing and regression testing?",
    options: [
      { id: "a", text: "Confirmation testing checks that a fix works; regression testing checks that changes have not broken existing behaviour" },
      { id: "b", text: "They are two names for the same activity" },
      { id: "c", text: "Confirmation testing is automated; regression testing is manual" },
      { id: "d", text: "Regression testing is only done before the first release" },
    ],
    answer: "a",
    explanation: "Confirmation testing re-runs the test that failed, to confirm the defect is fixed. Regression testing looks for unintended side effects of a change in areas that previously worked.",
  },
  {
    id: "p4",
    prompt: "Last release, most production defects came from the payments module. Which testing principle most directly supports focusing more effort there?",
    options: [
      { id: "a", text: "Exhaustive testing is impossible" },
      { id: "b", text: "Defects cluster together" },
      { id: "c", text: "Absence-of-defects fallacy" },
      { id: "d", text: "Testing is context dependent" },
    ],
    answer: "b",
    explanation: "Defect clustering says that a small number of components usually contain most defects. Historical defect data is valid input for risk-based prioritisation.",
  },
  {
    id: "p5",
    prompt: "A decision table has three independent Boolean conditions and no infeasible combinations. Before any collapsing, how many rules does it contain?",
    options: [
      { id: "a", text: "3" },
      { id: "b", text: "6" },
      { id: "c", text: "8" },
      { id: "d", text: "9" },
    ],
    answer: "c",
    explanation: "Each Boolean condition doubles the number of combinations: 2³ = 8 rules.",
  },
  {
    id: "p6",
    prompt: "Which of these is the best example of a product risk rather than a project risk?",
    options: [
      { id: "a", text: "The test environment will not be ready until the last week of the sprint" },
      { id: "b", text: "Two testers are leaving the team next month" },
      { id: "c", text: "The interest calculation may round incorrectly for some loan terms" },
      { id: "d", text: "The vendor may deliver the test tool late" },
    ],
    answer: "c",
    explanation: "Product risks concern the quality of the product itself, such as incorrect calculations. The other options affect the project's ability to achieve its objectives (schedule, staffing, tooling), which makes them project risks.",
  },
  {
    id: "p7",
    prompt: "In a test report, which statement gives stakeholders the most useful information for a release decision?",
    options: [
      { id: "a", text: "All 312 test cases passed." },
      { id: "b", text: "Testing is complete." },
      { id: "c", text: "All planned high-risk scenarios passed; two medium-risk areas were not tested due to environment issues, and one open defect affects refunds over 1,000." },
      { id: "d", text: "The testers worked 120 hours this sprint." },
    ],
    answer: "c",
    explanation: "Useful reporting connects coverage, residual risk and open defects to the decision being made. Counts and effort alone do not tell stakeholders what could still go wrong.",
  },
  {
    id: "p8",
    prompt: "A tester designs tests based on knowledge of where similar applications have failed before, such as date handling around month ends. Which category of technique is this?",
    options: [
      { id: "a", text: "Black-box technique" },
      { id: "b", text: "White-box technique" },
      { id: "c", text: "Experience-based technique" },
      { id: "d", text: "Static analysis" },
    ],
    answer: "c",
    explanation: "Using knowledge of likely failure areas is error guessing, an experience-based technique. It complements black-box and white-box techniques rather than replacing them.",
  },
  {
    id: "p9",
    prompt: "Which statement about test automation is most accurate?",
    options: [
      { id: "a", text: "Automation removes the need for test design" },
      { id: "b", text: "Automation brings benefits such as faster repeatable execution, but also costs and risks such as maintenance effort and unrealistic expectations" },
      { id: "c", text: "Every test should be automated as early as possible" },
      { id: "d", text: "Automated tests find more defects than exploratory testing" },
    ],
    answer: "b",
    explanation: "Automation is valuable for repeatable checks like regression suites, but it has real costs: building and maintaining scripts, tool limitations and the risk of over-reliance. Good test design is still required.",
  },
  {
    id: "p10",
    prompt: "Which test level is the main focus when checking that a mobile app and a third-party payment gateway exchange messages correctly?",
    options: [
      { id: "a", text: "Component testing" },
      { id: "b", text: "Component integration testing" },
      { id: "c", text: "System integration testing" },
      { id: "d", text: "Acceptance testing" },
    ],
    answer: "c",
    explanation: "Interfaces between the system under test and external systems, such as a third-party payment gateway, are the focus of system integration testing.",
  },
];

const ctflPracticeAr: QuizQuestion[] = [
  {
    id: "p1",
    prompt: "يراجع فريق قصة مستخدم مع مالك المنتج، فيكتشف أنها لا تذكر ما يحدث عند انتهاء صلاحية القسيمة. ما نوع النشاط الذي كشف هذه المشكلة؟",
    options: [
      { id: "a", text: "الاختبار الديناميكي (Dynamic testing)" },
      { id: "b", text: "الاختبار الساكن (Static testing)" },
      { id: "c", text: "تصحيح الأخطاء (Debugging)" },
      { id: "d", text: "اختبار التأكيد (Confirmation testing)" },
    ],
    answer: "b",
    explanation: "اكتُشف الخلل بفحص منتج عمل (القصة) دون تشغيل أي كود، وهذا هو الاختبار الساكن. والمراجعات من أكثر الطرق فعالية من حيث الكلفة لاكتشاف الأخطاء في المتطلبات.",
  },
  {
    id: "p2",
    prompt: "يقبل حقل الأعداد الصحيحة من 10 إلى 50 شاملًا الطرفين. باستخدام تحليل القيم الحدّية بقيمتين (2-value BVA)، كم قيمة اختبار نحتاج لتغطية كل الحدود؟",
    options: [
      { id: "a", text: "2" },
      { id: "b", text: "4" },
      { id: "c", text: "6" },
      { id: "d", text: "3" },
    ],
    answer: "b",
    explanation: "هناك حدّان. يختبر تحليل القيم الحدّية بقيمتين كل قيمة حدّية وأقرب جار لها في القسم المجاور: 9 و10 و50 و51، أي أربع قيم.",
  },
  {
    id: "p3",
    prompt: "أي عبارة تصف الفرق بين اختبار التأكيد واختبار الانحدار وصفًا أدق؟",
    options: [
      { id: "a", text: "اختبار التأكيد يتحقق من نجاح الإصلاح، واختبار الانحدار يتحقق من أن التغييرات لم تُفسد سلوكًا كان يعمل" },
      { id: "b", text: "هما اسمان لنشاط واحد" },
      { id: "c", text: "اختبار التأكيد مؤتمت، واختبار الانحدار يدوي" },
      { id: "d", text: "اختبار الانحدار لا يُجرى إلا قبل الإصدار الأول" },
    ],
    answer: "a",
    explanation: "يعيد اختبار التأكيد تشغيل الاختبار الذي فشل للتأكد من إصلاح الخطأ. أمّا اختبار الانحدار فيبحث عن آثار جانبية غير مقصودة للتغيير في مناطق كانت تعمل سابقًا.",
  },
  {
    id: "p4",
    prompt: "في الإصدار الماضي، جاءت معظم أخطاء بيئة الإنتاج من وحدة المدفوعات. أي مبدأ من مبادئ الاختبار يدعم مباشرةً تركيز جهد أكبر هناك؟",
    options: [
      { id: "a", text: "الاختبار الشامل مستحيل" },
      { id: "b", text: "الأخطاء تتجمّع معًا" },
      { id: "c", text: "مغالطة غياب الأخطاء" },
      { id: "d", text: "الاختبار يعتمد على السياق" },
    ],
    answer: "b",
    explanation: "ينص مبدأ تجمّع الأخطاء على أن عددًا قليلًا من المكونات يحتوي عادةً معظم الأخطاء. وبيانات الأخطاء السابقة مدخل صالح لترتيب الأولويات حسب المخاطر.",
  },
  {
    id: "p5",
    prompt: "جدول قرار فيه ثلاثة شروط منطقية مستقلة ولا توجد فيه تركيبات مستحيلة. قبل أي دمج للأعمدة، كم قاعدة يحتوي؟",
    options: [
      { id: "a", text: "3" },
      { id: "b", text: "6" },
      { id: "c", text: "8" },
      { id: "d", text: "9" },
    ],
    answer: "c",
    explanation: "كل شرط منطقي يضاعف عدد التركيبات: 2³ = 8 قواعد.",
  },
  {
    id: "p6",
    prompt: "أي ممّا يلي أفضل مثال على خطر في المنتج (product risk) لا خطر في المشروع (project risk)؟",
    options: [
      { id: "a", text: "لن تكون بيئة الاختبار جاهزة حتى الأسبوع الأخير من السباق (sprint)" },
      { id: "b", text: "سيغادر مختبران الفريق الشهر القادم" },
      { id: "c", text: "قد يُقرَّب حساب الفائدة بشكل خاطئ لبعض مدد القروض" },
      { id: "d", text: "قد يتأخر المورّد في تسليم أداة الاختبار" },
    ],
    answer: "c",
    explanation: "تتعلق مخاطر المنتج بجودة المنتج نفسه، مثل الحسابات الخاطئة. أمّا الخيارات الأخرى فتؤثر في قدرة المشروع على تحقيق أهدافه (الجدول الزمني والكوادر والأدوات)، ولذلك فهي مخاطر مشروع.",
  },
  {
    id: "p7",
    prompt: "في تقرير اختبار، أي عبارة تمنح أصحاب المصلحة المعلومة الأكثر فائدة لاتخاذ قرار الإصدار؟",
    options: [
      { id: "a", text: "نجحت جميع حالات الاختبار الـ312." },
      { id: "b", text: "اكتمل الاختبار." },
      { id: "c", text: "نجحت كل السيناريوهات عالية المخاطر المخطط لها؛ ولم تُختبر منطقتان متوسطتا المخاطر بسبب مشكلات في البيئة، وهناك خطأ مفتوح يؤثر في المبالغ المستردة التي تتجاوز 1,000." },
      { id: "d", text: "عمل المختبرون 120 ساعة في هذا السباق." },
    ],
    answer: "c",
    explanation: "التقرير المفيد يربط التغطية والمخاطر المتبقية والأخطاء المفتوحة بالقرار المطلوب. أمّا الأعداد والجهد وحدهما فلا يخبران أصحاب المصلحة بما قد يسوء.",
  },
  {
    id: "p8",
    prompt: "يصمّم مختبر اختبارات بناءً على معرفته بالمواضع التي أخفقت فيها تطبيقات مشابهة سابقًا، مثل التعامل مع التواريخ في نهايات الأشهر. إلى أي فئة تنتمي هذه التقنية؟",
    options: [
      { id: "a", text: "تقنية الصندوق الأسود" },
      { id: "b", text: "تقنية الصندوق الأبيض" },
      { id: "c", text: "تقنية مبنية على الخبرة" },
      { id: "d", text: "التحليل الساكن" },
    ],
    answer: "c",
    explanation: "استخدام المعرفة بمواضع الإخفاق المحتملة هو تخمين الأخطاء (error guessing)، وهي تقنية مبنية على الخبرة تكمّل تقنيات الصندوق الأسود والأبيض ولا تحل محلها.",
  },
  {
    id: "p9",
    prompt: "أي عبارة عن أتمتة الاختبار هي الأدق؟",
    options: [
      { id: "a", text: "الأتمتة تلغي الحاجة إلى تصميم الاختبارات" },
      { id: "b", text: "للأتمتة فوائد مثل التنفيذ المتكرر الأسرع، ولها أيضًا كلفة ومخاطر مثل جهد الصيانة والتوقعات غير الواقعية" },
      { id: "c", text: "يجب أتمتة كل اختبار في أبكر وقت ممكن" },
      { id: "d", text: "الاختبارات المؤتمتة تكتشف أخطاء أكثر من الاختبار الاستكشافي" },
    ],
    answer: "b",
    explanation: "الأتمتة قيّمة للفحوص المتكررة مثل مجموعات الانحدار، لكن لها كلفة حقيقية: بناء النصوص البرمجية وصيانتها، وحدود الأدوات، وخطر الاعتماد المفرط عليها. ويبقى تصميم الاختبارات الجيد ضروريًا.",
  },
  {
    id: "p10",
    prompt: "ما مستوى الاختبار الذي ينصبّ عليه التركيز عند التحقق من أن تطبيق جوال وبوابة دفع خارجية يتبادلان الرسائل بشكل صحيح؟",
    options: [
      { id: "a", text: "اختبار المكوّن (Component testing)" },
      { id: "b", text: "اختبار تكامل المكوّنات (Component integration testing)" },
      { id: "c", text: "اختبار تكامل الأنظمة (System integration testing)" },
      { id: "d", text: "اختبار القبول (Acceptance testing)" },
    ],
    answer: "c",
    explanation: "الواجهات بين النظام قيد الاختبار والأنظمة الخارجية، مثل بوابة دفع لطرف ثالث، هي محور اختبار تكامل الأنظمة.",
  },
];

const verified: SeedCertification[] = [
  {
    slug: "ctfl",
    code: "CTFL",
    name: "Certified Tester Foundation Level",
    issuer: "ISTQB",
    version: "v4.0 (syllabus v4.0.1)",
    stream: "Core Foundation",
    sourceUrl: `${ISTQB}certified-tester-foundation-level-ctfl-v4-0/`,
    reviewedOn: "2026-10-11",
    verified: true,
    exam: { questions: 40, totalPoints: 40, passingScore: 26, durationMinutes: 60, nonNativeExtension: "+25%" },
    chapters: [
      "Fundamentals of Testing",
      "Testing Throughout the Software Development Lifecycle",
      "Static Testing",
      "Test Analysis and Design",
      "Managing the Test Activities",
      "Test Tools",
    ],
    officialLinks: [
      { label: "Official certification page, syllabus and sample exams", url: `${ISTQB}certified-tester-foundation-level-ctfl-v4-0/` },
      { label: "ISTQB Glossary", url: "https://glossary.istqb.org/" },
    ],
    relatedPaths: ["qa-foundations", "practical-manual-testing"],
    text: {
      en: {
        summary:
          "The entry point to the ISTQB scheme and a prerequisite for every certification that requires Foundation Level. It covers testing fundamentals, testing across the lifecycle, static testing, test design techniques, test management and tools.",
        audience: [
          "Testers, test analysts, test engineers, test consultants, test managers and user acceptance testers",
          "Software developers who test their own work",
          "Project, product, quality and development managers, business analysts and IT directors who need a working understanding of testing",
        ],
        prerequisites: ["None listed on the official page."],
        studyPlan: [
          {
            week: "Week 1",
            focus: "Chapters 1–2: fundamentals and the lifecycle",
            activities: [
              "Complete the QA Foundations lessons \"What quality means\" and \"Testing across the delivery lifecycle\".",
              "Read syllabus chapters 1 and 2. Write one example from your own work for each testing principle.",
              "Look up every chapter 1–2 term in the ISTQB Glossary.",
            ],
          },
          {
            week: "Week 2",
            focus: "Chapters 3–4: static testing and test design",
            activities: [
              "Complete the lessons on equivalence partitioning, boundary values, decision tables and state transition testing.",
              "Practise: derive test cases for three forms in apps you use, and state the coverage for each.",
              "Read the syllabus sections on statement and branch coverage and experience-based techniques.",
            ],
          },
          {
            week: "Week 3",
            focus: "Chapters 5–6: test management and tools",
            activities: [
              "Complete \"Writing defect reports that get fixed\".",
              "Read syllabus chapter 5, focusing on risk-based testing, estimation, metrics and defect management.",
              "Take the practice set on this page and review every explanation, including the questions you got right.",
            ],
          },
          {
            week: "Week 4",
            focus: "Exam readiness",
            activities: [
              "Take the official ISTQB sample exams under exam conditions (60 minutes, no notes).",
              "For every wrong answer, find the syllabus learning objective it maps to and re-read that section.",
              "Book the exam through a member board or accredited exam provider once you consistently score well above 26/40.",
            ],
          },
        ],
        practice: ctflPracticeEn,
      },
      ar: {
        summary:
          "نقطة الدخول إلى منظومة ISTQB، ومتطلب سابق لكل شهادة تشترط المستوى التأسيسي. تغطي أساسيات الاختبار، والاختبار عبر دورة الحياة، والاختبار الساكن، وتقنيات تصميم الاختبار، وإدارة الاختبار، والأدوات.",
        audience: [
          "المختبرون ومحللو الاختبار ومهندسو الاختبار واستشاريو الاختبار ومديرو الاختبار ومختبرو القبول",
          "مطوّرو البرمجيات الذين يختبرون أعمالهم",
          "مديرو المشاريع والمنتجات والجودة والتطوير، ومحللو الأعمال، ومديرو تقنية المعلومات ممّن يحتاجون إلى فهم عملي للاختبار",
        ],
        prerequisites: ["لا توجد متطلبات سابقة مذكورة في الصفحة الرسمية."],
        chapters: [
          "أساسيات الاختبار",
          "الاختبار عبر دورة حياة تطوير البرمجيات",
          "الاختبار الساكن",
          "تحليل الاختبار وتصميمه",
          "إدارة أنشطة الاختبار",
          "أدوات الاختبار",
        ],
        studyPlan: [
          {
            week: "الأسبوع 1",
            focus: "الفصلان 1 و2: الأساسيات ودورة الحياة",
            activities: [
              "أكمِل درسَي «ما معنى الجودة» و«الاختبار عبر دورة التسليم» في مسار أساسيات ضمان الجودة.",
              "اقرأ الفصلين 1 و2 من المنهج، واكتب مثالًا من عملك لكل مبدأ من مبادئ الاختبار.",
              "ابحث عن كل مصطلح في الفصلين 1 و2 في مسرد ISTQB.",
            ],
          },
          {
            week: "الأسبوع 2",
            focus: "الفصلان 3 و4: الاختبار الساكن وتصميم الاختبارات",
            activities: [
              "أكمِل دروس تقسيم التكافؤ والقيم الحدّية وجداول القرار واختبار انتقالات الحالة.",
              "تدرّب: استخرج حالات اختبار لثلاثة نماذج في تطبيقات تستخدمها، واذكر التغطية لكل منها.",
              "اقرأ أقسام المنهج الخاصة بتغطية التعليمات والفروع والتقنيات المبنية على الخبرة.",
            ],
          },
          {
            week: "الأسبوع 3",
            focus: "الفصلان 5 و6: إدارة الاختبار والأدوات",
            activities: [
              "أكمِل درس «كتابة تقارير أخطاء تضمن إصلاحها».",
              "اقرأ الفصل 5 من المنهج مع التركيز على الاختبار المبني على المخاطر والتقدير والمقاييس وإدارة الأخطاء.",
              "حلّ مجموعة الأسئلة التدريبية في هذه الصفحة وراجع كل شرح، حتى للأسئلة التي أجبت عنها صحيحًا.",
            ],
          },
          {
            week: "الأسبوع 4",
            focus: "الاستعداد للامتحان",
            activities: [
              "حلّ نماذج امتحانات ISTQB الرسمية في ظروف الامتحان (60 دقيقة، دون ملاحظات).",
              "لكل إجابة خاطئة، حدّد هدف التعلّم الذي تنتمي إليه في المنهج وأعد قراءة ذلك القسم.",
              "احجز الامتحان عبر مجلس عضو أو مزوّد امتحانات معتمد حين تتجاوز نتيجتك 26 من 40 بفارق مريح وباستمرار.",
            ],
          },
        ],
        practice: ctflPracticeAr,
      },
    },
  },
  {
    slug: "ctal-ta",
    code: "CTAL-TA",
    name: "Certified Tester Advanced Level Test Analyst",
    issuer: "ISTQB",
    version: "v4.0",
    stream: "Core Advanced",
    sourceUrl: `${ISTQB}certified-tester-advanced-level-test-analyst/`,
    reviewedOn: "2026-10-11",
    verified: true,
    exam: { questions: 45, totalPoints: 78, passingScore: 51, durationMinutes: 120, nonNativeExtension: "+25%" },
    chapters: [
      "The Tasks of the Test Analyst in the Test Process",
      "The Tasks of the Test Analyst in Risk-Based Testing",
      "Test Analysis and Test Design",
      "Test Quality Characteristics",
      "Software Defect Prevention",
    ],
    officialLinks: [{ label: "Official certification page", url: `${ISTQB}certified-tester-advanced-level-test-analyst/` }],
    relatedPaths: ["qa-foundations", "practical-manual-testing"],
    text: {
      en: {
        summary:
          "For testers who want to deepen their skills in test analysis and design: business-focused functional testing, black-box and experience-based techniques, user-focused quality characteristics and defect prevention. ISTQB lists v3.1 as retiring (sunset 16 May 2026 for English, 16 November 2026 for other languages).",
        audience: ["Testers who want to deepen their expertise in test analysis and test design techniques"],
        prerequisites: [
          "ISTQB Certified Tester Foundation Level (v4.0 preferred, earlier versions accepted)",
          "Sufficient practical experience. Criteria are set by your ISTQB member board or exam provider.",
        ],
      },
      ar: {
        summary:
          "للمختبرين الذين يريدون تعميق مهاراتهم في تحليل الاختبار وتصميمه: الاختبار الوظيفي الموجّه للأعمال، وتقنيات الصندوق الأسود والتقنيات المبنية على الخبرة، وخصائص الجودة المتعلقة بالمستخدم، ومنع الأخطاء. تشير ISTQB إلى أن الإصدار v3.1 في طور الإيقاف (آخر موعد 16 مايو 2026 للإنجليزية و16 نوفمبر 2026 للغات الأخرى).",
        audience: ["المختبرون الذين يريدون تعميق خبرتهم في تحليل الاختبار وتقنيات تصميمه"],
        prerequisites: [
          "شهادة ISTQB للمستوى التأسيسي (يُفضَّل الإصدار v4.0، وتُقبل الإصدارات السابقة)",
          "خبرة عملية كافية، يحدد معاييرها المجلس العضو في ISTQB أو مزوّد الامتحان.",
        ],
        chapters: [
          "مهام محلل الاختبار في عملية الاختبار",
          "مهام محلل الاختبار في الاختبار المبني على المخاطر",
          "تحليل الاختبار وتصميمه",
          "خصائص جودة الاختبار",
          "منع أخطاء البرمجيات",
        ],
      },
    },
  },
  {
    slug: "ctal-tae",
    code: "CTAL-TAE",
    name: "Certified Tester Advanced Level Test Automation Engineering",
    issuer: "ISTQB",
    version: "v2.0",
    stream: "Core Advanced",
    sourceUrl: `${ISTQB}certified-tester-advanced-level-test-automation-engineering-ctal-tae-v2-0/`,
    reviewedOn: "2026-10-11",
    verified: true,
    exam: { questions: 40, totalPoints: 66, passingScore: 43, durationMinutes: 90, nonNativeExtension: null },
    chapters: [
      "Introduction and Objectives for Test Automation",
      "Preparing for Test Automation",
      "Test Automation Architecture",
      "Implementing Test Automation",
      "Implementing and Deployment Strategies for Test Automation",
      "Test Automation Reporting and Metrics",
      "Verifying the Test Automation Solution",
      "Continuous Improvement",
    ],
    officialLinks: [
      { label: "Official certification page", url: `${ISTQB}certified-tester-advanced-level-test-automation-engineering-ctal-tae-v2-0/` },
    ],
    relatedPaths: ["playwright-with-typescript", "api-testing-essentials"],
    text: {
      en: {
        summary:
          "For engineers who design, build and maintain test automation solutions: automation architecture, implementation, CI/CD integration, reporting and metrics, and continuous improvement.",
        audience: [
          "Testers, test analysts, test automation engineers, test architects, test managers and software developers",
          "Managers, business analysts and consultants who need a working understanding of test automation",
        ],
        prerequisites: [
          "ISTQB Certified Tester Foundation Level (v4.0 or an earlier version)",
          "Sufficient practical experience. Criteria are set by your ISTQB member board or exam provider.",
        ],
      },
      ar: {
        summary:
          "للمهندسين الذين يصمّمون حلول أتمتة الاختبار ويبنونها ويصونونها: معمارية الأتمتة، وتنفيذها، ودمجها في التكامل والنشر المستمرين، والتقارير والمقاييس، والتحسين المستمر.",
        audience: [
          "المختبرون ومحللو الاختبار ومهندسو أتمتة الاختبار ومعماريو الاختبار ومديرو الاختبار ومطوّرو البرمجيات",
          "المديرون ومحللو الأعمال والاستشاريون الذين يحتاجون إلى فهم عملي لأتمتة الاختبار",
        ],
        prerequisites: [
          "شهادة ISTQB للمستوى التأسيسي (الإصدار v4.0 أو إصدار سابق)",
          "خبرة عملية كافية، يحدد معاييرها المجلس العضو في ISTQB أو مزوّد الامتحان.",
        ],
        chapters: [
          "مقدمة أتمتة الاختبار وأهدافها",
          "التحضير لأتمتة الاختبار",
          "معمارية أتمتة الاختبار",
          "تنفيذ أتمتة الاختبار",
          "استراتيجيات تنفيذ أتمتة الاختبار ونشرها",
          "تقارير أتمتة الاختبار ومقاييسها",
          "التحقق من حل أتمتة الاختبار",
          "التحسين المستمر",
        ],
      },
    },
  },
  {
    slug: "ctal-tm",
    code: "CTAL-TM",
    name: "Certified Tester Advanced Level Test Management",
    issuer: "ISTQB",
    version: "v3.0",
    stream: "Core Advanced",
    sourceUrl: `${ISTQB}certified-tester-advanced-level-test-management-ctal-tm-v3-0/`,
    reviewedOn: "2026-10-11",
    verified: true,
    exam: { questions: 50, totalPoints: 88, passingScore: 58, durationMinutes: 120, nonNativeExtension: "+25%" },
    chapters: [
      "Managing the Test Activities",
      "The Context of Testing",
      "Risk-based Testing",
      "Project Test Strategy",
      "Improving the Test Process",
      "Test Tools",
      "Test Metrics",
      "Test Estimation",
      "Defect Management",
      "The Test Team",
      "Stakeholder Relationship",
    ],
    officialLinks: [
      { label: "Official certification page", url: `${ISTQB}certified-tester-advanced-level-test-management-ctal-tm-v3-0/` },
    ],
    relatedPaths: ["test-management", "qa-leadership"],
    text: {
      en: {
        summary:
          "For people who manage testing: risk-based testing, project test strategy, estimation, metrics, defect management, process improvement, tools, and leading the test team and stakeholders.",
        audience: [
          "Anyone involved in managing software testing: testers, test consultants, test managers, scrum masters, project managers and product owners",
          "Quality and development managers, business analysts, IT directors and consultants who want an advanced understanding of testing",
        ],
        prerequisites: [
          "ISTQB Certified Tester Foundation Level (v4.0 or an earlier version)",
          "Sufficient practical experience. Criteria are set by your ISTQB member board or exam provider.",
        ],
      },
      ar: {
        summary:
          "لمن يديرون الاختبار: الاختبار المبني على المخاطر، واستراتيجية اختبار المشروع، والتقدير، والمقاييس، وإدارة الأخطاء، وتحسين العملية، والأدوات، وقيادة فريق الاختبار وأصحاب المصلحة.",
        audience: [
          "كل من يشارك في إدارة اختبار البرمجيات: المختبرون واستشاريو الاختبار ومديرو الاختبار ومنسّقو سكرم (scrum masters) ومديرو المشاريع ومالكو المنتجات",
          "مديرو الجودة والتطوير ومحللو الأعمال ومديرو تقنية المعلومات والاستشاريون الذين يريدون فهمًا متقدمًا للاختبار",
        ],
        prerequisites: [
          "شهادة ISTQB للمستوى التأسيسي (الإصدار v4.0 أو إصدار سابق)",
          "خبرة عملية كافية، يحدد معاييرها المجلس العضو في ISTQB أو مزوّد الامتحان.",
        ],
        chapters: [
          "إدارة أنشطة الاختبار",
          "سياق الاختبار",
          "الاختبار المبني على المخاطر",
          "استراتيجية اختبار المشروع",
          "تحسين عملية الاختبار",
          "أدوات الاختبار",
          "مقاييس الاختبار",
          "تقدير الاختبار",
          "إدارة الأخطاء",
          "فريق الاختبار",
          "العلاقة مع أصحاب المصلحة",
        ],
      },
    },
  },
];

// Listed in the official ISTQB portfolio (reviewed 2026-10-11). Exam facts not yet verified here.
const listed: [string, string, string, string | null, string, string][] = [
  ["ctal-at", "CTAL-AT", "Certified Tester Advanced Level Agile Tester", "v2.0", "Core Advanced", "certified-tester-advanced-level-agile-tester-ctal-at/"],
  ["ctal-tta", "CTAL-TTA", "Certified Tester Advanced Level Technical Test Analyst", null, "Core Advanced", "certified-tester-advanced-level-technical-test-analyst-ctal-tta/"],
  ["ct-ai", "CT-AI", "Certified Tester AI Testing", "v2.0", "Specialist: Technologies and Approaches", "certified-tester-ai-testing-ct-ai/"],
  ["ct-genai", "CT-GenAI", "Certified Tester Testing with Generative AI", null, "Specialist: Technologies and Approaches", "gen-ai/"],
  ["ct-qdo", "CT-QDO", "Certified Tester Quality in DevOps", null, "Specialist: Technologies and Approaches", "certified-tester-quality-in-devops-ct-qdo/"],
  ["ct-mat", "CT-MAT", "Certified Tester Mobile Application Testing", null, "Specialist: Technologies and Approaches", "certified-tester-mobile-application-testing-ct-mat/"],
  ["ct-mbt", "CT-MBT", "Certified Tester Model-Based Tester", null, "Specialist: Technologies and Approaches", "certified-tester-model-based-tester-ct-mbt/"],
  ["ct-tas", "CT-TAS", "Certified Tester Test Automation Strategy", null, "Specialist: Technologies and Approaches", "certified-tester-test-automation-strategy-ct-tas/"],
  ["ct-atlas", "CT-ATLaS", "Certified Tester Agile Test Leadership at Scale", null, "Specialist: Technologies and Approaches", "certified-tester-agile-test-leadership-at-scale-ct-atlas/"],
  ["ct-act", "CT-AcT", "Certified Tester Acceptance Testing", null, "Specialist: Quality Characteristics & Test Levels", "certified-tester-acceptance-testing-ct-act/"],
  ["ct-pt", "CT-PT", "Certified Tester Performance Testing", null, "Specialist: Quality Characteristics & Test Levels", "certified-tester-performance-testing-ct-pt/"],
  ["ct-sec", "CT-SEC", "Certified Tester Security Tester", null, "Specialist: Quality Characteristics & Test Levels", "certified-tester-security-tester-ct-sec/"],
  ["ct-ste", "CT-STE", "Certified Tester Security Test Engineer", null, "Specialist: Quality Characteristics & Test Levels", "certified-tester-security-test-engineer/"],
  ["ct-ut", "CT-UT", "Certified Tester Usability Testing", null, "Specialist: Quality Characteristics & Test Levels", "certified-tester-usability-testing-ct-ut/"],
  ["ct-ft", "CT-FT", "Certified Tester Finance Testing", null, "Specialist: Testing in Particular Domains", "certified-tester-finance-testing-ct-ft/"],
  ["ct-aut", "CT-AuT", "Certified Tester Automotive Software Tester", null, "Specialist: Testing in Particular Domains", "certified-tester-automotive-software-tester-ct-aut/"],
  ["ct-game", "CT-GaMe", "Certified Tester Game Testing", null, "Specialist: Testing in Particular Domains", "certified-tester-game-testing-ct-game/"],
  ["ct-gt", "CT-GT", "Certified Tester Gambling Industry Tester", null, "Specialist: Testing in Particular Domains", "certified-tester-gambling-industry-tester-ct-gt/"],
  ["ctel-itp-atp", "CTEL-ITP-ATP", "Certified Tester Expert Level Assessing Test Processes", null, "Expert Level", "certified-tester-expert-level-assessing-test-processes-ctel-itp-atp/"],
  ["ctel-itp-itpi", "CTEL-ITP-ITPI", "Certified Tester Expert Level Implementing Test Process Improvement", null, "Expert Level", "certified-tester-expert-level-implementing-test-process-improvement-ctel-itp-itpi/"],
  ["ctel-tm-sm", "CTEL-TM-SM", "Certified Tester Expert Level Strategic Test Management", null, "Expert Level", "certified-tester-expert-level-test-management-strategic-test-management-ctel-tm-sm/"],
  ["ctel-tm-otm", "CTEL-TM-OTM", "Certified Tester Expert Level Operational Test Management", null, "Expert Level", "certified-tester-expert-level-test-management-operational-test-management-ctel-tm-otm/"],
  ["ctel-tm-mtt", "CTEL-TM-MTT", "Certified Tester Expert Level Managing the Test Team", null, "Expert Level", "certified-tester-expert-level-test-management-managing-the-test-team-ctel-tm-mtt/"],
];

export const seedCertifications: SeedCertification[] = [
  ...verified,
  ...listed.map(
    ([slug, code, name, version, stream, path]): SeedCertification => ({
      slug,
      code,
      name,
      issuer: "ISTQB",
      version,
      stream,
      sourceUrl: `${ISTQB}${path}`,
      reviewedOn: null,
      verified: false,
      exam: null,
      chapters: [],
      officialLinks: [{ label: "Official certification page", url: `${ISTQB}${path}` }],
      relatedPaths: [],
      text: { en: {}, ar: {} },
    }),
  ),
];
