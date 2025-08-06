import { User, Training, TrainingContent, Quiz, Badge, Announcement, Notification, TrainingProgress } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alperen Erdem',
    email: 'ahmet.yilmaz@sirket.com',
    role: 'admin',
    department: 'Yönetim',
    position: 'İnsan Kaynakları Direktörü',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    completedTrainings: ['1', '3'],
    assignedTrainings: ['1', '2', '3', '4'],
    badges: [
      {
        id: '1',
        name: 'Eğitim Liderliği',
        description: '10 eğitimi tamamladı',
        icon: 'award',
        criteria: '10 eğitim tamamlama',
      }
    ],
    points: 450,
  },
  {
    id: '2',
    name: 'Zeynep Kaya',
    email: 'zeynep.kaya@sirket.com',
    role: 'instructor',
    department: 'İnsan Kaynakları',
    position: 'Eğitim Uzmanı',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    completedTrainings: ['2'],
    assignedTrainings: ['1', '2', '4'],
    badges: [],
    points: 280,
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    email: 'mehmet.demir@sirket.com',
    role: 'employee',
    department: 'Satış',
    position: 'Satış Uzmanı',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    completedTrainings: [],
    assignedTrainings: ['1', '3'],
    badges: [],
    points: 120,
  },
  {
    id: '4',
    name: 'Ayşe Yıldız',
    email: 'ayse.yildiz@sirket.com',
    role: 'employee',
    department: 'Pazarlama',
    position: 'Pazarlama Uzmanı',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    completedTrainings: ['4'],
    assignedTrainings: ['2', '4'],
    badges: [],
    points: 180,
  },
];

export const mockTrainings: Training[] = [
  {
    id: '1',
    title: 'İş Sağlığı ve Güvenliği Temel Eğitimi',
    description: 'İş yerinde sağlık ve güvenlik konusunda temel bilgiler ve uygulamalar',
    category: 'Zorunlu Eğitimler',
    difficulty: 'beginner',
    duration: 60,
    author: 'Yılmaz',
    published: true,
    createdAt: '2024-10-15T08:00:00Z',
    updatedAt: '2024-10-15T08:00:00Z',
    content: [
      {
        id: '1-1',
        type: 'video',
        title: 'İş Sağlığı ve Güvenliği Temelleri',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 20,
        order: 1,
      },
      {
        id: '1-2',
        type: 'text',
        title: 'Yasal Düzenlemeler',
        content: '<p>İş sağlığı ve güvenliği ile ilgili yasal düzenlemeler...</p>',
        order: 2,
      }
    ],
    quizzes: [
      {
        id: '1-quiz',
        title: 'İSG Temel Bilgiler Testi',
        description: 'İş Sağlığı ve Güvenliği temel bilgilerini ölçen test',
        passingScore: 70,
        questions: [
          {
            id: 'q1',
            text: 'İş Sağlığı ve Güvenliği Kanunu hangi yılda yürürlüğe girmiştir?',
            type: 'multiple-choice',
            options: ['2010', '2012', '2015', '2018'],
            correctAnswer: '2012',
            points: 10,
          },
          {
            id: 'q2',
            text: 'İş kazası durumunda ilk yapılması gereken nedir?',
            type: 'multiple-choice',
            options: [
              'Yöneticiye haber vermek',
              'İlk yardım uygulamak ve acil servisi aramak',
              'Kaza raporu doldurmak',
              'İş arkadaşlarını uyarmak'
            ],
            correctAnswer: 'İlk yardım uygulamak ve acil servisi aramak',
            points: 10,
          }
        ],
        timeLimit: 15,
      }
    ],
    certificateTemplate: 'isg-sertifika',
  },
  {
    id: '2',
    title: 'Etkili İletişim Becerileri',
    description: 'İş yerinde etkili iletişim kurma ve çatışma yönetimi becerileri',
    category: 'Kişisel Gelişim',
    difficulty: 'intermediate',
    duration: 120,
    author: 'Zeynep Kaya',
    published: true,
    createdAt: '2024-10-10T10:30:00Z',
    updatedAt: '2024-10-12T14:15:00Z',
    content: [
      {
        id: '2-1',
        type: 'video',
        title: 'İletişimin Temelleri',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 25,
        order: 1,
      },
      {
        id: '2-2',
        type: 'pdf',
        title: 'Etkili İletişim Rehberi',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order: 2,
      }
    ],
    quizzes: [
      {
        id: '2-quiz',
        title: 'İletişim Becerileri Değerlendirmesi',
        description: 'İletişim becerilerini ölçen test',
        passingScore: 80,
        questions: [
          {
            id: 'q1',
            text: 'Aktif dinleme nedir?',
            type: 'multiple-choice',
            options: [
              'Karşıdakinin sözünü kesmeden dinlemek',
              'Konuşurken göz teması kurmak',
              'Dinlerken anladığınızı göstermek ve sorular sormak',
              'Konuşmayı yönlendirmek'
            ],
            correctAnswer: 'Dinlerken anladığınızı göstermek ve sorular sormak',
            points: 10,
          }
        ],
        timeLimit: 20,
      }
    ],
  },
  {
    id: '3',
    title: 'Microsoft Excel İleri Seviye',
    description: 'Excel\'de ileri formüller, pivot tablolar ve makrolar',
    category: 'Bilgisayar Becerileri',
    difficulty: 'advanced',
    duration: 180,
    author: 'Mehmet Demir',
    published: true,
    createdAt: '2024-09-05T09:45:00Z',
    updatedAt: '2024-09-20T11:30:00Z',
    content: [
      {
        id: '3-1',
        type: 'video',
        title: 'İleri Excel Formülleri',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 40,
        order: 1,
      },
      {
        id: '3-2',
        type: 'interactive',
        title: 'Pivot Tablo Alıştırmaları',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        order: 2,
      }
    ],
    quizzes: [
      {
        id: '3-quiz',
        title: 'Excel Uzmanlık Sınavı',
        description: 'Excel bilgilerini ölçen kapsamlı sınav',
        passingScore: 75,
        questions: [
          {
            id: 'q1',
            text: 'VLOOKUP fonksiyonu ne işe yarar?',
            type: 'short-answer',
            correctAnswer: 'Dikey arama yaparak başka bir veri aralığından değer getirir',
            points: 15,
          }
        ],
        timeLimit: 30,
      }
    ],
    certificateTemplate: 'excel-sertifika',
  },
  {
    id: '4',
    title: 'Müşteri İlişkileri Yönetimi',
    description: 'Müşteri memnuniyeti ve sadakati oluşturma stratejileri',
    category: 'Satış ve Pazarlama',
    difficulty: 'intermediate',
    duration: 90,
    author: 'Ayşe Yıldız',
    published: true,
    createdAt: '2024-10-01T13:20:00Z',
    updatedAt: '2024-10-05T09:10:00Z',
    content: [
      {
        id: '4-1',
        type: 'video',
        title: 'Müşteri Deneyimi Temelleri',
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 30,
        order: 1,
      },
      {
        id: '4-2',
        type: 'text',
        title: 'Zorlu Müşterilerle Başa Çıkma',
        content: '<p>Zorlu müşterilerle başa çıkma stratejileri...</p>',
        order: 2,
      }
    ],
    quizzes: [
      {
        id: '4-quiz',
        title: 'Müşteri İlişkileri Değerlendirmesi',
        description: 'Müşteri ilişkileri yönetimi bilgisini ölçen test',
        passingScore: 70,
        questions: [
          {
            id: 'q1',
            text: 'Müşteri memnuniyetini ölçmek için en yaygın kullanılan metrik hangisidir?',
            type: 'multiple-choice',
            options: ['NPS (Net Promoter Score)', 'CSAT (Customer Satisfaction)', 'CES (Customer Effort Score)', 'Churn Rate'],
            correctAnswer: 'NPS (Net Promoter Score)',
            points: 10,
          }
        ],
        timeLimit: 15,
      }
    ],
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Yeni Zorunlu İSG Eğitimi',
    content: 'Tüm çalışanların 30 gün içinde İş Sağlığı ve Güvenliği eğitimini tamamlaması gerekmektedir.',
    author: 'Ahmet Yılmaz',
    important: true,
    createdAt: '2024-10-18T09:00:00Z',
    expiresAt: '2024-11-18T09:00:00Z',
  },
  {
    id: '2',
    title: 'Ekim Ayı Eğitim Takvimi',
    content: 'Ekim ayında gerçekleşecek eğitimler ve tarihleri yayınlandı. Detaylar için takvimi kontrol edin.',
    author: 'Zeynep Kaya',
    important: false,
    createdAt: '2024-10-01T08:30:00Z',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '3',
    type: 'assignment',
    title: 'Yeni Eğitim Atandı',
    message: 'Size "İş Sağlığı ve Güvenliği Temel Eğitimi" atandı. Lütfen 30 gün içinde tamamlayın.',
    read: false,
    createdAt: '2024-10-18T09:15:00Z',
    relatedId: '1',
  },
  {
    id: '2',
    userId: '3',
    type: 'reminder',
    title: 'Eğitim Hatırlatması',
    message: 'Atanan "İş Sağlığı ve Güvenliği Temel Eğitimi" için son 5 gününüz kaldı.',
    read: true,
    createdAt: '2024-11-12T10:00:00Z',
    relatedId: '1',
  },
];

