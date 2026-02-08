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

  // Create email marketing templates
  const templates = [
    {
      id: "template-welcome",
      name: "Welcome Email",
      subject: "Welcome to {{company_name}}!",
      previewText: "We're thrilled to have you on board",
      category: "welcome",
      isSystem: true,
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:Inter,sans-serif;"><h1 style="color:#0891b2;">Welcome!</h1><p>Hi {{first_name}},</p><p>Thank you for joining us. We're excited to help you grow your business.</p><a href="#" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#fff;text-decoration:none;border-radius:6px;">Get Started</a></div>`,
      jsonContent: { blocks: [{ type: "heading", content: "Welcome!" }, { type: "text", content: "Hi {{first_name}}, Thank you for joining us." }, { type: "button", content: "Get Started", url: "#" }] },
    },
    {
      id: "template-newsletter",
      name: "Monthly Newsletter",
      subject: "{{company_name}} Monthly Update - {{month}}",
      previewText: "Your monthly digest of news and updates",
      category: "newsletter",
      isSystem: true,
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:Inter,sans-serif;"><h1 style="color:#0891b2;">Monthly Newsletter</h1><p>Hi {{first_name}},</p><p>Here's what's new this month:</p><ul><li>Feature update: New dashboard</li><li>Blog: Best practices guide</li><li>Event: Upcoming webinar</li></ul></div>`,
      jsonContent: { blocks: [{ type: "heading", content: "Monthly Newsletter" }, { type: "text", content: "Here's what's new this month:" }, { type: "list", items: ["Feature update", "Blog post", "Upcoming event"] }] },
    },
    {
      id: "template-promo",
      name: "Product Update",
      subject: "Exciting news from {{company_name}}",
      previewText: "Check out our latest features",
      category: "promotional",
      isSystem: true,
      htmlContent: `<div style="max-width:600px;margin:0 auto;font-family:Inter,sans-serif;"><h1 style="color:#0891b2;">New Features</h1><p>Hi {{first_name}},</p><p>We've been working hard on new features to help you succeed.</p><a href="#" style="display:inline-block;padding:12px 24px;background:#0891b2;color:#fff;text-decoration:none;border-radius:6px;">Learn More</a></div>`,
      jsonContent: { blocks: [{ type: "heading", content: "New Features" }, { type: "text", content: "We've been working hard on new features." }, { type: "button", content: "Learn More", url: "#" }] },
    },
  ];

  for (const tpl of templates) {
    await prisma.emailMarketingTemplate.upsert({
      where: { id: tpl.id },
      update: {},
      create: { ...tpl, tenantId: tenant.id },
    });
  }
  console.log("✅ Created", templates.length, "email templates");

  // Create contact lists
  const allContactIds = contacts.map((c) => `contact-${c.email}`);

  const allContactsList = await prisma.contactList.upsert({
    where: { id: "list-all-contacts" },
    update: {},
    create: {
      id: "list-all-contacts",
      tenantId: tenant.id,
      name: "All Contacts",
      description: "All contacts in the CRM",
      memberCount: allContactIds.length,
    },
  });

  const leadslist = await prisma.contactList.upsert({
    where: { id: "list-leads-mqls" },
    update: {},
    create: {
      id: "list-leads-mqls",
      tenantId: tenant.id,
      name: "Leads & MQLs",
      description: "Contacts in lead or MQL lifecycle stage",
      memberCount: 2,
    },
  });

  // Add members to lists
  for (const contactId of allContactIds) {
    await prisma.contactListMember.upsert({
      where: { listId_contactId: { listId: allContactsList.id, contactId } },
      update: {},
      create: { listId: allContactsList.id, contactId },
    });
  }

  const leadContactIds = allContactIds.filter((id) =>
    ["contact-john@example.com", "contact-jane@techcorp.com"].includes(id)
  );
  for (const contactId of leadContactIds) {
    await prisma.contactListMember.upsert({
      where: { listId_contactId: { listId: leadslist.id, contactId } },
      update: {},
      create: { listId: leadslist.id, contactId },
    });
  }
  console.log("✅ Created 2 contact lists");

  // Create email campaigns
  const campaigns = [
    {
      id: "campaign-welcome",
      name: "Welcome Series - Feb 2026",
      description: "Automated welcome email for new contacts",
      templateId: "template-welcome",
      subject: "Welcome to F-CORE!",
      fromName: "F-CORE Team",
      fromEmail: "hello@f-core.com",
      listId: allContactsList.id,
      status: "sent",
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      totalRecipients: 5,
      totalSent: 5,
      totalDelivered: 5,
      totalOpened: 3,
      totalClicked: 2,
    },
    {
      id: "campaign-newsletter",
      name: "February Newsletter",
      description: "Monthly newsletter for February 2026",
      templateId: "template-newsletter",
      subject: "F-CORE Monthly Update - February",
      fromName: "F-CORE Newsletter",
      fromEmail: "newsletter@f-core.com",
      listId: allContactsList.id,
      status: "draft",
    },
  ];

  for (const camp of campaigns) {
    await prisma.emailCampaign.upsert({
      where: { id: camp.id },
      update: {},
      create: { ...camp, tenantId: tenant.id },
    });
  }
  console.log("✅ Created", campaigns.length, "email campaigns");

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
