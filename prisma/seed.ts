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

  // Create sample contacts with diverse lifecycle stages
  const contacts = [
    { firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+1-555-0101", lifecycleStage: "lead", jobTitle: "Marketing Manager" },
    { firstName: "Jane", lastName: "Smith", email: "jane@techcorp.com", phone: "+1-555-0102", lifecycleStage: "mql", jobTitle: "Sales Director" },
    { firstName: "Bob", lastName: "Johnson", email: "bob@startup.io", phone: "+1-555-0103", lifecycleStage: "sql", jobTitle: "VP of Sales" },
    { firstName: "Alice", lastName: "Williams", email: "alice@enterprise.com", phone: "+1-555-0104", lifecycleStage: "customer", jobTitle: "CEO" },
    { firstName: "Charlie", lastName: "Brown", email: "charlie@agency.co", phone: "+1-555-0105", lifecycleStage: "opportunity", jobTitle: "CTO" },
    { firstName: "Sarah", lastName: "Davis", email: "sarah@startup.com", phone: "+1-555-0106", lifecycleStage: "subscriber", jobTitle: "Product Manager" },
    { firstName: "Michael", lastName: "Garcia", email: "michael@corp.com", phone: "+1-555-0107", lifecycleStage: "evangelist", jobTitle: "Head of Engineering" },
    { firstName: "Emily", lastName: "Martinez", email: "emily@tech.io", phone: "+1-555-0108", lifecycleStage: "lead", jobTitle: "Designer" },
    { firstName: "David", lastName: "Rodriguez", email: "david@agency.com", phone: "+1-555-0109", lifecycleStage: "mql", jobTitle: "Developer" },
    { firstName: "Lisa", lastName: "Lopez", email: "lisa@enterprise.co", phone: "+1-555-0110", lifecycleStage: "sql", jobTitle: "CFO" },
    { firstName: "James", lastName: "Wilson", email: "james@business.com", phone: "+1-555-0111", lifecycleStage: "customer", jobTitle: "COO" },
    { firstName: "Jennifer", lastName: "Anderson", email: "jennifer@startup.net", phone: "+1-555-0112", lifecycleStage: "opportunity", jobTitle: "Founder" },
    { firstName: "Robert", lastName: "Taylor", email: "robert@tech.com", phone: "+1-555-0113", lifecycleStage: "subscriber", jobTitle: "Engineer" },
    { firstName: "Mary", lastName: "Thomas", email: "mary@corp.io", phone: "+1-555-0114", lifecycleStage: "lead", jobTitle: "Analyst" },
    { firstName: "Christopher", lastName: "Moore", email: "chris@company.com", phone: "+1-555-0115", lifecycleStage: "evangelist", jobTitle: "Director" },
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

  // Create default property definitions
  const propertyDefs = [
    // Contact properties - About
    { objectType: "contact", name: "first_name", label: "First Name", fieldType: "text", groupName: "About", orderIndex: 0, isSystem: true, isRequired: true },
    { objectType: "contact", name: "last_name", label: "Last Name", fieldType: "text", groupName: "About", orderIndex: 1, isSystem: true, isRequired: true },
    { objectType: "contact", name: "email", label: "Email", fieldType: "email", groupName: "About", orderIndex: 2, isSystem: true },
    { objectType: "contact", name: "phone", label: "Phone Number", fieldType: "phone", groupName: "About", orderIndex: 3, isSystem: true },
    { objectType: "contact", name: "job_title", label: "Job Title", fieldType: "text", groupName: "About", orderIndex: 4, isSystem: true },
    { objectType: "contact", name: "lifecycle_stage", label: "Lifecycle Stage", fieldType: "select", groupName: "About", orderIndex: 5, isSystem: true, options: [
      { value: "subscriber", label: "Subscriber" },
      { value: "lead", label: "Lead" },
      { value: "mql", label: "Marketing Qualified Lead" },
      { value: "sql", label: "Sales Qualified Lead" },
      { value: "opportunity", label: "Opportunity" },
      { value: "customer", label: "Customer" },
      { value: "evangelist", label: "Evangelist" },
    ]},
    { objectType: "contact", name: "lead_status", label: "Lead Status", fieldType: "select", groupName: "About", orderIndex: 6, isSystem: true, options: [
      { value: "new", label: "New" },
      { value: "open", label: "Open" },
      { value: "in_progress", label: "In Progress" },
      { value: "qualified", label: "Qualified" },
      { value: "unqualified", label: "Unqualified" },
    ]},
    // Contact properties - Contact Information
    { objectType: "contact", name: "mobile_phone", label: "Mobile Phone", fieldType: "phone", groupName: "Contact Information", orderIndex: 0, isSystem: true },
    { objectType: "contact", name: "website", label: "Website", fieldType: "url", groupName: "Contact Information", orderIndex: 1, isSystem: true },
    { objectType: "contact", name: "linkedin_url", label: "LinkedIn", fieldType: "url", groupName: "Contact Information", orderIndex: 2, isSystem: true },
    { objectType: "contact", name: "twitter_handle", label: "Twitter", fieldType: "text", groupName: "Contact Information", orderIndex: 3, isSystem: true },
    // Contact properties - Address
    { objectType: "contact", name: "address", label: "Street Address", fieldType: "text", groupName: "Address", orderIndex: 0, isSystem: true },
    { objectType: "contact", name: "city", label: "City", fieldType: "text", groupName: "Address", orderIndex: 1, isSystem: true },
    { objectType: "contact", name: "state", label: "State/Region", fieldType: "text", groupName: "Address", orderIndex: 2, isSystem: true },
    { objectType: "contact", name: "country", label: "Country", fieldType: "text", groupName: "Address", orderIndex: 3, isSystem: true },
    { objectType: "contact", name: "postal_code", label: "Postal Code", fieldType: "text", groupName: "Address", orderIndex: 4, isSystem: true },

    // Company properties - About
    { objectType: "company", name: "name", label: "Company Name", fieldType: "text", groupName: "About", orderIndex: 0, isSystem: true, isRequired: true },
    { objectType: "company", name: "domain", label: "Domain", fieldType: "url", groupName: "About", orderIndex: 1, isSystem: true },
    { objectType: "company", name: "industry", label: "Industry", fieldType: "select", groupName: "About", orderIndex: 2, isSystem: true, options: [
      { value: "technology", label: "Technology" },
      { value: "software", label: "Software" },
      { value: "consulting", label: "Consulting" },
      { value: "marketing", label: "Marketing" },
      { value: "finance", label: "Finance" },
      { value: "healthcare", label: "Healthcare" },
      { value: "education", label: "Education" },
      { value: "retail", label: "Retail" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "other", label: "Other" },
    ]},
    { objectType: "company", name: "size", label: "Company Size", fieldType: "select", groupName: "About", orderIndex: 3, isSystem: true, options: [
      { value: "1-10", label: "1-10" },
      { value: "11-50", label: "11-50" },
      { value: "51-200", label: "51-200" },
      { value: "201-500", label: "201-500" },
      { value: "501-1000", label: "501-1000" },
      { value: "1001-5000", label: "1001-5000" },
      { value: "5001+", label: "5001+" },
    ]},
    { objectType: "company", name: "type", label: "Company Type", fieldType: "select", groupName: "About", orderIndex: 4, isSystem: true, options: [
      { value: "prospect", label: "Prospect" },
      { value: "partner", label: "Partner" },
      { value: "reseller", label: "Reseller" },
      { value: "vendor", label: "Vendor" },
      { value: "other", label: "Other" },
    ]},
    { objectType: "company", name: "annual_revenue", label: "Annual Revenue", fieldType: "number", groupName: "About", orderIndex: 5, isSystem: true },
    { objectType: "company", name: "description", label: "Description", fieldType: "text", groupName: "About", orderIndex: 6, isSystem: true },
    // Company properties - Contact Info
    { objectType: "company", name: "phone", label: "Phone", fieldType: "phone", groupName: "Contact Information", orderIndex: 0, isSystem: true },
    { objectType: "company", name: "website", label: "Website", fieldType: "url", groupName: "Contact Information", orderIndex: 1, isSystem: true },
    { objectType: "company", name: "linkedin_url", label: "LinkedIn", fieldType: "url", groupName: "Contact Information", orderIndex: 2, isSystem: true },

    // Deal properties - About
    { objectType: "deal", name: "name", label: "Deal Name", fieldType: "text", groupName: "About", orderIndex: 0, isSystem: true, isRequired: true },
    { objectType: "deal", name: "amount", label: "Amount", fieldType: "number", groupName: "About", orderIndex: 1, isSystem: true },
    { objectType: "deal", name: "close_date", label: "Close Date", fieldType: "date", groupName: "About", orderIndex: 2, isSystem: true },
    { objectType: "deal", name: "deal_type", label: "Deal Type", fieldType: "select", groupName: "About", orderIndex: 3, isSystem: true, options: [
      { value: "newbusiness", label: "New Business" },
      { value: "existingbusiness", label: "Existing Business" },
    ]},
    { objectType: "deal", name: "priority", label: "Priority", fieldType: "select", groupName: "About", orderIndex: 4, isSystem: true, options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
    ]},
    { objectType: "deal", name: "description", label: "Description", fieldType: "text", groupName: "About", orderIndex: 5, isSystem: true },
  ];

  for (const prop of propertyDefs) {
    await prisma.propertyDefinition.upsert({
      where: {
        tenantId_objectType_name: {
          tenantId: tenant.id,
          objectType: prop.objectType,
          name: prop.name,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...prop,
      },
    });
  }
  console.log("✅ Created", propertyDefs.length, "property definitions");

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
