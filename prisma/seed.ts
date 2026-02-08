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

  // Create sample emails with tracking
  const sampleEmails = [
    {
      trackingId: "trk_demo_001",
      fromEmail: "admin@f-core.com",
      fromName: "Admin User",
      toRecipients: [{ email: "john@example.com", name: "John Doe" }],
      subject: "Following up on our conversation",
      bodyHtml: "<p>Hi John,</p><p>I wanted to follow up on our conversation about the new project. Let me know if you have any questions.</p><p>Best regards,<br/>Admin</p>",
      bodyText: "Hi John, I wanted to follow up on our conversation about the new project. Let me know if you have any questions. Best regards, Admin",
      status: "sent",
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      openCount: 3,
      clickCount: 1,
      firstOpenedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      lastOpenedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      firstClickedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      contactId: `contact-john@example.com`,
      companyId: null,
    },
    {
      trackingId: "trk_demo_002",
      fromEmail: "admin@f-core.com",
      fromName: "Admin User",
      toRecipients: [{ email: "jane@techcorp.com", name: "Jane Smith" }],
      subject: "TechCorp Enterprise Proposal",
      bodyHtml: "<p>Hi Jane,</p><p>Please find attached our proposal for the enterprise solution. The pricing includes all features discussed during our demo.</p><p>Looking forward to your feedback.</p>",
      bodyText: "Hi Jane, Please find attached our proposal for the enterprise solution. The pricing includes all features discussed during our demo. Looking forward to your feedback.",
      status: "sent",
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      openCount: 7,
      clickCount: 3,
      firstOpenedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      lastOpenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      firstClickedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      contactId: `contact-jane@techcorp.com`,
      companyId: `company-techcorp.com`,
    },
    {
      trackingId: "trk_demo_003",
      fromEmail: "admin@f-core.com",
      fromName: "Admin User",
      toRecipients: [{ email: "bob@startup.io", name: "Bob Johnson" }],
      subject: "StartupIO - Getting Started Guide",
      bodyHtml: "<p>Hey Bob,</p><p>Here's your getting started guide for the starter package. Click the link below to access your dashboard:</p><p><a href='https://app.f-core.com/onboarding'>Start Onboarding</a></p>",
      bodyText: "Hey Bob, Here's your getting started guide for the starter package.",
      status: "sent",
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      openCount: 1,
      clickCount: 0,
      firstOpenedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      contactId: `contact-bob@startup.io`,
      companyId: `company-startup.io`,
    },
    {
      trackingId: "trk_demo_004",
      fromEmail: "admin@f-core.com",
      fromName: "Admin User",
      toRecipients: [{ email: "alice@enterprise.com", name: "Alice Williams" }],
      ccRecipients: [{ email: "charlie@agency.co", name: "Charlie Brown" }],
      subject: "Q4 Partnership Review",
      bodyHtml: "<p>Hi Alice,</p><p>Let's schedule a review of our Q4 partnership progress. I've prepared a summary of key metrics and deliverables.</p>",
      bodyText: "Hi Alice, Let's schedule a review of our Q4 partnership progress.",
      status: "sent",
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      openCount: 0,
      clickCount: 0,
      contactId: `contact-alice@enterprise.com`,
      companyId: `company-enterprise.com`,
    },
    {
      trackingId: "trk_demo_005",
      fromEmail: "admin@f-core.com",
      fromName: "Admin User",
      toRecipients: [{ email: "charlie@agency.co", name: "Charlie Brown" }],
      subject: "Creative Campaign Brief - Draft",
      bodyHtml: "<p>Hi Charlie,</p><p>Here's the draft campaign brief we discussed. Please review and let me know your thoughts.</p>",
      bodyText: "Hi Charlie, Here's the draft campaign brief we discussed.",
      status: "draft",
      sentAt: null,
      openCount: 0,
      clickCount: 0,
      contactId: `contact-charlie@agency.co`,
      companyId: `company-agency.co`,
    },
  ];

  for (const emailData of sampleEmails) {
    const email = await prisma.email.upsert({
      where: { trackingId: emailData.trackingId },
      update: {},
      create: {
        tenantId: tenant.id,
        trackingId: emailData.trackingId,
        messageId: `<${emailData.trackingId}@fcore.app>`,
        threadId: `thread_${emailData.trackingId}`,
        fromEmail: emailData.fromEmail,
        fromName: emailData.fromName,
        toRecipients: emailData.toRecipients,
        ccRecipients: emailData.ccRecipients || undefined,
        subject: emailData.subject,
        bodyHtml: emailData.bodyHtml,
        bodyText: emailData.bodyText,
        bodyOriginal: emailData.bodyHtml,
        status: emailData.status,
        direction: "outbound",
        sentAt: emailData.sentAt,
        openCount: emailData.openCount,
        clickCount: emailData.clickCount,
        firstOpenedAt: emailData.firstOpenedAt || null,
        lastOpenedAt: emailData.lastOpenedAt || null,
        firstClickedAt: emailData.firstClickedAt || null,
        contactId: emailData.contactId || null,
        companyId: emailData.companyId || null,
        ownerId: user.id,
      },
    });

    // Create tracking events for sent emails
    if (emailData.status === "sent") {
      await prisma.emailEvent.create({
        data: {
          emailId: email.id,
          eventType: "SENT",
          createdAt: emailData.sentAt!,
        },
      });

      // Create OPENED events matching openCount
      for (let oi = 0; oi < emailData.openCount; oi++) {
        const openTime = new Date(
          (emailData.firstOpenedAt || emailData.sentAt!).getTime() + oi * 3600000
        );
        await prisma.emailEvent.create({
          data: {
            emailId: email.id,
            eventType: "OPENED",
            createdAt: openTime,
            ipAddress: `203.0.113.${42 + oi}`,
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
        });
      }

      // Create CLICKED events matching clickCount
      for (let ci = 0; ci < emailData.clickCount; ci++) {
        const clickTime = new Date(
          (emailData.firstClickedAt || emailData.sentAt!).getTime() + ci * 3600000
        );
        await prisma.emailEvent.create({
          data: {
            emailId: email.id,
            eventType: "CLICKED",
            linkUrl: "https://app.f-core.com/proposal",
            createdAt: clickTime,
            ipAddress: `203.0.113.${42 + ci}`,
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          },
        });
      }
    }
  }
  console.log("✅ Created", sampleEmails.length, "sample emails with tracking events");

  // Create sample email templates
  const templates = [
    {
      name: "Follow-up After Meeting",
      subject: "Great meeting, {{contact.firstName}}!",
      category: "follow-up",
      bodyHtml: "<p>Hi {{contact.firstName}},</p><p>Thank you for taking the time to meet today. I wanted to follow up on our discussion about {{deal.name}}.</p><p>Please let me know if you have any questions.</p><p>Best,<br/>{{sender.name}}</p>",
      bodyText: "Hi {{contact.firstName}}, Thank you for taking the time to meet today.",
    },
    {
      name: "Initial Outreach",
      subject: "Introduction from F-CORE",
      category: "sales",
      bodyHtml: "<p>Hi {{contact.firstName}},</p><p>I'm reaching out because I noticed {{company.name}} is in the {{company.industry}} space. We've helped similar companies improve their sales process by 40%.</p><p>Would you be open to a quick 15-minute call this week?</p>",
      bodyText: "Hi {{contact.firstName}}, I'm reaching out because I noticed your company...",
    },
    {
      name: "Proposal Follow-up",
      subject: "Re: {{deal.name}} - Proposal",
      category: "sales",
      bodyHtml: "<p>Hi {{contact.firstName}},</p><p>I wanted to check in on the proposal I sent over last week for {{deal.name}}. Have you had a chance to review it?</p><p>I'm happy to schedule a call to walk through any questions.</p>",
      bodyText: "Hi {{contact.firstName}}, I wanted to check in on the proposal I sent over last week.",
    },
  ];

  for (const tmpl of templates) {
    await prisma.emailTemplate.upsert({
      where: { id: `template-${tmpl.name.replace(/\s+/g, "-").toLowerCase()}` },
      update: {},
      create: {
        id: `template-${tmpl.name.replace(/\s+/g, "-").toLowerCase()}`,
        tenantId: tenant.id,
        name: tmpl.name,
        subject: tmpl.subject,
        category: tmpl.category,
        bodyHtml: tmpl.bodyHtml,
        bodyText: tmpl.bodyText,
        createdById: user.id,
        isShared: true,
      },
    });
  }
  console.log("✅ Created", templates.length, "email templates");

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
