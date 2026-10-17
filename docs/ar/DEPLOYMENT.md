<div dir="rtl">

# النشر والتشغيل

تشغيل الأكاديمية على جهازك، وعلى Render، وفي Docker، وعلى خادمك الخاص. [English version](../DEPLOYMENT.md)

آخر مراجعة: 13 أكتوبر 2026. انظر أيضًا [المخطط 13](../diagrams/13-testing-ci-cd-deployment.md) و[قاعدة البيانات](../DATABASE.md).

## 1. ما يحتاجه التطبيق

- **Node.js 22 أو أحدث.**
- **قرص دائم قابل للكتابة** لملف SQLite، إذا أردت أن تبقى الحسابات والتعديلات بعد إعادة التشغيل.
- **نسخة خادم واحدة**، لأن ملف قاعدة البيانات وعدّاد محاولات الدخول موجودان على تلك النسخة.
- لا حاجة لقاعدة بيانات خارجية ولا لخدمة بريد ولا لمفاتيح API.

**غير مناسب كما هو:** منصات serverless مثل Vercel أو Netlify Functions، لأنها لا توفر قرصًا دائمًا قابلًا للكتابة. الانتقال إليها يتطلب التحويل إلى PostgreSQL أولًا ([ARCHITECTURE.md](../ARCHITECTURE.md#9-scaling-path)).

## 2. ماذا يحدث عند التشغيل

الأمران `npm run build` و`npm start` يشغّلان أولًا `scripts/prepare.ts`، وهو:

1. ينشئ ملف قاعدة البيانات إن لم يوجد، ويطبّق الترحيلات؛
2. يضيف بيانات البداية الناقصة، ولا يستبدل أي سجل موجود؛
3. ينشئ أول مسؤول من `ADMIN_EMAIL` و`ADMIN_PASSWORD` إذا لم يوجد مسؤول بعد.

الحسابات التجريبية لا تُنشأ إلا مع `npm run dev`، ولا تُنشأ أبدًا عندما يكون `NODE_ENV=production`.

## 3. متغيرات البيئة

| المتغير | مطلوب؟ | الافتراضي | الغرض |
| --- | --- | --- | --- |
| `DATABASE_PATH` | في الإنتاج مع قرص دائم | `./data/academy.db` | مكان ملف SQLite. وجّهه إلى القرص الدائم |
| `NODE_ENV` | في الإنتاج: نعم | يضبطه Next.js | القيمة `production` تعطّل الحسابات التجريبية و`/dev/outbox` و`db:reset` |
| `NEXT_PUBLIC_SITE_URL` | يُنصح به | `RENDER_EXTERNAL_URL` على Render، وإلا `http://localhost:3000` | العنوان العام في روابط إعادة التعيين والروابط الأساسية وخريطة الموقع. اضبطه عند استخدام نطاق خاص |
| `ADMIN_EMAIL` و`ADMIN_PASSWORD` | لأول تشغيل | — | إنشاء أول مسؤول إذا لم يوجد. على الخادم فقط، ولا يُرسلان إلى المتصفح. كلمة المرور 10 أحرف أو أكثر وفيها حرف ورقم |
| `ADMIN_NAME` | لا | `Administrator` | الاسم الظاهر لذلك المسؤول |
| `DEMO_PASSWORD` | لا | `Demo-Password-2026` | كلمة مرور الحسابات التجريبية في التطوير |
| `INSECURE_COOKIES` | لا | — | القيمة `1` تسمح بملفات الجلسة عبر `http` عند تجربة نسخة الإنتاج على عنوان شبكة محلية. لا تستخدمه على موقع عام |
| `PORT` | لا | `3000` | منفذ `npm start` |

## 4. على جهازك

**وضع التطوير** (تحديث تلقائي، وحسابات تجريبية):

<div dir="ltr">

```bash
npm ci
npm run dev            # http://localhost:3000/ar  and  http://localhost:3000
```

</div>

**نسخة الإنتاج على جهازك:**

<div dir="ltr">

```bash
npm run build
npm start              # http://localhost:3000
```

</div>

المتصفحات تقبل ملفات الجلسة الآمنة على `http://localhost`، فيعمل تسجيل الدخول. لفتح الموقع من جهاز آخر على شبكتك (`http://192.168.x.x:3000`) شغّله مع `INSECURE_COOKIES=1`.

على ويندوز: اتبع الخطوات في [README بالعربية](../../README.ar.md#local). لا تحتاج أدوات بناء، لأن `better-sqlite3` يأتي بملفات جاهزة.

## 5. Render

في المستودع ملف إعداد جاهز اسمه `render.yaml` (Blueprint). يقرؤه Render وينشئ الخدمة بالإعدادات الصحيحة. يبدأ على **الخطة المجانية** لتجربة الموقع دون تكلفة. انتقل إلى الإعداد الدائم (الخيار ب) عندما يبدأ متعلّمون حقيقيون باستخدامه.

### الخيار أ: تجربة مجانية (الإعداد الافتراضي)

ما تتوقعه على الخطة المجانية:

- تنام الخدمة بعد نحو 15 دقيقة بلا زوار، وأول زيارة بعدها تنتظر قرابة دقيقة حتى تستيقظ.
- لا يوجد قرص دائم، لذلك **كل إعادة تشغيل أو استيقاظ أو نشر جديد يبدأ بقاعدة بيانات جديدة**:
  - المحتوى موجود دائمًا، لأنه يُحمَّل أثناء البناء وعند التشغيل؛
  - المسؤول يُعاد إنشاؤه من متغيرات البيئة؛
  - الحسابات الجديدة والتقدّم وتعديلات الاستوديو تضيع.

الخطوات:

1. سجّل الدخول في <https://dashboard.render.com> (يمكنك الدخول بحساب GitHub).
2. افتح الرابط <https://render.com/deploy?repo=https://github.com/eman-dev2/qa-engineering-academy> (زر **Deploy to Render** في README). أو اختر **New ← Blueprint**، واربط GitHub إذا طُلب منك، واختر المستودع `eman-dev2/qa-engineering-academy`.
3. يعرض Render الخدمة `qa-engineering-academy` على الخطة **Free**. أدخل القيمتين المطلوبتين:
   - `ADMIN_EMAIL`: بريدك الإلكتروني؛
   - `ADMIN_PASSWORD`: كلمة مرور قوية (10 أحرف أو أكثر، فيها حرف ورقم).
4. اضغط **Deploy Blueprint** (أو **Apply**).
   - أول بناء يستغرق بضع دقائق.
   - يظهر في سجلّ البناء `administrator created: you@example.com`، وتتحول حالة الخدمة إلى **Live**.
5. افتح الرابط الذي يعرضه Render، مثل `https://qa-engineering-academy.onrender.com` (يضيف Render لاحقة إذا كان الاسم مأخوذًا). أضف `/ar` للنسخة العربية، وسجّل الدخول ببريد المسؤول وكلمة مروره.

ما يضبطه ملف الإعداد:

<div dir="ltr">

```yaml
plan: free
buildCommand: npm ci --include=dev && npm run build
startCommand: npm start
envVars: NODE_VERSION=22, NODE_ENV=production, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME=Eman Abo-Oun
autoDeploy: true      # every push to main redeploys
```

</div>

### الخيار ب: إعداد دائم (خطة Starter مع قرص)

تبقى الحسابات والتقدّم وتعديلات الاستوديو بعد إعادة التشغيل والنشر. خطة Starter مدفوعة (راجع الأسعار الحالية على render.com)، والأقراص تتطلب خطة مدفوعة. عدّل `render.yaml` كما يلي، ثم ارفع التغيير. يطبّق Render تغييرات الإعداد في المزامنة التالية.

<div dir="ltr">

```yaml
    plan: starter
    # The disk isn't mounted while building, so the build uses its own throwaway database.
    buildCommand: npm ci --include=dev && DATABASE_PATH=./data/build.db npm run build
    envVars:
      # ...keep the existing variables, and add:
      - key: DATABASE_PATH
        value: /var/data/academy.db
    disk:
      name: academy-data
      mountPath: /var/data
      sizeGB: 1
```

</div>

- البناء يجهّز الصفحات من قاعدة بيانات مؤقتة خاصة به (`build.db`)، لأن القرص غير متصل أثناء البناء.
- عند التشغيل يطبّق التطبيق الترحيلات ويضيف البيانات إلى قاعدة البيانات على القرص.
- الصفحات المبنية من قاعدة البناء تتحدّث من القاعدة الحية خلال ساعة، وفورًا بعد أي تعديل في الاستوديو.
- الانتقال من الخيار أ يبدأ بقاعدة بيانات جديدة على القرص، ولا يضيع شيء لأن الخطة المجانية لا تحفظ البيانات أصلًا.

`ADMIN_PASSWORD` لا يُقرأ إلا عندما لا يوجد مسؤول في قاعدة البيانات:

- في الخيار ب يمكنك حذفه من **Environment** في الخدمة بعد أول تشغيل.
- على الخطة المجانية أبقِه، لأنه يُستخدم لإعادة إنشاء المسؤول كلما بدأت القاعدة من جديد.

### نطاق خاص

في **Settings ← Custom Domains** أضف نطاقك وسجلات DNS التي يعرضها Render. ثم اضبط `NEXT_PUBLIC_SITE_URL=https://your-domain` وأعد النشر، حتى تستخدمه روابط إعادة التعيين وخريطة الموقع.

### السجلات والـ Shell والنسخ الاحتياطي على Render

- **Logs:** تظهر فيها روابط إعادة تعيين كلمة المرور (إلى أن يُضاف بريد حقيقي) ورسائل التشغيل.
- **Shell** (في الخطط المدفوعة فقط): لأوامر مثل `npm run admin:create -- --email … --name "…"` و`npm run user:role -- grant … instructor`، أو لأخذ نسخة احتياطية ([DATABASE.md](../DATABASE.md#7-backups-and-restore)).
- يأخذ Render لقطة يومية للأقراص الدائمة.

## 6. Docker

<div dir="ltr">

```bash
docker build -t qa-academy .
docker run -d --name qa-academy -p 3000:3000 \
  -v qa-academy-data:/data \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='a-strong-password-1' \
  -e NEXT_PUBLIC_SITE_URL=https://your-domain \
  qa-academy
```

</div>

- قاعدة البيانات على وحدة التخزين `/data` (`DATABASE_PATH=/data/academy.db`).
- ضع أمامه خادمًا عكسيًا يدير HTTPS (مثل Caddy أو nginx أو Traefik)، لأن ملفات الجلسة آمنة (`Secure`) في الإنتاج.
- ملف Dockerfile يتبع خطوات البناء والتشغيل نفسها التي اختُبرت لـ Render. لكن الصورة نفسها لم تُبنَ بعد في بيئة المشروع، لعدم توفر Docker فيها.

## 7. خادم لينكس عادي

<div dir="ltr">

```bash
# as a non-root user, with Node.js 22 installed
git clone https://github.com/eman-dev2/qa-engineering-academy.git && cd qa-engineering-academy
npm ci --include=dev
export NODE_ENV=production DATABASE_PATH=/srv/qa-academy/academy.db NEXT_PUBLIC_SITE_URL=https://your-domain
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password-1' npm run build
npm start          # keep it running with systemd or pm2; proxy HTTPS to port 3000
```

</div>

للتحديث: `git pull && npm ci --include=dev && npm run build` ثم أعد التشغيل. البيانات الجديدة تُضاف وتعديلاتك تبقى.

## 8. قائمة تحقق بعد النشر

- [ ] الموقع يفتح بالعربية (`/ar`) والإنجليزية (`/`).
- [ ] تستطيع تسجيل الدخول كمسؤول وفتح **الإدارة**.
- [ ] الرابط `/ar/dev/outbox` يعرض «هذه الصفحة غير موجودة».
- [ ] الحساب الجديد يحصل على دور متعلّم فقط (تحقق من **الإدارة ← المستخدمون والأدوار**).
- [ ] آخر سطر في `/robots.txt` يحتوي عنوان موقعك العام. إذا ظهر `localhost`، اضبط `NEXT_PUBLIC_SITE_URL` على العنوان العام وأعد النشر.
- [ ] `NEXT_PUBLIC_SITE_URL` مضبوط إذا كنت تستخدم نطاقًا خاصًا.
- [ ] في الخيار ب فقط: خطة للنسخ الاحتياطي (لقطات Render مع نسخ خاصة بك).

## 9. تحديث المحتوى والكود

- **الكود:** ارفع إلى `main`، فيشغّل CI الفحوصات ويعيد Render النشر تلقائيًا (`autoDeploy: true`).
- **بيانات البداية الجديدة** (ملف درس جديد مثلًا) تُضاف في التشغيل التالي، ولا يُستبدل المحتوى الذي عُدّل في الاستوديو.
- **تعديلات الاستوديو** تظهر فورًا، لكنها لا تبقى بعد النشر إلا مع قرص دائم (الخيار ب، أو Docker، أو خادم بمسار دائم).

</div>
