import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:123456@localhost:5432/hubspot_clone?schema=public",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create tenant - use existing if found, otherwise create new
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

  // ============================================
  // Knowledge Base - Categories & Articles
  // ============================================

  // Root categories
  const kbCatGettingStarted = await prisma.kBCategory.upsert({
    where: { id: "kb-cat-getting-started" },
    update: {},
    create: {
      id: "kb-cat-getting-started",
      tenantId: tenant.id,
      name: "Getting Started",
      slug: "getting-started",
      description: "Learn the basics of F-CORE CRM and get up and running quickly.",
      icon: "rocket",
      orderIndex: 0,
    },
  });

  const kbCatAccountBilling = await prisma.kBCategory.upsert({
    where: { id: "kb-cat-account-billing" },
    update: {},
    create: {
      id: "kb-cat-account-billing",
      tenantId: tenant.id,
      name: "Account & Billing",
      slug: "account-billing",
      description: "Manage your account settings, billing information, and subscription plans.",
      icon: "credit-card",
      orderIndex: 1,
    },
  });

  const kbCatTroubleshooting = await prisma.kBCategory.upsert({
    where: { id: "kb-cat-troubleshooting" },
    update: {},
    create: {
      id: "kb-cat-troubleshooting",
      tenantId: tenant.id,
      name: "Troubleshooting",
      slug: "troubleshooting",
      description: "Find solutions to common issues and learn how to resolve problems.",
      icon: "wrench",
      orderIndex: 2,
    },
  });

  // Sub-categories under "Getting Started"
  const kbCatQuickStart = await prisma.kBCategory.upsert({
    where: { id: "kb-cat-quick-start" },
    update: {},
    create: {
      id: "kb-cat-quick-start",
      tenantId: tenant.id,
      name: "Quick Start Guide",
      slug: "quick-start-guide",
      description: "Step-by-step guide to set up your CRM in under 10 minutes.",
      icon: "zap",
      parentId: kbCatGettingStarted.id,
      orderIndex: 0,
    },
  });

  const kbCatFaq = await prisma.kBCategory.upsert({
    where: { id: "kb-cat-faq" },
    update: {},
    create: {
      id: "kb-cat-faq",
      tenantId: tenant.id,
      name: "FAQ",
      slug: "faq",
      description: "Frequently asked questions about F-CORE CRM.",
      icon: "help-circle",
      parentId: kbCatGettingStarted.id,
      orderIndex: 1,
    },
  });

  console.log("✅ Created 5 KB categories (3 root + 2 sub)");

  // Articles
  // Article 1 - Published (Quick Start)
  const kbArticle1 = await prisma.kBArticle.upsert({
    where: { id: "kb-article-1" },
    update: {},
    create: {
      id: "kb-article-1",
      tenantId: tenant.id,
      title: "How to Set Up Your CRM in 5 Minutes",
      slug: "setup-crm-5-minutes",
      subtitle: "A quick walkthrough for new users",
      excerpt: "Get your F-CORE CRM up and running in just 5 minutes. This guide covers initial setup, importing contacts, and creating your first deal pipeline.",
      contentHtml: `<h2>Welcome to F-CORE CRM</h2>
<p>Setting up your CRM doesn't have to be complicated. Follow these simple steps to get started:</p>
<h3>Step 1: Create Your Workspace</h3>
<p>After signing up, you'll be prompted to create your first workspace. Enter your company name and invite your team members.</p>
<h3>Step 2: Import Your Contacts</h3>
<p>Navigate to <strong>Contacts > Import</strong> and upload your CSV file. F-CORE will automatically map common fields like name, email, and phone number.</p>
<h3>Step 3: Set Up Your Pipeline</h3>
<p>Go to <strong>Deals > Pipeline Settings</strong> to customize your sales stages. We provide a default pipeline that works for most businesses.</p>
<h3>Step 4: Connect Your Email</h3>
<p>Link your email account to automatically log communications with contacts. Support for Gmail, Outlook, and custom IMAP.</p>
<h3>Step 5: Start Tracking Deals</h3>
<p>Create your first deal by clicking the <strong>+ New Deal</strong> button. Assign it to a contact and move it through your pipeline.</p>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatQuickStart.id,
      tags: ["setup", "getting-started", "onboarding"],
      status: "published",
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      metaTitle: "Set Up F-CORE CRM in 5 Minutes | Quick Start Guide",
      metaDescription: "Learn how to set up F-CORE CRM quickly. Import contacts, create pipelines, and start closing deals in just 5 minutes.",
      viewCount: 1247,
      helpfulCount: 89,
      notHelpfulCount: 5,
    },
  });

  // Article 2 - Published (FAQ)
  const kbArticle2 = await prisma.kBArticle.upsert({
    where: { id: "kb-article-2" },
    update: {},
    create: {
      id: "kb-article-2",
      tenantId: tenant.id,
      title: "Frequently Asked Questions About F-CORE CRM",
      slug: "frequently-asked-questions",
      subtitle: "Answers to the most common questions",
      excerpt: "Find answers to frequently asked questions about F-CORE CRM, including pricing, features, integrations, and data security.",
      contentHtml: `<h2>General Questions</h2>
<h3>What is F-CORE CRM?</h3>
<p>F-CORE CRM is an all-in-one customer relationship management platform designed for growing businesses. It combines sales, marketing, and service tools in a single interface.</p>
<h3>Is there a free plan?</h3>
<p>Yes! Our free plan includes up to 1,000 contacts, basic pipeline management, and email integration. No credit card required.</p>
<h3>Can I import data from other CRMs?</h3>
<p>Absolutely. We support direct imports from Salesforce, HubSpot, Pipedrive, and any CSV-based export. Our migration team can also assist with complex data transfers.</p>
<h2>Security & Privacy</h2>
<h3>Is my data secure?</h3>
<p>We use AES-256 encryption at rest and TLS 1.3 in transit. All data is stored in SOC 2 Type II certified data centers. We also support SSO via SAML 2.0.</p>
<h3>Do you comply with GDPR?</h3>
<p>Yes. F-CORE is fully GDPR compliant. We provide tools for data export, deletion requests, and consent management.</p>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatFaq.id,
      tags: ["faq", "pricing", "security", "features"],
      status: "published",
      publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      metaTitle: "FAQ - F-CORE CRM | Common Questions Answered",
      metaDescription: "Get answers to frequently asked questions about F-CORE CRM pricing, features, security, and integrations.",
      viewCount: 856,
      helpfulCount: 62,
      notHelpfulCount: 8,
    },
  });

  // Article 3 - Published (Account & Billing)
  const kbArticle3 = await prisma.kBArticle.upsert({
    where: { id: "kb-article-3" },
    update: {},
    create: {
      id: "kb-article-3",
      tenantId: tenant.id,
      title: "How to Upgrade Your Subscription Plan",
      slug: "upgrade-subscription-plan",
      subtitle: "Step-by-step billing guide",
      excerpt: "Learn how to upgrade your F-CORE CRM subscription from Free to Starter, Professional, or Enterprise. Understand what each plan includes.",
      contentHtml: `<h2>Upgrading Your Plan</h2>
<p>F-CORE offers four plans: <strong>Free</strong>, <strong>Starter ($29/mo)</strong>, <strong>Professional ($79/mo)</strong>, and <strong>Enterprise (custom pricing)</strong>.</p>
<h3>How to Upgrade</h3>
<ol>
<li>Navigate to <strong>Settings > Account & Billing</strong></li>
<li>Click <strong>Upgrade Plan</strong></li>
<li>Select your desired plan and billing period (monthly or annual)</li>
<li>Enter your payment information</li>
<li>Confirm your upgrade</li>
</ol>
<h3>What Happens When You Upgrade?</h3>
<p>Your new features are activated immediately. You'll be prorated for the remainder of your current billing cycle.</p>
<h3>Can I Downgrade?</h3>
<p>Yes, you can downgrade at any time. The change will take effect at the end of your current billing period. Your data is preserved during downgrades.</p>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatAccountBilling.id,
      tags: ["billing", "upgrade", "subscription", "pricing"],
      status: "published",
      publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      metaTitle: "Upgrade Your Plan | F-CORE CRM Billing",
      metaDescription: "Step-by-step guide to upgrading your F-CORE CRM subscription plan. Compare features and pricing.",
      viewCount: 432,
      helpfulCount: 35,
      notHelpfulCount: 3,
    },
  });

  // Article 4 - Draft (Troubleshooting)
  await prisma.kBArticle.upsert({
    where: { id: "kb-article-4" },
    update: {},
    create: {
      id: "kb-article-4",
      tenantId: tenant.id,
      title: "Fixing Email Sync Issues",
      slug: "fixing-email-sync-issues",
      subtitle: "Troubleshoot common email integration problems",
      excerpt: "Having trouble with email sync? This guide covers the most common issues and their solutions, including OAuth token expiration and IMAP configuration.",
      contentHtml: `<h2>Common Email Sync Issues</h2>
<h3>1. Emails Not Appearing in CRM</h3>
<p>If your emails are not syncing to F-CORE, try the following steps:</p>
<ul>
<li>Check that your email connection is still active in Settings > Integrations</li>
<li>Reconnect your email account by clicking Disconnect then Connect again</li>
<li>Ensure you have not exceeded your email sync quota for your plan</li>
</ul>
<h3>2. OAuth Token Expired</h3>
<p>Gmail and Outlook connections use OAuth tokens that may expire. To resolve, simply reconnect your email account.</p>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatTroubleshooting.id,
      tags: ["email", "sync", "troubleshooting", "integration"],
      status: "draft",
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
  });

  // Article 5 - Draft (Getting Started)
  await prisma.kBArticle.upsert({
    where: { id: "kb-article-5" },
    update: {},
    create: {
      id: "kb-article-5",
      tenantId: tenant.id,
      title: "Understanding Contact Lifecycle Stages",
      slug: "understanding-contact-lifecycle-stages",
      subtitle: "How to track contacts from lead to customer",
      excerpt: "Learn about F-CORE's lifecycle stages: Subscriber, Lead, MQL, SQL, Opportunity, Customer, and Evangelist. Understand how to use them to track your sales funnel.",
      contentHtml: `<h2>What Are Lifecycle Stages?</h2>
<p>Lifecycle stages help you track where each contact is in your sales and marketing funnel. F-CORE provides seven default stages:</p>
<ul>
<li><strong>Subscriber</strong> - Signed up for content (newsletter, blog)</li>
<li><strong>Lead</strong> - Showed interest beyond subscribing</li>
<li><strong>MQL (Marketing Qualified Lead)</strong> - Met marketing criteria</li>
<li><strong>SQL (Sales Qualified Lead)</strong> - Accepted by sales team</li>
<li><strong>Opportunity</strong> - Associated with an active deal</li>
<li><strong>Customer</strong> - Closed won deal</li>
<li><strong>Evangelist</strong> - Active promoter of your product</li>
</ul>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatGettingStarted.id,
      tags: ["contacts", "lifecycle", "sales-funnel", "getting-started"],
      status: "draft",
      viewCount: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
    },
  });

  // Article 6 - Archived (Account & Billing)
  await prisma.kBArticle.upsert({
    where: { id: "kb-article-6" },
    update: {},
    create: {
      id: "kb-article-6",
      tenantId: tenant.id,
      title: "Legacy Billing System Migration Guide",
      slug: "legacy-billing-migration",
      subtitle: "For customers on the old billing system",
      excerpt: "This guide is for customers who were on our legacy billing system prior to January 2025. Learn how to migrate to the new billing platform.",
      contentHtml: `<h2>Legacy Billing Migration</h2>
<p>If you signed up before January 2025, you may still be on our legacy billing system. We've since upgraded to a new platform with better features.</p>
<h3>How to Migrate</h3>
<p>Contact our support team at <strong>billing@f-core.com</strong> to schedule your migration. The process takes approximately 24 hours and requires no downtime.</p>
<p><em>Note: This article has been archived as the migration period has ended.</em></p>`,
      contentJson: { version: 1, blocks: [] },
      categoryId: kbCatAccountBilling.id,
      tags: ["billing", "migration", "legacy"],
      status: "archived",
      publishedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      viewCount: 156,
      helpfulCount: 12,
      notHelpfulCount: 2,
    },
  });

  console.log("✅ Created 6 KB articles (3 published, 2 draft, 1 archived)");

  // Feedback on published articles
  const feedbackEntries = [
    { articleId: kbArticle1.id, isHelpful: true, comment: "Very clear and easy to follow! Had my CRM set up in no time.", visitorId: "visitor-001" },
    { articleId: kbArticle1.id, isHelpful: true, comment: null, visitorId: "visitor-002" },
    { articleId: kbArticle1.id, isHelpful: true, comment: "The step about importing contacts was exactly what I needed.", visitorId: "visitor-003" },
    { articleId: kbArticle1.id, isHelpful: false, comment: "Would be nice to have a video walkthrough as well.", visitorId: "visitor-004" },
    { articleId: kbArticle2.id, isHelpful: true, comment: "Answered all my questions about security compliance.", visitorId: "visitor-001" },
    { articleId: kbArticle2.id, isHelpful: true, comment: null, visitorId: "visitor-005" },
    { articleId: kbArticle2.id, isHelpful: false, comment: "Missing information about API rate limits.", visitorId: "visitor-006" },
    { articleId: kbArticle3.id, isHelpful: true, comment: "Upgrading was painless. Thanks for the clear instructions!", visitorId: "visitor-002" },
    { articleId: kbArticle3.id, isHelpful: true, comment: null, visitorId: "visitor-007" },
  ];

  for (let i = 0; i < feedbackEntries.length; i++) {
    await prisma.kBArticleFeedback.upsert({
      where: { id: `kb-feedback-${i + 1}` },
      update: {},
      create: {
        id: `kb-feedback-${i + 1}`,
        tenantId: tenant.id,
        articleId: feedbackEntries[i].articleId,
        isHelpful: feedbackEntries[i].isHelpful,
        comment: feedbackEntries[i].comment,
        visitorId: feedbackEntries[i].visitorId,
        ipAddress: `192.168.1.${10 + i}`,
      },
    });
  }

  console.log("✅ Created 9 KB feedback entries on published articles");

  // ============================================
  // Custom Reports & Dashboards
  // ============================================

  const report1 = await prisma.report.upsert({
    where: { id: "report-deals-by-stage" },
    update: {},
    create: {
      id: "report-deals-by-stage",
      tenantId: tenant.id,
      name: "Deals by Stage",
      description: "Shows the number of deals in each pipeline stage",
      category: "sales",
      isFavorite: true,
      runCount: 24,
      lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      definition: {
        dataSource: "deals",
        metrics: [{ field: "*", aggregate: "count", label: "Deal Count" }],
        dimensions: [{ field: "closedReason", type: "categorical", label: "Stage" }],
        filters: [],
        chart: { chartType: "bar", showLegend: false, showGrid: true },
      },
    },
  });

  const report2 = await prisma.report.upsert({
    where: { id: "report-revenue-over-time" },
    update: {},
    create: {
      id: "report-revenue-over-time",
      tenantId: tenant.id,
      name: "Revenue Over Time",
      description: "Monthly revenue trend from closed deals",
      category: "sales",
      isFavorite: true,
      runCount: 18,
      lastRunAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      definition: {
        dataSource: "deals",
        metrics: [{ field: "amount", aggregate: "sum", label: "Revenue" }],
        dimensions: [{ field: "createdAt", type: "temporal", granularity: "month", label: "Month" }],
        filters: [],
        chart: { chartType: "area", showLegend: false, showGrid: true },
        dateRange: { type: "preset", preset: "thisYear", dateField: "createdAt" },
      },
    },
  });

  const report3 = await prisma.report.upsert({
    where: { id: "report-contacts-lifecycle" },
    update: {},
    create: {
      id: "report-contacts-lifecycle",
      tenantId: tenant.id,
      name: "Contacts by Lifecycle Stage",
      description: "Distribution of contacts across lifecycle stages",
      category: "marketing",
      isFavorite: false,
      runCount: 12,
      lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      definition: {
        dataSource: "contacts",
        metrics: [{ field: "*", aggregate: "count", label: "Count" }],
        dimensions: [{ field: "lifecycleStage", type: "categorical", label: "Lifecycle Stage" }],
        filters: [],
        chart: { chartType: "pie", showLegend: true },
      },
    },
  });

  const report4 = await prisma.report.upsert({
    where: { id: "report-activities-by-type" },
    update: {},
    create: {
      id: "report-activities-by-type",
      tenantId: tenant.id,
      name: "Activities by Type",
      description: "Breakdown of activity types (calls, emails, meetings, etc.)",
      category: "sales",
      runCount: 8,
      definition: {
        dataSource: "activities",
        metrics: [{ field: "*", aggregate: "count", label: "Activity Count" }],
        dimensions: [{ field: "type", type: "categorical", label: "Type" }],
        filters: [],
        chart: { chartType: "bar", showLegend: false, showGrid: true },
      },
    },
  });

  const report5 = await prisma.report.upsert({
    where: { id: "report-companies-by-industry" },
    update: {},
    create: {
      id: "report-companies-by-industry",
      tenantId: tenant.id,
      name: "Companies by Industry",
      description: "Distribution of companies across industries",
      category: "marketing",
      runCount: 5,
      definition: {
        dataSource: "companies",
        metrics: [{ field: "*", aggregate: "count", label: "Count" }],
        dimensions: [{ field: "industry", type: "categorical", label: "Industry" }],
        filters: [],
        chart: { chartType: "pie", showLegend: true },
      },
    },
  });

  const report6 = await prisma.report.upsert({
    where: { id: "report-total-deal-value" },
    update: {},
    create: {
      id: "report-total-deal-value",
      tenantId: tenant.id,
      name: "Total Pipeline Value",
      description: "Sum of all active deal amounts",
      category: "sales",
      isFavorite: true,
      runCount: 30,
      lastRunAt: new Date(),
      definition: {
        dataSource: "deals",
        metrics: [{ field: "amount", aggregate: "sum", label: "Total Value" }],
        dimensions: [],
        filters: [],
        chart: { chartType: "number" },
      },
    },
  });

  console.log("✅ Created 6 reports");

  // Dashboards
  const dashboard1 = await prisma.dashboard.upsert({
    where: { id: "dashboard-sales-overview" },
    update: {},
    create: {
      id: "dashboard-sales-overview",
      tenantId: tenant.id,
      name: "Sales Overview",
      description: "Key sales metrics and deal pipeline insights",
      isDefault: true,
    },
  });

  // Add widgets to Sales Overview dashboard
  await prisma.dashboardWidget.upsert({
    where: { id: "widget-1" },
    update: {},
    create: {
      id: "widget-1",
      dashboardId: dashboard1.id,
      reportId: report6.id,
      title: "Total Pipeline Value",
      x: 0, y: 0, w: 4, h: 3,
    },
  });

  await prisma.dashboardWidget.upsert({
    where: { id: "widget-2" },
    update: {},
    create: {
      id: "widget-2",
      dashboardId: dashboard1.id,
      reportId: report1.id,
      title: "Deals by Stage",
      x: 4, y: 0, w: 8, h: 4,
    },
  });

  await prisma.dashboardWidget.upsert({
    where: { id: "widget-3" },
    update: {},
    create: {
      id: "widget-3",
      dashboardId: dashboard1.id,
      reportId: report2.id,
      title: "Revenue Trend",
      x: 0, y: 4, w: 6, h: 4,
    },
  });

  await prisma.dashboardWidget.upsert({
    where: { id: "widget-4" },
    update: {},
    create: {
      id: "widget-4",
      dashboardId: dashboard1.id,
      reportId: report4.id,
      title: "Activity Breakdown",
      x: 6, y: 4, w: 6, h: 4,
    },
  });

  const dashboard2 = await prisma.dashboard.upsert({
    where: { id: "dashboard-marketing" },
    update: {},
    create: {
      id: "dashboard-marketing",
      tenantId: tenant.id,
      name: "Marketing Dashboard",
      description: "Contact and company analytics",
    },
  });

  await prisma.dashboardWidget.upsert({
    where: { id: "widget-5" },
    update: {},
    create: {
      id: "widget-5",
      dashboardId: dashboard2.id,
      reportId: report3.id,
      title: "Contacts by Lifecycle",
      x: 0, y: 0, w: 6, h: 4,
    },
  });

  await prisma.dashboardWidget.upsert({
    where: { id: "widget-6" },
    update: {},
    create: {
      id: "widget-6",
      dashboardId: dashboard2.id,
      reportId: report5.id,
      title: "Companies by Industry",
      x: 6, y: 0, w: 6, h: 4,
    },
  });

  console.log("✅ Created 2 dashboards with 6 widgets");

  // ============================================
  // TICKETS - Service Hub
  // ============================================

  const ticketData = [
    {
      id: "ticket-1",
      subject: "Cannot export contacts to CSV",
      description: "When I try to export my contacts list to CSV, the download starts but the file is empty. Tried in Chrome and Firefox.",
      category: "bug",
      status: "open",
      priority: "high",
      contactId: "contact-john@example.com",
      companyId: "company-techcorp.com",
      source: "web",
    },
    {
      id: "ticket-2",
      subject: "How to set up email integration?",
      description: "I'd like to connect my Gmail account to the CRM. Can you provide instructions or documentation?",
      category: "question",
      status: "in_progress",
      priority: "medium",
      contactId: "contact-jane@techcorp.com",
      source: "email",
    },
    {
      id: "ticket-3",
      subject: "Request: Bulk edit contacts",
      description: "We need the ability to bulk edit contact fields like lifecycle stage and owner. Currently we have to update each contact individually which is very time consuming.",
      category: "feature",
      status: "open",
      priority: "medium",
      contactId: "contact-bob@startup.io",
      companyId: "company-startup.io",
      source: "web",
    },
    {
      id: "ticket-4",
      subject: "Pipeline view not loading on mobile",
      description: "The Kanban pipeline view doesn't render properly on iPhone 15. Cards overlap and drag-and-drop doesn't work.",
      category: "bug",
      status: "waiting",
      priority: "high",
      contactId: "contact-alice@enterprise.com",
      companyId: "company-enterprise.com",
      source: "chat",
    },
    {
      id: "ticket-5",
      subject: "Account billing question",
      description: "We were charged twice for our Professional plan this month. Please investigate and refund the duplicate charge.",
      category: "support",
      status: "resolved",
      priority: "urgent",
      contactId: "contact-charlie@agency.co",
      companyId: "company-agency.co",
      source: "phone",
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ticket-6",
      subject: "API rate limit too low",
      description: "Our integration is hitting the API rate limit at 100 requests/minute. We need at least 500/min for our use case.",
      category: "feature",
      status: "open",
      priority: "low",
      contactId: "contact-jane@techcorp.com",
      companyId: "company-techcorp.com",
      source: "email",
    },
    {
      id: "ticket-7",
      subject: "Dashboard widgets not refreshing",
      description: "The sales dashboard widgets show stale data. They only update after a full page refresh, not automatically.",
      category: "bug",
      status: "closed",
      priority: "medium",
      contactId: "contact-bob@startup.io",
      source: "web",
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: "ticket-8",
      subject: "Need help with workflow automation setup",
      description: "I want to create a workflow that automatically assigns leads to sales reps based on territory. Can someone walk me through this?",
      category: "question",
      status: "in_progress",
      priority: "medium",
      contactId: "contact-alice@enterprise.com",
      source: "chat",
    },
  ];

  for (const t of ticketData) {
    await prisma.ticket.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        tenantId: tenant.id,
        assigneeId: user.id,
        createdById: user.id,
        subject: t.subject,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        contactId: t.contactId,
        companyId: t.companyId || null,
        source: t.source,
        resolvedAt: t.resolvedAt || null,
        closedAt: t.closedAt || null,
        tags: ["crm"],
      },
    });
  }
  console.log("✅ Created 8 tickets");

  // ============================================
  // EMAIL CAMPAIGNS - Marketing Hub
  // ============================================

  const campaignData = [
    {
      id: "campaign-1",
      name: "Q1 Product Launch",
      subject: "Introducing F-CORE 2.0 - Your CRM, Reimagined",
      body: "<h1>F-CORE 2.0 is Here!</h1><p>We've rebuilt the CRM experience from the ground up...</p>",
      previewText: "See what's new in F-CORE 2.0",
      status: "sent",
      sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      recipientCount: 2450,
      sentCount: 2430,
      deliveredCount: 2380,
      openedCount: 1142,
      clickedCount: 387,
      bouncedCount: 50,
      unsubscribedCount: 12,
    },
    {
      id: "campaign-2",
      name: "Monthly Newsletter - January",
      subject: "What's New This Month at F-CORE",
      body: "<h1>January Newsletter</h1><p>Here's what happened this month...</p>",
      previewText: "Product updates, tips, and more",
      status: "sent",
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      recipientCount: 1850,
      sentCount: 1840,
      deliveredCount: 1810,
      openedCount: 724,
      clickedCount: 198,
      bouncedCount: 30,
      unsubscribedCount: 5,
    },
    {
      id: "campaign-3",
      name: "Webinar Invitation: CRM Best Practices",
      subject: "You're Invited: Master Your Sales Pipeline",
      body: "<h1>Join Our Free Webinar</h1><p>Learn how top sales teams use CRM to close more deals...</p>",
      previewText: "Reserve your spot - limited seats",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      recipientCount: 3200,
    },
    {
      id: "campaign-4",
      name: "Feature Announcement: Workflow Automation",
      subject: "Automate Your Sales Process with Workflows",
      body: "<h1>New Feature: Workflows</h1><p>Set up automated processes to save hours every week...</p>",
      previewText: "New automation features just dropped",
      status: "draft",
    },
    {
      id: "campaign-5",
      name: "Customer Success Stories",
      subject: "How TechCorp Grew Revenue 3x with F-CORE",
      body: "<h1>Success Story</h1><p>Read how our customers are winning...</p>",
      previewText: "Real results from real customers",
      status: "sent",
      sentAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      recipientCount: 1500,
      sentCount: 1490,
      deliveredCount: 1460,
      openedCount: 876,
      clickedCount: 312,
      bouncedCount: 30,
      unsubscribedCount: 8,
    },
    {
      id: "campaign-6",
      name: "Re-engagement: We Miss You!",
      subject: "It's been a while - here's what you're missing",
      body: "<h1>Come Back!</h1><p>We've made lots of improvements since you last visited...</p>",
      previewText: "New features and improvements await",
      status: "draft",
    },
  ];

  for (const c of campaignData) {
    await prisma.emailCampaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        tenantId: tenant.id,
        ownerId: user.id,
        name: c.name,
        subject: c.subject,
        body: c.body,
        previewText: c.previewText || null,
        status: c.status,
        scheduledAt: c.scheduledAt || null,
        sentAt: c.sentAt || null,
        recipientCount: c.recipientCount || 0,
        sentCount: c.sentCount || 0,
        deliveredCount: c.deliveredCount || 0,
        openedCount: c.openedCount || 0,
        clickedCount: c.clickedCount || 0,
        bouncedCount: c.bouncedCount || 0,
        unsubscribedCount: c.unsubscribedCount || 0,
      },
    });
  }
  console.log("✅ Created 6 email campaigns");

  // ============================================
  // WORKFLOWS - Automation Hub
  // ============================================

  const workflowData = [
    {
      id: "workflow-1",
      name: "Welcome New Contacts",
      description: "Automatically send a welcome email when a new contact is created and create a follow-up task for the sales team.",
      triggerType: "contact_created",
      triggerConfig: {},
      status: "active",
      isActive: true,
      enrolledCount: 234,
      completedCount: 198,
      lastTriggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actions: [
        { type: "send_email", config: { templateName: "Welcome Email", delay: 0 } },
        { type: "wait", config: { duration: 1, unit: "days" } },
        { type: "create_task", config: { title: "Follow up with new contact", assignTo: "owner", dueInDays: 3 } },
      ],
    },
    {
      id: "workflow-2",
      name: "Deal Won Celebration",
      description: "When a deal moves to Closed Won, send an internal notification and update the contact lifecycle stage to Customer.",
      triggerType: "deal_stage_changed",
      triggerConfig: { toStage: "Closed Won" },
      status: "active",
      isActive: true,
      enrolledCount: 45,
      completedCount: 42,
      lastTriggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      actions: [
        { type: "send_email", config: { templateName: "Deal Won Notification", to: "owner" } },
        { type: "update_property", config: { object: "contact", field: "lifecycleStage", value: "customer" } },
        { type: "create_task", config: { title: "Schedule onboarding call", assignTo: "owner", dueInDays: 1 } },
      ],
    },
    {
      id: "workflow-3",
      name: "Form Submission Follow-up",
      description: "When a contact submits the Contact Us form, assign to sales and create a follow-up task.",
      triggerType: "form_submitted",
      triggerConfig: { formId: "form-contact-us" },
      status: "active",
      isActive: true,
      enrolledCount: 89,
      completedCount: 76,
      lastTriggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      actions: [
        { type: "send_email", config: { templateName: "Thank You for Contacting Us" } },
        { type: "update_property", config: { object: "contact", field: "leadStatus", value: "new" } },
        { type: "create_task", config: { title: "Review form submission", assignTo: "owner", dueInDays: 1 } },
      ],
    },
    {
      id: "workflow-4",
      name: "Lead Nurture Sequence",
      description: "A 3-email drip sequence for MQL contacts who haven't converted to SQL within 7 days.",
      triggerType: "manual",
      triggerConfig: {},
      status: "paused",
      isActive: false,
      enrolledCount: 156,
      completedCount: 89,
      actions: [
        { type: "send_email", config: { templateName: "Nurture Email 1 - Case Study" } },
        { type: "wait", config: { duration: 3, unit: "days" } },
        { type: "if_branch", config: { condition: "contact.lifecycleStage != 'sql'", thenAction: "continue", elseAction: "stop" } },
        { type: "send_email", config: { templateName: "Nurture Email 2 - Product Demo" } },
        { type: "wait", config: { duration: 4, unit: "days" } },
        { type: "send_email", config: { templateName: "Nurture Email 3 - Special Offer" } },
      ],
    },
    {
      id: "workflow-5",
      name: "Stale Deal Alert",
      description: "Alert deal owners when a deal hasn't been updated in 14 days.",
      triggerType: "manual",
      triggerConfig: {},
      status: "draft",
      isActive: false,
      enrolledCount: 0,
      completedCount: 0,
      actions: [
        { type: "if_branch", config: { condition: "deal.daysSinceUpdate > 14" } },
        { type: "send_email", config: { templateName: "Stale Deal Alert", to: "owner" } },
        { type: "create_task", config: { title: "Review stale deal", assignTo: "owner", dueInDays: 2 } },
      ],
    },
  ];

  for (const w of workflowData) {
    await prisma.workflow.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        tenantId: tenant.id,
        ownerId: user.id,
        name: w.name,
        description: w.description,
        triggerType: w.triggerType,
        triggerConfig: w.triggerConfig,
        actions: w.actions,
        status: w.status,
        isActive: w.isActive,
        enrolledCount: w.enrolledCount,
        completedCount: w.completedCount,
        lastTriggeredAt: w.lastTriggeredAt || null,
      },
    });
  }
  console.log("✅ Created 5 workflows");

  // ============================================
  // MEETING TYPES & LINKS - Sales Hub
  // ============================================

  const meetingType1 = await prisma.meetingType.upsert({
    where: { id: "mtype-quick-call" },
    update: {},
    create: {
      id: "mtype-quick-call",
      tenantId: tenant.id,
      ownerId: user.id,
      name: "15-min Quick Call",
      slug: "quick-call",
      duration: 15,
      color: "#0891b2",
      description: "A quick 15-minute call to discuss your needs and see if we're a good fit.",
      location: "Google Meet",
      isActive: true,
      bufferBefore: 5,
      bufferAfter: 5,
    },
  });

  const meetingType2 = await prisma.meetingType.upsert({
    where: { id: "mtype-product-demo" },
    update: {},
    create: {
      id: "mtype-product-demo",
      tenantId: tenant.id,
      ownerId: user.id,
      name: "30-min Product Demo",
      slug: "product-demo",
      duration: 30,
      color: "#8b5cf6",
      description: "A comprehensive demo of F-CORE CRM tailored to your business needs.",
      location: "Zoom",
      isActive: true,
      bufferBefore: 5,
      bufferAfter: 10,
    },
  });

  const meetingType3 = await prisma.meetingType.upsert({
    where: { id: "mtype-consultation" },
    update: {},
    create: {
      id: "mtype-consultation",
      tenantId: tenant.id,
      ownerId: user.id,
      name: "60-min Strategy Consultation",
      slug: "strategy-consultation",
      duration: 60,
      color: "#059669",
      description: "An in-depth consultation to plan your CRM strategy and implementation roadmap.",
      location: "Zoom",
      isActive: true,
      bufferBefore: 10,
      bufferAfter: 15,
    },
  });

  console.log("✅ Created 3 meeting types");

  // Meeting links
  await prisma.meetingLink.upsert({
    where: { id: "mlink-1" },
    update: {},
    create: {
      id: "mlink-1",
      tenantId: tenant.id,
      slug: "admin-quick-call",
      userId: user.id,
      meetingTypeId: meetingType1.id,
      isActive: true,
      customMessage: "Thanks for booking a quick call! I look forward to chatting with you.",
    },
  });

  await prisma.meetingLink.upsert({
    where: { id: "mlink-2" },
    update: {},
    create: {
      id: "mlink-2",
      tenantId: tenant.id,
      slug: "admin-product-demo",
      userId: user.id,
      meetingTypeId: meetingType2.id,
      isActive: true,
      customMessage: "Excited to show you what F-CORE can do for your business!",
    },
  });

  await prisma.meetingLink.upsert({
    where: { id: "mlink-3" },
    update: {},
    create: {
      id: "mlink-3",
      tenantId: tenant.id,
      slug: "admin-consultation",
      userId: user.id,
      meetingTypeId: meetingType3.id,
      isActive: true,
      customMessage: "Let's dive deep into your CRM needs and build a plan together.",
    },
  });

  console.log("✅ Created 3 meeting links");

  // User availability (Mon-Fri, 9am-5pm)
  for (let day = 1; day <= 5; day++) {
    await prisma.userAvailability.upsert({
      where: {
        userId_dayOfWeek: { userId: user.id, dayOfWeek: day },
      },
      update: {},
      create: {
        userId: user.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isActive: true,
      },
    });
  }
  console.log("✅ Created user availability (Mon-Fri 9am-5pm)");

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
