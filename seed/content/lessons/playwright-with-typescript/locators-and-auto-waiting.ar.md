---
title: "المحدِّدات والانتظار التلقائي في Playwright"
summary: "معظم اختبارات الواجهة غير المستقرة سببها عادتان: محدِّدات هشّة وانتظار يدوي. تعلّم كيف تُزيل المحدِّدات الموجّهة للمستخدم والانتظار المدمج في Playwright كلتا العادتين."
objectives:
  - "اختيار المحدِّدات بترتيب متانتها: الدور (role) والتسمية (label) والنص قبل معرّفات الاختبار، ثم CSS أو XPath كملاذ أخير فقط."
  - "شرح صرامة المحدِّدات (strictness) وإعادة تقييمها الكسول، واستخدام التصفية والتسلسل بدلًا من nth()."
  - "وصف فحوص قابلية التنفيذ (actionability) التي يجريها Playwright قبل أي إجراء."
  - "استبدال الانتظار الثابت ومقارنة القيم المقروءة بتأكيدات الويب أولًا (web-first assertions)."
prerequisites:
  - "أساسيات TypeScript: المتغيرات والدوال وasync/await"
  - "Playwright مثبّت في مشروع (npm init playwright@latest)"
keyTerms:
  - term: "المحدِّد (Locator)"
    definition: "وصف لطريقة العثور على عنصر في الصفحة. يُقيَّم في كل مرة يُستخدم فيها، لا لحظة إنشائه."
  - term: "الصرامة (Strictness)"
    definition: "إذا طابق محدِّدُ إجراءٍ أكثرَ من عنصر واحد، يرمي الإجراء خطأً بدل أن يختار أحدها."
  - term: "فحوص قابلية التنفيذ (Actionability checks)"
    definition: "شروط ينتظرها Playwright قبل تنفيذ الإجراء، مثل أن يكون العنصر مرئيًا ومستقرًا ومفعّلًا ويستقبل الأحداث."
  - term: "تأكيد الويب أولًا (Web-first assertion)"
    definition: "تأكيد مثل toBeVisible() يعيد المحاولة حتى يتحقق الشرط أو تنتهي المهلة."
mistakes:
  - mistake: "نسخ محدِّدات CSS أو XPath طويلة من أدوات المطوّر في المتصفح."
    fix: "استخدم getByRole مع الاسم المتاح (accessible name). فهو يصمد أمام تغييرات التخطيط، ويفشل حين تفقد الصفحة إمكانية الوصول، وهذا خلل حقيقي."
  - mistake: "إضافة page.waitForTimeout(2000) لكي ينجح الاختبار."
    fix: "الانتظار الثابت أطول من اللازم حين يكون التطبيق سريعًا، وأقصر من اللازم حين يكون بطيئًا. انتظر إشارة بدلًا منه: تأكيد ويب أولًا أو استجابة شبكة محددة."
  - mistake: "قراءة النص بـ textContent() ثم مقارنته بـ expect(text).toBe(...)."
    fix: "استخدم await expect(locator).toHaveText(...). فهو يعيد المحاولة حتى يطابق النص، فلا يتسابق مع الصفحة."
  - mistake: "استخدام locator.nth(2) لاختيار الصف الثالث المطابق."
    fix: "صفِّ بما يميّز الصف، مثل getByRole('row').filter({ hasText: 'INV-1042' }). الترتيب يتغير حين تتغير البيانات."
