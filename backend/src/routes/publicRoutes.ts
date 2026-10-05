import { Router, Request, Response } from 'express';
import { prisma } from '../db';

export const publicRouter = Router();

// ==========================================
// SITE CONFIGURATION & CONSTANTS
// ==========================================
export const SITE = {
  name: 'Sri Munis Kanna Driving School',
  url: 'https://nellaimuniskanna.com',
  short: 'SMK Driving School',
  owner: 'M. Muthukumar',
  phone: '+91 94877 19904',
  phoneTel: '+919487719904',
  phone2: '+91 74483 20321',
  phone2Tel: '+917448320321',
  whatsapp: '919487719904',
  whatsappMsg: "Hi! I'd like to enquire about driving classes and car rentals at Sri Munis Kanna Driving School.",
  location: 'Tirunelveli Junction, Tamil Nadu',
  address: 'Near Tirunelveli Junction, Tirunelveli, Tamil Nadu 627001',
  hours: 'Mon – Sat: 6:00 AM – 8:00 PM • Sun: 7:00 AM – 12:00 PM',
  mapsEmbed: 'https://www.google.com/maps?q=Tirunelveli+Junction,+Tamil+Nadu&output=embed',
};

export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/courses', label: 'Courses' },
  { href: '/car-rentals', label: 'Car Rentals' },
  { href: '/why-us', label: 'Why Us' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export function waLink(msg: string = SITE.whatsappMsg): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
}

