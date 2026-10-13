/** Downloadable templates (files live in /public/templates) and practice projects. */
import type { SkillId } from "../../src/content/skills";
import type { Level } from "../../src/lib/db/schema";

export type SeedTemplate = {
  slug: string;
  format: string;
  skills: SkillId[];
  relatedLessons: string[];
  text: { en: { title: string; description: string }; ar: { title: string; description: string } };
  file: string; // file name, same for both locales
};

export const seedTemplates: SeedTemplate[] = [
  {
    slug: "defect-report",
    format: "Markdown",
    skills: ["manual", "test-management"],
    relatedLessons: ["qa-foundations/writing-defect-reports"],
    file: "defect-report-template.md",
    text: {
      en: { title: "Defect report", description: "Title, environment, minimal steps, expected and actual results, evidence, severity, and a clearly labelled hypothesis." },
      ar: { title: "تقرير خطأ", description: "العنوان والبيئة والخطوات المختصرة والنتيجتان المتوقعة والفعلية والأدلة والخطورة، مع فرضية معلَّمة بوضوح." },
    },
  },
  {
    slug: "test-case-sheet",
    format: "CSV",
    skills: ["manual"],
    relatedLessons: [
      "qa-foundations/equivalence-partitioning-and-boundaries",
      "qa-foundations/decision-tables",
      "practical-manual-testing/state-transition-testing",
    ],
    file: "test-case-template.csv",
    text: {
      en: { title: "Test case sheet", description: "Spreadsheet-ready columns for test cases, with two worked boundary-value examples. Opens in Excel or Google Sheets." },
      ar: { title: "جدول حالات الاختبار", description: "أعمدة جاهزة لجداول البيانات لحالات الاختبار، مع مثالين محلولين للقيم الحدّية. يُفتح في Excel أو Google Sheets." },
    },
  },
  {
    slug: "test-plan",
    format: "Markdown",
    skills: ["test-management"],
    relatedLessons: ["qa-foundations/testing-across-the-lifecycle", "test-management/test-estimation-techniques"],
    file: "test-plan-template.md",
    text: {
      en: { title: "Test plan", description: "A one-page plan: scope, risks, approach, environments, entry and exit criteria, schedule and reporting." },
      ar: { title: "خطة اختبار", description: "خطة من صفحة واحدة: النطاق والمخاطر والمنهجية والبيئات ومعايير الدخول والخروج والجدول الزمني والتقارير." },
    },
  },
  {
    slug: "traceability-matrix",
    format: "CSV",
    skills: ["test-management"],
    relatedLessons: ["qa-foundations/testing-across-the-lifecycle"],
    file: "traceability-matrix.csv",
    text: {
      en: { title: "Traceability matrix", description: "Link requirements to risks, test cases, automated tests, results and open defects." },
      ar: { title: "مصفوفة التتبّع", description: "اربط المتطلبات بالمخاطر وحالات الاختبار والاختبارات المؤتمتة والنتائج والأخطاء المفتوحة." },
    },
  },
  {
    slug: "risk-register",
    format: "CSV",
    skills: ["test-management", "leadership"],
    relatedLessons: ["qa-leadership/release-readiness-and-go-no-go", "test-management/test-estimation-techniques"],
    file: "risk-register.csv",
    text: {
      en: { title: "Risk register", description: "Product and project risks scored by likelihood and impact, with owners and the test response for each." },
      ar: { title: "سجل المخاطر", description: "مخاطر المنتج والمشروع مُقيّمة حسب الاحتمال والأثر، مع المسؤول واستجابة الاختبار لكل منها." },
    },
  },
  {
    slug: "exploratory-charter",
    format: "Markdown",
    skills: ["manual"],
    relatedLessons: ["practical-manual-testing/state-transition-testing"],
    file: "exploratory-session-charter.md",
    text: {
      en: { title: "Exploratory session charter", description: "Charter, time box, session notes with T/B/Q/I markers, bugs, questions and a debrief." },
      ar: { title: "ميثاق جلسة استكشافية", description: "الميثاق والمدة وملاحظات الجلسة بعلامات (ت/خ/س/ف) والأخطاء والأسئلة والمراجعة الختامية." },
    },
  },
  {
    slug: "release-readiness",
    format: "Markdown",
    skills: ["leadership", "test-management"],
    relatedLessons: ["qa-leadership/release-readiness-and-go-no-go"],
    file: "release-readiness-checklist.md",
    text: {
      en: { title: "Release readiness checklist", description: "Evidence, operational readiness and residual risk in business terms, ending in a go/no-go recommendation." },
      ar: { title: "قائمة جاهزية الإصدار", description: "الأدلة والجاهزية التشغيلية والمخاطر المتبقية بلغة الأعمال، وتنتهي بتوصية «إطلاق أو عدم إطلاق»." },
    },
  },
];

