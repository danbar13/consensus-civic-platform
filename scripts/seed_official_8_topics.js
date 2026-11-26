import 'dotenv/config';
import { supabase, isSupabaseConfigured } from '../server/supabase.js';
import { db } from '../server/db.js';

export const OFFICIAL_TOPICS = [
  {
    id: 'eilat-parking',
    slug: 'eilat-parking',
    title: 'שבוע 1: מצוקת החניה בשכונות, באזורי המסחר והחונים לסיני',
    subtitle: 'משאל עמדות אנונימי לאיתור פתרונות מוסכמים ומניעת חיכוכים בין תושבים, בעלי עסקים ותיירים לקראת עונת השיא',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    topic_type: 'weekly',
    groups: [
      { id: 'residents', label: 'תושבי שכונות המגורים', color: '#2563eb' },
      { id: 'business', label: 'בעלי עסקים ועובדי אזור התעשייה', color: '#d97706' },
      { id: 'tourism', label: 'ענף התיירות ומבקרים', color: '#059669' }
    ],
    // Currently live in the air (launched now, 5 days duration)
    starts_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    submissions_close_at: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(),
    closes_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    statements: [
      {
        id: 1,
        text: 'הקמת חניון "חנה וסע" מוסדר בתשלום לנופשים לסיני בשטח שדה התעופה הישן או בכניסה לעיר עם שאטל ישיר למעבר טאבה, ואכיפה מוגברת בשכונות.',
        group: 'residents'
      },
      {
        id: 2,
        text: 'צביעת כל ההכנסות מאכיפת חניה ומחניוני תיירים לקרן עירונית שקופה להצללת מדרכות, תחבורה ציבורית ושיפור החניה בשכונות.',
        group: 'residents'
      },
      {
        id: 3,
        text: 'הגבלת החניה באזור התעשייה ובמרכזי המסחר ל-3 שעות לתחלופת לקוחות, עם שעתיים ראשונות חינם לבעלי "תו תושב אילתי".',
        group: 'business'
      },
      {
        id: 4,
        text: 'הכשרת מגרשי חניה ייעודיים וחינמיים לעובדי אזור התעשייה ולרכבים מסחריים כתנאי מקדים לאכיפה באזור.',
        group: 'business'
      },
      {
        id: 5,
        text: 'איסור מוחלט על חניית רכבים ללא "תו תושב אילתי" בתוך שכונות המגורים בתקופות שיא (חגים וקיץ) או מעל 24 שעות רצופות.',
        group: 'residents'
      },
      {
        id: 6,
        text: 'הימנעות מקנסות וגרירות קשוחות לתיירים ישראלים שיורדים לסיני, כדי לא לפגוע בתדמית התיירותית של אילת ובעסקים שהם מפרנסים בדרך.',
        group: 'tourism'
      },
      {
        id: 7,
        text: 'מתן אפשרות לבעלי דירות נופש (Airbnb) בשכונות להנפיק עד 2 תווי חניה זמניים לאורחים רשומים.',
        group: 'tourism'
      },
      {
        id: 8,
        text: 'הפעלת קו מיניבוסים חשמלי וחינמי בתדירות של כל 10 דקות בין השכונות, אזור התעשייה והטיילת כדי לצמצם תלות ברכב פרטי.',
        group: 'residents'
      }
    ]
  },
  {
    id: 'eilat-airbnb',
    slug: 'eilat-airbnb',
    title: 'שבוע 2: הסדרת דירות ה-Airbnb בשכונות הוותיקות מול איכות חיי השכנים',
    subtitle: 'מיפוי עמדות למציאת אמנה קהילתית מחייבת שתשמור על השקט בשכונות לצד פרנסת המארחים',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'mediation',
    topic_type: 'weekly',
    groups: [
      { id: 'neighbors', label: 'שכנים ותושבים קבועים בבניינים', color: '#2563eb' },
      { id: 'hosts', label: 'מפעילי ובעלי דירות נופש', color: '#d97706' },
      { id: 'merchants', label: 'עסקים מקומיים ונותני שירותים', color: '#059669' }
    ],
    // Live active arena
    starts_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    submissions_close_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    statements: [
      {
        id: 9,
        text: 'חיוב כל בעל דירת נופש להתקין מד רעש דיגיטלי שמזהיר אוטומטית את האורחים ומדווח למארח בעת חריגת רעש אחרי 23:00.',
        group: 'neighbors'
      },
      {
        id: 10,
        text: 'פרסום מספר טלפון ישיר של איש קשר זמין 24/7 לכל דירת נופש שפועלת בבניין משותף, לטיפול מיידי במטרדים.',
        group: 'neighbors'
      },
      {
        id: 11,
        text: 'הגבלת מספר דירות הנופש בבניין משותף לעד 20% מכלל הדירות כדי לשמור על האופי הקהילתי.',
        group: 'neighbors'
      },
      {
        id: 12,
        text: 'השתתפות של בעלי דירות הנופש בתשלום ועד בית כפול בגין בלאי מואץ של המעלית והשטחים המשותפים.',
        group: 'hosts'
      },
      {
        id: 13,
        text: 'איסור מוחלט על השכרת דירות נופש בבנייני מגורים ללא הסכמה מראש של 75% מדיירי הבניין.',
        group: 'neighbors'
      },
      {
        id: 14,
        text: 'הטלת אגרת רישוי עירונית שנתית על דירות נופש, שתוכנס כולה לתקציב שיטור קהילתי ואכיפה ממוקדת בשכונות.',
        group: 'neighbors'
      },
      {
        id: 15,
        text: 'אפשרות להפעלת דירות נופש רק בידי תושבי אילת הגרים בעיר, ומניעת רכישה מסיבית של דירות ע"י משקיעי חוץ להשכרה לטווח קצר.',
        group: 'hosts'
      },
      {
        id: 16,
        text: 'יצירת "תו אירוח איכותי אילתי" שיעניק למארחים שומרי חוק הטבות בארנונה, לצד שלילת רישיון מיידית למפרי שקט סדרתיים.',
        group: 'hosts'
      }
    ]
  },
  {
    id: 'eilat-old-airport',
    slug: 'eilat-old-airport',
    title: 'שבוע 3: עתיד שטח שדה התעופה הישן: תמהיל מגורים לצעירים, פארק ותיירות',
    subtitle: 'איזה אופי יקבל הלב העירוני החדש של אילת: תמהיל שימושים, דיור בר-השגה וריאות ירוקות',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    topic_type: 'weekly',
    groups: [
      { id: 'young_families', label: 'צעירים ומשפחות צעירות', color: '#2563eb' },
      { id: 'planners_env', label: 'פעילי סביבה ותכנון עירוני', color: '#059669' },
      { id: 'commerce_tourism', label: 'יזמים, מלונאים ועסקים', color: '#d97706' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 17,
        text: 'הקצאת לפחות 40% משטח השדה לפארק ירוק מרכזי מוצל, עם מוקדי תרבות וספורט הפתוחים לכלל התושבים ללא תשלום.',
        group: 'planners_env'
      },
      {
        id: 18,
        text: 'ייעוד כל יחידות הדיור במתחם לדיור בר-השגה והשכרה ארוכת טווח במחיר מפוקח לתושבי אילת וזוגות צעירים בלבד.',
        group: 'young_families'
      },
      {
        id: 19,
        text: 'יצירת חיבור אורבני רציף ומוצל בין מרכז העיר הוותיק (שכונות א\'-ב\') לאזור המלונות והחוף, להולכי רגל ורוכבי אופניים בלבד.',
        group: 'planners_env'
      },
      {
        id: 20,
        text: 'הקמת מתחם תיירות, מסחר ובילויים חדשני ללא מע"מ שימשוך קהל ישראלי ובינלאומי ויעשיר את חיי הלילה של העיר.',
        group: 'commerce_tourism'
      },
      {
        id: 21,
        text: 'איסור מוחלט על בניית מגדלים גבוהים במתחם כדי לא לחסום את זרימת הרוח והנוף אל הרי אילת והמפרץ.',
        group: 'planners_env'
      },
      {
        id: 22,
        text: 'הקמת קמפוס אקדמי-מחקרי בינלאומי במתחם (מדעי הים, מדבר, אנרגיה ירוקה) שיביא סטודנטים וחוקרים להתגורר בעיר.',
        group: 'young_families'
      },
      {
        id: 23,
        text: 'הקצאת חלק מהשטח באופן מיידי לחניון תיירים מוזל עם שאטלים, עד לתחילת עבודות הפיתוח בפועל.',
        group: 'commerce_tourism'
      },
      {
        id: 24,
        text: 'הפקדת תוכנית הבינוי בידי ועדה ציבורית משותפת של נציגי תושבים לצד נציגי העירייה, כדי להבטיח מענה לצורכי הקהילה.',
        group: 'young_families'
      }
    ]
  },
  {
    id: 'eilat-clean-transit',
    slug: 'eilat-clean-transit',
    title: 'שבוע 4: ניקיון, הצללה ותחבורה ציבורית משכונות המגורים לחופים',
    subtitle: 'איך מייצרים עיר נקייה, מוצלת ונגישה: פתרונות תחבורה, ניקיון המרחב הציבורי והורדת עומסי חום',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    topic_type: 'weekly',
    groups: [
      { id: 'veteran_residents', label: 'תושבי השכונות והגיל השלישי', color: '#2563eb' },
      { id: 'youth_commuters', label: 'בני נוער, חיילים ומשתמשי תח"צ', color: '#7c3aed' },
      { id: 'beach_businesses', label: 'מפעילי חופים ומסחר סובב', color: '#059669' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 25,
        text: 'הפעלת קו שאטל חופים ייעודי, מוצל וחינמי כל 15 דקות מהשכונות הגבוהות ישירות לחופי הרחצה במהלך חודשי הקיץ והחגים.',
        group: 'youth_commuters'
      },
      {
        id: 26,
        text: 'פרויקט הצללה עירוני מואץ: חובת התקנת קירוי והצללה רציפה בכל תחנות האוטובוס ושבילי ההליכה המרכזיים בעיר.',
        group: 'veteran_residents'
      },
      {
        id: 27,
        text: 'הצבת פחי מחזור ואשפה מוגדלים ועמידים למפגעי רוח בשכונות, עם פינוי יומיומי כפול בחודשי החום כדי למנוע ריחות ומפגעים.',
        group: 'veteran_residents'
      },
      {
        id: 28,
        text: 'הגברת הפיקוח והטלת קנסות מוגדלים ובלתי מתפשרים על השלכת פסולת בחופים ובשטחים הפתוחים בעיר.',
        group: 'beach_businesses'
      },
      {
        id: 29,
        text: 'סבסוד נסיעות בתחבורה ציבורית לבני נוער ואזרחים ותיקים אילתיים לאורך כל השנה.',
        group: 'youth_commuters'
      },
      {
        id: 30,
        text: 'הוספת מתקני שתייה מקוררים וברזיות מים ציבוריות לאורך הטיילת ושבילי הגישה לחופים.',
        group: 'veteran_residents'
      },
      {
        id: 31,
        text: 'החמרת האכיפה נגד כניסת כלי רכב ורכבי שטח לרצועת החוף המוכרזת ולשבילי הולכי הרגל.',
        group: 'beach_businesses'
      },
      {
        id: 32,
        text: 'שיתוף פעולה בין מפעילי החופים לעירייה לפינוי מוקדם של פסולת והקצאת עמדות צל קבועות חינם לתושבי אילת בהצגת תעודת תושב.',
        group: 'beach_businesses'
      }
    ]
  },
  {
    id: 'eilat-cost-of-living',
    slug: 'eilat-cost-of-living',
    title: 'שבוע 5: יוקר המחיה והמחירים ברשתות המזון, הצריכה והפנאי באילת',
    subtitle: 'איפה באמת נעלם הפטור ממע"מ? גיבוש מהלכים עירוניים ואזרחיים להוזלת סל הקניות והשירותים',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    topic_type: 'weekly',
    groups: [
      { id: 'consumers', label: 'משפחות וצרכנים אילתיים', color: '#2563eb' },
      { id: 'local_retailers', label: 'סוחרים ורשתות מזון מקומיות', color: '#d97706' },
      { id: 'service_providers', label: 'בעלי מסעדות ומקומות בילוי', color: '#059669' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 33,
        text: 'פרסום "מדד סל המוצרים האילתי" השבועי בעיתון ערב ערב שישווה מחירים בין הרשתות בעיר ויחשוף מי מגלגל את הפטור ממע"מ לצרכן.',
        group: 'consumers'
      },
      {
        id: 34,
        text: 'חיוב רשתות השיווק הארציות להציג במדף את מחיר המוצר באילת מול מחירו במרכז הארץ כדי לוודא הנחת מע"מ אמיתית (17%).',
        group: 'consumers'
      },
      {
        id: 35,
        text: 'הקצאת קרקע עירונית במחיר סמלי להקמת שוק איכרים ומזון קואופרטיבי מוזל ישירות מחקלאי הערבה והדרום לתושבי העיר.',
        group: 'consumers'
      },
      {
        id: 36,
        text: 'הנחה קבועה של לפחות 15% לבעלי תעודת "תושב אילת" במסעדות, בתי קפה ואתרי בילוי בכל ימות השבוע.',
        group: 'service_providers'
      },
      {
        id: 37,
        text: 'עידוד תחרות ע"י מתן פטור מארנונה בשנה הראשונה לרשתות מזון מוזלות חדשות שיפתחו סניפים בתוך שכונות המגורים.',
        group: 'local_retailers'
      },
      {
        id: 38,
        text: 'הכרה בעלויות השינוע היקרות והלוגיסטיקה המורכבת של אילת ומתן סיוע ממשלתי ייעודי בהובלת סחורות כדי למנוע התייקרות.',
        group: 'local_retailers'
      },
      {
        id: 39,
        text: 'הקמת "סיירת מחירים עירונית" של מתנדבים שתדווח בזמן אמת על הפקעת מחירים של מוצרי יסוד.',
        group: 'consumers'
      },
      {
        id: 40,
        text: 'פיקוח עירוני קפדני על מחירי הצהרונים, חוגי הילדים והקייטנות העירוניות שאינם מצדיקים מחירים גבוהים מאלו שבמרכז.',
        group: 'consumers'
      }
    ]
  },
  {
    id: 'eilat-young-talent',
    slug: 'eilat-young-talent',
    title: 'שבוע 6: תעסוקת צעירים, השכלה גבוהה ושימור הון אנושי בעיר',
    subtitle: 'איך עוצרים את עזיבת הצעירים? מסלולי תעסוקה איכותיים, אקדמיה, יזמות ומענקי דיור',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'committee',
    topic_type: 'weekly',
    groups: [
      { id: 'young_academics', label: 'צעירים, סטודנטים ואקדמאים', color: '#2563eb' },
      { id: 'employers', label: 'מעסיקים, הייטק ומנהלי ארגונים', color: '#d97706' },
      { id: 'public_sector', label: 'הנהגת העירייה ומוסדות חינוך', color: '#7c3aed' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 41,
        text: 'מתן מענק דיור עירוני לצעירים אילתיים החוזרים לעיר לאחר סיום תואר אקדמי במקצועות נדרשים.',
        group: 'young_academics'
      },
      {
        id: 42,
        text: 'הקמת מתחם Hub טכנולוגי-עירוני ליזמות, עבודה מרחוק והייטק עם תשתיות אינטרנט מהיר ומנטורינג מוזל.',
        group: 'employers'
      },
      {
        id: 43,
        text: 'הרחבת היצע התארים האקדמיים המלאים באוניברסיטת בן-גוריון באילת בתחומי מדעי הנתונים, ביוטכנולוגיה ימית והוראה.',
        group: 'public_sector'
      },
      {
        id: 44,
        text: 'חיוב גופים ומלונות הנהנים מהטבות עירוניות להעסיק צעירים אילתיים במשרות ניהוליות ומקצועיות ולא רק בתפקידי שירות זמניים.',
        group: 'employers'
      },
      {
        id: 45,
        text: 'יצירת מסלול התמחות מקצועי (סטאז\') בשכר לבוגרי מכללות ואוניברסיטאות בחברות ובמוסדות באילת.',
        group: 'employers'
      },
      {
        id: 46,
        text: 'מודל הטבות שכר ומיסוי מוגדל לעובדי הייטק ועובדים במקצועות חופשיים הבוחרים להעתיק את מגוריהם ועבודתם לאילת.',
        group: 'public_sector'
      },
      {
        id: 47,
        text: 'מלגות לימודים מוגדלות תמורת התחייבות ל-3 שנות עבודה והתנדבות קהילתית באילת לאחר סיום התואר.',
        group: 'young_academics'
      },
      {
        id: 48,
        text: 'פיתוח חיי לילה, תרבות והופעות מסובסדות לחיילים וצעירים כדי ליצור סביבה תוססת שמעודדת הישארות בעיר.',
        group: 'young_academics'
      }
    ]
  },
  {
    id: 'eilat-north-beach',
    slug: 'eilat-north-beach',
    title: 'שבוע 7: פיתוח רצועת החוף הצפונית מול שמירה על ערכי הטבע והשונית',
    subtitle: 'איזון בין מלונאות, טיילת ומסחר לבין שימור משאב הטבע החשוב ביותר של העיר אילת',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    topic_type: 'weekly',
    groups: [
      { id: 'green_orgs', label: 'פעילי סביבה, צוללים ושומרי טבע', color: '#059669' },
      { id: 'tourism_dev', label: 'יזמי תיירות, מלונאים ועסקי חוף', color: '#d97706' },
      { id: 'city_residents', label: 'תושבי העיר ומשתמשי החוף', color: '#2563eb' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 49,
        text: 'איסור מוחלט על בנייה מסחרית חדשה במרחק של פחות מ-100 מטר מקו המים ברצועת החוף הצפונית.',
        group: 'green_orgs'
      },
      {
        id: 50,
        text: 'הנגשה מלאה של כלל חופי הרחצה לרחצה ציבורית חופשית, כולל פירוק גדרות ומחסומים בלתי מורשים.',
        group: 'city_residents'
      },
      {
        id: 51,
        text: 'חיוב כל עסק ומתקן חוף במערכות סינון שפכים ואפס פליטת פלסטיק וזיהום למי המפרץ והשונית.',
        group: 'green_orgs'
      },
      {
        id: 52,
        text: 'פיתוח טיילת חוף אקולוגית רציפה ומוצלת עם שבילי אופניים ומקלחות חוף ידידותיות לסביבה.',
        group: 'city_residents'
      },
      {
        id: 53,
        text: 'התרת פעילות ספורט ימי ממונע (אופנועי ים) רק באזורים מוגדרים ומרוחקים היטב מאזורי שחייה ושוניות.',
        group: 'tourism_dev'
      },
      {
        id: 54,
        text: 'הקמת מתחמי קמפינג ולינת שטח מוסדרים עם שירותים ומקלחות בעלות סמלית לתושבים ולתיירים.',
        group: 'city_residents'
      },
      {
        id: 55,
        text: 'הקצאת רצועת חוף ייעודית מוגנת למחקר ביולוגי ימי ושיקום אלמוגים, בשיתוף המכון הבינאוניברסיטאי.',
        group: 'green_orgs'
      },
      {
        id: 56,
        text: 'מתן עדיפות בהפעלת שירותי חוף (מזנונים, השכרת ציוד) לעסקים קטנים בבעלות תושבי אילת ולא לזכייני ענק מבחוץ.',
        group: 'tourism_dev'
      }
    ]
  },
  {
    id: 'eilat-health-services',
    slug: 'eilat-health-services',
    title: 'שבוע 8: שירותי הרפואה והמומחים באילת: סדרי עדיפויות לקידום מול הממשלה',
    subtitle: 'איך פותרים את המרחק והמחסור ברפואה דחופה ומקצועית: דרישות העיר אילת לקראת תקציב המדינה',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'committee',
    topic_type: 'weekly',
    groups: [
      { id: 'patients_families', label: 'מטופלים, חולים כרוניים ובני משפחה', color: '#2563eb' },
      { id: 'medical_staff', label: 'רופאים, אחיות ועובדי מערכת הבריאות', color: '#059669' },
      { id: 'city_leadership', label: 'נציגי ציבור והנהלת בית חולים יוספטל', color: '#dc2626' }
    ],
    // Unscheduled in reservoir
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    statements: [
      {
        id: 57,
        text: 'חובת המדינה לממן טיסות רפואיות ללא הגבלה למטופלים אילתיים הנזקקים לבדיקות ולטיפולים שאינם קיימים ביוספטל.',
        group: 'patients_families'
      },
      {
        id: 58,
        text: 'מתן חבילת תמריצים ממשלתית חריגה (דיור חינם + מענק חודשי) לרופאים מומחים שיעברו להתגורר ולעבוד קבוע באילת.',
        group: 'medical_staff'
      },
      {
        id: 59,
        text: 'שדרוג והרחבת חדרי המיון והיחידות לטיפול נמרץ וצנתורים בביה"ח יוספטל כדי למנוע צורך בהטסות חירום מצילות חיים.',
        group: 'city_leadership'
      },
      {
        id: 60,
        text: 'חיוב קופות החולים לאפשר תורים לרופאים מומחים באילת בפרק זמן של עד שבועיים, או לממן רופא פרטי לתושב.',
        group: 'patients_families'
      },
      {
        id: 61,
        text: 'הקמת מרכז רפואי ייעודי לבריאות הנפש, התפתחות הילד ורפואת שיקום בעיר ללא תלות במרכז הארץ.',
        group: 'patients_families'
      },
      {
        id: 62,
        text: 'הפעלת מערך רפואה מרחוק (Telemedicine) מתקדם עם בתי החולים הגדולים (איכילוב, שיבא) למתן ייעוץ מומחים מיידי.',
        group: 'medical_staff'
      },
      {
        id: 63,
        text: 'פתיחת מסלול לימודי סיעוד ורפואה ייעודי באוניברסיטת בן-גוריון באילת עם מלגות מלאות לתושבי האזור.',
        group: 'city_leadership'
      },
      {
        id: 64,
        text: 'הצבת נושא הרפואה באילת כדרישת סף בלתי מתפשרת של הנהגת העיר מול הממשלה בהסכמים קואליציוניים ותקציביים.',
        group: 'city_leadership'
      }
    ]
  }
];