exercise:
  title: "أعد كتابة اختبار غير مستقر"
  brief: |
    هذا الاختبار ينجح على جهازك ويفشل مرة من كل خمس مرات تقريبًا في خط CI:

    ```ts
    test("customer can apply a voucher", async ({ page }) => {
      await page.goto("/basket");
      await page.locator("#app > div.main > div:nth-child(3) input").fill("SPRING-10");
      await page.locator("button.btn.btn-primary").click();
      await page.waitForTimeout(1500);
      const total = await page.locator(".summary .total span").textContent();
      expect(total).toBe("45.00 JOD");
    });
    ```

    حقل القسيمة تسميته "Voucher code"، والزر مكتوب عليه "Apply"، والإجمالي موجود في صف عنوانه "Total". أعد كتابة الاختبار ليكون متينًا ولا ينتظر مدة ثابتة، واشرح كل تغيير.
  modelAnswer: |
    ```ts
    test("customer can apply a voucher", async ({ page }) => {
      await page.goto("/basket");
      await page.getByLabel("Voucher code").fill("SPRING-10");
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(
        page.getByRole("row", { name: /Total/ }),
      ).toContainText("45.00 JOD");
    });
    ```

    - **getByLabel** يحلّ محل مسار CSS موضعي ينكسر كلما تغيّر التخطيط، ويتحقق أيضًا من أن للحقل تسمية متاحة.
    - **getByRole("button", { name: "Apply" })** يحلّ محل `button.btn.btn-primary` الذي يطابق أي زر رئيسي في الصفحة. ومع وجود أكثر من تطابق، تجعل صرامة Playwright الإجراء يفشل.
    - **اختفى الانتظار الثابت.** تأكيد الويب أولًا يعيد المحاولة حتى يتحدّث الإجمالي (حتى مهلة expect، وهي 5 ثوانٍ افتراضيًا)، فينجح فور جاهزية الصفحة ويفشل بوضوح إن لم تجهز.
    - **انتقل فحص القيمة إلى داخل التأكيد**، فلا يمكنه قراءة الإجمالي القديم قبل وصول التحديث، وهذا كان السبب الحقيقي لإخفاقات CI.
quiz:
  - id: q1
    prompt: "أي محدِّد توصي به وثائق Playwright أولًا لزر إرسال مكتوب عليه 'Pay now'؟"
    options:
      - { id: a, text: "page.locator('#checkout > form > button:nth-child(4)')" }
      - { id: b, text: "page.getByRole('button', { name: 'Pay now' })" }
      - { id: c, text: "page.locator('//button[4]')" }
      - { id: d, text: "page.locator('.btn-primary')" }
    answer: b
    explanation: "محدِّدات الدور تعكس طريقة إدراك المستخدمين والتقنيات المساعدة للصفحة. أما CSS وXPath المرتبطان بالبنية فينكسران حين يتغير DOM، والوثائق تصفهما بأنهما غير متينين."
  - id: q2
    prompt: "محدِّد يطابق ثلاثة أزرار، والاختبار يستدعي click() عليه. ماذا يحدث؟"
    options:
      - { id: a, text: "ينقر Playwright على الزر الأول" }
      - { id: b, text: "ينقر Playwright على الأزرار الثلاثة" }
      - { id: c, text: "يرمي الإجراء خطأً، لأن المحدِّدات صارمة" }
      - { id: d, text: "يختار Playwright أحدها عشوائيًا" }
    answer: c
    explanation: "الإجراءات على محدِّد يطابق أكثر من عنصر ترمي خطأً. وهذا يجبرك على جعل المحدِّد دقيقًا بدل أن تنفّذ الإجراء بصمت على العنصر الخطأ."
  - id: q3
    prompt: "قبل النقر، أيٌّ مما يلي لا يفحصه Playwright ضمن قابلية التنفيذ؟"
    options:
      - { id: a, text: "أن العنصر مرئي" }
      - { id: b, text: "أن العنصر مستقر (لا يتحرك)" }
      - { id: c, text: "أن العنصر يستقبل الأحداث (لا يغطيه عنصر آخر)" }
      - { id: d, text: "أن نص العنصر يطابق اسم الاختبار" }
    answer: d
    explanation: "قبل النقر ينتظر Playwright عنصرًا واحدًا مطابقًا يكون مرئيًا ومستقرًا ويستقبل الأحداث ومفعّلًا. أما مطابقة النص فهي شيء تؤكده أنت، وليست فحص قابلية تنفيذ."
  - id: q4
    prompt: "لماذا يُعدّ await expect(locator).toHaveText('Paid') أفضل من قراءة النص ومقارنته؟"
    options:
      - { id: a, text: "لأنه أقصر" }
      - { id: b, text: "لأنه يعيد المحاولة حتى يطابق النص أو تنتهي المهلة، فلا يتسابق مع الصفحة" }
      - { id: c, text: "لأنه يتجاهل حالة الأحرف" }
      - { id: d, text: "لأنه أسرع إذ لا ينتظر" }
    answer: b
    explanation: "تأكيدات الويب أولًا تستطلع الصفحة باستمرار. أما قراءة القيمة مرة واحدة فتلتقط ما هو موجود في تلك اللحظة، وقد يكون الحالة السابقة للتحديث."
references:
  - title: "Locators"
    url: "https://playwright.dev/docs/locators"
    publisher: "Playwright"
  - title: "Auto-waiting and actionability"
    url: "https://playwright.dev/docs/actionability"
    publisher: "Playwright"
  - title: "Assertions"
    url: "https://playwright.dev/docs/test-assertions"
    publisher: "Playwright"