// ==========================================
// SVG ICONS
// ==========================================
export function icon(name: string, cls = 'size-5'): string {
  const paths: Record<string, string> = {
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12 19.79 19.79 0 0 1 1.24 3.34a2 2 0 0 1 1.99-2.15h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 6 6l.42-.42a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'message-circle': '<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'award': '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'map': '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>',
    'badge-check': '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    'check': '<path d="M20 6 9 17l-5-5"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    'sparkles': '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
    'quote': '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    'id-card': '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    'car': '<path d="M19 17H5v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2Z"/><path d="M4.5 13.5 3 8h18l-1.5 5.5"/><path d="M3 8a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
    'route': '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    'clipboard-check': '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    'menu': '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    'x': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    'instagram': '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>',
    'facebook': '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    'youtube': '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    'calendar': '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    'shield': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    'key': '<path d="m21 2-2 2m-1.5 1.5L14 9a5 5 0 1 0 3 3l6.5-6.5a1 1 0 0 0 0-1.41L22.41 2.59a1 1 0 0 0-1.41 0z"/><circle cx="7.5" cy="16.5" r="1.5"/>',
    'fuel': '<path d="M3 22v-8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v8"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/><path d="M3 9h10V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/>',
    'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  };

  const inner = paths[name] || '';
  const fill = name === 'star' ? 'currentColor' : 'none';

  return `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// ==========================================
// DATA: COURSES
// ==========================================
export const COURSES_DATA = [
  {
    name: 'Beginner Course',
    duration: '21 Days',
    sessions: '22 Practical Classes',
    highlight: false,
    badge: null,
    features: [
      'Vehicle controls & basics',
      'Steering, gears, clutch mastery',
      'Slow-speed maneuvering',
      'Traffic signal training',
      'LL + DL assistance',
    ],
  },
  {
    name: 'Ladies Special',
    duration: '21 Days',
    sessions: 'Female-friendly batches',
    highlight: true,
    badge: 'Most loved',
    features: [
      'Comfortable, judgement-free',
      'Patient female-aware coaching',
      'Flexible morning/evening',
      'Confidence-first approach',
      'Full license assistance',
    ],
  },
  {
    name: 'Advanced Driving',
    duration: '10 Days',
    sessions: 'Highway + city',
    highlight: false,
    badge: null,
    features: [
      'Highway & long-route practice',
      'Night driving sessions',
      'Defensive driving techniques',
      'Parking & reverse mastery',
      'Heavy traffic handling',
    ],
  },
  {
    name: 'Refresher Course',
    duration: '7 Days',
    sessions: 'For licensed drivers',
    highlight: false,
    badge: null,
    features: [
      'Brush-up after a long break',
      'Confidence rebuilding',
      'Modern car familiarization',
      'Personalized weak-area focus',
    ],
  },
  {
    name: 'License Assistance',
    duration: 'End-to-end',
    sessions: 'Documentation + Test',
    highlight: false,
    badge: null,
    features: [
      'RTO documentation help',
      'LL slot booking',
      'Driving test prep',
      'Permanent DL follow-up',
    ],
  },
];

// ==========================================
// DATA: CAR RENTALS
// ==========================================
export const CAR_RENTALS_DATA = [
  {
    id: 'hatchback',
    name: 'Maruti Suzuki Swift / WagonR',
    category: 'Hatchback',
    tagline: 'City friendly & economical',
    image: '/assets/images/car-lboard.jpg',
    dailyRate: '₹1,200',
    hourlyRate: '₹150/hr',
    transmission: 'Manual & Automatic',
    fuel: 'Petrol / CNG',
    seats: '5 Seater',
    luggage: '2 Bags',
    ac: true,
    features: ['Self-Drive or with Driver', 'Dual Airbags & ABS', 'Bluetooth Audio', 'Unlimited KM Option'],
    popular: true,
  },
  {
    id: 'sedan',
    name: 'Maruti Dzire / Honda Amaze',
    category: 'Compact Sedan',
    tagline: 'Smooth highway cruiser & executive travel',
    image: '/assets/images/hero-car.jpg',
    dailyRate: '₹1,500',
    hourlyRate: '₹180/hr',
    transmission: 'Manual / AMT',
    fuel: 'Petrol / Diesel',
    seats: '5 Seater',
    luggage: '3 Large Bags',
    ac: true,
    features: ['Premium Plush Seats', 'Touchscreen Infotainment', 'Cruise Control', 'Outstation Permitted'],
    popular: false,
  },
  {
    id: 'suv-7seater',
    name: 'Toyota Innova Crysta / Ertiga',
    category: 'Premium MPV / 7-Seater',
    tagline: 'Family tours, outstation trips & temple visits',
    image: '/assets/images/lesson.jpg',
    dailyRate: '₹2,400',
    hourlyRate: '₹280/hr',
    transmission: 'Manual / Automatic',
    fuel: 'Diesel (High Mileage)',
    seats: '7-8 Seater',
    luggage: '5 Large Bags',
    ac: true,
    features: ['Dual Zone AC', 'Captain Seats Available', 'Expert Chauffeur Available', 'Inter-state Permits'],
    popular: true,
  },
  {
    id: 'compact-suv',
    name: 'Hyundai Creta / Maruti Brezza',
    category: 'Compact SUV',
    tagline: 'High ground clearance & rugged comfort',
    image: '/assets/images/car-lboard.jpg',
    dailyRate: '₹2,000',
    hourlyRate: '₹220/hr',
    transmission: 'Manual / Automatic',
    fuel: 'Petrol / Diesel',
    seats: '5 Seater',
    luggage: '4 Bags',
    ac: true,
    features: ['Panoramic Sunroof / Moonroof', 'Rear Camera & Sensors', 'Hill Hold Assist', '24x7 Breakdown Cover'],
    popular: false,
  },
  {
    id: 'luxury-wedding',
    name: 'Wedding & VIP Chauffeur Fleet',
    category: 'Luxury / Special Events',
    tagline: 'Marriage functions, VIP pickup & Airport drops',
    image: '/assets/images/hero-car.jpg',
    dailyRate: '₹3,500+',
    hourlyRate: 'Custom Package',
    transmission: 'Automatic',
    fuel: 'Diesel / Petrol',
    seats: '5-7 Seater',
    luggage: 'Full Capacity',
    ac: true,
    features: ['Uniformed Experienced Driver', 'Floral Decoration Option', 'Airport Meet & Greet', 'Punctuality Guarantee'],
    popular: false,
  },
];

// ==========================================
// DATA: TESTIMONIALS
// ==========================================
export const TESTIMONIALS_DATA = [
  {
    name: 'Priya R.',
    role: 'First-time driver, Tirunelveli',
    quote: 'I was terrified of driving. Muthukumar sir was so patient — within 3 weeks I was driving on Tirunelveli main roads confidently. Got my license first attempt!',
    rating: 5,
  },
  {
    name: 'Karthik S.',
    role: 'Working professional',
    quote: "Best driving school in town. The trainers don't just rush you through — they actually teach you to drive safely. Worth every rupee.",
    rating: 5,
  },
  {
    name: 'Meena V.',
    role: 'Homemaker',
    quote: 'The ladies special batch made me so comfortable. I never felt judged for slow learning. Highly recommend for women.',
    rating: 5,
  },
  {
    name: 'Arun K.',
    role: 'College student & Car Rental Client',
    quote: 'Flexible timings helped me fit classes between college. Also rented their Swift for a Kanyakumari weekend trip — seamless process!',
    rating: 5,
  },
  {
    name: 'Lakshmi P.',
    role: 'Refresher learner',
    quote: "Hadn't driven in 8 years. The refresher course rebuilt my confidence completely. Sir is gold.",
    rating: 5,
  },
  {
    name: 'Vignesh M.',
    role: 'Software engineer',
    quote: 'Highway training was the highlight. Got proper exposure to real conditions, not just empty grounds. Thank you team!',
    rating: 5,
  },
];

// ==========================================
// DATA: FAQS
// ==========================================
export const FAQS_DATA = [
  {
    q: 'How many classes are included in the driving course?',
    a: 'Our standard course includes 22 practical driving classes. Each session is around 40–45 minutes of focused, real-road training.',
  },
  {
    q: 'Do you provide car rentals in Tirunelveli?',
    a: 'Yes! We provide well-maintained hatchbacks, sedans, and 7-seater MPVs for both Self-Drive and Chauffeur-driven rentals. Daily, weekly, and outstation packages are available.',
  },
  {
    q: 'Do you provide end-to-end license assistance?',
    a: "Yes — end-to-end. We help with Learner's License (LL), document verification, slot booking, mock RTO tests, and follow-up till your Permanent Driving License is delivered.",
  },
  {
    q: 'Is ladies special coaching available?',
    a: 'Absolutely. We run a dedicated Ladies Special program with female-aware, judgement-free coaching. Many women have built confidence with us from absolute zero.',
  },
  {
    q: 'Are flexible timings available?',
    a: 'Yes. We run batches from 6:00 AM to 8:00 PM on weekdays and Sunday mornings. Pick a slot that suits your work or college schedule.',
  },
  {
    q: 'Which areas do you serve?',
    a: 'We are based at Tirunelveli Junction and serve all surrounding localities including Palayamkottai, Vannarpettai, Melapalayam, Perumalpuram and nearby towns.',
  },
  {
    q: 'What documents are required for Car Rentals?',
    a: 'For self-drive: Valid Original Driving License, Aadhaar Card / ID proof, and a refundable security deposit. For chauffeur-driven cars: Just your booking details & destination.',
  },
  {
    q: 'Can I take a free demo first?',
    a: 'Of course! Book a free demo class and meet your trainer before committing. WhatsApp us anytime to schedule.',
  },
];

// ==========================================
// DATA: BLOG POSTS
// ==========================================
export const BLOG_POSTS_DATA = [
  {
    id: 1,
    title: '5 Driving Tips for Absolute Beginners',
    slug: '5-driving-tips-beginners',
    excerpt: 'Steering grip, mirror checks, and the small habits that build confidence in your first week.',
    image_url: '/assets/images/lesson.jpg',
    read_time: '4 min read',
    tags: ['Beginner', 'Tips'],
    published_at: '2026-05-30',
    content: `
      <p>Starting your driving journey can feel overwhelming — there is so much to think about at once. But most beginners struggle with the same handful of habits. Get these five right and you will build confidence far faster than you expect.</p>
      <h3>1. Hold the Wheel Correctly</h3>
      <p>Place your hands at the <strong>9 o'clock and 3 o'clock</strong> positions. This gives you better control and leaves your arms less fatigued on longer drives. Keep a firm but relaxed grip.</p>
      <h3>2. Check Your Mirrors Every 5–8 Seconds</h3>
      <p>New drivers tend to fixate on the road directly ahead. Train yourself to glance at your left mirror, right mirror, and rear-view mirror in a regular cycle.</p>
      <h3>3. Look Far Ahead, Not Just in Front of the Bonnet</h3>
      <p>Experienced drivers scan 12–15 seconds ahead — in city traffic that is roughly the next junction or pedestrian crossing. This gives you time to react smoothly.</p>
      <h3>4. Brake Early and Gently</h3>
      <p>Whenever you see a red light or a slowing vehicle ahead, begin releasing the accelerator early and apply the brake progressively.</p>
      <h3>5. Adjust Your Seat and Mirrors Before You Move</h3>
      <p>Spend 30 seconds before every drive adjusting seat distance, headrest, and all three mirrors before the engine starts.</p>
    `,
  },
  {
    id: 3,
    title: 'Parallel Parking Made Simple',
    slug: 'parallel-parking-guide',
    excerpt: 'A step-by-step method that works on any Indian street — no panic required.',
    image_url: '/assets/images/car-lboard.jpg',
    read_time: '3 min read',
    tags: ['Parking', 'Technique'],
    published_at: '2026-05-30',
    content: `
      <p>Parallel parking intimidates almost every new driver. The good news is that it follows a fixed sequence of steps that works on any Indian street.</p>
      <h3>The Four-Step Method</h3>
      <ol style="padding-left:1.4rem;margin:0 0 1.15rem">
        <li><strong>Reverse slowly</strong> until your rear bumper aligns with the car in front.</li>
        <li><strong>Steer full lock toward the kerb</strong> and reverse at 45 degrees.</li>
        <li><strong>Straighten the wheel</strong> and reverse until front bumper clears.</li>
        <li><strong>Steer full lock away from kerb</strong> and align straight.</li>
      </ol>
    `,
  },
  {
    id: 4,
    title: 'Driving Safely After Dark',
    slug: 'night-driving-safety',
    excerpt: 'Headlight etiquette, glare management, and how to stay alert on highways at night.',
    image_url: '/assets/images/hero-car.jpg',
    read_time: '6 min read',
    tags: ['Night Driving', 'Safety'],
    published_at: '2026-05-30',
    content: `
      <p>Driving after dark demands deliberate adjustments. Use low beam in traffic, glance at the road edge during oncoming glare, and keep stopping distances ample.</p>
    `,
  },
  {
    id: 5,
    title: 'Your First Highway Drive: A Calm Guide',
    slug: 'first-highway-drive',
    excerpt: 'Lane changes, overtaking, and reading signage on Tamil Nadu state highways.',
    image_url: '/assets/images/woman-driver.jpg',
    read_time: '5 min read',
    tags: ['Highway', 'Confidence'],
    published_at: '2026-05-30',
    content: `
      <p>Highway driving has its own clear logic: keep a 3-4 second distance, signal early, and merge at traffic speed.</p>
    `,
  },
  {
    id: 6,
    title: 'Pre-Drive Checks Every Driver Should Do',
    slug: 'pre-drive-checks',
    excerpt: 'Tyres, fluids, mirrors — a 60-second routine that prevents most breakdowns.',
    image_url: '/assets/images/license-success.jpg',
    read_time: '3 min read',
    tags: ['Maintenance', 'Safety'],
    published_at: '2026-05-30',
    content: `
      <p>A quick 60-second walk-around checking tyres, oil dipstick, coolant level and lights prevents breakdowns on the road.</p>
    `,
  },
  {
    id: 7,
    title: 'How to Stay Safe at Busy Intersections',
    slug: 'how-to-stay-safe-at-busy-intersections',
    excerpt: 'Busy intersections are where most urban accidents happen. Learn defensive techniques that keep you safe.',
    image_url: '/assets/uploads/posts/e746d91e9c1fa786627f3028.webp',
    read_time: '2 min read',
    tags: ['Safety', 'Urban Driving'],
    published_at: '2026-05-30',
    content: `
      <p>Intersections require slowing down, double-checking blind spots, yielding to pedestrians and never rushing yellow lights.</p>
    `,
  },
];

// ==========================================
// HTML LAYOUT HELPER
// ==========================================
export function renderLayout(opts: {
  title?: string;
  description?: string;
  canonical?: string;
  activePath: string;
  content: string;
}): string {
  const pageTitle = opts.title || `${SITE.name} — Best Driving School in Tirunelveli`;
  const pageDesc = opts.description || 'Premium driving school & car rentals at Tirunelveli Junction. 22 practical classes, ladies special coaching, self-drive rentals & complete license assistance.';
  const canonicalUrl = opts.canonical ? `${SITE.url}${opts.canonical}` : `${SITE.url}${opts.activePath}`;

  const navHtml = NAV_ITEMS.map((n) => {
    const isActive = opts.activePath === n.href;
    return `
      <a href="${n.href}" class="relative px-4 py-2 text-sm font-medium rounded-full transition-colors ${
      isActive ? 'text-yellow nav-active' : 'text-white/80 hover:text-white'
    }">
        ${n.label}
        ${isActive ? '<span class="absolute inset-0 -z-10 rounded-full bg-white/10"></span>' : ''}
      </a>
    `;
  }).join('');

  const mobileNavHtml = NAV_ITEMS.map((n) => {
    const isActive = opts.activePath === n.href;
    return `
      <a href="${n.href}" class="block px-4 py-3 rounded-2xl text-sm font-medium ${
      isActive ? 'bg-ink text-white' : 'text-ink hover:bg-gray-100'
    }">
        ${n.label}
      </a>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDesc}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:site_name" content="${SITE.name}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${pageDesc}" />
  <meta property="og:image" content="${SITE.url}/assets/og.jpg" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${pageTitle}" />
  <meta name="twitter:description" content="${pageDesc}" />
  <meta name="twitter:image" content="${SITE.url}/assets/og.jpg" />

  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/css/styles.css" />

  <style>
    .pagination { display:flex; align-items:center; justify-content:center; gap:4px; flex-wrap:wrap; }
    .pg-btn { display:inline-flex; align-items:center; justify-content:center; min-width:36px; height:36px; padding:0 4px; border-radius:8px; font-size:14px; font-weight:500; color:#6b7280; text-decoration:none; transition:background .15s, color .15s; }
    .pg-btn:hover { background:#fff; color:#111; }
    .pg-current { background:#FBBF24; color:#111 !important; font-weight:600; pointer-events:none; }
  </style>
</head>
<body>
  <div class="min-h-screen flex flex-col bg-background">
    <!-- Navbar -->
    <header id="navbar" class="fixed top-0 inset-x-0 z-50 transition-all duration-300 py-4">
      <div class="mx-auto max-w-7xl px-4">
        <div id="navbar-inner" class="flex items-center justify-between rounded-full px-4 md:px-6 transition-all duration-300 bg-ink/40 backdrop-blur-md border border-white/10 h-16">
          <a href="/" class="flex items-center gap-2 group">
            <span class="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-yellow shadow-glow">
              <span class="font-display font-bold text-ink">SMK</span>
            </span>
            <span class="hidden sm:flex flex-col leading-tight font-display navbar-logo-text text-white">
              <span class="text-[13px] font-bold tracking-wide">SRI MUNIS KANNA</span>
              <span class="text-[10px] uppercase tracking-[0.18em] text-yellow">Driving School &amp; Rentals</span>
            </span>
          </a>

          <nav class="hidden lg:flex items-center gap-1">
            ${navHtml}
          </nav>

          <div class="flex items-center gap-2">
            <div class="hidden md:flex flex-col items-end">
              <a href="tel:${SITE.phoneTel}" class="inline-flex items-center gap-1.5 text-sm font-semibold navbar-phone-text text-white">
                ${icon('phone', 'size-3.5')} ${SITE.phone}
              </a>
              <a href="tel:${SITE.phone2Tel}" class="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity navbar-phone-text text-white">
                ${SITE.phone2}
              </a>
            </div>
            <a href="/book-demo" class="hidden sm:block">
              <button class="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity">Book Demo</button>
            </a>
            <a href="/admin" class="hidden xl:inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold glass text-white hover:bg-white/10 transition-colors">
              CRM Portal
            </a>
            <button id="nav-toggle" class="lg:hidden rounded-full p-2 text-white hover:bg-white/10" aria-label="Toggle menu">
              <span id="nav-icon-menu">${icon('menu', 'size-5')}</span>
              <span id="nav-icon-close" class="hidden">${icon('x', 'size-5')}</span>
            </button>
          </div>
        </div>

        <div id="nav-mobile" class="hidden lg:hidden mt-2 rounded-3xl bg-white/90 backdrop-blur-xl border border-black/5 shadow-card overflow-hidden">
          <div class="p-2">
            ${mobileNavHtml}
            <a href="/book-demo" class="block mt-2">
              <button class="w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity">Book Free Demo</button>
            </a>
            <a href="/admin" class="block mt-2">
              <button class="w-full inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs font-semibold bg-ink text-white hover:opacity-90 transition-opacity">Staff CRM Login</button>
            </a>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 pb-20 md:pb-0">
      ${opts.content}
    </main>

    <!-- Footer -->
    <footer class="bg-ink text-white border-t border-white/10 pt-16 pb-12">
      <div class="mx-auto max-w-7xl px-4 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-yellow font-display font-bold text-ink">SMK</span>
            <span class="font-display font-bold text-lg">Sri Munis Kanna</span>
          </div>
          <p class="mt-4 text-sm text-white/70 leading-relaxed">
            Tirunelveli's trusted driving school and car rental service. Real road practice, ladies special batches, certified trainers, self-drive rentals and complete RTO license assistance.
          </p>
          <div class="mt-4 flex items-center gap-3 text-white/70">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" class="p-2 rounded-full hover:bg-white/10 transition-colors">${icon('instagram', 'size-4')}</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" class="p-2 rounded-full hover:bg-white/10 transition-colors">${icon('facebook', 'size-4')}</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" class="p-2 rounded-full hover:bg-white/10 transition-colors">${icon('youtube', 'size-4')}</a>
          </div>
        </div>

        <div>
          <h4 class="font-display font-semibold text-base text-yellow">Quick Links</h4>
          <ul class="mt-4 space-y-2.5 text-sm text-white/70">
            <li><a href="/" class="hover:text-white transition-colors">Home</a></li>
            <li><a href="/about" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="/courses" class="hover:text-white transition-colors">Driving Courses</a></li>
            <li><a href="/car-rentals" class="hover:text-white transition-colors">Car Rentals (Self-Drive &amp; Chauffeur)</a></li>
            <li><a href="/why-us" class="hover:text-white transition-colors">Why Choose Us</a></li>
            <li><a href="/gallery" class="hover:text-white transition-colors">Gallery</a></li>
            <li><a href="/blog" class="hover:text-white transition-colors">Driving Tips Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-semibold text-base text-yellow">Our Services</h4>
          <ul class="mt-4 space-y-2.5 text-sm text-white/70">
            <li><a href="/courses" class="hover:text-white transition-colors">Beginner 22-Class Course</a></li>
            <li><a href="/courses" class="hover:text-white transition-colors">Ladies Special Coaching</a></li>
            <li><a href="/courses" class="hover:text-white transition-colors">Highway &amp; Night Driving</a></li>
            <li><a href="/courses" class="hover:text-white transition-colors">License Assistance (LL &amp; DL)</a></li>
            <li><a href="/car-rentals" class="hover:text-white transition-colors">Self-Drive Hatchback &amp; Sedan</a></li>
            <li><a href="/car-rentals" class="hover:text-white transition-colors">Innova 7-Seater Family Rentals</a></li>
            <li><a href="/car-rentals" class="hover:text-white transition-colors">Wedding &amp; VIP Chauffeur Cars</a></li>
          </ul>
        </div>

        <div>
          <h4 class="font-display font-semibold text-base text-yellow">Contact &amp; Location</h4>
          <ul class="mt-4 space-y-3 text-sm text-white/70">
            <li class="flex items-start gap-2">
              ${icon('map-pin', 'size-4 shrink-0 text-yellow mt-0.5')}
              <span>${SITE.address}</span>
            </li>
            <li class="flex items-center gap-2">
              ${icon('phone', 'size-4 shrink-0 text-yellow')}
              <a href="tel:${SITE.phoneTel}" class="hover:text-white">${SITE.phone}</a>
            </li>
            <li class="flex items-center gap-2">
              ${icon('phone', 'size-4 shrink-0 text-yellow')}
              <a href="tel:${SITE.phone2Tel}" class="hover:text-white">${SITE.phone2}</a>
            </li>
            <li class="flex items-center gap-2">
              ${icon('clock', 'size-4 shrink-0 text-yellow')}
              <span>${SITE.hours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-white/10 mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
        <p>&copy; ${new Date().getFullYear()} ${SITE.name}. All rights reserved.</p>
        <div class="flex gap-4">
          <a href="/admin" class="hover:text-white">Admin / Staff Portal</a>
          <span>&bull;</span>
          <a href="/faq" class="hover:text-white">FAQ</a>
          <span>&bull;</span>
          <a href="/contact" class="hover:text-white">Support</a>
        </div>
      </div>
    </footer>

    <!-- Floating Mobile Actions -->
    <div class="fixed bottom-0 inset-x-0 z-40 md:hidden bg-ink/90 backdrop-blur-lg border-t border-white/10 p-3 flex gap-2">
      <a href="tel:${SITE.phoneTel}" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 bg-white/10 text-white text-xs font-semibold">
        ${icon('phone', 'size-4 text-yellow')} Call
      </a>
      <a href="${waLink()}" target="_blank" rel="noreferrer" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 bg-whatsapp text-white text-xs font-semibold">
        ${icon('message-circle', 'size-4')} WhatsApp
      </a>
      <a href="/car-rentals" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 bg-gradient-yellow text-ink text-xs font-semibold">
        ${icon('car', 'size-4')} Rentals
      </a>
      <a href="/book-demo" class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 px-3 bg-yellow text-ink text-xs font-semibold">
        Book Demo
      </a>
    </div>
  </div>

  <script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

// ==========================================
// PAGE HERO SECTION HELPER
// ==========================================
export function renderPageHero(eyebrow: string, title: string, subtitle = ''): string {
  return `
    <section class="relative bg-ink text-white pt-36 pb-20 overflow-hidden">
      <div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-yellow/20 blur-3xl"></div>
      <div class="relative z-10 mx-auto max-w-7xl px-4">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow">${eyebrow}</span>
        <h1 class="mt-3 text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-tight max-w-4xl">${title}</h1>
        ${subtitle ? `<p class="mt-4 text-lg text-white/75 max-w-2xl font-display">${subtitle}</p>` : ''}
      </div>
    </section>
  `;
}

// ==========================================
// CONTACT CTA SECTION HELPER
// ==========================================
export function renderContactCta(): string {
  return `
    <section class="py-20 md:py-28 bg-ink text-white relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 stripe-yellow"></div>
      <div class="relative z-10 mx-auto max-w-5xl px-4 text-center reveal">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow">Get behind the wheel</span>
        <h2 class="mt-4 text-4xl md:text-5xl font-display font-bold">Ready to start driving with confidence?</h2>
        <p class="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Book a free demo class, enquire about our flexible batches, or rent a car for your upcoming trip.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <a href="tel:${SITE.phoneTel}">
            <button class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              ${icon('phone', 'size-4')} Call ${SITE.phone}
            </button>
          </a>
          <a href="${waLink()}" target="_blank" rel="noreferrer">
            <button class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold bg-whatsapp text-white hover:opacity-90 transition-opacity">
              ${icon('message-circle', 'size-4')} Chat on WhatsApp
            </button>
          </a>
          <a href="/car-rentals">
            <button class="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold glass text-white hover:bg-white/10 transition-colors">
              ${icon('car', 'size-4 text-yellow')} Rent a Car
            </button>
          </a>
        </div>
      </div>
    </section>
  `;
}

// ==========================================
// 1. HOME PAGE
// ==========================================
publicRouter.get('/', (req: Request, res: Response) => {
  const content = `
    <!-- Hero Section -->
    <section class="relative min-h-[100svh] w-full overflow-hidden bg-ink text-white flex items-end">
      <div class="absolute inset-0">
        <img src="/assets/images/hero-car.jpg" alt="Driving school car at golden hour" class="absolute inset-0 h-full w-full object-cover scale-105" />
        <div class="absolute inset-0 bg-gradient-overlay"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/40 to-transparent"></div>
      </div>

      <div class="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-yellow/30 blur-3xl animate-drift"></div>
      <div class="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-yellow/20 blur-3xl animate-drift" style="animation-delay:2s"></div>

      <div class="relative z-10 mx-auto max-w-7xl w-full px-4 pt-32 pb-24 md:pb-32 fade-in-up">
        <div class="max-w-3xl">
          <span class="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase">
            ${icon('shield-check', 'size-3.5 text-yellow')}
            Tirunelveli's Trusted Driving Academy &amp; Car Rentals
          </span>

          <h1 class="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] tracking-tight">
            Learn Driving with<br />
            <span class="text-gradient-yellow">Confidence &amp; Safety</span>
          </h1>

          <p class="mt-6 text-lg md:text-xl text-white/85 font-display max-w-2xl">
            "லைசன்ஸ் மட்டும் இல்ல…<span class="text-yellow"> Perfect Driving Skill</span> உங்களுக்காக!"
          </p>

          <p class="mt-3 text-white/65 max-w-xl">
            22 practical classes &bull; Real-road training &bull; Ladies special coaching &bull; Self-Drive &amp; Chauffeur Car Rentals &bull; Complete license assistance.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a href="tel:${SITE.phoneTel}">
              <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
                ${icon('phone', 'size-4')} Call Now
              </button>
            </a>
            <a href="${waLink()}" target="_blank" rel="noreferrer">
              <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold bg-whatsapp text-white hover:opacity-90 transition-opacity">
                ${icon('message-circle', 'size-4')} WhatsApp Us
              </button>
            </a>
            <a href="/car-rentals">
              <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold glass text-white hover:bg-white/10 transition-colors">
                ${icon('car', 'size-4 text-yellow')} Car Rentals
              </button>
            </a>
            <a href="/book-demo">
              <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold glass text-white hover:bg-white/10 transition-colors">
                Book Free Demo
              </button>
            </a>
          </div>

          <div class="mt-10 flex items-center gap-6 text-sm text-white/70">
            <div class="flex items-center gap-1.5">
              ${icon('star', 'size-4 fill-yellow text-yellow').repeat(5)}
              <span class="ml-1">4.9 / 5 from learners</span>
            </div>
            <div class="hidden sm:block h-4 w-px bg-white/20"></div>
            <span class="hidden sm:inline">500+ licenses delivered</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Indicators -->
    <section class="py-12 bg-card border-y border-border">
      <div class="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div class="p-4 reveal">
          <div class="text-3xl md:text-4xl font-display font-bold text-yellow-deep">22</div>
          <p class="mt-1 text-sm font-medium text-ink">Practical Driving Classes</p>
          <p class="text-xs text-muted-foreground mt-0.5">Real road exposure</p>
        </div>
        <div class="p-4 reveal">
          <div class="text-3xl md:text-4xl font-display font-bold text-yellow-deep">500+</div>
          <p class="mt-1 text-sm font-medium text-ink">Licenses Delivered</p>
          <p class="text-xs text-muted-foreground mt-0.5">High first-attempt pass rate</p>
        </div>
        <div class="p-4 reveal">
          <div class="text-3xl md:text-4xl font-display font-bold text-yellow-deep">100%</div>
          <p class="mt-1 text-sm font-medium text-ink">Ladies Special Batches</p>
          <p class="text-xs text-muted-foreground mt-0.5">Safe, patient &amp; judgement-free</p>
        </div>
        <div class="p-4 reveal">
          <div class="text-3xl md:text-4xl font-display font-bold text-yellow-deep">24x7</div>
          <p class="mt-1 text-sm font-medium text-ink">Car Rentals &amp; Support</p>
          <p class="text-xs text-muted-foreground mt-0.5">Self-drive &amp; chauffeur fleet</p>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2 items-center">
        <div class="reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">About Sri Munis Kanna</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink leading-tight">
            Learn driving from Tirunelveli's most patient instructors.
          </h2>
          <p class="mt-6 text-base text-muted-foreground leading-relaxed">
            Founded with a commitment to creating confident, defensive drivers, Sri Munis Kanna Driving School has been the first choice for families, college students, and professionals in Tirunelveli.
          </p>
          <p class="mt-4 text-base text-muted-foreground leading-relaxed">
            We don't just train you to pass the RTO ground test — we teach you real city navigation, junction handling, slope restarts, reverse parking, and highway cruising so you can take your own car anywhere with absolute confidence.
          </p>

          <div class="mt-8 grid sm:grid-cols-2 gap-4">
            <div class="flex items-start gap-3">
              ${icon('badge-check', 'size-5 text-yellow-deep shrink-0 mt-0.5')}
              <div>
                <h4 class="font-semibold text-ink text-sm">Dual-Control Safety Fleet</h4>
                <p class="text-xs text-muted-foreground mt-0.5">Instructor safety brakes for zero fear</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              ${icon('badge-check', 'size-5 text-yellow-deep shrink-0 mt-0.5')}
              <div>
                <h4 class="font-semibold text-ink text-sm">Doorstep &amp; Flexible Slots</h4>
                <p class="text-xs text-muted-foreground mt-0.5">6:00 AM to 8:00 PM batches</p>
              </div>
            </div>
          </div>

          <div class="mt-8 flex gap-3">
            <a href="/about">
              <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-ink text-white hover:opacity-90 transition-opacity">
                Read Our Story ${icon('arrow-right', 'size-4')}
              </button>
            </a>
          </div>
        </div>

        <div class="relative reveal">
          <div class="aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-border">
            <img src="/assets/images/lesson.jpg" alt="Practical driving training session" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-6 -left-6 rounded-2xl bg-ink text-white p-6 shadow-glow border border-white/10 hidden sm:block max-w-xs">
            <p class="font-display font-bold text-2xl text-yellow">15+ Years</p>
            <p class="text-xs text-white/80 mt-1">Of teaching road safety and confidence in Tirunelveli.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Courses Section -->
    <section class="py-20 md:py-28 bg-card border-y border-border">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center max-w-2xl mx-auto mb-16 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Our Programs</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink">Courses Built for Every Learner</h2>
          <p class="mt-4 text-muted-foreground text-sm md:text-base">
            From absolute first-timers to drivers wanting to polish highway &amp; parking skills.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${COURSES_DATA.slice(0, 3).map((c) => `
            <div class="reveal relative rounded-3xl p-7 border transition-all duration-500 hover:-translate-y-1 ${
              c.highlight ? 'bg-ink text-white border-yellow shadow-glow' : 'bg-background text-ink border-border shadow-card hover:shadow-glow'
            }">
              ${c.badge ? `<span class="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-yellow text-ink text-xs font-semibold px-3 py-1 shadow-glow">${icon('sparkles', 'size-3')} ${c.badge}</span>` : ''}
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-2xl font-display font-bold">${c.name}</h3>
                  <p class="text-sm mt-1 ${c.highlight ? 'text-yellow' : 'text-muted-foreground'}">${c.sessions}</p>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-medium ${c.highlight ? 'bg-yellow text-ink' : 'bg-secondary text-ink'}">
                  ${c.duration}
                </span>
              </div>
              <ul class="mt-6 space-y-3">
                ${c.features.map((f) => `
                  <li class="flex gap-2 text-sm">
                    ${icon('check', `size-4 mt-0.5 shrink-0 ${c.highlight ? 'text-yellow' : 'text-yellow-deep'}`)}
                    <span class="${c.highlight ? 'text-white/85' : 'text-ink'}">${f}</span>
                  </li>
                `).join('')}
              </ul>
              <a href="/book-demo" class="block mt-7">
                <button class="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity ${
                  c.highlight ? 'bg-gradient-yellow text-ink' : 'bg-ink text-white'
                }">
                  Enquire Now ${icon('arrow-right', 'size-4')}
                </button>
              </a>
            </div>
          `).join('')}
        </div>

        <div class="mt-12 text-center">
          <a href="/courses">
            <button class="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold bg-secondary text-ink hover:bg-yellow hover:text-ink transition-colors border border-border">
              View All 5 Courses &amp; Packages ${icon('arrow-right', 'size-4')}
            </button>
          </a>
        </div>
      </div>
    </section>

    <!-- CAR RENTALS SECTION (STEP 4) -->
    <section class="py-20 md:py-28 bg-ink text-white relative overflow-hidden">
      <div class="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-yellow/15 blur-3xl"></div>
      <div class="relative z-10 mx-auto max-w-7xl px-4">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 reveal">
          <div>
            <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow">Self-Drive &amp; Chauffeur Fleet</span>
            <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold">Car Rentals in Tirunelveli</h2>
            <p class="mt-4 text-white/70 max-w-xl text-sm md:text-base">
              Clean, sanitized, and well-maintained cars for local city runs, family tours, outstation trips, and wedding events.
            </p>
          </div>
          <a href="/car-rentals">
            <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              Explore Full Fleet ${icon('arrow-right', 'size-4')}
            </button>
          </a>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${CAR_RENTALS_DATA.slice(0, 3).map((car) => `
            <div class="reveal rounded-3xl bg-white/5 border border-white/10 overflow-hidden hover:border-yellow/50 transition-all duration-300 flex flex-col">
              <div class="aspect-[16/10] relative overflow-hidden bg-ink/50">
                <img src="${car.image}" alt="${car.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                <span class="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wider bg-yellow text-ink px-3 py-1 rounded-full">
                  ${car.category}
                </span>
                <span class="absolute bottom-4 right-4 text-xs font-semibold bg-ink/80 text-white backdrop-blur-md px-3 py-1 rounded-full">
                  ${car.dailyRate} / day
                </span>
              </div>
              <div class="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 class="font-display font-bold text-xl text-white">${car.name}</h3>
                  <p class="text-xs text-white/60 mt-1">${car.tagline}</p>
                  <div class="mt-4 flex flex-wrap gap-2 text-xs text-white/80">
                    <span class="px-2.5 py-1 rounded-lg bg-white/10">${car.seats}</span>
                    <span class="px-2.5 py-1 rounded-lg bg-white/10">${car.fuel}</span>
                    <span class="px-2.5 py-1 rounded-lg bg-white/10">${car.transmission}</span>
                  </div>
                </div>
                <div class="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span class="text-xs text-yellow font-semibold">Instant WhatsApp Booking</span>
                  <a href="${waLink(`Hi, I would like to book/enquire about renting ${car.name} in Tirunelveli.`)}" target="_blank" rel="noreferrer">
                    <button class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-whatsapp text-white hover:opacity-90 transition-opacity">
                      ${icon('message-circle', 'size-3.5')} Rent Car
                    </button>
                  </a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Founder / Owner Section -->
    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2 items-center">
        <div class="relative order-2 lg:order-1 reveal">
          <div class="aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-border">
            <img src="/assets/images/owner.jpg" alt="M. Muthukumar - Founder" class="w-full h-full object-cover" />
          </div>
        </div>

        <div class="order-1 lg:order-2 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Meet the founder</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink leading-tight">
            ${SITE.owner}
          </h2>
          <p class="mt-2 text-sm font-semibold text-yellow-deep">Founder &amp; Chief Driving Instructor</p>
          <p class="mt-6 text-base text-muted-foreground leading-relaxed">
            "Driving is not merely about pressing pedals or turning the wheel — it is about awareness, patience, and respecting life on the road. When you learn with us, my guarantee is that you will drive without panic, on any road, in any traffic."
          </p>
          <div class="mt-8 flex items-center gap-6 text-sm">
            <div>
              <div class="text-2xl font-display font-bold text-ink">15+</div>
              <div class="text-xs text-muted-foreground mt-0.5">Years of experience</div>
            </div>
            <div class="h-8 w-px bg-border"></div>
            <div>
              <div class="text-2xl font-display font-bold text-ink">500+</div>
              <div class="text-xs text-muted-foreground mt-0.5">Learners trained</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Women Driving Program -->
    <section class="py-20 md:py-28 bg-card border-y border-border">
      <div class="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2 items-center">
        <div class="reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Special program</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink leading-tight">
            Ladies Special Driving Program
          </h2>
          <p class="mt-6 text-base text-muted-foreground leading-relaxed">
            We understand that many women feel anxious when starting to drive. Our dedicated Ladies Special batches are designed with extreme patience, step-by-step encouragement, and flexible morning/evening slots.
          </p>
          <ul class="mt-6 space-y-3">
            <li class="flex gap-2 text-sm text-ink">
              ${icon('check-circle', 'size-4 text-yellow-deep shrink-0 mt-0.5')}
              <span>Comfortable, judgement-free environment</span>
            </li>
            <li class="flex gap-2 text-sm text-ink">
              ${icon('check-circle', 'size-4 text-yellow-deep shrink-0 mt-0.5')}
              <span>Doorstep pickup &amp; drop available in select areas</span>
            </li>
            <li class="flex gap-2 text-sm text-ink">
              ${icon('check-circle', 'size-4 text-yellow-deep shrink-0 mt-0.5')}
              <span>Personalized pace — no rush until you feel completely ready</span>
            </li>
          </ul>
          <a href="/book-demo" class="inline-block mt-8">
            <button class="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              Book Ladies Special Demo ${icon('arrow-right', 'size-4')}
            </button>
          </a>
        </div>

        <div class="reveal">
          <div class="aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-border">
            <img src="/assets/images/woman-driver.jpg" alt="Woman learner driving confidently" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center max-w-2xl mx-auto mb-16 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Learner Stories</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink">What Our Students Say</h2>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${TESTIMONIALS_DATA.map((t) => `
            <div class="reveal rounded-3xl bg-card border border-border p-7 shadow-card flex flex-col justify-between">
              <div>
                <div class="flex items-center gap-1 text-yellow-deep mb-4">
                  ${icon('star', 'size-4 fill-yellow text-yellow').repeat(t.rating)}
                </div>
                <p class="text-sm text-ink leading-relaxed italic">"${t.quote}"</p>
              </div>
              <div class="mt-6 pt-4 border-t border-border flex items-center gap-3">
                <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-ink">
                  ${t.name.charAt(0)}
                </div>
                <div>
                  <h4 class="font-semibold text-sm text-ink">${t.name}</h4>
                  <p class="text-xs text-muted-foreground">${t.role}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- License Process -->
    <section class="py-20 md:py-28 bg-card border-y border-border">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center max-w-2xl mx-auto mb-16 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Step-by-step</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink">How You Get Your License</h2>
        </div>

        <div class="grid gap-6 md:grid-cols-4">
          <div class="reveal p-6 rounded-3xl bg-background border border-border shadow-card">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-ink font-bold text-sm">1</span>
            <h3 class="mt-4 font-display font-bold text-lg text-ink">Learner's License (LL)</h3>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Online application, document upload and slot booking assistance.</p>
          </div>
          <div class="reveal p-6 rounded-3xl bg-background border border-border shadow-card">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-ink font-bold text-sm">2</span>
            <h3 class="mt-4 font-display font-bold text-lg text-ink">22 Practical Classes</h3>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">Vehicle controls, traffic training, reverse parking &amp; night driving.</p>
          </div>
          <div class="reveal p-6 rounded-3xl bg-background border border-border shadow-card">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-ink font-bold text-sm">3</span>
            <h3 class="mt-4 font-display font-bold text-lg text-ink">RTO Mock Test</h3>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">'8' track and 'H' track practice to guarantee first-time passing.</p>
          </div>
          <div class="reveal p-6 rounded-3xl bg-background border border-border shadow-card">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-ink font-bold text-sm">4</span>
            <h3 class="mt-4 font-display font-bold text-lg text-ink">Permanent DL Delivery</h3>
            <p class="mt-2 text-xs text-muted-foreground leading-relaxed">RTO driving test accompanied by our instructor &amp; DL dispatch.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Preview -->
    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-4xl px-4">
        <div class="text-center mb-12 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">FAQ</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink">Frequently Asked Questions</h2>
        </div>

        <div class="space-y-4">
          ${FAQS_DATA.slice(0, 5).map((faq, i) => `
            <details class="reveal group rounded-2xl bg-card border border-border p-6 shadow-card transition-all [&_svg]:open:-rotate-180">
              <summary class="flex cursor-pointer items-center justify-between font-display font-semibold text-ink text-base md:text-lg select-none list-none">
                <span>${faq.q}</span>
                <span class="ml-4 shrink-0 transition-transform duration-300">
                  ${icon('chevron-down', 'size-5 text-muted-foreground')}
                </span>
              </summary>
              <p class="mt-4 text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                ${faq.a}
              </p>
            </details>
          `).join('')}
        </div>

        <div class="mt-10 text-center">
          <a href="/faq" class="text-sm font-semibold text-yellow-deep hover:underline">
            View all questions &amp; answers &rarr;
          </a>
        </div>
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/', content }));
});

// ==========================================
// 2. ABOUT PAGE
// ==========================================
publicRouter.get('/about', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('About Us', 'A driving school built on patience, safety, and real roads.', "We've spent over 15 years turning nervous beginners into confident drivers across Tirunelveli.")}

    <section class="py-20 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-2 items-center">
        <div class="reveal">
          <h2 class="text-3xl font-display font-bold text-ink">Our Philosophy</h2>
          <p class="mt-4 text-muted-foreground leading-relaxed">
            At Sri Munis Kanna Driving School, we believe that everyone can learn to drive well when given patient, systematic coaching. Fear on the road disappears when muscle memory takes over through structured practical practice.
          </p>
          <p class="mt-4 text-muted-foreground leading-relaxed">
            Located right near Tirunelveli Junction, we have modern dual-control training hatchbacks, sedans, and SUVs. Our instructors are RTO certified and trained to provide calm guidance without harsh criticism.
          </p>
        </div>
        <div class="reveal">
          <div class="aspect-[4/3] rounded-3xl overflow-hidden shadow-card border border-border">
            <img src="/assets/images/owner.jpg" alt="Founder M. Muthukumar" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/about', title: 'About Us — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 3. COURSES PAGE
// ==========================================
publicRouter.get('/courses', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Courses & Packages', 'Programs designed for every kind of driver.', "Whether you're starting from zero or polishing existing skills, there's a course built for you.")}

    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${COURSES_DATA.map((c) => `
          <div class="reveal relative rounded-3xl p-7 border transition-all duration-500 hover:-translate-y-1 ${
            c.highlight ? 'bg-ink text-white border-yellow shadow-glow' : 'bg-card text-ink border-border shadow-card hover:shadow-glow'
          }">
            ${c.badge ? `<span class="absolute -top-3 right-6 inline-flex items-center gap-1 rounded-full bg-gradient-yellow text-ink text-xs font-semibold px-3 py-1 shadow-glow">${icon('sparkles', 'size-3')} ${c.badge}</span>` : ''}
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-2xl font-display font-bold">${c.name}</h3>
                <p class="text-sm mt-1 ${c.highlight ? 'text-yellow' : 'text-muted-foreground'}">${c.sessions}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-medium ${c.highlight ? 'bg-yellow text-ink' : 'bg-secondary text-ink'}">
                ${c.duration}
              </span>
            </div>
            <ul class="mt-6 space-y-3">
              ${c.features.map((f) => `
                <li class="flex gap-2 text-sm">
                  ${icon('check', `size-4 mt-0.5 shrink-0 ${c.highlight ? 'text-yellow' : 'text-yellow-deep'}`)}
                  <span class="${c.highlight ? 'text-white/85' : 'text-ink'}">${f}</span>
                </li>
              `).join('')}
            </ul>
            <a href="/book-demo" class="block mt-7">
              <button class="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity ${
                c.highlight ? 'bg-gradient-yellow text-ink' : 'bg-ink text-white'
              }">
                Enquire Now ${icon('arrow-right', 'size-4')}
              </button>
            </a>
          </div>
        `).join('')}
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/courses', title: 'Driving Courses & Packages — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 4. CAR RENTALS PAGE (STEP 4)
// ==========================================
publicRouter.get('/car-rentals', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Car Rentals in Tirunelveli', 'Self-Drive & Chauffeur Car Rentals', 'Well-maintained fleet, transparent rates, zero hidden charges & 24x7 roadside assistance. Book online or on WhatsApp.')}

    <!-- Rental Fleet Showcase -->
    <section class="py-16 md:py-24 bg-background">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-center max-w-2xl mx-auto mb-16 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Available Fleet</span>
          <h2 class="mt-3 text-3xl md:text-5xl font-display font-bold text-ink">Choose Your Perfect Ride</h2>
          <p class="mt-4 text-muted-foreground text-sm md:text-base">
            From city hatchbacks to 7-seater family MPVs and luxury wedding cars.
          </p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          ${CAR_RENTALS_DATA.map((car) => `
            <div class="reveal rounded-3xl bg-card border border-border overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 flex flex-col justify-between">
              <div>
                <div class="aspect-[16/10] relative overflow-hidden bg-ink">
                  <img src="${car.image}" alt="${car.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <span class="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wider bg-yellow text-ink px-3 py-1 rounded-full shadow-sm">
                    ${car.category}
                  </span>
                  ${car.popular ? `<span class="absolute top-4 right-4 text-[11px] font-bold uppercase tracking-wider bg-ink text-white px-3 py-1 rounded-full border border-white/20">Popular</span>` : ''}
                </div>

                <div class="p-6">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h3 class="font-display font-bold text-xl text-ink">${car.name}</h3>
                      <p class="text-xs text-muted-foreground mt-0.5">${car.tagline}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="font-display font-bold text-lg text-yellow-deep">${car.dailyRate}</span>
                      <span class="block text-[10px] text-muted-foreground">per day</span>
                    </div>
                  </div>

                  <div class="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2 rounded-xl bg-secondary text-ink font-medium">
                      ${car.seats}
                    </div>
                    <div class="p-2 rounded-xl bg-secondary text-ink font-medium truncate">
                      ${car.fuel}
                    </div>
                    <div class="p-2 rounded-xl bg-secondary text-ink font-medium truncate">
                      ${car.transmission}
                    </div>
                  </div>

                  <ul class="mt-5 space-y-2 text-xs text-muted-foreground">
                    ${car.features.map((f) => `
                      <li class="flex items-center gap-2">
                        ${icon('check', 'size-3.5 text-yellow-deep shrink-0')}
                        <span>${f}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              </div>

              <div class="p-6 pt-0">
                <a href="${waLink(`Hi Sri Munis Kanna team, I would like to book the ${car.name} (${car.category}) for rent.`)}" target="_blank" rel="noreferrer" class="block w-full">
                  <button class="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
                    ${icon('message-circle', 'size-4')} Book via WhatsApp
                  </button>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Rental Booking Form & Benefits -->
    <section class="py-20 bg-card border-y border-border">
      <div class="mx-auto max-w-7xl px-4 grid gap-12 lg:grid-cols-5 items-start">
        <div class="lg:col-span-3 rounded-3xl bg-background border border-border p-8 md:p-10 shadow-card reveal">
          <div class="flex items-center gap-2 text-yellow-deep">
            ${icon('car', 'size-5')}
            <span class="text-xs font-semibold uppercase tracking-[0.2em]">Quick Rental Enquiry</span>
          </div>
          <h2 class="mt-3 text-3xl font-display font-bold text-ink">Reserve Your Vehicle</h2>
          <p class="mt-2 text-sm text-muted-foreground">Fill in your requirements for instant rates &amp; availability confirmation.</p>

          <div id="rental-success" style="display:none" class="mt-6 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-green-800 text-sm font-medium text-center">
            Thank you! Your rental enquiry has been received. We will connect with you shortly.
          </div>

          <form id="rental-form" class="mt-6 space-y-4" novalidate>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Full Name</label>
                <input name="name" type="text" placeholder="e.g. Ramesh Kumar" required class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Phone / WhatsApp</label>
                <input name="phone" type="tel" placeholder="+91 98XXXXXXXX" required class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Preferred Car</label>
                <select name="course" required class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="" disabled selected>Select Car Model</option>
                  <option value="Rental: Maruti Swift / WagonR (Hatchback)">Maruti Swift / WagonR (Hatchback)</option>
                  <option value="Rental: Maruti Dzire / Amaze (Sedan)">Maruti Dzire / Amaze (Sedan)</option>
                  <option value="Rental: Toyota Innova Crysta (7-Seater)">Toyota Innova Crysta (7-Seater)</option>
                  <option value="Rental: Hyundai Creta / Brezza (SUV)">Hyundai Creta / Brezza (SUV)</option>
                  <option value="Rental: Luxury / Wedding Car">Luxury / Wedding Chauffeur Car</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Rental Type</label>
                <select name="rental_type" class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="Self-Drive">Self-Drive</option>
                  <option value="With Chauffeur / Driver">With Chauffeur / Driver</option>
                </select>
              </div>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Pickup Date</label>
                <input name="preferred_date" type="date" required class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-ink mb-1">Duration / Days</label>
                <input name="duration" type="text" placeholder="e.g. 2 Days / 1 Week" class="w-full h-11 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-ink mb-1">Trip Details / Destination (Optional)</label>
              <textarea name="message" rows="3" placeholder="e.g. Outstation trip to Kanyakumari / Local city use..." class="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
            </div>

            <button type="submit" id="rental-submit" class="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              ${icon('car', 'size-4')} Submit Rental Booking
            </button>
          </form>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-3xl bg-ink text-white p-8 shadow-card reveal">
            <h3 class="font-display font-bold text-2xl">Why Rent With SMK?</h3>
            <ul class="mt-5 space-y-4 text-sm text-white/80">
              <li class="flex gap-3">
                ${icon('shield-check', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white">Safety Tested &amp; Insured</strong>
                  <p class="text-xs text-white/60">Every car is routinely serviced and fully insured.</p>
                </div>
              </li>
              <li class="flex gap-3">
                ${icon('badge-check', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white">Zero Hidden Charges</strong>
                  <p class="text-xs text-white/60">Transparent pricing with no surprise deductions.</p>
                </div>
              </li>
              <li class="flex gap-3">
                ${icon('clock', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white">24x7 Roadside Assistance</strong>
                  <p class="text-xs text-white/60">Instant support across Tamil Nadu highways.</p>
                </div>
              </li>
              <li class="flex gap-3">
                ${icon('map-pin', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white">Junction Pickup &amp; Doorstep Delivery</strong>
                  <p class="text-xs text-white/60">Pickup directly at Tirunelveli Junction or doorstep.</p>
                </div>
              </li>
            </ul>
          </div>

          <div class="rounded-3xl bg-gradient-yellow p-8 text-ink shadow-glow reveal">
            <h3 class="font-display font-bold text-2xl">Need Urgent Booking?</h3>
            <p class="mt-2 text-sm text-ink/80">Call or message us directly on WhatsApp for 5-minute vehicle allotment.</p>
            <a href="tel:${SITE.phoneTel}" class="mt-4 block font-display font-bold text-lg">
              ${icon('phone', 'size-4 inline mr-1')} ${SITE.phone}
            </a>
          </div>
        </div>
      </div>
    </section>

    <script>
      document.getElementById('rental-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = this.querySelector('[name="name"]').value.trim();
        var phone = this.querySelector('[name="phone"]').value.trim();
        var car = this.querySelector('[name="course"]').value;
        var rType = this.querySelector('[name="rental_type"]').value;
        var date = this.querySelector('[name="preferred_date"]').value;
        var duration = this.querySelector('[name="duration"]').value.trim();
        var notes = this.querySelector('[name="message"]').value.trim();

        if (name.length < 2 || phone.length < 8 || !car) {
          alert('Please provide your name, valid phone number, and select a car.');
          return;
        }

        var btn = document.getElementById('rental-submit');
        btn.disabled = true;
        btn.textContent = 'Submitting Booking…';

        var fullMsg = 'Rental: ' + car + ' (' + rType + ')' + (duration ? ' for ' + duration : '') + (notes ? ' - ' + notes : '');

        var fd = new FormData();
        fd.append('name', name);
        fd.append('phone', phone);
        fd.append('course', car);
        fd.append('preferred_date', date);
        fd.append('message', fullMsg);
        fd.append('source', 'car-rentals');

        fetch('/enquiry', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            document.getElementById('rental-success').style.display = 'block';
            document.getElementById('rental-form').reset();
            btn.disabled = false;
            btn.innerHTML = 'Submit Rental Booking';
            if (data.wa_url) {
              window.open(data.wa_url, '_blank');
            }
          })
          .catch(function() {
            btn.disabled = false;
            btn.innerHTML = 'Submit Rental Booking';
            alert('Something went wrong. Please call us directly.');
          });
      });
    </script>
  `;

  res.send(renderLayout({ activePath: '/car-rentals', title: 'Car Rentals Tirunelveli — Self-Drive & Chauffeur Fleet', content }));
});

// ==========================================
// 5. WHY US PAGE
// ==========================================
publicRouter.get('/why-us', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Why Choose Us', 'Six reasons families trust us with first-time drivers.', "Patient trainers, real road practice, ladies special batches, and complete license assistance.")}

    <section class="py-20 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">1</div>
          <h3 class="text-xl font-display font-bold text-ink">Zero Shouting &amp; Extreme Patience</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">Our trainers are strictly trained to be calm, respectful, and supportive. You will never be scolded for making mistakes while learning.</p>
        </div>
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">2</div>
          <h3 class="text-xl font-display font-bold text-ink">22 Practical Classes on Real Roads</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">We don't limit you to empty grounds. You practice on real Tirunelveli Junction roads, market streets, and state highways.</p>
        </div>
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">3</div>
          <h3 class="text-xl font-display font-bold text-ink">Dedicated Ladies Coaching</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">Judgement-free, female-friendly batches with convenient morning and evening timings for homemakers and working women.</p>
        </div>
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">4</div>
          <h3 class="text-xl font-display font-bold text-ink">Complete License Assistance</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">From LL application, document checking, and RTO track practice to driving test coordination and DL delivery.</p>
        </div>
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">5</div>
          <h3 class="text-xl font-display font-bold text-ink">Dual Control Safety Fleet</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">Every vehicle is equipped with dual clutch and dual brake controls so the instructor can assist instantly in any situation.</p>
        </div>
        <div class="p-8 rounded-3xl bg-card border border-border shadow-card reveal">
          <div class="h-12 w-12 rounded-2xl bg-gradient-yellow flex items-center justify-center font-bold text-ink mb-6">6</div>
          <h3 class="text-xl font-display font-bold text-ink">Car Rentals &amp; Post-License Support</h3>
          <p class="mt-3 text-sm text-muted-foreground leading-relaxed">Need a car after getting your license? Rent directly from our well-maintained fleet or get highway refresher sessions.</p>
        </div>
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/why-us', title: 'Why Choose Us — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 6. GALLERY PAGE
// ==========================================
publicRouter.get('/gallery', (req: Request, res: Response) => {
  const images = [
    { src: '/assets/images/hero-car.jpg', caption: 'Premium Dual-Control Training Vehicle' },
    { src: '/assets/images/lesson.jpg', caption: 'Road Navigation Training Session' },
    { src: '/assets/images/owner.jpg', caption: 'Founder M. Muthukumar Coaching' },
    { src: '/assets/images/woman-driver.jpg', caption: 'Ladies Special Batch In Action' },
    { src: '/assets/images/license-success.jpg', caption: 'Learner Celebrating DL Test Success' },
    { src: '/assets/images/car-lboard.jpg', caption: 'L-Board Training Vehicle at Junction' },
  ];

  const content = `
    ${renderPageHero('Gallery', 'Inside the Academy &amp; Fleet', 'Training cars, practical road sessions, and license success moments.')}

    <section class="py-16 md:py-24 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        ${images.map((img) => `
          <div class="reveal group rounded-3xl overflow-hidden bg-card border border-border shadow-card hover:shadow-glow transition-all">
            <div class="aspect-[4/3] overflow-hidden bg-ink">
              <img src="${img.src}" alt="${img.caption}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div class="p-4 text-center">
              <p class="text-xs font-semibold text-ink">${img.caption}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/gallery', title: 'Gallery — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 7. BLOG LIST PAGE
// ==========================================
publicRouter.get('/blog', (req: Request, res: Response) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const perPage = 9;

  let filtered = BLOG_POSTS_DATA;
  if (search) {
    filtered = BLOG_POSTS_DATA.filter(
      (p) => p.title.toLowerCase().includes(search) || p.excerpt.toLowerCase().includes(search) || p.tags.some((t) => t.toLowerCase().includes(search))
    );
  }

  const total = filtered.length;
  const posts = filtered.slice((page - 1) * perPage, page * perPage);

  const content = `
    ${renderPageHero('Blog & Driving Tips', 'Practical Guides to Drive Smarter', 'Tips on parking, night driving, highway safety, and maintenance from professional trainers.')}

    <section class="py-16 md:py-24 bg-background">
      <div class="mx-auto max-w-7xl px-4">
        <!-- Search bar -->
        <form method="GET" action="/blog" class="mb-10 max-w-2xl mx-auto">
          <div class="flex gap-2 p-1.5 rounded-2xl border border-border bg-card shadow-card">
            <div class="relative flex-1">
              <span class="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted-foreground">
                ${icon('search', 'size-4')}
              </span>
              <input type="search" name="search" value="${search}" placeholder="Search articles…" class="w-full h-10 pl-10 pr-3 bg-transparent text-sm text-ink placeholder:text-muted-foreground focus:outline-none" />
            </div>
            ${search ? `<a href="/blog" class="flex items-center px-3 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-ink transition-colors">Clear</a>` : ''}
            <button type="submit" class="h-10 px-5 rounded-xl bg-gradient-yellow text-ink text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow">Search</button>
          </div>
        </form>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          ${posts.map((p) => `
            <a href="/blog/${p.slug}" class="reveal group rounded-3xl overflow-hidden bg-card border border-border shadow-card hover:shadow-glow transition-all duration-500 hover:-translate-y-1 block no-underline">
              <div class="aspect-[16/10] relative overflow-hidden bg-ink">
                <img src="${p.image_url}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <span class="absolute top-4 left-4 text-[10px] uppercase tracking-widest bg-yellow text-ink font-semibold px-3 py-1 rounded-full">
                  ${p.tags[0] || 'Driving'}
                </span>
              </div>
              <div class="p-6">
                <h3 class="font-display font-bold text-xl text-ink leading-tight group-hover:text-yellow-deep transition-colors">
                  ${p.title}
                </h3>
                <p class="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  ${p.excerpt}
                </p>
                <div class="mt-5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>${p.read_time} &bull; ${p.published_at}</span>
                  ${icon('arrow-up-right', 'size-4 text-yellow-deep')}
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/blog', title: 'Driving Tips & Blog — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 8. BLOG POST DETAIL PAGE
// ==========================================
publicRouter.get('/blog/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const post = BLOG_POSTS_DATA.find((p) => p.slug === slug);

  if (!post) {
    return res.status(404).send(
      renderLayout({
        activePath: '/blog',
        title: 'Post Not Found — Sri Munis Kanna Driving School',
        content: `
          <section class="py-32 text-center bg-background">
            <h1 class="text-4xl font-display font-bold text-ink">Post Not Found</h1>
            <p class="mt-4 text-muted-foreground">The article you are looking for does not exist.</p>
            <a href="/blog" class="mt-6 inline-block text-yellow-deep font-semibold">&larr; Back to Blog</a>
          </section>
        `,
      })
    );
  }

  const content = `
    <article class="bg-background pt-36 pb-20">
      <div class="mx-auto max-w-4xl px-4">
        <a href="/blog" class="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-deep hover:underline mb-6">
          ${icon('arrow-left', 'size-4')} Back to all articles
        </a>

        <div class="flex items-center gap-2 mb-4">
          ${post.tags.map((t) => `<span class="rounded-full bg-yellow/20 text-ink px-3 py-1 text-xs font-semibold">${t}</span>`).join('')}
          <span class="text-xs text-muted-foreground">&bull; ${post.read_time}</span>
        </div>

        <h1 class="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-ink leading-tight">
          ${post.title}
        </h1>

        <div class="mt-6 aspect-video rounded-3xl overflow-hidden bg-ink shadow-card border border-border">
          <img src="${post.image_url}" alt="${post.title}" class="w-full h-full object-cover" />
        </div>

        <div class="mt-10 prose prose-lg max-w-none text-ink leading-relaxed space-y-5">
          ${post.content}
        </div>

        <div class="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-gradient-yellow flex items-center justify-center font-bold text-ink">SMK</div>
            <div>
              <p class="font-semibold text-sm text-ink">${SITE.owner}</p>
              <p class="text-xs text-muted-foreground">Sri Munis Kanna Driving School</p>
            </div>
          </div>
          <a href="${waLink(`Hi, I read your article "${post.title}" and would like to enquire about classes/rentals.`)}" target="_blank" rel="noreferrer">
            <button class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold bg-whatsapp text-white">
              ${icon('message-circle', 'size-3.5')} Discuss on WhatsApp
            </button>
          </a>
        </div>
      </div>
    </article>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/blog', title: `${post.title} — Sri Munis Kanna Driving School`, content }));
});

// ==========================================
// 9. TESTIMONIALS PAGE
// ==========================================
publicRouter.get('/testimonials', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Testimonials', 'Hear from our successful drivers.', 'Over 500 learners have gained confidence and earned their permanent driving license with us.')}

    <section class="py-20 bg-background">
      <div class="mx-auto max-w-7xl px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${TESTIMONIALS_DATA.map((t) => `
          <div class="reveal rounded-3xl bg-card border border-border p-7 shadow-card flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-1 text-yellow-deep mb-4">
                ${icon('star', 'size-4 fill-yellow text-yellow').repeat(t.rating)}
              </div>
              <p class="text-sm text-ink leading-relaxed italic">"${t.quote}"</p>
            </div>
            <div class="mt-6 pt-4 border-t border-border flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-ink">${t.name.charAt(0)}</div>
              <div>
                <h4 class="font-semibold text-sm text-ink">${t.name}</h4>
                <p class="text-xs text-muted-foreground">${t.role}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/testimonials', title: 'Student Reviews & Testimonials — Sri Munis Kanna', content }));
});

// ==========================================
// 10. FAQ PAGE
// ==========================================
publicRouter.get('/faq', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('FAQ', 'Everything You Need to Know', 'Answers to questions about our courses, license assistance, timings, and car rentals.')}

    <section class="py-20 bg-background">
      <div class="mx-auto max-w-4xl px-4 space-y-4">
        ${FAQS_DATA.map((faq) => `
          <details class="reveal group rounded-2xl bg-card border border-border p-6 shadow-card transition-all [&_svg]:open:-rotate-180">
            <summary class="flex cursor-pointer items-center justify-between font-display font-semibold text-ink text-base md:text-lg select-none list-none">
              <span>${faq.q}</span>
              <span class="ml-4 shrink-0 transition-transform duration-300">
                ${icon('chevron-down', 'size-5 text-muted-foreground')}
              </span>
            </summary>
            <p class="mt-4 text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
              ${faq.a}
            </p>
          </details>
        `).join('')}
      </div>
    </section>

    ${renderContactCta()}
  `;

  res.send(renderLayout({ activePath: '/faq', title: 'FAQ — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 11. BOOK DEMO PAGE
// ==========================================
publicRouter.get('/book-demo', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Book Demo', 'Try a free demo class first.', "No commitment. Sit in the car, meet your instructor, and see if we're the right fit for you.")}

    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-6xl px-4 grid gap-8 lg:grid-cols-5">
        <div class="lg:col-span-3 rounded-3xl bg-card border border-border shadow-glow p-8 md:p-10 reveal">
          <div class="flex items-center gap-2 text-yellow-deep">
            ${icon('sparkles', 'size-4')}
            <span class="text-xs font-semibold uppercase tracking-[0.2em]">Free Demo Class</span>
          </div>
          <h2 class="mt-3 text-3xl font-display font-bold text-ink">Tell us a little about you</h2>

          <div id="demo-success" style="display:none" class="mt-6 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-green-800 text-sm font-medium text-center">
            Booking received! We'll confirm your demo class slot shortly.
          </div>

          <form id="demo-form" class="mt-8 space-y-5" novalidate>
            <div class="grid sm:grid-cols-2 gap-5">
              <div>
                <label for="demo-name" class="block text-sm font-medium text-ink mb-1.5">Full name</label>
                <input id="demo-name" name="name" type="text" placeholder="e.g. Anand" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label for="demo-phone" class="block text-sm font-medium text-ink mb-1.5">Phone / WhatsApp</label>
                <input id="demo-phone" name="phone" type="tel" placeholder="+91 98XXXXXXXX" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>

            <div>
              <label for="demo-course" class="block text-sm font-medium text-ink mb-1.5">Course interested in</label>
              <select id="demo-course" name="course" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="" disabled selected>Select a course</option>
                ${COURSES_DATA.map((c) => `<option value="${c.name}">${c.name} (${c.duration})</option>`).join('')}
              </select>
            </div>

            <div>
              <label for="demo-date" class="block text-sm font-medium text-ink mb-1.5">Preferred demo date</label>
              <input id="demo-date" name="date" type="date" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label for="demo-notes" class="block text-sm font-medium text-ink mb-1.5">Anything we should know? (optional)</label>
              <textarea id="demo-notes" name="notes" rows="3" placeholder="e.g. complete beginner, prefer morning slot…" class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
            </div>

            <button type="submit" id="demo-submit" class="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              ${icon('calendar', 'size-4')} Confirm Free Demo
            </button>
          </form>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div class="rounded-3xl bg-ink text-white p-8 shadow-glow reveal">
            <h3 class="font-display font-bold text-2xl">What you get</h3>
            <ul class="mt-5 space-y-3 text-white/85 text-sm">
              <li class="flex gap-3">${icon('check-circle', 'size-5 text-yellow shrink-0 mt-0.5')} 100% free, no obligation</li>
              <li class="flex gap-3">${icon('check-circle', 'size-5 text-yellow shrink-0 mt-0.5')} Meet your trainer &amp; inspect the vehicle</li>
              <li class="flex gap-3">${icon('check-circle', 'size-5 text-yellow shrink-0 mt-0.5')} Quick driving assessment</li>
              <li class="flex gap-3">${icon('check-circle', 'size-5 text-yellow shrink-0 mt-0.5')} Personalized course recommendation</li>
            </ul>
            <div class="mt-8 pt-6 border-t border-white/10">
              <p class="text-sm text-white/60">Prefer to talk directly?</p>
              <a href="tel:${SITE.phoneTel}" class="mt-2 flex items-center gap-2 font-display font-semibold text-yellow text-lg">
                ${icon('phone', 'size-4')} ${SITE.phone}
              </a>
            </div>
          </div>

          <div class="rounded-3xl bg-gradient-yellow p-8 text-ink shadow-glow reveal">
            ${icon('message-circle', 'size-8')}
            <h3 class="mt-3 font-display font-bold text-2xl">Or WhatsApp Us Directly</h3>
            <p class="mt-2 text-sm text-ink/80">Fastest way to schedule. We reply within minutes.</p>
            <a href="${waLink()}" target="_blank" rel="noreferrer" class="block mt-5">
              <button class="w-full inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold bg-ink text-white hover:opacity-90 transition-opacity">
                Open WhatsApp
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>

    <script>
      document.getElementById('demo-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = this.querySelector('[name="name"]').value.trim();
        var phone = this.querySelector('[name="phone"]').value.trim();
        var course = this.querySelector('[name="course"]').value;
        var date = this.querySelector('[name="date"]').value;
        var notes = this.querySelector('[name="notes"]').value.trim();

        if (!name || !phone || !course || !date) {
          alert('Please fill all required fields.');
          return;
        }

        var btn = document.getElementById('demo-submit');
        btn.disabled = true;
        btn.textContent = 'Booking…';

        var fd = new FormData();
        fd.append('name', name);
        fd.append('phone', phone);
        fd.append('course', course);
        fd.append('preferred_date', date);
        fd.append('message', notes);
        fd.append('source', 'book-demo');

        fetch('/enquiry', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            document.getElementById('demo-success').style.display = 'block';
            document.getElementById('demo-form').reset();
            btn.disabled = false;
            btn.innerHTML = 'Confirm Free Demo';
            if (data.wa_url) {
              window.open(data.wa_url, '_blank');
            }
          })
          .catch(function() {
            btn.disabled = false;
            btn.innerHTML = 'Confirm Free Demo';
            alert('Something went wrong. Please call us directly.');
          });
      });
    </script>
  `;

  res.send(renderLayout({ activePath: '/book-demo', title: 'Book Free Demo — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 12. CONTACT PAGE
// ==========================================
publicRouter.get('/contact', (req: Request, res: Response) => {
  const content = `
    ${renderPageHero('Contact Us', "We'd love to hear from you.", 'Call, WhatsApp, visit our office near Tirunelveli Junction, or send an enquiry.')}

    <section class="py-20 md:py-28 bg-background">
      <div class="mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-5 items-start">
        <div class="lg:col-span-3 rounded-3xl bg-card border border-border shadow-glow p-8 md:p-12 reveal">
          <span class="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-deep">Send enquiry</span>
          <h2 class="mt-2 text-3xl md:text-4xl font-display font-bold text-ink">Tell us how we can help</h2>

          <div id="contact-success" style="display:none" class="my-6 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-green-800 text-sm font-medium text-center">
            Thank you! We'll be in touch shortly.
          </div>

          <form id="contact-form" class="mt-6 space-y-5" novalidate>
            <div>
              <label for="contact-name" class="block text-sm font-medium text-ink mb-1.5">Your name</label>
              <input id="contact-name" name="name" type="text" placeholder="e.g. Priya Ravi" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label for="contact-phone" class="block text-sm font-medium text-ink mb-1.5">Phone / WhatsApp</label>
              <input id="contact-phone" name="phone" type="tel" placeholder="+91 98XXXXXXXX" required class="w-full h-12 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label for="contact-message" class="block text-sm font-medium text-ink mb-1.5">What would you like to know?</label>
              <textarea id="contact-message" name="message" rows="4" placeholder="I'm interested in the ladies special course / car rentals…" required class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"></textarea>
            </div>
            <button type="submit" id="contact-submit" class="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold bg-gradient-yellow text-ink hover:opacity-90 transition-opacity shadow-glow">
              ${icon('message-circle', 'size-4')} Send Enquiry
            </button>
          </form>
        </div>

        <div class="lg:col-span-2 space-y-6 reveal">
          <div class="rounded-3xl bg-ink text-white p-8 shadow-card space-y-6">
            <h3 class="font-display font-bold text-2xl">Visit Our Office</h3>
            <div class="space-y-4 text-sm text-white/80">
              <div class="flex items-start gap-3">
                ${icon('map-pin', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white block">Address</strong>
                  <span>${SITE.address}</span>
                </div>
              </div>
              <div class="flex items-start gap-3">
                ${icon('phone', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white block">Phone</strong>
                  <a href="tel:${SITE.phoneTel}" class="hover:text-yellow">${SITE.phone}</a><br/>
                  <a href="tel:${SITE.phone2Tel}" class="hover:text-yellow">${SITE.phone2}</a>
                </div>
              </div>
              <div class="flex items-start gap-3">
                ${icon('clock', 'size-5 text-yellow shrink-0 mt-0.5')}
                <div>
                  <strong class="text-white block">Working Hours</strong>
                  <span>${SITE.hours}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-3xl overflow-hidden border border-border shadow-card h-64 bg-card">
            <iframe src="${SITE.mapsEmbed}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
          </div>
        </div>
      </div>
    </section>

    <script>
      document.getElementById('contact-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = this.querySelector('[name="name"]').value.trim();
        var phone = this.querySelector('[name="phone"]').value.trim();
        var message = this.querySelector('[name="message"]').value.trim();

        if (name.length < 2 || phone.length < 8 || !message) {
          alert('Please fill all fields correctly.');
          return;
        }

        var btn = document.getElementById('contact-submit');
        btn.disabled = true;
        btn.textContent = 'Sending…';

        var fd = new FormData();
        fd.append('name', name);
        fd.append('phone', phone);
        fd.append('message', message);
        fd.append('source', 'contact');

        fetch('/enquiry', { method: 'POST', body: fd })
          .then(function(r) { return r.json(); })
          .then(function(data) {
            document.getElementById('contact-success').style.display = 'block';
            document.getElementById('contact-form').reset();
            btn.disabled = false;
            btn.innerHTML = 'Send Enquiry';
            if (data.wa_url) {
              window.open(data.wa_url, '_blank');
            }
          })
          .catch(function() {
            btn.disabled = false;
            btn.innerHTML = 'Send Enquiry';
            alert('Something went wrong. Please call us directly.');
          });
      });
    </script>
  `;

  res.send(renderLayout({ activePath: '/contact', title: 'Contact Us — Sri Munis Kanna Driving School', content }));
});

// ==========================================
// 13. POST /enquiry & /api/enquiry HANDLER
// ==========================================
const handleEnquiry = async (req: Request, res: Response) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const message = String(req.body.message || '').trim();
    const course = String(req.body.course || '').trim();
    const preferredDate = String(req.body.preferred_date || '').trim();
    const source = String(req.body.source || 'contact');

    if (name.length < 2 || phone.length < 7) {
      return res.status(400).json({ success: false, error: 'Please provide a valid name and phone number.' });
    }

    // Attempt to save into Prisma Lead / CRM if database is available
    try {
      const code = `LEAD-${Date.now().toString().slice(-6)}`;
      await prisma.lead.create({
        data: {
          leadCode: code,
          fullName: name,
          phone: phone,
          courseInterested: course || (source === 'car-rentals' ? 'Car Rental' : 'Driving Course'),
          leadSource: source === 'car-rentals' ? 'RENTAL_WEBSITE' : 'WEBSITE',
          status: 'NEW',
          notes: `Website Enquiry (${source})\nMessage: ${message}\nPreferred Date: ${preferredDate}`,
        },
      });
    } catch (dbErr) {
      console.warn('Note: Could not insert directly to Lead table (will still generate WhatsApp link):', dbErr);
    }

    let waText = `Hi Sri Munis Kanna! I'd like to enquire.\n\nName: ${name}\nPhone: ${phone}`;
    if (course) waText += `\nService: ${course}`;
    if (preferredDate) waText += `\nPreferred Date: ${preferredDate}`;
    if (message) waText += `\nDetails: ${message}`;

    const waUrl = waLink(waText);

    return res.json({
      success: true,
      message: 'Enquiry submitted successfully',
      wa_url: waUrl,
    });
  } catch (error: any) {
    console.error('Enquiry handler error:', error);
    return res.status(500).json({ success: false, error: 'Could not process enquiry.' });
  }
};

publicRouter.post('/enquiry', handleEnquiry);
publicRouter.post('/api/enquiry', handleEnquiry);

// Public JSON endpoints for blog posts & rentals
publicRouter.get('/api/public/posts', (req: Request, res: Response) => {
  res.json({ success: true, data: BLOG_POSTS_DATA });
});

publicRouter.get('/api/public/rentals', (req: Request, res: Response) => {
  res.json({ success: true, data: CAR_RENTALS_DATA });
});