type ProjectText = { title: string; summary: string; brief: string; deliverables: string[]; criteria: string[] };

export type SeedProject = {
  slug: string;
  level: Level;
  skills: SkillId[];
  relatedPaths: string[];
  hours: number;
  text: { en: ProjectText; ar: ProjectText };
};

export const seedProjects: SeedProject[] = [
  {
    slug: "checkout-test-design",
    level: "Junior",
    skills: ["manual", "fundamentals"],
    relatedPaths: ["qa-foundations", "practical-manual-testing"],
    hours: 6,
    text: {
      en: {
        title: "Test design and defect reports for a demo shop",
        summary: "Design a systematic test set for the checkout of a public demo shop, run it, and report what you find.",
        brief: `Use [Swag Labs](https://www.saucedemo.com/), a public demo shop maintained by Sauce Labs for practice. The login page lists the practice usernames and the shared password.

1. Write the requirements you can infer for the checkout information form (first name, last name, postal code) and the order total.
2. Identify partitions and boundaries for each field, and build a decision table for anything that combines conditions.
3. Run your tests with the standard user, then repeat a sample with the problem user and compare.
4. Report each defect using the defect report template.

Only test the public demo site. Do not run load or security tools against it.`,
        deliverables: [
          "A one-page test design: inferred requirements, partitions, boundaries and a decision table",
          "At least 12 test cases in the test case sheet, with coverage stated",
          "At least 3 defect reports using the template",
        ],
        criteria: [
          "Every test case traces to a stated requirement or assumption",
          "Invalid partitions are tested one at a time",
          "Each defect report can be reproduced from its steps alone",
          "Assumptions are written down, not hidden in test cases",
        ],
      },
      ar: {
        title: "تصميم اختبارات وتقارير أخطاء لمتجر تجريبي",
        summary: "صمّم مجموعة اختبارات منهجية لصفحة الدفع في متجر تجريبي عام، ونفّذها، وأبلغ عمّا تجده.",
        brief: `استخدم [Swag Labs](https://www.saucedemo.com/)، وهو متجر تجريبي عام تتيحه Sauce Labs للتدريب. تعرض صفحة الدخول أسماء المستخدمين التدريبية وكلمة المرور المشتركة.

1. اكتب المتطلبات التي يمكنك استنتاجها لنموذج معلومات الدفع (الاسم الأول، واسم العائلة، والرمز البريدي) ولمجموع الطلب.
2. حدّد أقسام التكافؤ والقيم الحدّية لكل حقل، وابنِ جدول قرار لأي شيء يجمع بين عدة شروط.
3. نفّذ اختباراتك بالمستخدم القياسي، ثم كرّر عينة منها بالمستخدم «problem_user» وقارن النتائج.
4. أبلغ عن كل خطأ باستخدام قالب تقرير الخطأ.

اختبر الموقع التجريبي العام فقط، ولا تشغّل عليه أدوات حمل أو أدوات أمنية.`,
        deliverables: [
          "تصميم اختبار من صفحة واحدة: المتطلبات المستنتجة والأقسام والحدود وجدول قرار",
          "12 حالة اختبار على الأقل في جدول حالات الاختبار، مع ذكر التغطية",
          "3 تقارير أخطاء على الأقل باستخدام القالب",
        ],
        criteria: [
          "كل حالة اختبار ترتبط بمتطلب أو افتراض مذكور",
          "الأقسام غير الصالحة تُختبر واحدًا تلو الآخر",
          "كل تقرير خطأ يمكن إعادة إنتاجه من خطواته وحدها",
          "الافتراضات مكتوبة صراحة، لا مخفية داخل حالات الاختبار",
        ],
      },
    },
  },
  {
    slug: "booking-api-test-pack",
    level: "Mid-level",
    skills: ["api", "security", "programming"],
    relatedPaths: ["api-testing-essentials"],
    hours: 10,
    text: {
      en: {
        title: "An automated test pack for a booking API",
        summary: "Design and automate API tests for a public practice API that contains deliberate bugs.",
        brief: `Use [Restful-Booker](https://restful-booker.herokuapp.com/), an API playground built by Mark Winteringham for learning API testing. Its [API documentation](https://restful-booker.herokuapp.com/apidoc/index.html) describes the endpoints. The API contains deliberate bugs.

1. Read the documentation and write the contract you expect for creating, reading, updating and deleting a booking.
2. Design tests with the endpoint checklist from *Designing tests for a REST endpoint*: validation, state, idempotency, authorization and errors.
3. Automate at least 10 tests with Playwright's request fixture, including JSON Schema validation of the booking response.
4. Report the defects you find, with the request and response as evidence.

The playground is shared and resets regularly: create your own data in each test and never depend on existing bookings.`,
        deliverables: [
          "A written contract for the booking endpoints",
          "A test design covering validation, state, auth and errors",
          "A repository with at least 10 automated API tests and a README to run them",
          "Defect reports for any deliberate bugs you find",
        ],
        criteria: [
          "Tests create their own data and can run in any order",
          "Each test checks status, important headers, body and resulting state",
          "Authorization tests use the documented auth flow, never guessed credentials",
          "Schema validation failures print which field broke",
        ],
      },
      ar: {
        title: "حزمة اختبارات مؤتمتة لواجهة برمجية للحجوزات",
        summary: "صمّم اختبارات API لواجهة برمجية تدريبية عامة تحتوي أخطاءً متعمّدة، وأتمِتها.",
        brief: `استخدم [Restful-Booker](https://restful-booker.herokuapp.com/)، وهي بيئة تدريب على اختبار الواجهات البرمجية أنشأها Mark Winteringham. يصف [توثيق الواجهة](https://restful-booker.herokuapp.com/apidoc/index.html) نقاطها، وفيها أخطاء متعمّدة.

1. اقرأ التوثيق واكتب العقد الذي تتوقعه لإنشاء الحجز وقراءته وتعديله وحذفه.
2. صمّم الاختبارات باستخدام قائمة التحقق من درس *تصميم اختبارات لنقطة REST*: التحقق من المدخلات، والحالة، والتكرار الآمن، والتفويض، والأخطاء.
3. أتمِت 10 اختبارات على الأقل باستخدام request في Playwright، بما فيها التحقق من استجابة الحجز مقابل مخطط JSON Schema.
4. أبلغ عن الأخطاء التي تجدها، مع الطلب والاستجابة كأدلة.

بيئة التدريب مشتركة وتُعاد تهيئتها دوريًا: أنشئ بياناتك في كل اختبار ولا تعتمد أبدًا على حجوزات موجودة.`,
        deliverables: [
          "عقد مكتوب لنقاط الحجز",
          "تصميم اختبار يغطي التحقق من المدخلات والحالة والمصادقة والأخطاء",
          "مستودع فيه 10 اختبارات API مؤتمتة على الأقل مع ملف README لتشغيلها",
          "تقارير أخطاء لأي أخطاء متعمّدة تكتشفها",
        ],
        criteria: [
          "الاختبارات تنشئ بياناتها ويمكن تشغيلها بأي ترتيب",
          "كل اختبار يتحقق من رمز الحالة والترويسات المهمة والمحتوى والحالة الناتجة",
          "اختبارات التفويض تستخدم طريقة المصادقة الموثّقة، لا بيانات اعتماد مخمّنة",
          "إخفاقات التحقق من المخطط تُظهر أي حقل هو الذي خالف",
        ],
      },
    },
  },
  {
    slug: "playwright-suite-demo-shop",
    level: "Automation",
    skills: ["ui-automation", "programming", "cicd"],
    relatedPaths: ["playwright-with-typescript", "senior-quality-engineering"],
    hours: 12,
    text: {
      en: {
        title: "A Playwright suite with CI for a demo shop",
        summary: "Automate the critical journeys of a demo shop with reliable locators, fixtures and a CI pipeline.",
        brief: `Use [Swag Labs](https://www.saucedemo.com/) again, this time as an automation target.

1. Choose the five journeys that matter most to a shop (log in, browse, add to basket, check out, log out) and justify the choice.
2. Automate them with Playwright and TypeScript, using role-based locators and web-first assertions only. No fixed waits.
3. Add a fixture for a logged-in user and page objects with intent-level methods; keep assertions in the tests.
4. Run the suite in GitHub Actions on every push, with the HTML report and traces uploaded as artifacts.
5. Run the suite 20 times in a row and record any flaky result with its root cause.`,
        deliverables: [
          "A public repository with the suite, fixture and page objects",
          "A CI workflow file and a link to a passing run",
          "A short report: journeys chosen, flake-rate result over 20 runs, and causes fixed",
        ],
        criteria: [
          "No `waitForTimeout` or fixed sleeps anywhere",
          "Tests are independent and pass in parallel",
          "A failing test can be diagnosed from the trace alone",
          "Page objects describe intent (`checkout.payWith(card)`) rather than clicks",
        ],
      },
      ar: {
        title: "مجموعة اختبارات Playwright مع تكامل مستمر لمتجر تجريبي",
        summary: "أتمِت الرحلات الحرجة في متجر تجريبي بمحدّدات عناصر موثوقة وتجهيزات وخط تكامل مستمر.",
        brief: `استخدم [Swag Labs](https://www.saucedemo.com/) مرة أخرى، لكن هذه المرة كهدف للأتمتة.

1. اختر أهم خمس رحلات لأي متجر (الدخول، والتصفح، والإضافة إلى السلة، والدفع، والخروج) وبرّر اختيارك.
2. أتمِتها باستخدام Playwright وTypeScript، مستخدمًا المحدّدات المبنية على الدور والتحققات المعتمدة على الويب فقط، ودون أي انتظار ثابت.
3. أضف تجهيزًا (fixture) لمستخدم مسجّل الدخول، وكائنات صفحات بدوال تعبّر عن النية، وأبقِ التحققات داخل الاختبارات.
4. شغّل المجموعة في GitHub Actions مع كل دفع (push)، وارفع تقرير HTML والتتبّعات كمخرجات.
5. شغّل المجموعة 20 مرة متتالية وسجّل أي نتيجة متذبذبة مع سببها الجذري.`,
        deliverables: [
          "مستودع عام يحتوي المجموعة والتجهيز وكائنات الصفحات",
          "ملف سير عمل للتكامل المستمر ورابط لتشغيل ناجح",
          "تقرير قصير: الرحلات المختارة، ونسبة التذبذب عبر 20 تشغيلًا، والأسباب التي عولجت",
        ],
        criteria: [
          "لا وجود لـ `waitForTimeout` أو أي انتظار ثابت",
          "الاختبارات مستقلة وتنجح عند التشغيل المتوازي",
          "يمكن تشخيص الاختبار الفاشل من التتبّع وحده",
          "كائنات الصفحات تصف النية (`checkout.payWith(card)`) لا النقرات",
        ],
      },
    },
  },
  {
    slug: "release-recommendation",
    level: "Lead",
    skills: ["leadership", "test-management"],
    relatedPaths: ["qa-leadership"],
    hours: 4,
    text: {
      en: {
        title: "Write a go/no-go recommendation",
        summary: "Turn a messy release status into a one-page recommendation a product director can act on.",
        brief: `A wallet app is due to release version 5.2 on Thursday. Here is the (synthetic) status you have on Tuesday afternoon:

- 412 of 430 regression tests passed; 11 failed in the statements module, 7 were not run because the staging bank simulator was down for a day.
- Open defects: 1 high (statement PDF shows the wrong closing balance when a transfer is reversed on the last day of the month), 6 medium, 14 low.
- Performance test: p95 transfer latency 820 ms (target 1,000 ms).
- The marketing team has announced a cashback campaign that starts Friday and depends on 5.2.

Use the release readiness checklist and the *Release readiness and go/no-go decisions* lesson.`,
        deliverables: [
          "A completed release readiness checklist",
          "A one-page recommendation with residual risks in business terms",
          "A list of conditions, owners and deadlines if you recommend going ahead with conditions",
        ],
        criteria: [
          "The recommendation is stated in the first sentence",
          "Every risk names who is affected and how likely it is",
          "The unrun tests are treated as unknown, not as passed",
          "Options are offered (for example a flag, a partial release or a fix-forward plan), each with its trade-off",
        ],
      },
      ar: {
        title: "اكتب توصية «إطلاق أو عدم إطلاق»",
        summary: "حوّل حالة إصدار مشوّشة إلى توصية من صفحة واحدة يستطيع مدير المنتج التصرّف بناءً عليها.",
        brief: `من المقرر إطلاق الإصدار 5.2 من تطبيق محفظة رقمية يوم الخميس. هذه الحالة (الاصطناعية) المتوفرة لديك عصر الثلاثاء:

- نجح 412 من أصل 430 اختبار انحدار؛ وفشل 11 في وحدة كشوف الحساب، ولم يُنفّذ 7 لأن محاكي البنك في بيئة التجهيز كان متوقفًا يومًا كاملًا.
- الأخطاء المفتوحة: خطأ واحد عالي الخطورة (ملف PDF لكشف الحساب يعرض رصيدًا ختاميًا خاطئًا عند عكس تحويل في آخر يوم من الشهر)، و6 متوسطة، و14 منخفضة.
- اختبار الأداء: زمن التحويل عند المئين 95 يساوي 820 مللي ثانية (الهدف 1,000 مللي ثانية).
- أعلن فريق التسويق حملة استرداد نقدي تبدأ يوم الجمعة وتعتمد على الإصدار 5.2.

استخدم قائمة جاهزية الإصدار ودرس *جاهزية الإصدار وقرارات الإطلاق*.`,
        deliverables: [
          "قائمة جاهزية إصدار مكتملة",
          "توصية من صفحة واحدة مع المخاطر المتبقية بلغة الأعمال",
          "قائمة بالشروط والمسؤولين والمواعيد إن أوصيت بالإطلاق المشروط",
        ],
        criteria: [
          "التوصية مذكورة في الجملة الأولى",
          "كل خطر يذكر من يتأثر به ومدى احتماله",
          "الاختبارات غير المنفّذة تُعامل كمجهول، لا كناجحة",
          "تُعرض خيارات (مثل مفتاح تفعيل ميزة، أو إطلاق جزئي، أو خطة إصلاح لاحق) مع كلفة كل منها",
        ],
      },
    },
  },
  {
    slug: "estimate-and-plan",
    level: "Manager",
    skills: ["test-management", "leadership"],
    relatedPaths: ["test-management"],
    hours: 6,
    text: {
      en: {
        title: "Estimate and plan the testing for a new feature",
        summary: "Produce a test estimate with two techniques and a one-page plan for a multi-team feature.",
        brief: `Three teams are building "split the bill" for a restaurant ordering app (synthetic scenario): a mobile front end, a payments service change and a notifications service change. Release is in six weeks.

1. List the test activities and risks, and produce an estimate with two independent techniques (for example work breakdown and three-point estimation).
2. Reconcile the two estimates and state the uncertainty as a range.
3. Write a one-page test plan with the template, including entry and exit criteria.
4. Propose three metrics you will report weekly, and say which decision each one informs.`,
        deliverables: [
          "Two estimates, their reconciliation and a range",
          "A one-page test plan",
          "A metrics proposal tied to decisions",
        ],
        criteria: [
          "Assumptions behind each estimate are explicit",
          "The plan names owners for each test level across the three teams",
          "No metric rewards testers for raw defect counts",
        ],
      },
      ar: {
        title: "قدّر جهد اختبار ميزة جديدة وخطّط له",
        summary: "أعِدّ تقديرًا لجهد الاختبار بتقنيتين وخطة من صفحة واحدة لميزة تشارك فيها عدة فرق.",
        brief: `تبني ثلاثة فرق ميزة «تقسيم الفاتورة» لتطبيق طلبات مطاعم (سيناريو اصطناعي): واجهة الجوال، وتعديل على خدمة المدفوعات، وتعديل على خدمة الإشعارات. الإصدار بعد ستة أسابيع.

1. اذكر أنشطة الاختبار والمخاطر، وأعِدّ تقديرًا بتقنيتين مستقلتين (مثل تفكيك العمل والتقدير بالنقاط الثلاث).
2. وفّق بين التقديرين واذكر عدم اليقين كنطاق.
3. اكتب خطة اختبار من صفحة واحدة باستخدام القالب، بما فيها معايير الدخول والخروج.
4. اقترح ثلاثة مقاييس ستبلّغ عنها أسبوعيًا، واذكر القرار الذي يدعمه كل منها.`,
        deliverables: [
          "تقديران، والتوفيق بينهما، ونطاق",
          "خطة اختبار من صفحة واحدة",
          "مقترح مقاييس مرتبط بالقرارات",
        ],
        criteria: [
          "الافتراضات خلف كل تقدير مكتوبة صراحة",
          "الخطة تسمّي المسؤول عن كل مستوى اختبار عبر الفرق الثلاثة",
          "لا يكافئ أي مقياس المختبرين على العدد الخام للأخطاء",
        ],
      },
    },
  },
];