---

## لماذا تصبح اختبارات الواجهة غير مستقرة

اختبار الواجهة يتسابق مع التطبيق. يرسل الاختبار نقرة، فيبدأ التطبيق طلبًا، وينتظر الخادم، ويعيد الرسم، وربما يُظهر حركة انتقالية. إذا بحث الاختبار عن النتيجة قبل أن توجد، يفشل الاختبار رغم أن التطبيق سليم. شغّله مجددًا فينجح. هذا هو الاختبار غير المستقر (flaky test)، وهو السبب الرئيسي لفقدان الفرق ثقتها بالأتمتة.

عادتان تسببان معظم المشكلة: **محدِّدات مرتبطة ببنية الصفحة**، تنكسر أو تطابق العنصر الخطأ حين يتغير التخطيط، و**انتظار يدوي** يخمّن المدة التي يحتاجها التطبيق. صُمّم Playwright لإزالة العادتين، لكن بشرط أن تستخدم محدِّداته وتأكيداته بالطريقة المقصودة.

## محدِّدات تصف ما يراه المستخدم

المحدِّد (locator) وصف لطريقة العثور على عنصر، مكتوب من وجهة نظر المستخدم. هذه هي المحدِّدات المدمجة في Playwright بالترتيب الذي توصي به وثائقه:

| المحدِّد | يعثر على العنصر بواسطة | مثال |
| --- | --- | --- |
| `getByRole` | دوره في إمكانية الوصول واسمه المتاح | `getByRole('button', { name: 'Pay now' })` |
| `getByLabel` | نص تسمية حقل النموذج | `getByLabel('Email')` |
| `getByPlaceholder` | النص المؤقت داخل الحقل | `getByPlaceholder('Search orders')` |
| `getByText` | النص الظاهر | `getByText('Payment received')` |
| `getByAltText` | النص البديل للصورة | `getByAltText('Company logo')` |
| `getByTitle` | سمة title | `getByTitle('Close')` |
| `getByTestId` | سمة `data-testid` | `getByTestId('order-total')` |

`getByRole` هو الخيار الافتراضي. محدِّد الدور يصمد أمام تغيير أسماء الأصناف (classes) وتغييرات التخطيط وترقيات مكتبات المكوّنات. وله أثر جانبي مفيد: إذا فقد زرٌّ اسمه المتاح، يفشل الاختبار، وهذا خلل حقيقي في إمكانية الوصول وليس ضجيجًا.

معرّفات الاختبار (test ids) عقدٌ بين المختبرين والمطوّرين. هي الخيار الصحيح حين لا يوجد شيء فريد أو ثابت يراه المستخدم، مثل رسم بياني بلا نص. أما CSS وXPath المرتبطان ببنية DOM فهما الملاذ الأخير؛ ووثائق Playwright تقول صراحة إنهما يؤديان إلى اختبارات غير متينة.

## صارمة وكسولة: كيف تتصرف المحدِّدات

خاصيتان للمحدِّدات تفسّران معظم الإخفاقات المفاجئة.

**المحدِّدات صارمة.** إذا طابق محدِّدُ إجراءٍ أكثر من عنصر، يرمي الإجراء خطأً بدل أن يختار أحدها. هذا مقصود: النقر على "أول زر حذف" هو الطريقة التي تحذف بها الاختبارات السجل الخطأ. ضيّق المحدِّد بدلًا من ذلك:

```ts
// Too broad: there is a Delete button on every row.
await page.getByRole("button", { name: "Delete" }).click(); // throws

// Narrow it to the row that matters.
await page
  .getByRole("row")
  .filter({ hasText: "INV-1042" })
  .getByRole("button", { name: "Delete" })
  .click();
```

**المحدِّدات كسولة.** إنشاء المحدِّد لا يبحث في الصفحة. في كل مرة تستخدمه، يبحث Playwright عن عنصر محدَّث. إذا أُعيد رسم الصفحة بين خطوتين، يجد المحدِّد العنصر الجديد. ولهذا يمكنك تعريف المحدِّدات مرة واحدة، في كائن صفحة (page object) مثلًا، وإعادة استخدامها بأمان.

تجنّب `nth()` و`first()` إلا إذا كان الموضع هو المتطلب فعلًا ("أحدث رسالة تظهر في الأعلى"). المواضع تتغير حين تتغير البيانات؛ أما التصفية المبنية على المحتوى فلا.

