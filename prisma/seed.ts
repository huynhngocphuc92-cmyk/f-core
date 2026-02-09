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

  // Create sample forms
  const contactForm = await prisma.form.upsert({
    where: { id: "form-contact-us" },
    update: {},
    create: {
      id: "form-contact-us",
      tenantId: tenant.id,
      name: "Contact Us",
      slug: "contact-us",
      description: "Main website contact form",
      status: "published",
      publishedAt: new Date(),
      viewCount: 342,
      settings: {
        thankYouMessage: "Thank you for reaching out! We'll get back to you within 24 hours.",
        notifyEmails: ["admin@f-core.com"],
        honeypotEnabled: true,
      },
      theme: {
        submitButtonText: "Send Message",
        submitButtonColor: "#0891b2",
      },
    },
  });

  const contactFormFields = [
    { name: "first_name", label: "First Name", type: "text", required: true, width: "half", orderIndex: 0 },
    { name: "last_name", label: "Last Name", type: "text", required: true, width: "half", orderIndex: 1 },
    { name: "email", label: "Email Address", type: "email", required: true, placeholder: "you@company.com", orderIndex: 2 },
    { name: "phone", label: "Phone Number", type: "phone", required: false, orderIndex: 3 },
    { name: "company", label: "Company", type: "text", required: false, orderIndex: 4 },
    { name: "message", label: "How can we help?", type: "textarea", required: true, placeholder: "Tell us about your needs...", orderIndex: 5 },
  ];

  for (const field of contactFormFields) {
    await prisma.formField.upsert({
      where: { id: `field-contact-${field.name}` },
      update: {},
      create: {
        id: `field-contact-${field.name}`,
        formId: contactForm.id,
        ...field,
      },
    });
  }

  const newsletterForm = await prisma.form.upsert({
    where: { id: "form-newsletter" },
    update: {},
    create: {
      id: "form-newsletter",
      tenantId: tenant.id,
      name: "Newsletter Signup",
      slug: "newsletter-signup",
      description: "Email newsletter subscription form",
      status: "published",
      publishedAt: new Date(),
      viewCount: 1205,
      settings: {
        thankYouMessage: "You're subscribed! Check your inbox for a confirmation email.",
        honeypotEnabled: true,
      },
      theme: {
        submitButtonText: "Subscribe",
        submitButtonColor: "#0891b2",
      },
    },
  });

  await prisma.formField.upsert({
    where: { id: "field-newsletter-email" },
    update: {},
    create: {
      id: "field-newsletter-email",
      formId: newsletterForm.id,
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      placeholder: "Enter your email",
      orderIndex: 0,
    },
  });

  const feedbackForm = await prisma.form.upsert({
    where: { id: "form-feedback" },
    update: {},
    create: {
      id: "form-feedback",
      tenantId: tenant.id,
      name: "Product Feedback",
      slug: "product-feedback",
      description: "Collect customer feedback about our products",
      status: "draft",
      viewCount: 0,
      settings: {},
      theme: {
        submitButtonText: "Submit Feedback",
        submitButtonColor: "#0891b2",
      },
    },
  });

  const feedbackFields = [
    { name: "name", label: "Your Name", type: "text", required: true, orderIndex: 0 },
    { name: "email", label: "Email", type: "email", required: true, orderIndex: 1 },
    {
      name: "rating",
      label: "How would you rate our product?",
      type: "radio",
      required: true,
      orderIndex: 2,
      options: [
        { value: "5", label: "Excellent" },
        { value: "4", label: "Good" },
        { value: "3", label: "Average" },
        { value: "2", label: "Below Average" },
        { value: "1", label: "Poor" },
      ],
    },
    { name: "feedback", label: "Your Feedback", type: "textarea", required: false, placeholder: "Tell us what you think...", orderIndex: 3 },
  ];

  for (const field of feedbackFields) {
    await prisma.formField.upsert({
      where: { id: `field-feedback-${field.name}` },
      update: {},
      create: {
        id: `field-feedback-${field.name}`,
        formId: feedbackForm.id,
        ...field,
      },
    });
  }

  // Create sample submissions for contact form
  const sampleSubmissions = [
    { data: { first_name: "Sarah", last_name: "Connor", email: "sarah@skynet.com", message: "Interested in your CRM solution" }, submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { data: { first_name: "Michael", last_name: "Scott", email: "michael@dundermifflin.com", phone: "+15551234567", company: "Dunder Mifflin", message: "Need a demo for my team of 50" }, submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { data: { first_name: "Tony", last_name: "Stark", email: "tony@stark.com", company: "Stark Industries", message: "Looking for enterprise pricing" }, submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  ];

  for (let i = 0; i < sampleSubmissions.length; i++) {
    await prisma.formSubmission.upsert({
      where: { id: `submission-${i + 1}` },
      update: {},
      create: {
        id: `submission-${i + 1}`,
        formId: contactForm.id,
        tenantId: tenant.id,
        data: sampleSubmissions[i].data,
        submittedAt: sampleSubmissions[i].submittedAt,
        metadata: { referrer: "https://f-core.com", userAgent: "Mozilla/5.0" },
      },
    });
  }

  console.log("✅ Created 3 forms with fields and submissions");

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