async function seedDatabase() {
  console.log('🚀 Starting official 8 topics seed...');

  // 1. Seed SQLite Database
  const insertTopic = db.prepare(`
    INSERT INTO topics (id, slug, title, subtitle, organization, category, groups_json, topic_type, moderation_mode, created_at, starts_at, submissions_close_at, closes_at)
    VALUES (@id, @slug, @title, @subtitle, @organization, @category, @groups_json, @topic_type, @moderation_mode, @created_at, @starts_at, @submissions_close_at, @closes_at)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      subtitle = excluded.subtitle,
      organization = excluded.organization,
      category = excluded.category,
      groups_json = excluded.groups_json,
      topic_type = excluded.topic_type,
      starts_at = excluded.starts_at,
      submissions_close_at = excluded.submissions_close_at,
      closes_at = excluded.closes_at
  `);

  const insertStatement = db.prepare(`
    INSERT INTO statements (id, topic_id, text, author_group, is_seed, status, created_at)
    VALUES (@id, @topic_id, @text, @author_group, @is_seed, @status, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      text = excluded.text,
      author_group = excluded.author_group,
      status = excluded.status
  `);

  const insertVote = db.prepare(`
    INSERT OR IGNORE INTO votes (topic_id, statement_id, session_id, group_id, vote, created_at)
    VALUES (@topic_id, @statement_id, @session_id, @group_id, @vote, @created_at)
  `);

  const now = new Date().toISOString();

  for (const t of OFFICIAL_TOPICS) {
    console.log(`📦 Seeding SQLite: ${t.id} - ${t.title}`);
    insertTopic.run({
      id: t.id,
      slug: t.slug,
      title: t.title,
      subtitle: t.subtitle,
      organization: t.organization,
      category: t.category,
      groups_json: JSON.stringify(t.groups),
      topic_type: t.topic_type,
      moderation_mode: 'batch_approval',
      created_at: now,
      starts_at: t.starts_at,
      submissions_close_at: t.submissions_close_at,
      closes_at: t.closes_at
    });

    for (const st of t.statements) {
      insertStatement.run({
        id: st.id,
        topic_id: t.id,
        text: st.text,
        author_group: st.group,
        is_seed: 1,
        status: 'approved',
        created_at: now
      });
    }

    // Seed simulated votes for demo topics so they have rich consensus data
    // 35 simulated participants per topic
    const groupsList = t.groups.map(g => g.id);
    for (let i = 1; i <= 35; i++) {
      const assignedGroup = groupsList[i % groupsList.length];
      const sessionId = `sim_${t.id}_user_${i}`;
      for (const st of t.statements) {
        // High consensus for first 4 statements (bridging), more divisive for last 4
        let vote = 1;
        const rand = Math.random();
        if (st.id % 8 <= 4) {
          vote = rand < 0.85 ? 1 : rand < 0.95 ? -1 : 0;
        } else {
          vote = rand < 0.5 ? 1 : rand < 0.85 ? -1 : 0;
        }
        insertVote.run({
          topic_id: t.id,
          statement_id: st.id,
          session_id: sessionId,
          group_id: assignedGroup,
          vote,
          created_at: now
        });
      }
    }
  }

  console.log('✅ SQLite database updated with all 8 official topics!');

  // 2. Seed Supabase Cloud if configured
  if (isSupabaseConfigured && supabase) {
    console.log('⚡ Connecting to Supabase Cloud to sync 8 official topics...');
    try {
      for (const t of OFFICIAL_TOPICS) {
        console.log(`☁️ Upserting to Supabase: ${t.id}`);
        const topicPayload = {
          id: t.id,
          slug: t.slug,
          title: t.title,
          subtitle: t.subtitle,
          organization: t.organization,
          category: t.category,
          groups_json: t.groups,
          moderation_mode: 'batch_approval',
          created_at: now,
          submissions_close_at: t.submissions_close_at,
          closes_at: t.closes_at
        };

        const { error: topicErr } = await supabase.from('topics').upsert(topicPayload);

        if (topicErr) {
          console.error(`Error upserting topic ${t.id} to Supabase:`, topicErr.message);
          continue;
        }

        const statementsPayload = t.statements.map(st => ({
          id: st.id,
          topic_id: t.id,
          text: st.text,
          author_group: st.group,
          is_seed: true,
          status: 'approved',
          created_at: now
        }));

        const { error: stErr } = await supabase.from('statements').upsert(statementsPayload);
        if (stErr) {
          console.error(`Error upserting statements for ${t.id} to Supabase:`, stErr.message);
        }

        // Seed sample votes in Supabase
        const groupsList = t.groups.map(g => g.id);
        const votesPayload = [];
        for (let i = 1; i <= 25; i++) {
          const assignedGroup = groupsList[i % groupsList.length];
          const sessionId = `sim_${t.id}_user_${i}`;
          for (const st of t.statements) {
            let vote = 1;
            const rand = Math.random();
            if (st.id % 8 <= 4) {
              vote = rand < 0.85 ? 1 : rand < 0.95 ? -1 : 0;
            } else {
              vote = rand < 0.5 ? 1 : rand < 0.85 ? -1 : 0;
            }
            votesPayload.push({
              topic_id: t.id,
              statement_id: st.id,
              session_id: sessionId,
              group_id: assignedGroup,
              vote,
              created_at: now
            });
          }
        }

        const { error: vErr } = await supabase
          .from('votes')
          .upsert(votesPayload, { onConflict: 'statement_id,session_id' });
        if (vErr) {
          console.warn(`Sample votes sync notice for ${t.id}:`, vErr.message);
        }
      }
      console.log('🎉 Supabase cloud successfully synchronized with all 8 official topics!');
    } catch (err) {
      console.error('Error during Supabase sync:', err.message);
    }
  }

  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Seed fatal error:', err);
  process.exit(1);
});
