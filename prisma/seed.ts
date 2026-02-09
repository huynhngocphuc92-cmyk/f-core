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
