export type Lang = 'ar' | 'en';

export const translations = {
  ar: {
    app: {
      name: 'نجوم',
      tagline: 'لوحة التحكم',
      subtitle: 'للمشرفين فقط',
    },
    nav: {
      home:       'الرئيسية',
      users:      'المستخدمات',
      content:    'المحتوى',
      hotlines:   'خطوط الطوارئ',
      moderation: 'الإشراف',
      scouts:     'الكشافة',
      events:     'الفعاليات',
      mentors:    'المرشدات',
      sos:        'نداءات SOS',
      analytics:  'الإحصائيات',
    },
    topbar: {
      signOut:       'تسجيل الخروج',
      switchToLight: 'الوضع النهاري',
      switchToDark:  'الوضع الليلي',
      switchToEn:    'English',
      switchToAr:    'عربي',
    },
    login: {
      title:      'نجوم',
      subtitle:   'لوحة التحكم',
      cta:        'الدخول بحساب Google',
      loading:    'جارٍ تسجيل الدخول…',
      adminOnly:  'هذه اللوحة مخصصة للمشرفين فقط.',
      noAccount:  'إذا لم يكن لديكِ حساب مشرف، تواصلي مع المسؤولة.',
      errUnauth:  'ليس لديكِ صلاحية الوصول إلى لوحة التحكم.',
      errOAuth:   'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    },
  },
  en: {
    app: {
      name:    'Njoum',
      tagline: 'Admin Dashboard',
      subtitle:'Admin only',
    },
    nav: {
      home:       'Dashboard',
      users:      'Users',
      content:    'Content',
      hotlines:   'Hotlines',
      moderation: 'Moderation',
      scouts:     'Scouts',
      events:     'Events',
      mentors:    'Mentors',
      sos:        'SOS Alerts',
      analytics:  'Analytics',
    },
    topbar: {
      signOut:       'Sign Out',
      switchToLight: 'Light Mode',
      switchToDark:  'Dark Mode',
      switchToEn:    'English',
      switchToAr:    'عربي',
    },
    login: {
      title:     'Njoum',
      subtitle:  'Admin Dashboard',
      cta:       'Sign in with Google',
      loading:   'Signing in…',
      adminOnly: 'This panel is for administrators only.',
      noAccount: "If you don't have an admin account, contact the system admin.",
      errUnauth: "You don't have access to this dashboard.",
      errOAuth:  'An error occurred during sign-in. Please try again.',
    },
  },
} as const;

export type Translations = typeof translations.ar;
