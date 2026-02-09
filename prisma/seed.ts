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

  // ============================================
  // TICKETING SYSTEM SEED DATA
  // ============================================

  // Create ticket pipeline with stages
  const ticketPipeline = await prisma.ticketPipeline.upsert({
    where: { id: "ticket-pipeline-default" },
    update: {},
    create: {
      id: "ticket-pipeline-default",
      name: "Support Pipeline",
      description: "Default support ticket pipeline",
      isDefault: true,
      tenantId: tenant.id,
    },
  });

  const ticketStages = [
    { name: "New", displayOrder: 0, type: "open", color: "#3B82F6" },
    { name: "Waiting on contact", displayOrder: 1, type: "waiting", color: "#F59E0B" },
    { name: "Waiting on us", displayOrder: 2, type: "in_progress", color: "#8B5CF6" },
    { name: "Resolved", displayOrder: 3, type: "resolved", color: "#10B981" },
    { name: "Closed", displayOrder: 4, type: "closed", color: "#6B7280" },
  ];

  const createdTicketStages: string[] = [];
  for (let i = 0; i < ticketStages.length; i++) {
    const stage = await prisma.ticketPipelineStage.upsert({
      where: { id: `ticket-stage-${i + 1}` },
      update: {},
      create: {
        id: `ticket-stage-${i + 1}`,
        pipelineId: ticketPipeline.id,
        ...ticketStages[i],
      },
    });
    createdTicketStages.push(stage.id);
  }
  console.log("✅ Created ticket pipeline with", ticketStages.length, "stages");

  // Create SLA policies
  const slaPolicies = [
    { name: "Urgent Support", priority: "urgent", firstResponseTime: 30, nextResponseTime: 30, resolutionTime: 240 },
    { name: "High Priority", priority: "high", firstResponseTime: 60, nextResponseTime: 120, resolutionTime: 480 },
    { name: "Medium Priority", priority: "medium", firstResponseTime: 240, nextResponseTime: 480, resolutionTime: 1440 },
    { name: "Low Priority", priority: "low", firstResponseTime: 480, nextResponseTime: 1440, resolutionTime: 4320 },
  ];

  const createdSLAs: string[] = [];
  for (const sla of slaPolicies) {
    const created = await prisma.ticketSLAPolicy.upsert({
      where: {
        tenantId_priority: { tenantId: tenant.id, priority: sla.priority },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...sla,
      },
    });
    createdSLAs.push(created.id);
  }
  console.log("✅ Created", slaPolicies.length, "SLA policies");

  // Create ticket counter
  await prisma.ticketCounter.upsert({
    where: { tenantId: tenant.id },
    update: { lastNumber: 6 },
    create: {
      tenantId: tenant.id,
      lastNumber: 6,
    },
  });

  // Create sample tickets
  const sampleTickets = [
    {
      ticketNumber: 1,
      title: "Cannot login to dashboard",
      description: "I'm getting a 403 error when trying to access the dashboard after login.",
      priority: "urgent",
      status: "in_progress",
      category: "bug",
      source: "email",
      contactId: `contact-${contacts[0].email}`,
      companyId: `company-${companies[0].domain}`,
      stageId: createdTicketStages[2], // Waiting on us
      slaId: createdSLAs[0], // Urgent SLA
    },
    {
      ticketNumber: 2,
      title: "Feature request: Export to CSV",
      description: "Would love to be able to export my contacts list to CSV format for offline analysis.",
      priority: "low",
      status: "open",
      category: "feature_request",
      source: "web",
      contactId: `contact-${contacts[1].email}`,
      companyId: `company-${companies[0].domain}`,
      stageId: createdTicketStages[0], // New
      slaId: createdSLAs[3], // Low SLA
    },
    {
      ticketNumber: 3,
      title: "Billing discrepancy on last invoice",
      description: "Our last invoice shows charges for 50 users but we only have 35 active users.",
      priority: "high",
      status: "waiting",
      category: "billing",
      source: "phone",
      contactId: `contact-${contacts[3].email}`,
      companyId: `company-${companies[2].domain}`,
      stageId: createdTicketStages[1], // Waiting on contact
      slaId: createdSLAs[1], // High SLA
      firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      ticketNumber: 4,
      title: "How to set up email integration?",
      description: "I need help configuring the email integration with our Gmail workspace.",
      priority: "medium",
      status: "resolved",
      category: "question",
      source: "chat",
      contactId: `contact-${contacts[2].email}`,
      companyId: `company-${companies[1].domain}`,
      stageId: createdTicketStages[3], // Resolved
      slaId: createdSLAs[2], // Medium SLA
      firstResponseAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      ticketNumber: 5,
      title: "API rate limiting errors",
      description: "We're hitting rate limits on the API when syncing contacts. Need higher limits or guidance on batching.",
      priority: "high",
      status: "in_progress",
      category: "bug",
      source: "api",
      contactId: `contact-${contacts[4].email}`,
      companyId: `company-${companies[3].domain}`,
      stageId: createdTicketStages[2], // Waiting on us
      slaId: createdSLAs[1], // High SLA
    },
    {
      ticketNumber: 6,
      title: "Onboarding assistance needed",
      description: "New customer needs help getting started with the platform. Requested a walkthrough session.",
      priority: "medium",
      status: "closed",
      category: "question",
      source: "web",
      contactId: `contact-${contacts[1].email}`,
      stageId: createdTicketStages[4], // Closed
      slaId: createdSLAs[2], // Medium SLA
      firstResponseAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const ticket of sampleTickets) {
    await prisma.ticket.upsert({
      where: {
        tenantId_ticketNumber: { tenantId: tenant.id, ticketNumber: ticket.ticketNumber },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        assignedToUserId: user.id,
        createdById: user.id,
        pipelineId: ticketPipeline.id,
        ...ticket,
      },
    });
  }
  console.log("✅ Created", sampleTickets.length, "tickets");

  // Create sample ticket comments
  const ticketForComments = await prisma.ticket.findFirst({
    where: { tenantId: tenant.id, ticketNumber: 1 },
  });

  if (ticketForComments) {
    const ticketComments = [
      { content: "I've been unable to log in since this morning. Getting a 403 Forbidden error on /dashboard.", isInternal: false },
      { content: "Checked the auth logs - looks like the user's session token expired and isn't being refreshed. Investigating the token refresh flow.", isInternal: true },
      { content: "We've identified the issue with your login. A fix is being deployed now. Can you try clearing your browser cache and logging in again?", isInternal: false },
    ];

    for (const comment of ticketComments) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticketForComments.id,
          authorId: user.id,
          ...comment,
        },
      });
    }
    console.log("✅ Created", ticketComments.length, "ticket comments");

    // Create ticket activity entries
    const ticketActivities = [
      { type: "created", description: "Ticket created", metadata: {} },
      { type: "assignment_change", field: "assignedToUserId", oldValue: null, newValue: user.id, description: `Assigned to ${user.name}` },
      { type: "stage_change", field: "stageId", oldValue: createdTicketStages[0], newValue: createdTicketStages[2], description: "Stage changed from New to Waiting on us" },
      { type: "comment_added", description: "Public comment added" },
    ];

    for (const activity of ticketActivities) {
      await prisma.ticketActivity.create({
        data: {
          ticketId: ticketForComments.id,
          tenantId: tenant.id,
          performedById: user.id,
          ...activity,
        },
      });
    }
    console.log("✅ Created", ticketActivities.length, "ticket activities");
  }

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
