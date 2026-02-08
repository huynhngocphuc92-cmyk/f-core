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

  // Create sample workflows
  const workflow1 = await prisma.workflowDefinition.create({
    data: {
      tenantId: tenant.id,
      name: "Welcome New Contacts",
      description: "Automatically send a welcome email when a new contact is created",
      objectType: "contact",
      status: "active",
      triggerConfig: {
        type: "record_created",
        objectType: "contact",
      },
      steps: [
        {
          id: "step_1",
          type: "send_email",
          name: "Send welcome email",
          config: { templateId: "welcome_template" },
          position: { x: 250, y: 180 },
          next: ["step_2"],
        },
        {
          id: "step_2",
          type: "delay",
          name: "Wait 3 days",
          config: { duration: 3, unit: "days" },
          position: { x: 250, y: 310 },
          next: ["step_3"],
        },
        {
          id: "step_3",
          type: "create_task",
          name: "Create follow-up task",
          config: { subject: "Follow up with new contact", priority: "medium" },
          position: { x: 250, y: 440 },
        },
      ],
      createdBy: user.id,
    },
  });

  const workflow2 = await prisma.workflowDefinition.create({
    data: {
      tenantId: tenant.id,
      name: "MQL Nurture Sequence",
      description: "Nurture contacts that reach MQL lifecycle stage",
      objectType: "contact",
      status: "draft",
      triggerConfig: {
        type: "property_change",
        objectType: "contact",
        property: "lifecycleStage",
        operator: "equals",
        value: "mql",
      },
      steps: [
        {
          id: "step_1",
          type: "send_notification",
          name: "Notify sales team",
          config: { message: "New MQL: {{contact.firstName}} {{contact.lastName}}" },
          position: { x: 250, y: 180 },
          next: ["step_2"],
        },
        {
          id: "step_2",
          type: "update_property",
          name: "Set lead status",
          config: { property: "leadStatus", value: "open" },
          position: { x: 250, y: 310 },
        },
      ],
      createdBy: user.id,
    },
  });

  const workflow3 = await prisma.workflowDefinition.create({
    data: {
      tenantId: tenant.id,
      name: "Deal Stage Automation",
      description: "Automate actions when deals change stages",
      objectType: "deal",
      status: "paused",
      triggerConfig: {
        type: "property_change",
        objectType: "deal",
        property: "stageId",
      },
      steps: [
        {
          id: "step_1",
          type: "if_then",
          name: "Check deal amount",
          config: { property: "amount", operator: "greater_than", value: 10000 },
          position: { x: 250, y: 180 },
          nextTrue: ["step_2a"],
          nextFalse: ["step_2b"],
        },
        {
          id: "step_2a",
          type: "send_notification",
          name: "Notify manager",
          config: { message: "High-value deal update" },
          position: { x: 150, y: 340 },
        },
        {
          id: "step_2b",
          type: "create_task",
          name: "Create follow-up",
          config: { subject: "Follow up on deal" },
          position: { x: 350, y: 340 },
        },
      ],
      createdBy: user.id,
    },
  });

  console.log("✅ Created 3 workflows:", workflow1.name, workflow2.name, workflow3.name);

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
