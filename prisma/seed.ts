import { PrismaClient, Role, ArticleStatus, Locale } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 சங்கதி ஆரம்பத் தரவுகள் (Seed Data) 3 மொழிகளில் ஏற்றப்படுகின்றன...");

  // 1. ஆரம்பப் பயனாளர்கள் (Users)

  const [adminPassword, reporterPassword] = await Promise.all([
    bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Admin-2026!", 12),
    bcrypt.hash(process.env.SEED_REPORTER_PASSWORD || "ChangeMe-Reporter-2026!", 12),
  ]);

  await prisma.user.upsert({
    where: { email: "admin@sangathe.com" },
    update: { name: "Sangathe Administrator", role: Role.ADMIN, isActive: true },
    create: { email: "admin@sangathe.com", name: "Sangathe Administrator", password: adminPassword, role: Role.ADMIN },
  });

  const reporter = await prisma.user.upsert({
    where: { email: "reporter@sangathe.com" },
    update: { isActive: true },
    create: {
      email: "reporter@sangathe.com",
      name: "யாழ் நிருபர்",
      password: reporterPassword,
      role: Role.REPORTER,
    },
  });

  console.log("✅ பயனாளர்கள் உருவாயினர்: Admin & Reporter");

  // 2. 8 முதன்மைப் பகுதிகள் - 3 மொழிகளில் (Trilingual Categories)
  const categoryData = [
    {
      slug: "local-news",
      order: 1,
      translations: {
        en: "Local News",
        ta: "உள்ளூர் செய்திகள்",
        si: "දේශීය පුවත්",
      },
    },
    {
      slug: "politics",
      order: 2,
      translations: {
        en: "Politics",
        ta: "அரசியல்",
        si: "දේශපාලන",
      },
    },
    {
      slug: "business-economy",
      order: 3,
      translations: {
        en: "Business / Economy",
        ta: "வணிகம் / பொருளாதாரம்",
        si: "ව්‍යාපාර සහ ආර්ථික",
      },
    },
    {
      slug: "sports",
      order: 4,
      translations: {
        en: "Sports",
        ta: "விளையாட்டு",
        si: "ක්‍රීඩා",
      },
    },
    {
      slug: "world",
      order: 5,
      translations: {
        en: "World",
        ta: "உலகம்",
        si: "විදෙස් පුවත්",
      },
    },
    {
      slug: "entertainment",
      order: 6,
      translations: {
        en: "Entertainment",
        ta: "பொழுதுபோக்கு",
        si: "විනෝදාස්වාදය",
      },
    },
    {
      slug: "education",
      order: 7,
      translations: {
        en: "Education",
        ta: "கல்வி",
        si: "අධ්‍යාපන",
      },
    },
    {
      slug: "crime",
      order: 8,
      translations: {
        en: "Crime",
        ta: "குற்றங்கள்",
        si: "අපරාධ",
      },
    },
  ];

  // 3 மொழிகளிலும் Categories-ஐ Loop செய்து Database-ல் ஏற்றுதல் (8 x 3 = 24 entries)
  for (const cat of categoryData) {
    // English
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.en } },
      update: { name: cat.translations.en, order: cat.order },
      create: {
        name: cat.translations.en,
        slug: cat.slug,
        locale: Locale.en,
        order: cat.order,
      },
    });

    // Tamil
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.ta } },
      update: { name: cat.translations.ta, order: cat.order },
      create: {
        name: cat.translations.ta,
        slug: cat.slug,
        locale: Locale.ta,
        order: cat.order,
      },
    });

    // Sinhala
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.si } },
      update: { name: cat.translations.si, order: cat.order },
      create: {
        name: cat.translations.si,
        slug: cat.slug,
        locale: Locale.si,
        order: cat.order,
      },
    });
  }

  console.log("✅ 8 முக்கிய செய்திப் பிரிவுகளும் தமிழ், ஆங்கிலம், சிங்களம் ஆகிய 3 மொழிகளிலும் உருவாயின! (Total: 24)");

  // 3. மாதிரி முதன்மைச் செய்தி (Demo Breaking News in Tamil)
  const localNewsTa = await prisma.category.findUnique({
    where: { slug_locale: { slug: "local-news", locale: Locale.ta } },
  });

  if (localNewsTa) {
    await prisma.article.upsert({
      where: {
        slug_locale: {
          slug: "jaffna-new-it-park-initiative",
          locale: Locale.ta,
        },
      },
      update: {},
      create: {
        title: "யாழ்ப்பாணத்தில் புதிய தகவல் தொழில்நுட்ப மையம் உதயம்: இளைஞர்களுக்குப் புதிய வேலைவாய்ப்புகள்",
        slug: "jaffna-new-it-park-initiative",
        locale: Locale.ta,
        summary: "வட மாகாண இளைஞர்களின் தகவல் தொழில்நுட்பத் திறனை ஊக்குவிக்கும் வகையில் யாழ்ப்பாணத்தில் பிரம்மாண்ட ஐடி பூங்கா அமையவுள்ளது.",
        content: "<p>யாழ்ப்பாண மாவட்டத்தில் தொழில்நுட்ப வளர்ச்சியை அடுத்த கட்டத்திற்கு கொண்டு செல்லும் நோக்கில் புதிய தகவல் தொழில்நுட்ப மையம் அமையவுள்ளது. இதன் மூலம் ஆயிரக்கணக்கான பட்டதாரி இளைஞர்களுக்கு உள்நாட்டிலேயே வேலைவாய்ப்புகள் உருவாகும் என எதிர்பார்க்கப்படுகிறது.</p>",
        featuredImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200",
        imageCaption: "யாழ்ப்பாண தகவல் தொழில்நுட்ப பூங்கா மாதிரி வடிவம்",
        status: ArticleStatus.PUBLISHED,
        isBreaking: true,
        authorId: reporter.id,
        categoryId: localNewsTa.id,
        publishedAt: new Date(),
        seoTitle: "யாழ்ப்பாணத்தில் புதிய தகவல் தொழில்நுட்ப மையம் | சங்கதி",
        seoDescription: "யாழ்ப்பாணத்தில் புதிய ஐடி பூங்கா திறப்பு பற்றிய முழு விவரங்கள்.",
      },
    });
  }

  console.log("✅ மாதிரி பிரேக்கிங் செய்தி (Demo Article) இணைக்கப்பட்டது");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