export const mockTrainingProgress: TrainingProgress[] = [
  {
    userId: '1',
    trainingId: '1',
    started: '2024-10-16T10:30:00Z',
    completed: '2024-10-16T11:45:00Z',
    progress: 100,
    contentProgress: [
      {
        contentId: '1-1',
        completed: true,
        timeSpent: 1250,
      },
      {
        contentId: '1-2',
        completed: true,
        timeSpent: 800,
      }
    ],
    quizResults: [
      {
        quizId: '1-quiz',
        score: 90,
        passed: true,
        attempts: 1,
        lastAttempt: '2024-10-16T11:40:00Z',
      }
    ],
    certificateIssued: '2024-10-16T11:45:00Z',
  },
  {
    userId: '3',
    trainingId: '1',
    started: '2024-10-19T14:00:00Z',
    progress: 50,
    contentProgress: [
      {
        contentId: '1-1',
        completed: true,
        timeSpent: 1300,
      },
      {
        contentId: '1-2',
        completed: false,
        timeSpent: 300,
      }
    ],
    quizResults: [],
  },
];

export const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Eğitim Liderliği',
    description: '10 eğitimi tamamladı',
    icon: 'award',
    criteria: '10 eğitim tamamlama',
  },
  {
    id: '2',
    name: 'Hızlı Öğrenen',
    description: '5 eğitimi ilk denemede başarıyla tamamladı',
    icon: 'zap',
    criteria: '5 eğitimi ilk denemede başarıyla tamamlama',
  },
  {
    id: '3',
    name: 'Bilgi Paylaşımcısı',
    description: 'Forumda en çok yanıtlanan sorular',
    icon: 'share',
    criteria: 'En az 20 forum sorusuna yanıt verme',
  },
];

export const currentUser: User = mockUsers[0]; 