const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

// ── Ensure data directory exists ─────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ── Generic read / write helpers ─────────────────────────────────────────────
const readData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ── Auto-seed on first run ────────────────────────────────────────────────────
const seedDatabase = async () => {
  const existingUsers = readData(USERS_FILE);
  if (existingUsers.length > 0) return; // Already seeded

  console.log('🌱 Seeding database with sample data...');

  const hashed = await bcrypt.hash('password123', 10);
  const now = Date.now();

  const users = [
    {
      id: uuidv4(),
      username: 'alex_tech',
      name: 'Alex Johnson',
      bio: '🚀 Full Stack Developer | Open Source Enthusiast | Building things that matter',
      avatarColor: '#6366F1',
      initials: 'AJ',
      password: hashed,
      createdAt: new Date(now - 864000000).toISOString(),
    },
    {
      id: uuidv4(),
      username: 'sarah_dev',
      name: 'Sarah Chen',
      bio: '🎨 UI/UX Designer & Frontend Dev | Coffee Addict | Design for humans',
      avatarColor: '#EC4899',
      initials: 'SC',
      password: hashed,
      createdAt: new Date(now - 720000000).toISOString(),
    },
    {
      id: uuidv4(),
      username: 'mike_codes',
      name: 'Mike Rivera',
      bio: '💻 Backend Engineer | Python & Node.js | APIs & Databases',
      avatarColor: '#10B981',
      initials: 'MR',
      password: hashed,
      createdAt: new Date(now - 576000000).toISOString(),
    },
  ];

  writeData(USERS_FILE, users);

  const [alex, sarah, mike] = users;

  const posts = [
    {
      id: uuidv4(),
      userId: alex.id,
      content:
        'Just deployed my first full-stack app to production! 🎉 Six months of learning, countless debugging sessions, and it\'s finally live. The journey is everything. Keep building! #webdev #javascript #milestone',
      likes: [sarah.id, mike.id],
      comments: [
        {
          id: uuidv4(),
          userId: sarah.id,
          text: 'Congrats! That feeling is absolutely unbeatable 🔥 First deployment hits different.',
          createdAt: new Date(now - 3600000).toISOString(),
        },
        {
          id: uuidv4(),
          userId: mike.id,
          text: 'Welcome to the world of prod bugs 😄 Seriously though, amazing achievement!',
          createdAt: new Date(now - 1800000).toISOString(),
        },
      ],
      createdAt: new Date(now - 86400000).toISOString(),
    },
    {
      id: uuidv4(),
      userId: sarah.id,
      content:
        'Hot take: the best UI is invisible. When design truly works, users don\'t notice it — they just accomplish their goals effortlessly. That\'s the real craft we\'re all chasing. 🎨 #uxdesign #design #frontend',
      likes: [alex.id],
      comments: [
        {
          id: uuidv4(),
          userId: mike.id,
          text: 'This is exactly right. The best UX is the one nobody complains about.',
          createdAt: new Date(now - 7200000).toISOString(),
        },
      ],
      createdAt: new Date(now - 172800000).toISOString(),
    },
    {
      id: uuidv4(),
      userId: mike.id,
      content:
        'PSA: Stop putting business logic in your controllers. Your future self and your team will thank you. Fat models, thin controllers. Separation of concerns isn\'t a suggestion. 🙏 #nodejs #cleancode #backend',
      likes: [alex.id, sarah.id],
      comments: [],
      createdAt: new Date(now - 259200000).toISOString(),
    },
    {
      id: uuidv4(),
      userId: alex.id,
      content:
        'Learned more about CSS Grid in 1 hour of actually building something than in 3 hours of watching tutorials. Build things. Break things. Fix things. That\'s the loop. 💪 #css #frontend #learning',
      likes: [mike.id],
      comments: [
        {
          id: uuidv4(),
          userId: sarah.id,
          text: 'Tutorial paralysis is so real. Hands-on beats passive watching every single time!',
          createdAt: new Date(now - 14400000).toISOString(),
        },
      ],
      createdAt: new Date(now - 345600000).toISOString(),
    },
    {
      id: uuidv4(),
      userId: sarah.id,
      content:
        'Open source contribution #1 — done ✅ Even a small documentation fix counts. Every PR matters. The community grows one contribution at a time. Don\'t wait until you\'re "good enough." Start now. #opensource #github #community',
      likes: [alex.id, mike.id],
      comments: [
        {
          id: uuidv4(),
          userId: alex.id,
          text: 'First contributions are a huge deal! Keep going, the momentum builds fast 🚀',
          createdAt: new Date(now - 1800000).toISOString(),
        },
      ],
      createdAt: new Date(now - 432000000).toISOString(),
    },
  ];

  writeData(POSTS_FILE, posts);
  console.log('✅ Database seeded: 3 users, 5 posts, 6 comments');
  console.log('   Test login: username=alex_tech, password=password123\n');
};

module.exports = { readData, writeData, USERS_FILE, POSTS_FILE, seedDatabase };