## الانتظار التلقائي: ماذا يحدث قبل النقر

حين تستدعي `click()`، لا ينقر Playwright فورًا. بل ينتظر حتى يجتاز الهدف مجموعة من **فحوص قابلية التنفيذ**:

1. أن يطابق المحدِّد عنصرًا واحدًا بالضبط.
2. أن يكون العنصر **مرئيًا**.
3. أن يكون العنصر **مستقرًا**، أي لا يتحرك في حركة انتقالية.
4. أن يكون العنصر **مستقبلًا للأحداث**: لا يغطيه غطاء أو مؤشر تحميل أو شريط ملفات تعريف الارتباط.
5. أن يكون العنصر **مفعّلًا**.

الإجراءات الأخرى تستخدم المجموعة الفرعية المناسبة لها؛ فـ `fill()` مثلًا يتطلب أيضًا أن يكون الحقل قابلًا للتحرير. إذا لم تتحقق الفحوص خلال مهلة الإجراء، يفشل الإجراء بخطأ `TimeoutError` يذكر الفحص الذي لم يتحقق، مثل "element is not enabled" أو "element intercepts pointer events". هذه الرسالة كنز للتشخيص: اقرأها قبل أن تغيّر أي شيء.

لهذا لا تحتاج إلى `waitForSelector` قبل الإجراءات، ولهذا يُعدّ `page.waitForTimeout()` الحل الخطأ. وثائق واجهة Playwright البرمجية نفسها تقول إنه يجب ألا يُستخدم إلا لتصحيح الأخطاء، لأن الاختبارات التي تنتظر وقتًا ثابتًا غير مستقرة بطبيعتها.

## تأكيدات الويب أولًا

الإجراءات تنتظر تلقائيًا؛ والتأكيدات تحتاج إلى الانتظار أيضًا. قارن:

```ts
// Races the page: reads once, possibly before the update.
const status = await page.getByTestId("order-status").textContent();
expect(status).toBe("Paid");

// Retries until the text is "Paid" or the timeout expires.
await expect(page.getByTestId("order-status")).toHaveText("Paid");
```

الصيغة الثانية **تأكيد ويب أولًا**. إنه يستطلع الصفحة حتى يتحقق الشرط، حتى مهلة expect (5 ثوانٍ افتراضيًا، ويمكن تغييرها في `playwright.config.ts`). أكثرها فائدة:

| التأكيد | يتحقق من |
| --- | --- |
| `toBeVisible()` / `toBeHidden()` | ظهور العنصر أو عدم ظهوره |
| `toHaveText()` / `toContainText()` | النص الكامل، أو نص يتضمن جزءًا معينًا |
| `toHaveValue()` | القيمة الحالية لحقل إدخال |
| `toBeEnabled()` / `toBeDisabled()` | إمكانية استخدام عنصر التحكم |
| `toHaveCount()` | عدد العناصر المطابقة، مثل عدد الصفوف بعد التصفية |
| `toHaveURL()` / `toHaveTitle()` | حالة الصفحة بعد التنقل |

قاعدة جيدة: إذا كانت القيمة قادمة من الصفحة، فأكّد على المحدِّد نفسه، لا على قيمة قرأتها منه.

## تجميع كل شيء معًا

اختبار دفع مكتوب بهذه الطريقة يُقرأ كرحلة المستخدم ولا يحتوي أي تخمين للتوقيت:

```ts
import { test, expect } from "@playwright/test";

test("signed-in customer can pay for a basket", async ({ page }) => {
  await page.goto("/basket");
  await expect(page.getByRole("heading", { name: "Your basket" })).toBeVisible();

  await page.getByLabel("Voucher code").fill("SPRING-10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("row", { name: /Discount/ })).toContainText("-5.00");

  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page).toHaveURL(/\/orders\/\w+/);
  await expect(page.getByRole("status")).toHaveText("Payment received");
});
```

حين يفشل هذا الاختبار، يفشل عند الخطوة التي انكسرت، برسالة تسمّي العنصر والفحص. هذا هو الفرق بين مجموعة اختبارات يثق بها الناس، ومجموعة يعيدون تشغيلها حتى تصبح خضراء.

التالي في هذا المسار: تأكيدات الويب أولًا بتعمق أكبر، بما في ذلك كتابة فحوص الاستطلاع الخاصة بك.
