import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/hubspot_clone?schema=public",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { domain: "demo.f-core.com" },
    update: {},
    create: {
      name: "F-CORE Demo",
      domain: "demo.f-core.com",
      plan: "professional",
    },
  });
  console.log("✅ Created tenant:", tenant.name);

  // Create user
  const user = await prisma.user.upsert({
    where: { email: "admin@f-core.com" },
    update: {},
    create: {
      email: "admin@f-core.com",
      name: "Admin User",
      role: "admin",
      tenantId: tenant.id,
    },
  });
  console.log("✅ Created user:", user.email);

  // Create pipeline with stages
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "default-pipeline" },
    update: {},
    create: {
      id: "default-pipeline",
      name: "Sales Pipeline",
      description: "Default sales pipeline",
      isDefault: true,
      tenantId: tenant.id,
    },
  });

  const stages = [
    { name: "Appointment Scheduled", probability: 20, color: "#0891b2" },
    { name: "Qualified to Buy", probability: 40, color: "#0ea5e9" },
    { name: "Presentation Scheduled", probability: 60, color: "#22c55e" },
    { name: "Decision Maker Bought-In", probability: 80, color: "#eab308" },
    { name: "Contract Sent", probability: 90, color: "#f97316" },
    { name: "Closed Won", probability: 100, color: "#10b981", isClosed: true, isWon: true },
    { name: "Closed Lost", probability: 0, color: "#ef4444", isClosed: true, isWon: false },
  ];

  for (let i = 0; i < stages.length; i++) {
    await prisma.pipelineStage.upsert({
      where: { id: `stage-${i + 1}` },
      update: {},
      create: {
        id: `stage-${i + 1}`,
        pipelineId: pipeline.id,
        name: stages[i].name,
        orderIndex: i,
        probability: stages[i].probability,
        color: stages[i].color,
        isClosed: stages[i].isClosed || false,
        isWon: stages[i].isWon || false,
      },
    });
  }
  console.log("✅ Created pipeline with", stages.length, "stages");

  // Create sample contacts
  const contacts = [
    { firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+1234567890", lifecycleStage: "lead" },
    { firstName: "Jane", lastName: "Smith", email: "jane@techcorp.com", phone: "+1234567891", lifecycleStage: "mql" },
    { firstName: "Bob", lastName: "Johnson", email: "bob@startup.io", phone: "+1234567892", lifecycleStage: "sql" },
    { firstName: "Alice", lastName: "Williams", email: "alice@enterprise.com", phone: "+1234567893", lifecycleStage: "customer" },
    { firstName: "Charlie", lastName: "Brown", email: "charlie@agency.co", phone: "+1234567894", lifecycleStage: "opportunity" },
  ];

  for (const contact of contacts) {
    await prisma.contact.upsert({
      where: { id: `contact-${contact.email}` },
      update: {},
      create: {
        id: `contact-${contact.email}`,
        tenantId: tenant.id,
        ownerId: user.id,
        ...contact,
      },
    });
  }
  console.log("✅ Created", contacts.length, "contacts");

  // Create sample companies
  const companies = [
    { name: "TechCorp Inc", domain: "techcorp.com", industry: "Technology", size: "51-200" },
    { name: "StartupIO", domain: "startup.io", industry: "Software", size: "11-50" },
    { name: "Enterprise Solutions", domain: "enterprise.com", industry: "Consulting", size: "201-500" },
    { name: "Creative Agency", domain: "agency.co", industry: "Marketing", size: "1-10" },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: `company-${company.domain}` },
      update: {},
      create: {
        id: `company-${company.domain}`,
        tenantId: tenant.id,
        ownerId: user.id,
        ...company,
      },
    });
  }
  console.log("✅ Created", companies.length, "companies");

  // Create sample deals
  const deals = [
    { name: "TechCorp Enterprise Deal", amount: 50000, stageId: "stage-3" },
    { name: "StartupIO Starter Package", amount: 5000, stageId: "stage-2" },
    { name: "Enterprise Consulting Project", amount: 120000, stageId: "stage-4" },
    { name: "Agency Marketing Suite", amount: 15000, stageId: "stage-1" },
    { name: "New Business Opportunity", amount: 25000, stageId: "stage-5" },
  ];

  for (let i = 0; i < deals.length; i++) {
    await prisma.deal.upsert({
      where: { id: `deal-${i + 1}` },
      update: {},
      create: {
        id: `deal-${i + 1}`,
        tenantId: tenant.id,
        ownerId: user.id,
        pipelineId: pipeline.id,
        name: deals[i].name,
        amount: deals[i].amount,
        stageId: deals[i].stageId,
        closeDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000), // 1-5 weeks from now
      },
    });
  }
  console.log("✅ Created", deals.length, "deals");

  // Create sample activities
  const activities = [
    { type: "note", subject: "Initial contact", body: "Had a great initial call with the prospect." },
    { type: "email", subject: "Follow-up email", body: "Sent proposal document as discussed." },
    { type: "call", subject: "Discovery call", body: "Discussed requirements and budget.", callDuration: 1800 },
    { type: "meeting", subject: "Demo scheduled", body: "Product demo with decision makers." },
    { type: "task", subject: "Send contract", body: "Prepare and send final contract.", status: "pending" },
  ];

  for (let i = 0; i < activities.length; i++) {
    await prisma.activity.create({
      data: {
        tenantId: tenant.id,
        ownerId: user.id,
        contactId: `contact-${contacts[i % contacts.length].email}`,
        ...activities[i],
      },
    });
  }
  console.log("✅ Created", activities.length, "activities");

  // Create sample meeting types
  const meetingTypes = [
    {
      id: "meeting-type-1",
      name: "Quick Chat",
      slug: "quick-chat",
      description: "A brief 15-minute introductory call",
      duration: 15,
      color: "#0891b2",
      locationType: "video",
    },
    {
      id: "meeting-type-2",
      name: "Product Demo",
      slug: "product-demo",
      description: "30-minute product demonstration and Q&A",
      duration: 30,
      color: "#0ea5e9",
      bufferAfter: 15,
      locationType: "video",
    },
    {
      id: "meeting-type-3",
      name: "Strategy Session",
      slug: "strategy-session",
      description: "60-minute deep-dive strategy consultation",
      duration: 60,
      color: "#8b5cf6",
      bufferBefore: 5,
      bufferAfter: 15,
      locationType: "video",
    },
  ];

  for (const mt of meetingTypes) {
    const meetingType = await prisma.meetingType.upsert({
      where: { id: mt.id },
      update: {},
      create: {
        id: mt.id,
        tenantId: tenant.id,
        userId: user.id,
        name: mt.name,
        slug: mt.slug,
        description: mt.description,
        duration: mt.duration,
        color: mt.color,
        bufferBefore: mt.bufferBefore || 0,
        bufferAfter: mt.bufferAfter || 15,
        locationType: mt.locationType || "video",
      },
    });

    // Create default availability (Mon-Fri 9:00-17:00)
    const existingAvail = await prisma.meetingAvailability.findFirst({
      where: { meetingTypeId: meetingType.id },
    });

    if (!existingAvail) {
      await prisma.meetingAvailability.createMany({
        data: [1, 2, 3, 4, 5].map((day) => ({
          meetingTypeId: meetingType.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "17:00",
          timezone: "UTC",
        })),
      });
    }
  }
  console.log("✅ Created", meetingTypes.length, "meeting types with availability");

  // Create sample bookings
  const bookings = [
    {
      meetingTypeId: "meeting-type-2",
      inviteeName: "John Doe",
      inviteeEmail: "john@example.com",
      inviteeCompany: "TechCorp Inc",
      startOffset: 2, // days from now
      status: "scheduled",
    },
    {
      meetingTypeId: "meeting-type-1",
      inviteeName: "Jane Smith",
      inviteeEmail: "jane@techcorp.com",
      startOffset: 4,
      status: "scheduled",
    },
    {
      meetingTypeId: "meeting-type-3",
      inviteeName: "Bob Johnson",
      inviteeEmail: "bob@startup.io",
      inviteeCompany: "StartupIO",
      startOffset: -3,
      status: "completed",
    },
  ];

  for (let i = 0; i < bookings.length; i++) {
    const b = bookings[i];
    const mt = meetingTypes.find((m) => m.id === b.meetingTypeId)!;
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + b.startOffset);
    startTime.setHours(10 + i, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + mt.duration * 60000);

    const contactId = `contact-${b.inviteeEmail}`;
    const contactExists = contacts.find((c) => c.email === b.inviteeEmail);

    await prisma.meetingBooking.upsert({
      where: { id: `booking-${i + 1}` },
      update: {},
      create: {
        id: `booking-${i + 1}`,
        tenantId: tenant.id,
        meetingTypeId: b.meetingTypeId,
        startTime,
        endTime,
        timezone: "UTC",
        status: b.status,
        inviteeName: b.inviteeName,
        inviteeEmail: b.inviteeEmail,
        inviteeCompany: b.inviteeCompany,
        contactId: contactExists ? contactId : null,
      },
    });
  }
  console.log("✅ Created", bookings.length, "meeting bookings");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
